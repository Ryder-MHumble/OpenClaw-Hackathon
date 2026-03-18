import secrets

from fastapi import APIRouter, HTTPException, Request

from auth import create_access_token, pwd_context
from database import supabase
from models import JudgeVoterLoginRequest, AudienceVoterLoginRequest
from services.anti_cheat import generate_server_device_fingerprint, get_client_ip

router = APIRouter()


@router.post("/api/voting/auth/judge-login")
async def judge_voter_login(body: JudgeVoterLoginRequest):
    """Judge login for voting (separate from preliminary judging)"""
    try:
        result = supabase.table("voters").select("*").eq("email", body.email).eq("voter_type", "judge").execute()
        if not result.data:
            raise HTTPException(status_code=401, detail="评委账号不存在")

        voter = result.data[0]
        if not pwd_context.verify(body.password, voter["password_hash"]):
            raise HTTPException(status_code=401, detail="密码错误")

        if not voter["is_active"]:
            raise HTTPException(status_code=403, detail="账号已被禁用")

        token = create_access_token({
            "sub": str(voter["id"]),
            "voter_type": "judge",
            "email": voter["email"]
        })

        return {
            "token": token,
            "voter": {
                "id": voter["id"],
                "full_name": voter["full_name"],
                "voter_type": "judge",
                "has_voted": voter["has_voted"],
                "vote_count": voter["vote_count"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/auth/audience-login")
async def audience_voter_login(body: AudienceVoterLoginRequest):
    """Audience login with access code (no password)"""
    try:
        result = supabase.table("voters").select("*").eq("access_code", body.access_code).eq("voter_type", "audience").execute()

        if not result.data:
            raise HTTPException(status_code=401, detail="访问码无效")

        voter = result.data[0]
        if not voter["is_active"]:
            raise HTTPException(status_code=403, detail="访问码已被禁用")

        if body.full_name and not voter["full_name"]:
            supabase.table("voters").update({"full_name": body.full_name}).eq("id", voter["id"]).execute()
            voter["full_name"] = body.full_name

        token = create_access_token({
            "sub": str(voter["id"]),
            "voter_type": "audience",
            "access_code": voter["access_code"]
        })

        return {
            "token": token,
            "voter": {
                "id": voter["id"],
                "full_name": voter["full_name"],
                "voter_type": "audience",
                "has_voted": voter["has_voted"],
                "vote_count": voter["vote_count"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/voting/auth/anonymous-login")
async def anonymous_voter_login(request: Request):
    """Anonymous audience login - no access code required"""
    try:
        device_fp = generate_server_device_fingerprint(request)
        ip_address = get_client_ip(request)

        result = supabase.table("voters").select("*").eq("device_fingerprint", device_fp).eq("voter_type", "audience").execute()

        if result.data:
            voter = result.data[0]
        else:
            anonymous_id = f"观众_{secrets.token_hex(4)}"
            voter_data = {
                "voter_type": "audience",
                "full_name": anonymous_id,
                "is_active": True,
                "device_fingerprint": device_fp,
                "ip_address": ip_address,
                "access_code": None
            }
            result = supabase.table("voters").insert(voter_data).execute()
            voter = result.data[0]

        token = create_access_token({
            "sub": str(voter["id"]),
            "voter_type": "audience",
            "is_anonymous": True
        })

        return {
            "token": token,
            "voter": {
                "id": voter["id"],
                "full_name": voter["full_name"],
                "voter_type": "audience",
                "has_voted": voter.get("has_voted", False),
                "vote_count": voter.get("vote_count", 0)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
