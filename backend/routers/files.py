import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
import httpx

router = APIRouter()

UPLOAD_DIR = "uploads"
_PROXY_TIMEOUT = httpx.Timeout(15.0, connect=5.0)
_PROXY_LIMITS = httpx.Limits(max_connections=100, max_keepalive_connections=20)
_proxy_client: httpx.AsyncClient | None = None


def get_proxy_client() -> httpx.AsyncClient:
    global _proxy_client
    if _proxy_client is None:
        _proxy_client = httpx.AsyncClient(
            timeout=_PROXY_TIMEOUT,
            follow_redirects=True,
            limits=_PROXY_LIMITS,
        )
    return _proxy_client


@router.get("/api/proxy-image")
async def proxy_image(url: str):
    """代理加载外部图片，避免CORS限制"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com/",
            "Accept": "image/*,*/*;q=0.8",
        }

        client = get_proxy_client()
        response = await client.get(url, headers=headers)
        response.raise_for_status()

        content_type = response.headers.get("content-type", "image/jpeg")

        return StreamingResponse(
            iter([response.content]),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
                "Content-Disposition": "inline",
            },
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502, detail=f"无法加载图片: HTTP {e.response.status_code}"
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="图片加载超时")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"无法加载图片: {str(e)}")


@router.get("/api/files/{file_type}/{filename}")
async def get_file(file_type: str, filename: str):
    file_path = f"{UPLOAD_DIR}/{file_type}s/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
