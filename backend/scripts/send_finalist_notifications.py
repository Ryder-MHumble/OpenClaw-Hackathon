#!/usr/bin/env python3
"""Send finalist notification emails to all participants in database/*.csv.

Usage:
  python backend/scripts/send_finalist_notifications.py --dry-run
  python backend/scripts/send_finalist_notifications.py
"""

from __future__ import annotations

import argparse
import csv
import os
import smtplib
import time
from dataclasses import dataclass, field
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv


SUBJECT = "恭喜入选决赛！首届中关村北纬龙虾大赛决赛通知"

TEXT_TEMPLATE = """您好！

恭喜您的项目成功入选首届中关村北纬龙虾大赛决赛！感谢您的认真准备，您的作品经过评委评审获得一致认可，从众多优秀项目中脱颖而出。

以下是决赛相关事项，请务必仔细阅读：

【决赛时间与地点】
时间：3月22日（周日）下午，请于13:00到场签到并带实机进行展示
地点：北京海淀区中关村学院（具体地址将通过微信发送）

【展示形式】
每队3分钟demo路演 + 1分钟评委提问。展示方式不限（Word、PPT、视频均可），材料由组委会统一在现场播放。团队参赛鼓励全员到场，但仅限一人上台展示。

请重点突出项目的独特创意、产品完成度和赛道匹配度，决赛需要展示实际产品功能，不能空讲理念。

【需提交的材料】
1. 3月21日（周六）12:00前：提交一张项目易拉宝图片
2. 3月21日（周六）17:00前：提交路演展示材料（Word/PPT/视频）

【后续配合要求】
入围决赛的团队可能会被邀请参与媒体采访、行业分享或宣传内容制作，请提前知悉并配合。

再次恭喜，期待周日现场见！

首届中关村北纬龙虾大赛组委会
"""

HTML_TEMPLATE = """<!doctype html>
<html lang=\"zh-CN\">
  <body style=\"margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;\">
    <div style=\"max-width:680px;margin:24px auto;padding:0 12px;\">
      <div style=\"background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;\">
        <div style=\"background:linear-gradient(135deg,#ff7a18,#ff4d4f);padding:18px 22px;color:#fff;\">
          <div style=\"font-size:20px;font-weight:700;line-height:1.4;\">恭喜入选决赛！</div>
          <div style=\"font-size:13px;opacity:0.95;margin-top:4px;\">首届中关村北纬龙虾大赛决赛通知</div>
        </div>

        <div style=\"padding:22px;line-height:1.8;font-size:14px;\">
          <p style=\"margin:0 0 12px;\">您好！</p>
          <p style=\"margin:0 0 14px;\">恭喜您的项目成功入选首届中关村北纬龙虾大赛决赛！感谢您的认真准备，您的作品经过评委评审获得一致认可，从众多优秀项目中脱颖而出。</p>

          <div style=\"margin:16px 0;padding:12px 14px;border-radius:10px;background:#fff7ed;border:1px solid #fed7aa;\">
            <div style=\"font-weight:700;margin-bottom:6px;color:#9a3412;\">【决赛时间与地点】</div>
            <div>时间：3月22日（周日）下午，请于 <b>13:00</b> 到场签到并带实机进行展示</div>
            <div>地点：北京海淀区中关村学院（具体地址将通过微信发送）</div>
          </div>

          <div style=\"margin:16px 0;padding:12px 14px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;\">
            <div style=\"font-weight:700;margin-bottom:6px;\">【展示形式】</div>
            <div>每队 <b>3 分钟 demo 路演 + 1 分钟评委提问</b>。展示方式不限（Word、PPT、视频均可），材料由组委会统一在现场播放。团队参赛鼓励全员到场，但仅限一人上台展示。</div>
            <div style=\"margin-top:8px;\">请重点突出项目的独特创意、产品完成度和赛道匹配度，决赛需要展示实际产品功能，不能空讲理念。</div>
          </div>

          <div style=\"margin:16px 0;padding:12px 14px;border-radius:10px;background:#f0fdf4;border:1px solid #bbf7d0;\">
            <div style=\"font-weight:700;margin-bottom:6px;color:#166534;\">【需提交的材料】</div>
            <div>1. 3月21日（周六）<b>12:00 前</b>：提交一张项目易拉宝图片</div>
            <div>2. 3月21日（周六）<b>17:00 前</b>：提交路演展示材料（Word/PPT/视频）</div>
          </div>

          <div style=\"margin:16px 0;padding:12px 14px;border-radius:10px;background:#eef2ff;border:1px solid #c7d2fe;\">
            <div style=\"font-weight:700;margin-bottom:6px;color:#3730a3;\">【后续配合要求】</div>
            <div>入围决赛的团队可能会被邀请参与媒体采访、行业分享或宣传内容制作，请提前知悉并配合。</div>
          </div>

          <p style=\"margin:16px 0 0;\">再次恭喜，期待周日现场见！</p>
          <p style=\"margin:10px 0 0;color:#6b7280;\">首届中关村北纬龙虾大赛组委会</p>
        </div>
      </div>
    </div>
  </body>
</html>
"""


@dataclass
class Recipient:
  name: str
  email: str
  projects: list[str] = field(default_factory=list)
  tracks: set[str] = field(default_factory=set)


def _load_env(root: Path) -> None:
  load_dotenv(root / "backend" / ".env")
  load_dotenv(root / ".env")


def _csv_files(root: Path) -> dict[str, Path]:
  return {
    "academic": root / "database" / "科研.csv",
    "productivity": root / "database" / "生产力.csv",
    "life": root / "database" / "生活.csv",
  }


