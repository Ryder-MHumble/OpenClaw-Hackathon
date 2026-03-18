import asyncio
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM
from services.url_validator import validate_url, check_accessibility, _FIELD_LABELS


async def audit_and_notify(name: str, email: str, project_title: str,
                            url_fields: dict[str, str]):
    """后台任务：并发检测所有 URL，有问题则发邮件提醒"""
    check_tasks = {field: url for field, url in url_fields.items() if url}
    results = await asyncio.gather(
        *[check_accessibility(url) for url in check_tasks.values()],
        return_exceptions=True,
    )

    field_issues: dict[str, list[str]] = {}
    for (field, url), err in zip(check_tasks.items(), results):
        problems = []
        pattern_issue = validate_url(url, field)
        if pattern_issue:
            problems.append(pattern_issue["message"])
        if isinstance(err, str):
            problems.append(err)
        if problems:
            field_issues[field] = {"url": url, "problems": problems}

    if not field_issues or not SMTP_USER:
        return

    lines = [
        f"{name} 你好！",
        "",
        "我是 OpenClaw AI 黑客松组委会，感谢你报名参赛！",
        "",
        "我们在审核你的参赛材料时，发现以下链接存在访问问题，",
        "评委目前无法正常打开这些内容，可能影响你的参赛资格和评审结果。",
        "",
        "──── 问题链接明细 ────────────────────────",
    ]
    for field, info in field_issues.items():
        label = _FIELD_LABELS.get(field, field)
        lines.append(f"\n【{label}】")
        lines.append(f"  当前链接：{info['url']}")
        for p in info["problems"]:
            lines.append(f"  问题：{p}")
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
        "⚠ 请在 3月21日 24:00 前完成修复，逾期将影响评审。",
        "",
        "如有任何疑问，直接回复本邮件即可，我们会尽快回复。",
        "",
        "祝参赛顺利！",
        "OpenClaw AI 黑客松组委会",
        f"（系统检测时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}）",
    ]

    subject = f"【OpenClaw 黑客松】你的参赛材料链接需要修复 — {project_title}"
    body = "\n".join(lines)

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM or SMTP_USER
        msg["To"] = email
        msg.attach(MIMEText(body, "plain", "utf-8"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM or SMTP_USER, [email], msg.as_string())
    except Exception as e:
        print(f"[URL audit] 邮件发送失败 ({email}): {e}")
