"""
url_audit.py — 批量检查参赛者提交的 URL 并向有问题的参赛者发送提醒邮件

用法:
  python url_audit.py              # 检查 + 发送邮件
  python url_audit.py --dry-run    # 只检查，不发送邮件
  python url_audit.py --report     # 只打印报告，不发邮件

环境变量（在 .env 中配置）:
  SUPABASE_URL, SUPABASE_KEY
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
"""

import asyncio
import re
import sys
import smtplib
import textwrap
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime

import httpx
from dotenv import load_dotenv
import os
from supabase import create_client

load_dotenv()

# ── Supabase ────────────────────────────────────────────────────────────────
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# ── SMTP ─────────────────────────────────────────────────────────────────────
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.qq.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)

# ── URL 问题检测规则（与前端/后端保持一致）───────────────────────────────────
BLOCKED_PATTERNS = [
    (re.compile(r"github\.com/[^/]+/[^/]+/(blob|tree)/"),
     "GitHub 文件预览链接（/blob/...）无法直接访问，请改用仓库主页链接"),
]
WARNING_PATTERNS = [
    (re.compile(r"feishu\.cn|larksuite\.com"),
     "飞书文档 —— 请确保已开启「互联网上获得链接的人可查看」权限"),
    (re.compile(r"alidocs\.dingtalk\.com"),
     "钉钉文档 —— 请确保已开启「所有人可查看」分享权限"),
    (re.compile(r"notion\.so"),
     "Notion —— 请确保已在 Share 设置中开启「Share to web」"),
    (re.compile(r"docs\.qq\.com"),
     "腾讯文档 —— 请确保已设置为「任何人可查看」"),
    (re.compile(r"drive\.google\.com"),
     "Google Drive —— 请确保共享设置为「任何知道链接的人均可查看」"),
]

FIELD_LABELS = {
    "pdf_url":    "项目说明书",
    "poster_url": "项目海报",
    "video_url":  "演示视频",
    "repo_url":   "代码仓库",
    "demo_url":   "Demo 演示",
}

URL_FIELDS = list(FIELD_LABELS.keys())

TIMEOUT = httpx.Timeout(10.0)
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; OpenClaw-Auditor/1.0)",
}


def classify_url(url: str) -> list[dict]:
    """返回该 URL 存在的问题列表（可能有多条）"""
    issues = []
    for pattern, msg in BLOCKED_PATTERNS:
        if pattern.search(url):
            issues.append({"level": "blocked", "message": msg})
    for pattern, msg in WARNING_PATTERNS:
        if pattern.search(url):
            issues.append({"level": "warning", "message": msg})
    return issues


async def check_url_accessibility(client: httpx.AsyncClient, url: str) -> dict:
    """HTTP HEAD 请求检查 URL 是否可访问，返回 {"ok": bool, "status": int|None, "error": str|None}"""
    try:
        resp = await client.head(url, headers=HEADERS, follow_redirects=True)
        if resp.status_code in (405, 501):
            # 有些服务器不支持 HEAD，尝试 GET（只要响应头）
            resp = await client.get(url, headers=HEADERS, follow_redirects=True)
        ok = resp.status_code < 400
        return {"ok": ok, "status": resp.status_code, "error": None}
    except httpx.TimeoutException:
        return {"ok": False, "status": None, "error": "请求超时（10 秒）"}
    except Exception as e:
        return {"ok": False, "status": None, "error": str(e)}


async def audit_participant(client: httpx.AsyncClient, p: dict) -> dict | None:
    """检查单个参赛者的所有 URL，返回问题报告（无问题则返回 None）"""
    field_issues = {}

    tasks = {}
    for field in URL_FIELDS:
        url = p.get(field)
        if url:
            tasks[field] = url

    if not tasks:
        return None

    results = await asyncio.gather(
        *[check_url_accessibility(client, url) for url in tasks.values()],
        return_exceptions=True,
    )

    for (field, url), result in zip(tasks.items(), results):
        problems = []
        # 1. 模式匹配问题
        problems.extend(classify_url(url))
        # 2. HTTP 可访问性问题
        if isinstance(result, dict) and not result["ok"]:
            if result["error"]:
                problems.append({"level": "http_error", "message": f"链接无法访问：{result['error']}"})
            else:
                problems.append({"level": "http_error", "message": f"链接返回错误状态码 {result['status']}（可能需要登录或链接已失效）"})

        if problems:
            field_issues[field] = {"url": url, "problems": problems}

    if not field_issues:
        return None

    return {
        "id": p["id"],
        "name": p.get("full_name", ""),
        "email": p.get("email", ""),
        "project_title": p.get("project_title", ""),
        "field_issues": field_issues,
    }


