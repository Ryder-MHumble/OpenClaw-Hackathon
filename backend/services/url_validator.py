import re
from typing import Optional
from urllib.parse import urlparse
import httpx


_BLOCKED = [
    (
        re.compile(r"github\.com/[^/]+/[^/]+/(blob|tree)/"),
        "GitHub 文件预览链接无法直接访问，请使用仓库主页链接（去掉 /blob/... 部分）或确认仓库已设为 Public",
    ),
]
_WARNINGS = [
    (
        re.compile(r"feishu\.cn|larksuite\.com"),
        "飞书文档请确保已开启「互联网上获得链接的人可查看」权限",
    ),
    (
        re.compile(r"alidocs\.dingtalk\.com"),
        "钉钉文档请确保已开启「所有人可查看」分享权限",
    ),
    (
        re.compile(r"notion\.so"),
        "Notion 页面请确保已在 Share 设置中开启「Share to web」",
    ),
    (re.compile(r"docs\.qq\.com"), "腾讯文档请确保已设置为「任何人可查看」"),
    (
        re.compile(r"drive\.google\.com"),
        "Google Drive 请确保共享设置为「任何知道链接的人均可查看」",
    ),
]

_FIELD_LABELS = {
    "pdfUrl": "项目说明书",
    "posterUrl": "项目海报",
    "videoUrl": "演示视频",
    "repoUrl": "代码仓库",
    "demoUrl": "Demo 演示",
}

_ACCESS_TIMEOUT = httpx.Timeout(10.0, connect=5.0)
_ACCESS_LIMITS = httpx.Limits(max_connections=200, max_keepalive_connections=50)
_shared_access_client: Optional[httpx.AsyncClient] = None

# 这些平台经常出现登录态/反爬导致的误判，使用更宽松策略
_SOFT_CHECK_HOSTS = [
    "feishu.cn",
    "larksuite.com",
    "dingtalk.com",
    "alidocs.dingtalk.com",
    "notion.so",
    "notion.site",
    "drive.google.com",
    "docs.google.com",
    "youtube.com",
    "youtu.be",
    "bilibili.com",
    "b23.tv",
]


def _host_of(url: str) -> str:
    try:
        return (urlparse(url).hostname or "").lower()
    except Exception:
        return ""


def _is_soft_check_host(host: str) -> bool:
    return any(host == item or host.endswith(f".{item}") for item in _SOFT_CHECK_HOSTS)


def get_shared_access_client() -> httpx.AsyncClient:
    global _shared_access_client
    if _shared_access_client is None:
        _shared_access_client = httpx.AsyncClient(
            timeout=_ACCESS_TIMEOUT,
            follow_redirects=True,
            limits=_ACCESS_LIMITS,
        )
    return _shared_access_client


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


async def check_accessibility(
    url: str,
    client: Optional[httpx.AsyncClient] = None,
) -> Optional[str]:
    """检测 URL 是否可访问；仅在明确无效时返回错误，避免误报。"""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            return "链接格式不正确，请输入完整 URL（以 http:// 或 https:// 开头）"

        headers = {"User-Agent": "Mozilla/5.0 (compatible; OpenClaw-Auditor/1.0)"}
        host = _host_of(url)
        soft_check = _is_soft_check_host(host)

        http_client = client or get_shared_access_client()
        resp = await http_client.head(url, headers=headers)
        if resp.status_code in (405, 501):
            resp = await http_client.get(url, headers=headers)

        # 只对明确无效状态码报错，避免把登录态/反爬误判为失效
        if resp.status_code in (404, 410):
            return f"链接不存在或已失效（{resp.status_code}）"

        # 协作/视频平台：其余状态视为可用（常见 401/403/412/429 等）
        if soft_check:
            return None

        # 其他平台：保守报错，仅对大多数情况下明确异常的状态码报错
        if resp.status_code >= 400 and resp.status_code not in (
            401,
            403,
            405,
            412,
            429,
        ):
            return f"链接返回错误状态码 {resp.status_code}"

        return None
    except httpx.TimeoutException:
        # 网络抖动、跨境链路波动会造成大量误报，超时不判定为错误
        return None
    except Exception as e:
        # DNS/握手/反爬拦截也可能误报，仅在 URL 明显非法时才报错
        if "InvalidURL" in str(type(e)):
            return "链接格式不正确，请检查后重试"
        return None
