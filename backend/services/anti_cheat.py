import hashlib
from datetime import datetime
from typing import Optional

from fastapi import Request

from database import supabase


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"


def generate_server_device_fingerprint(request: Request) -> str:
    user_agent = request.headers.get("User-Agent", "")
    accept_language = request.headers.get("Accept-Language", "")
    accept_encoding = request.headers.get("Accept-Encoding", "")
    fingerprint_data = f"{user_agent}|{accept_language}|{accept_encoding}"
    return hashlib.sha256(fingerprint_data.encode()).hexdigest()


async def check_ip_voting_limit(session_id: int, ip_address: str, voter_id: int, max_votes_per_ip: int = 3) -> dict:
    try:
        result = supabase.table("ip_vote_limits").select("*").eq("session_id", session_id).eq("ip_address", ip_address).execute()
        if result.data:
            ip_limit = result.data[0]
            if ip_limit["is_blocked"]:
                return {"allowed": False, "reason": f"该IP地址已被封禁：{ip_limit['block_reason']}", "is_suspicious": True}
            if ip_limit["vote_count"] >= max_votes_per_ip:
                return {"allowed": False, "reason": f"该IP地址投票次数异常（已达{max_votes_per_ip}次），请联系工作人员", "is_suspicious": True}
            return {"allowed": True, "is_suspicious": False, "existing_record": ip_limit}
        return {"allowed": True, "is_suspicious": False, "existing_record": None}
    except Exception as e:
        print(f"IP limit check error: {e}")
        return {"allowed": True, "is_suspicious": False}


async def check_device_voting_limit(session_id: int, device_fingerprint: str, voter_id: int) -> dict:
    try:
        result = supabase.table("device_vote_limits").select("*").eq("session_id", session_id).eq("device_fingerprint", device_fingerprint).execute()
        if result.data:
            device_limit = result.data[0]
            if device_limit["is_blocked"]:
                return {"allowed": False, "reason": f"该设备已被封禁：{device_limit['block_reason']}", "is_suspicious": True}
            voter_ids = device_limit.get("voter_ids") or []
            if voter_id not in voter_ids and device_limit["vote_count"] >= 1:
                return {"allowed": False, "reason": "该设备已经投过票了，每台设备只能投票一次", "is_suspicious": True}
            return {"allowed": True, "is_suspicious": False, "existing_record": device_limit}
        return {"allowed": True, "is_suspicious": False, "existing_record": None}
    except Exception as e:
        print(f"Device limit check error: {e}")
        return {"allowed": True, "is_suspicious": False}


async def log_vote_audit(session_id: int, voter_id: int, action: str, vote_ids: list,
                         ip_address: str, device_fingerprint: str, user_agent: str,
                         is_suspicious: bool = False, suspicious_reason: str = None):
    try:
        supabase.table("vote_audit_logs").insert({
            "session_id": session_id,
            "voter_id": voter_id,
            "action": action,
            "vote_ids": vote_ids,
            "ip_address": ip_address,
            "device_fingerprint": device_fingerprint,
            "user_agent": user_agent,
            "is_suspicious": is_suspicious,
            "suspicious_reason": suspicious_reason,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
    except Exception as e:
        print(f"Audit log error: {e}")


async def update_ip_vote_limit(session_id: int, ip_address: str, voter_id: int, existing_record=None):
    try:
        if existing_record:
            voter_ids = existing_record.get("voter_ids") or []
            if voter_id not in voter_ids:
                voter_ids.append(voter_id)
            supabase.table("ip_vote_limits").update({
                "vote_count": existing_record["vote_count"] + 1,
                "voter_ids": voter_ids,
                "last_vote_at": datetime.utcnow().isoformat()
            }).eq("id", existing_record["id"]).execute()
        else:
            supabase.table("ip_vote_limits").insert({
                "session_id": session_id,
                "ip_address": ip_address,
                "vote_count": 1,
                "voter_ids": [voter_id],
                "first_vote_at": datetime.utcnow().isoformat(),
                "last_vote_at": datetime.utcnow().isoformat()
            }).execute()
    except Exception as e:
        print(f"IP limit update error: {e}")


async def update_device_vote_limit(session_id: int, device_fingerprint: str, voter_id: int, existing_record=None):
    try:
        if existing_record:
            voter_ids = existing_record.get("voter_ids") or []
            if voter_id not in voter_ids:
                voter_ids.append(voter_id)
            supabase.table("device_vote_limits").update({
                "vote_count": existing_record["vote_count"] + 1,
                "voter_ids": voter_ids,
                "last_vote_at": datetime.utcnow().isoformat()
            }).eq("id", existing_record["id"]).execute()
        else:
            supabase.table("device_vote_limits").insert({
                "session_id": session_id,
                "device_fingerprint": device_fingerprint,
                "vote_count": 1,
                "voter_ids": [voter_id],
                "first_vote_at": datetime.utcnow().isoformat(),
                "last_vote_at": datetime.utcnow().isoformat()
            }).execute()
    except Exception as e:
        print(f"Device limit update error: {e}")