def _clean(s: str | None) -> str:
  return (s or "").strip()


def load_recipients(root: Path) -> dict[str, Recipient]:
  recipients: dict[str, Recipient] = {}
  for track, path in _csv_files(root).items():
    if not path.exists():
      print(f"[WARN] Missing CSV: {path}")
      continue

    with path.open("r", encoding="utf-8-sig", newline="") as f:
      reader = csv.DictReader(f)
      for row in reader:
        email = _clean(row.get("email")).lower()
        if not email:
          continue

        name = _clean(row.get("full_name")) or "参赛者"
        project = _clean(row.get("project_title"))

        if email not in recipients:
          recipients[email] = Recipient(name=name, email=email)

        rec = recipients[email]
        if project and project not in rec.projects:
          rec.projects.append(project)
        rec.tracks.add(track)

  return recipients


def _make_message(from_addr: str, to_addr: str) -> MIMEMultipart:
  msg = MIMEMultipart("alternative")
  msg["Subject"] = SUBJECT
  msg["From"] = from_addr
  msg["To"] = to_addr
  msg.attach(MIMEText(TEXT_TEMPLATE, "plain", "utf-8"))
  msg.attach(MIMEText(HTML_TEMPLATE, "html", "utf-8"))
  return msg


def _send_batch(
  recipients: Iterable[Recipient],
  smtp_host: str,
  smtp_port: int,
  smtp_user: str,
  smtp_password: str,
  smtp_from: str,
  dry_run: bool,
  throttle_seconds: float,
  retry_max: int,
  retry_wait_seconds: float,
) -> tuple[int, int]:
  ok = 0
  fail = 0

  if dry_run:
    for idx, rec in enumerate(recipients, 1):
      print(f"[DRY-RUN {idx}] {rec.email} ({rec.name})")
      ok += 1
    return ok, fail

  for idx, rec in enumerate(recipients, 1):
    sent = False
    for attempt in range(1, retry_max + 1):
      try:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=12) as server:
          server.login(smtp_user, smtp_password)
          msg = _make_message(smtp_from, rec.email)
          server.sendmail(smtp_from, [rec.email], msg.as_string())
        sent = True
        break
      except smtplib.SMTPDataError as exc:
        code = getattr(exc, "smtp_code", None)
        print(f"[WARN] {rec.email} attempt={attempt}/{retry_max} smtp={code}")
        if attempt < retry_max:
          time.sleep(retry_wait_seconds)
      except Exception as exc:
        print(f"[WARN] {rec.email} attempt={attempt}/{retry_max} error={exc}")
        if attempt < retry_max:
          time.sleep(retry_wait_seconds)

    if sent:
      ok += 1
    else:
      fail += 1
      print(f"[ERROR] {rec.email}: give up after {retry_max} attempts")

    if throttle_seconds > 0:
      time.sleep(throttle_seconds)
    if idx % 10 == 0:
      print(f"[PROGRESS] processed={idx} sent={ok} failed={fail}")

  return ok, fail


def main() -> int:
  parser = argparse.ArgumentParser(description="Send finalist notifications")
  parser.add_argument("--dry-run", action="store_true", help="Do not send emails")
  parser.add_argument("--limit", type=int, default=0, help="Send first N only (0=all)")
  parser.add_argument(
    "--only-emails",
    type=str,
    default="",
    help="Only send to these emails (comma-separated)",
  )
  parser.add_argument(
    "--throttle-seconds",
    type=float,
    default=1.8,
    help="Sleep seconds between each recipient",
  )
  parser.add_argument(
    "--retry-max",
    type=int,
    default=3,
    help="Retry count per failed recipient",
  )
  parser.add_argument(
    "--retry-wait-seconds",
    type=float,
    default=40.0,
    help="Sleep seconds before retrying failed recipient",
  )
  args = parser.parse_args()

  root = Path(__file__).resolve().parents[2]
  _load_env(root)

  smtp_host = os.getenv("SMTP_HOST", "").strip()
  smtp_port = int(os.getenv("SMTP_PORT", "465").strip())
  smtp_user = os.getenv("SMTP_USER", "").strip()
  smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
  smtp_from = os.getenv("SMTP_FROM", "").strip() or smtp_user

  if not (smtp_host and smtp_user and smtp_password and smtp_from):
    print("[FATAL] SMTP env missing. Need SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD/SMTP_FROM")
    return 2

  recipients_map = load_recipients(root)
  recipients = list(recipients_map.values())

  only = {
    s.strip().lower()
    for s in args.only_emails.split(",")
    if s.strip()
  }
  if only:
    recipients = [r for r in recipients if r.email.lower() in only]
  recipients.sort(key=lambda x: x.email)

  if args.limit > 0:
    recipients = recipients[: args.limit]

  print(f"[INFO] unique recipients: {len(recipients)}")
  ok, fail = _send_batch(
    recipients=recipients,
    smtp_host=smtp_host,
    smtp_port=smtp_port,
    smtp_user=smtp_user,
    smtp_password=smtp_password,
    smtp_from=smtp_from,
    dry_run=args.dry_run,
    throttle_seconds=max(0.0, args.throttle_seconds),
    retry_max=max(1, args.retry_max),
    retry_wait_seconds=max(1.0, args.retry_wait_seconds),
  )

  print(f"[DONE] success={ok} failed={fail} total={len(recipients)}")
  return 0 if fail == 0 else 1


if __name__ == "__main__":
  raise SystemExit(main())
