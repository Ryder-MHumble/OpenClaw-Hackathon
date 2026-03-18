from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from auth import get_current_voter
from database import supabase
from models import BatchVoteSubmission
from services.anti_cheat import (
    get_client_ip,
    generate_server_device_fingerprint,
    check_device_voting_limit,
    check_ip_voting_limit,
    log_vote_audit,
    update_device_vote_limit,
    update_ip_vote_limit,
)

router = APIRouter()


@router.get("/api/voting/session/active")
async def get_active_voting_session():
    """Get currently active voting session"""
    try:
        result = supabase.table("voting_sessions").select("*").eq("is_active", True).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="当前没有进行中的投票")

        session = result.data[0]
        now = datetime.utcnow()
        start = datetime.fromisoformat(session["start_time"].replace("Z", "+00:00"))
        end = datetime.fromisoformat(session["end_time"].replace("Z", "+00:00"))

        if now < start:
            raise HTTPException(status_code=400, detail="投票尚未开始")
        if now > end:
            raise HTTPException(status_code=400, detail="投票已结束")

        return {"data": session}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/vote")
async def submit_vote(request: Request, body: BatchVoteSubmission, voter: dict = Depends(get_current_voter)):
    """Submit votes with anti-cheat checks.
    - 评委: 全局只能投3票（从所有30支团队中选3支）
    - 观众: 每个赛道各投3票，需在请求中传 track 字段
    """
    try:
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        device_fp = body.device_fingerprint or generate_server_device_fingerprint(request)

        if len(body.votes) != 3:
            raise HTTPException(status_code=400, detail="必须投票给3个不同的团队")
        participant_ids = [v.participant_id for v in body.votes]
        if len(set(participant_ids)) != 3:
            raise HTTPException(status_code=400, detail="不能重复投票给同一个团队")
        for vote in body.votes:
            if vote.star_rating not in [3, 4, 5]:
                raise HTTPException(status_code=400, detail="星级评分必须是3、4或5")

        session_result = supabase.table("voting_sessions").select("*").eq("is_active", True).execute()
        if not session_result.data:
            raise HTTPException(status_code=400, detail="当前没有进行中的投票")
        session = session_result.data[0]

        voter_result = supabase.table("voters").select("*").eq("id", voter["id"]).execute()
        if not voter_result.data:
            raise HTTPException(status_code=404, detail="投票人不存在")
        voter_data = voter_result.data[0]
        voter_type = voter_data["voter_type"]

        if voter_type == "judge":
            if voter_data["has_voted"]:
                await log_vote_audit(session["id"], voter["id"], "vote_attempt_blocked", [],
                                     client_ip, device_fp, user_agent,
                                     is_suspicious=True, suspicious_reason="评委尝试重复投票")
                raise HTTPException(status_code=400, detail="您已经投过票了")
            vote_track = None
        else:
            vote_track = body.track
            if not vote_track:
                raise HTTPException(status_code=400, detail="观众投票必须指定赛道（track 字段）")
            if vote_track not in ("academic", "productivity", "life"):
                raise HTTPException(status_code=400, detail="赛道必须是 academic / productivity / life 之一")

            track_limit = supabase.table("vote_limits").select("*") \
                .eq("session_id", session["id"]) \
                .eq("voter_id", voter["id"]) \
                .eq("track", vote_track).execute()
            if track_limit.data and track_limit.data[0]["votes_used"] >= 3:
                raise HTTPException(status_code=400, detail=f"您已经为「{vote_track}」赛道投过票了")

            teams_result = supabase.table("participants").select("id,track") \
                .in_("id", participant_ids).execute()
            for team in teams_result.data:
                if team["track"] != vote_track:
                    raise HTTPException(status_code=400, detail=f"团队 {team['id']} 不属于「{vote_track}」赛道，请只投同一赛道的团队")

        device_check = await check_device_voting_limit(session["id"], device_fp, voter["id"])
        if not device_check["allowed"]:
            await log_vote_audit(session["id"], voter["id"], "vote_attempt_blocked", [],
                                 client_ip, device_fp, user_agent,
                                 is_suspicious=True, suspicious_reason=device_check["reason"])
            raise HTTPException(status_code=403, detail=device_check["reason"])

        max_ip = 1 if voter_type == "judge" else 3
        ip_check = await check_ip_voting_limit(session["id"], client_ip, voter["id"], max_votes_per_ip=max_ip)
        if not ip_check["allowed"]:
            await log_vote_audit(session["id"], voter["id"], "vote_attempt_blocked", [],
                                 client_ip, device_fp, user_agent,
                                 is_suspicious=True, suspicious_reason=ip_check["reason"])
            raise HTTPException(status_code=403, detail=ip_check["reason"])

        vote_records = []
        for vote in body.votes:
            record = {
                "session_id": session["id"],
                "voter_id": voter["id"],
                "participant_id": vote.participant_id,
                "star_rating": vote.star_rating,
                "comment": vote.comment,
                "created_at": datetime.utcnow().isoformat()
            }
            if vote_track:
                record["track"] = vote_track
            vote_records.append(record)
        vote_result = supabase.table("votes").insert(vote_records).execute()
        vote_ids = [v["id"] for v in vote_result.data] if vote_result.data else []

        new_vote_count = (voter_data.get("vote_count") or 0) + 3
        update_data = {
            "vote_count": new_vote_count,
            "last_voted_at": datetime.utcnow().isoformat(),
            "voted_ip": client_ip
        }
        if voter_type == "judge":
            update_data["has_voted"] = True
        else:
            all_track_limits = supabase.table("vote_limits").select("track") \
                .eq("session_id", session["id"]).eq("voter_id", voter["id"]).execute()
            done_tracks = {r["track"] for r in all_track_limits.data if r.get("track")}
            done_tracks.add(vote_track)
            if done_tracks >= {"academic", "productivity", "life"}:
                update_data["has_voted"] = True
        supabase.table("voters").update(update_data).eq("id", voter["id"]).execute()

        limit_query = supabase.table("vote_limits").select("*") \
            .eq("session_id", session["id"]).eq("voter_id", voter["id"])
        if vote_track:
            limit_query = limit_query.eq("track", vote_track)
        else:
            limit_query = limit_query.is_("track", "null")
        limit_result = limit_query.execute()

        if limit_result.data:
            supabase.table("vote_limits").update({
                "votes_used": 3,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", limit_result.data[0]["id"]).execute()
        else:
            insert_data = {
                "session_id": session["id"],
                "voter_id": voter["id"],
                "votes_used": 3,
                "max_votes": 3
            }
            if vote_track:
                insert_data["track"] = vote_track
            supabase.table("vote_limits").insert(insert_data).execute()

        await update_device_vote_limit(session["id"], device_fp, voter["id"], device_check.get("existing_record"))
        await update_ip_vote_limit(session["id"], client_ip, voter["id"], ip_check.get("existing_record"))

        is_suspicious = ip_check.get("is_suspicious", False) or device_check.get("is_suspicious", False)
        await log_vote_audit(session["id"], voter["id"], "vote_submitted", vote_ids,
                             client_ip, device_fp, user_agent,
                             is_suspicious=is_suspicious,
                             suspicious_reason="IP或设备有多次投票记录" if is_suspicious else None)

        return {"message": "投票成功", "votes_submitted": len(body.votes), "track": vote_track}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/my-votes")
async def get_my_votes(voter: dict = Depends(get_current_voter)):
    """Get current voter's votes"""
    try:
        session_result = supabase.table("voting_sessions").select("*").eq("is_active", True).execute()
        if not session_result.data:
            return {"data": []}

        session = session_result.data[0]
        result = supabase.table("votes").select("*, participants(*)").eq("session_id", session["id"]).eq("voter_id", voter["id"]).execute()

        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/teams")
async def get_voting_teams(track: Optional[str] = None):
    """Get teams available for voting (only scored teams)"""
    try:
        query = supabase.table("participants").select("*").eq("status", "scored")
        if track:
            query = query.eq("track", track)
        result = query.execute()

        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/leaderboard")
async def get_voting_leaderboard(track: Optional[str] = None):
    """Get real-time voting leaderboard"""
    try:
        query = supabase.table("voting_leaderboard_view").select("*")
        if track:
            query = query.eq("track", track)
        result = query.execute()

        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/voting/stats")
async def get_voting_stats():
    """Get voting statistics for admin dashboard"""
    try:
        result = supabase.table("voting_stats_enhanced_view").select("*").execute()
        return {"data": result.data[0] if result.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
