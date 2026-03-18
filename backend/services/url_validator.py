import re
from typing import Optional
import httpx


_BLOCKED = [
    (re.compile(r"github\.com/[^/]+/[^/]+/(blob|tree)/"),
     "GitHub 文件预览链接无法直接访问，请使用仓库主页链接（去掉 /blob/... 部分）或确认仓库已设为 Public"),
]
_WARNINGS = [
    (re.compile(r"feishu\.cn|larksuite\.com"),
     "飞书文档请确保已开启「互联网上获得链接的人可查看」权限"),
    (re.compile(r"alidocs\.dingtalk\.com"),
     "钉钉文档请确保已开启「所有人可查看」分享权限"),
    (re.compile(r"notion\.so"),
     "Notion 页面请确保已在 Share 设置中开启「Share to web」"),
    (re.compile(r"docs\.qq\.com"),
     "腾讯文档请确保已设置为「任何人可查看」"),
    (re.compile(r"drive\.google\.com"),
     "Google Drive 请确保共享设置为「任何知道链接的人均可查看」"),
]

_FIELD_LABELS = {
    "pdfUrl":    "项目说明书",
    "posterUrl": "项目海报",
    "videoUrl":  "演示视频",
    "repoUrl":   "代码仓库",
    "demoUrl":   "Demo 演示",
}


def validate_url(url: Optional[str], field_name: str) -> Optional[dict]:
    """返回 None 表示没有问题，否则返回 {"level": "error"|"warning", "field": ..., "message": ...}"""
    if not url:
        return None
    for pattern, msg in _BLOCKED:
        if pattern.search(url):
            return {"level": "error", "field": field_name, "message": msg}
    for pattern, msg in _WARNINGS:
        if pattern.search(url):
            return {"level": "warning", "field": field_name, "message": msg}
    return None


async def check_accessibility(url: str) -> Optional[str]:
    """HTTP HEAD 检测 URL 是否可访问，返回错误描述或 None（正常）"""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; OpenClaw-Auditor/1.0)"}

        # 飞书/钉钉/腾讯文档等协作平台，即使返回 401/403 也可能是正常的（需要扫码登录）
        # B站/YouTube等视频平台，可能有反爬虫机制返回 412/403，但链接本身是有效的
        # 这些平台的链接只要能访问到页面就算有效
        collaborative_platforms = [
            "feishu.cn", "larksuite.com",  # 飞书
            "alidocs.dingtalk.com",  # 钉钉
            "docs.qq.com",  # 腾讯文档
            "notion.so",  # Notion
            "bilibili.com", "b23.tv",  # B站
            "youtube.com", "youtu.be",  # YouTube
        ]

        is_collaborative = any(platform in url for platform in collaborative_platforms)

        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.head(url, headers=headers)
            if resp.status_code in (405, 501):
                resp = await client.get(url, headers=headers)

            # 对于协作平台和视频平台，只要不是 404/500 等明确的错误，都认为是可访问的
            if is_collaborative:
                if resp.status_code in (401, 403, 412):
                    # 401/403/412 对于这些平台是正常的，表示需要登录/扫码或反爬虫
                    return None
                elif resp.status_code == 404:
                    return "链接不存在（404），请检查链接是否正确"
                elif resp.status_code >= 500:
                    return f"服务器错误（{resp.status_code}），请稍后重试或更换链接"
            else:
                # 非协作平台，按原逻辑处理
                if resp.status_code >= 400:
                    return f"链接返回错误状态码 {resp.status_code}（可能需要登录或链接已失效）"

        return None
    except httpx.TimeoutException:
        return "链接请求超时（可能无法访问）"
    except Exception as e:
        return f"链接无法访问：{e}"