def build_email(report: dict) -> tuple[str, str]:
    """构建提醒邮件（纯文本），返回 (subject, body)"""
    subject = f"【OpenClaw 黑客松】你的参赛材料链接需要修复 — {report['project_title']}"

    lines = [
        f"{report['name']} 你好！",
        "",
        "我是 OpenClaw AI 黑客松组委会，感谢你报名参赛！",
        "",
        "我们在审核你的参赛材料时，发现以下链接存在访问问题，",
        "评委目前无法正常打开这些内容，可能影响你的参赛资格和评审结果。",
        "",
        "──── 问题链接明细 ────────────────────────",
    ]

    for field, info in report["field_issues"].items():
        label = FIELD_LABELS.get(field, field)
        lines.append(f"\n【{label}】")
        lines.append(f"  当前链接：{info['url']}")
        for p in info["problems"]:
            lines.append(f"  问题：{p['message']}")

    lines += [
        "",
        "──── 如何修复 ────────────────────────────",
        "",
        "第一步：确认链接可以被任何人访问",
        "  · 飞书/钉钉/腾讯文档：分享设置中开启「任何人可查看」",
        "  · Google Drive：共享设置改为「知道链接的人均可查看」",
        "  · GitHub：确认仓库为 Public，并使用仓库主页链接",
        "    （正确示例：https://github.com/用户名/仓库名）",
        "    （错误示例：https://github.com/用户名/仓库名/blob/main/README.md）",
        "",
        "第二步：直接回复本邮件",
        "  请在回复中注明修正后的链接，格式如下：",
        "",
        "  项目说明书：<新链接>",
        "  项目海报：<新链接>",
        "  演示视频：<新链接>",
        "  （只需提供有问题的链接，没问题的无需重复填写）",
        "",
        "  组委会收到后会在 1 个工作日内为你更新。",
        "",
        "──────────────────────────────────────────",
        "",
        "⚠ 请在 3月19日 24:00 前完成修复，逾期将影响评审。",
        "",
        "如有任何疑问，直接回复本邮件即可，我们会尽快回复。",
        "",
        "祝参赛顺利！",
        "OpenClaw AI 黑客松组委会",
        f"（系统检测时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}）",
    ]

    return subject, "\n".join(lines)


def send_email(to_addr: str, subject: str, body: str, dry_run: bool = False) -> bool:
    if dry_run:
        print(f"  [DRY-RUN] 将发送邮件至 {to_addr}")
        print(f"  主题: {subject}")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to_addr
        msg.attach(MIMEText(body, "plain", "utf-8"))

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, [to_addr], msg.as_string())
        return True
    except Exception as e:
        print(f"  ✗ 发送失败 ({to_addr}): {e}")
        return False


async def run_audit(dry_run: bool = False, report_only: bool = False):
    print(f"\n{'='*56}")
    print("  OpenClaw URL 审计工具")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*56}\n")

    # 获取所有参赛者
    result = supabase.table("participants").select(
        "id, full_name, email, project_title, " + ", ".join(URL_FIELDS)
    ).execute()
    participants = result.data
    print(f"共 {len(participants)} 位参赛者，开始逐一检查链接……\n")

    problem_reports = []
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        tasks = [audit_participant(client, p) for p in participants]
        results = await asyncio.gather(*tasks)

    for report in results:
        if report:
            problem_reports.append(report)

    # 打印报告
    ok_count = len(participants) - len(problem_reports)
    print(f"检查完成：{ok_count} 位正常，{len(problem_reports)} 位存在问题\n")

    if not problem_reports:
        print("✓ 所有链接均可正常访问，无需发送提醒邮件。")
        return

    print("── 问题参赛者列表 ──────────────────────────────────────")
    for r in problem_reports:
        print(f"\n[#{r['id']}] {r['name']} <{r['email']}>  项目：{r['project_title']}")
        for field, info in r["field_issues"].items():
            label = FIELD_LABELS.get(field, field)
            print(f"  {label}: {info['url']}")
            for p in info["problems"]:
                marker = "✗" if p["level"] in ("blocked", "http_error") else "⚠"
                print(f"    {marker} {p['message']}")

    if report_only:
        print("\n[report-only 模式] 不发送邮件。")
        return

    if not SMTP_USER:
        print("\n⚠  未配置 SMTP_USER，跳过发送邮件。")
        print("   请在 .env 中配置 SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM")
        return

    print(f"\n── 发送提醒邮件 {'（DRY-RUN）' if dry_run else ''} ─────────────────────────")
    sent = 0
    for r in problem_reports:
        subject, body = build_email(r)
        ok = send_email(r["email"], subject, body, dry_run=dry_run)
        if ok:
            sent += 1
            if not dry_run:
                print(f"  ✓ 已发送至 {r['email']}")

    print(f"\n完成：共发送 {sent}/{len(problem_reports)} 封提醒邮件。")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    report_only = "--report" in sys.argv
    asyncio.run(run_audit(dry_run=dry_run, report_only=report_only))
