import json
from datetime import datetime

from fastapi import APIRouter, Form, HTTPException
import httpx

from config import JUDGE_PASSWORD, OPENROUTER_API_KEY, OPENROUTER_MODEL
from database import supabase
from auth import create_access_token

router = APIRouter()


@router.post("/api/judges/login")
async def judge_login(password: str = Form(...)):
    if password != JUDGE_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，请重试")

    token = create_access_token({"sub": "judge", "role": "judge"})
    return {"token": token, "message": "Login successful"}


@router.post("/api/judges/score")
async def submit_score(
    participant_id: int = Form(...),
    innovation: float = Form(...),
    technical: float = Form(...),
    market: float = Form(...),
    demo: float = Form(...),
    comments: str = Form(None)
):
    try:
        weighted_score = (innovation * 0.2 + technical * 0.2 + market * 0.5 + demo * 0.1)

        data = {
            "participant_id": participant_id,
            "innovation_score": innovation,
            "technical_score": technical,
            "market_score": market,
            "demo_score": demo,
            "weighted_score": weighted_score,
            "comments": comments,
            "created_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("scores").insert(data).execute()
        supabase.table("participants").update({"status": "scored"}).eq("id", participant_id).execute()

        return {"message": "Score submitted successfully", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/leaderboard")
async def get_leaderboard():
    try:
        result = supabase.table("leaderboard_view").select("*").execute()
        leaderboard_data = result.data

        participants_result = supabase.table("participants").select("id, poster_url").execute()
        poster_map = {p["id"]: p["poster_url"] for p in participants_result.data}

        for item in leaderboard_data:
            item["poster_url"] = poster_map.get(item.get("participant_id") or item.get("id"))

        return {"data": leaderboard_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/stats")
async def get_stats():
    """仪表盘统计摘要：总数、各状态计数、有PDF/视频数量"""
    try:
        result = supabase.table("stats_view").select("*").execute()
        return {"data": result.data[0] if result.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/judges/ai-analyze/{participant_id}")
async def ai_analyze_participant(participant_id: int):
    """使用 AI 分析参赛作品并给出评分建议"""
    try:
        result = supabase.table("participants").select("*").eq("id", participant_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")
        p = result.data[0]

        pdf_context = f"\n参赛者还上传了项目计划书，提取内容如下：\n{p.get('pdf_text', '')[:2000]}" if p.get('pdf_text') else ""
        prompt = f"""你是一位经验丰富的技术创业评审专家，请对以下参赛项目进行客观、专业的评审分析。

【参赛信息】
- 参赛者姓名：{p.get('full_name', '未知')}
- 所属机构：{p.get('organization', '未知')}
- 项目名称：{p.get('project_title', '未知')}
- 项目介绍：{p.get('project_description', '未提供')}
- Demo 地址：{p.get('demo_url') or '未提供'}
- 代码仓库：{p.get('repo_url') or '未提供'}{pdf_context}

【评审维度说明】
1. 应用前景（0-10分）：市场需求、商业前景、用户价值
2. 创新难度（0-10分）：技术或商业模式的创新程度与实现难度
3. 技术实现与完成度（0-10分）：技术选型合理性、实现质量、代码完整性
4. 路演表现（0-10分）：产品完成度、演示效果、用户体验

请以 JSON 格式返回分析结果，格式如下：
{{
  "summary": "项目综合评述（150字以内）",
  "strengths": ["亮点1", "亮点2", "亮点3"],
  "concerns": ["潜在问题1", "潜在问题2"],
  "suggested_scores": {{
    "innovation": 7.5,
    "technical": 8.0,
    "market": 7.0,
    "demo": 7.5
  }},
  "recommendation": "进入决赛" 或 "建议淘汰" 或 "待进一步了解"
}}

只返回 JSON，不要添加其他内容。"""

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://openclaw.hackathon",
                    "X-Title": "OpenClaw Hackathon Judge"
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 800
                }
            )
            response.raise_for_status()
            ai_response = response.json()

        raw_text = ai_response["choices"][0]["message"]["content"].strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        analysis = json.loads(raw_text.strip())
        return {"data": analysis, "participant_id": participant_id}

    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"AI 服务错误: {e.response.text}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI 返回格式异常，请重试")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
