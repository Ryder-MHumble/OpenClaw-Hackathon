import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Form, HTTPException

from database import supabase
from models import TrackControlRequest, BlockDeviceRequest, BlockIpRequest

router = APIRouter()


@router.get("/api/voting/admin/suspicious-votes")
async def get_suspicious_votes():
    """查询可疑投票（实时监控）"""
    try:
        result = supabase.table("suspicious_votes_monitor_view").select("*").execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/admin/stats-enhanced")
async def get_enhanced_stats():
    """查询增强的投票统计（包含可疑投票信息）"""
    try:
        result = supabase.table("voting_stats_enhanced_view").select("*").execute()
        return {"data": result.data[0] if result.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/admin/duplicate-ips")
async def get_duplicate_ips():
    """查询重复IP投票（事后审核用）"""
    try:
        result = supabase.table("ip_cluster_view").select("*").execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/admin/generate-codes")
async def generate_audience_codes(count: int = Form(...)):
    """Generate access codes for audience members (admin only)"""
    try:
        codes = []
        for _ in range(count):
            code = secrets.token_urlsafe(8)
            codes.append({
                "voter_type": "audience",
                "access_code": code,
                "full_name": f"观众_{code[:6]}",
                "is_active": True
            })

        result = supabase.table("voters").insert(codes).execute()
        return {"message": f"成功生成 {count} 个访问码", "codes": [c["access_code"] for c in codes]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/admin/open-track")
async def open_track_voting(body: TrackControlRequest):
    """开启某赛道的投票（管理员）- track: academic | productivity | life | all"""
    try:
        track = body.track
        now = datetime.now(timezone.utc)
        end_time = now + timedelta(minutes=3)
        track_names = {"academic": "学术龙虾", "productivity": "生产力龙虾", "life": "生活龙虾", "all": "全部赛道"}
        supabase.table("voting_sessions").update({"is_active": False}).eq("is_active", True).execute()
        result = supabase.table("voting_sessions").insert({
            "name": f"{track_names.get(track, track)} 投票",
            "track": track,
            "is_active": True,
            "start_time": now.isoformat(),
            "end_time": end_time.isoformat()
        }).execute()
        return {"message": f"赛道「{track_names.get(track, track)}」投票已开启，持续3分钟", "session": result.data[0] if result.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/admin/close-track")
async def close_track_voting(body: TrackControlRequest):
    """关闭某赛道的投票（管理员）"""
    try:
        track = body.track
        track_names = {"academic": "学术龙虾", "productivity": "生产力龙虾", "life": "生活龙虾", "all": "全部赛道"}
        supabase.table("voting_sessions").update({"is_active": False}).eq("track", track).eq("is_active", True).execute()
        return {"message": f"赛道「{track_names.get(track, track)}」投票已关闭"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/admin/audit-logs")
async def get_audit_logs(limit: int = 100, suspicious_only: bool = False):
    """查询投票审计日志（管理员）"""
    try:
        query = supabase.table("vote_audit_logs").select("*").order("created_at", desc=True).limit(limit)
        if suspicious_only:
            query = query.eq("is_suspicious", True)
        result = query.execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/admin/device-clusters")
async def get_device_clusters():
    """查询设备集群异常（同一设备多次投票）"""
    try:
        result = supabase.table("device_cluster_view").select("*").execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/admin/ip-clusters")
async def get_ip_clusters():
    """查询IP集群异常（同一IP多次投票）"""
    try:
        result = supabase.table("ip_cluster_view").select("*").execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/admin/block-device")
async def block_device(body: BlockDeviceRequest):
    """封禁设备（管理员）"""
    try:
        supabase.table("device_vote_limits").update({
            "is_blocked": True,
            "block_reason": body.reason
        }).eq("session_id", body.session_id).eq("device_fingerprint", body.device_fingerprint).execute()
        return {"message": "设备已被封禁"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/admin/block-ip")
async def block_ip(body: BlockIpRequest):
    """封禁IP地址（管理员）"""
    try:
        supabase.table("ip_vote_limits").update({
            "is_blocked": True,
            "block_reason": body.reason
        }).eq("session_id", body.session_id).eq("ip_address", body.ip_address).execute()
        return {"message": f"IP {body.ip_address} 已被封禁"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
