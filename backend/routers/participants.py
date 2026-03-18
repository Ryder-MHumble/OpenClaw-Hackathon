from datetime import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from database import supabase
from models import RegisterRequest, UpdateStatusRequest
from services.url_validator import validate_url, check_accessibility
from services.email_service import audit_and_notify

router = APIRouter()


class CheckUrlRequest(BaseModel):
    url: str


@router.post("/api/participants/check-url")
async def check_url_accessibility(body: CheckUrlRequest):
    """检查 URL 是否可访问（供前端实时校验使用）"""
    try:
        # 前端格式校验
        validation_error = validate_url(body.url, "url")
        if validation_error and validation_error.get("level") == "error":
            return {
                "accessible": False,
                "error": validation_error.get("message")
            }

        # 后端可访问性检查
        accessibility_error = await check_accessibility(body.url)
        if accessibility_error:
            return {
                "accessible": False,
                "error": accessibility_error
            }

        return {
            "accessible": True,
            "message": "链接可正常访问"
        }
    except Exception as e:
        return {
            "accessible": False,
            "error": f"检查失败：{str(e)}"
        }


@router.post("/api/participants/register")
async def register_participant(body: RegisterRequest, background_tasks: BackgroundTasks):
    url_issues = []
    for field, value in [
        ("pdfUrl", body.pdfUrl),
        ("posterUrl", body.posterUrl),
        ("videoUrl", body.videoUrl),
        ("repoUrl", body.repoUrl),
        ("demoUrl", body.demoUrl),
    ]:
        issue = validate_url(value, field)
        if issue:
            url_issues.append(issue)

    errors = [i for i in url_issues if i["level"] == "error"]
    if errors:
        raise HTTPException(
            status_code=422,
            detail={"url_errors": errors,
                    "message": "提交的链接存在问题，请修正后重新提交"}
        )

    try:
        data = {
            "full_name": body.fullName,
            "email": body.email,
            "organization": body.organization,
            "github": body.phone,
            "track": body.track or None,
            "project_title": body.projectTitle,
            "project_description": body.projectDescription,
            "demo_url": body.demoUrl or None,
            "repo_url": body.repoUrl or None,
            "pdf_url": body.pdfUrl or None,
            "video_url": body.videoUrl or None,
            "poster_url": body.posterUrl or None,
            "status": "pending"
        }

        result = supabase.table("participants").insert(data).execute()

        background_tasks.add_task(
            audit_and_notify,
            name=body.fullName,
            email=body.email,
            project_title=body.projectTitle,
            url_fields={
                "pdfUrl":    body.pdfUrl,
                "posterUrl": body.posterUrl,
                "videoUrl":  body.videoUrl,
                "repoUrl":   body.repoUrl,
                "demoUrl":   body.demoUrl,
            },
        )

        warnings = [i for i in url_issues if i["level"] == "warning"]
        return {
            "message": "Registration successful",
            "data": result.data,
            "url_warnings": warnings if warnings else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/participants")
async def get_participants(status: Optional[str] = None):
    try:
        query = supabase.table("participants").select("*")
        if status:
            query = query.eq("status", status)
        result = query.execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/participants/stats/tracks")
async def get_track_stats():
    try:
        result = supabase.table("participants").select("track").execute()
        counts = {}
        for p in result.data:
            track = p.get("track") or "未分类"
            counts[track] = counts.get(track, 0) + 1
        total = sum(counts.values())
        return {
            "data": [{"track": t, "count": c} for t, c in sorted(counts.items())],
            "total": total
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/api/judges/participants/{participant_id}/status")
async def update_participant_status(participant_id: int, body: UpdateStatusRequest):
    """更新参赛者状态（初筛阶段）"""
    try:
        valid_statuses = ["pending", "reviewing", "scored", "rejected"]
        if body.status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")

        result = supabase.table("participants").update({
            "status": body.status,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", participant_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")

        if body.comments and body.status == "rejected":
            supabase.table("scores").insert({
                "participant_id": participant_id,
                "judge_id": None,
                "innovation_score": 0,
                "technical_score": 0,
                "market_score": 0,
                "demo_score": 0,
                "weighted_score": 0,
                "comments": f"初筛不通过: {body.comments}",
                "created_at": datetime.utcnow().isoformat()
            }).execute()

        return {"message": "Status updated successfully", "data": result.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/participants/{participant_id}/next")
async def get_next_participant(participant_id: int, status: Optional[str] = None):
    """获取当前参赛者之后的下一个参赛者"""
    try:
        query = supabase.table("participants").select("id, status").order("id")
        if status:
            query = query.eq("status", status)
        result = query.execute()
        all_ids = [p["id"] for p in result.data]

        if participant_id in all_ids:
            idx = all_ids.index(participant_id)
            if idx + 1 < len(all_ids):
                return {"data": {"next_id": all_ids[idx + 1]}}
        return {"data": {"next_id": None}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/participants/{participant_id}")
async def get_participant(participant_id: int):
    try:
        result = supabase.table("participants").select("*").eq("id", participant_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")
        return {"data": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/api/judges/participants/{participant_id}")
async def delete_participant(participant_id: int):
    """删除参赛者及其相关评分记录"""
    try:
        supabase.table("scores").delete().eq("participant_id", participant_id).execute()
        result = supabase.table("participants").delete().eq("id", participant_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")

        return {"message": "Participant deleted successfully", "data": result.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
