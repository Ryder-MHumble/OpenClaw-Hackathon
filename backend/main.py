from fastapi import FastAPI, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import httpx
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="OpenClaw Hackathon API")

# CORS - 支持本地开发和生产环境
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://open-claw-hackathon-lilac.vercel.app",
        "http://43.98.254.243:3000",
        "http://43.98.254.243",
        "https://claw.lab.bza.edu.cn",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = "HS256"
JUDGE_PASSWORD = os.getenv("JUDGE_PASSWORD", "")

# OpenRouter AI
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "minimax/minimax-m2.5")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

class RegisterRequest(BaseModel):
    fullName: str
    email: str
    organization: str
    phone: Optional[str] = None
    track: Optional[str] = None  # academic | productivity | life
    projectTitle: str
    projectDescription: str
    demoUrl: Optional[str] = None
    repoUrl: Optional[str] = None
    pdfUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    posterUrl: Optional[str] = None

@app.get("/")
async def root():
    return {"message": "OpenClaw Hackathon API", "status": "running"}

@app.post("/api/participants/register")
async def register_participant(body: RegisterRequest):
    try:
        data = {
            "full_name": body.fullName,
            "email": body.email,
            "organization": body.organization,
            "github": body.phone,  # Using phone field temporarily for github
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

        return {"message": "Registration successful", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/judges/login")
async def judge_login(password: str = Form(...)):
    if password != JUDGE_PASSWORD:
        raise HTTPException(status_code=401, detail="密码错误，请重试")

    token = create_access_token({"sub": "judge", "role": "judge"})
    return {"token": token, "message": "Login successful"}

@app.get("/api/judges/participants")
async def get_participants(status: Optional[str] = None):
    try:
        query = supabase.table("participants").select("*")
        if status:
            query = query.eq("status", status)
        result = query.execute()
        return {"data": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/judges/participants/{participant_id}/status")
async def update_participant_status(
    participant_id: int,
    status: str = Form(...),
    comments: str = Form(None)
):
    """更新参赛者状态（初筛阶段）"""
    try:
        # 验证状态值
        valid_statuses = ["pending", "reviewing", "scored", "rejected"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail="Invalid status")

        # 更新状态
        result = supabase.table("participants").update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", participant_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")

        # 如果有评论，可以记录到scores表（可选）
        if comments and status == "rejected":
            supabase.table("scores").insert({
                "participant_id": participant_id,
                "judge_id": None,
                "innovation_score": 0,
                "technical_score": 0,
                "market_score": 0,
                "demo_score": 0,
                "weighted_score": 0,
                "comments": f"初筛不通过: {comments}",
                "created_at": datetime.utcnow().isoformat()
            }).execute()

        return {"message": "Status updated successfully", "data": result.data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/judges/participants/{participant_id}")
async def get_participant(participant_id: int):
    try:
        result = supabase.table("participants").select("*").eq("id", participant_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")
        return {"data": result.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/judges/score")
async def submit_score(
    participant_id: int = Form(...),
    innovation: float = Form(...),
    technical: float = Form(...),
    market: float = Form(...),
    demo: float = Form(...),
    comments: str = Form(None)
):
    try:
        # Calculate weighted score
        weighted_score = (innovation * 0.3 + technical * 0.3 + market * 0.2 + demo * 0.2)

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

        # Update participant status
        supabase.table("participants").update({"status": "scored"}).eq("id", participant_id).execute()

        return {"message": "Score submitted successfully", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/judges/leaderboard")
async def get_leaderboard():
    try:
        # 使用 leaderboard_view 视图（已在数据库中聚合）
        result = supabase.table("leaderboard_view").select("*").execute()
        leaderboard_data = result.data

        # 获取所有参赛者的 poster_url
        participants_result = supabase.table("participants").select("id, poster_url").execute()
        poster_map = {p["id"]: p["poster_url"] for p in participants_result.data}

        # 将 poster_url 添加到排行榜数据中
        for item in leaderboard_data:
            item["poster_url"] = poster_map.get(item.get("participant_id") or item.get("id"))

        return {"data": leaderboard_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/judges/stats")
async def get_stats():
    """仪表盘统计摘要：总数、各状态计数、有PDF/视频数量"""
    try:
        result = supabase.table("stats_view").select("*").execute()
        return {"data": result.data[0] if result.data else {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/judges/participants/{participant_id}/next")
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

@app.get("/api/proxy-image")
async def proxy_image(url: str):
    """代理加载外部图片，避免CORS限制"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.bilibili.com/",
            "Accept": "image/*,*/*;q=0.8"
        }

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()

            # 获取图片的Content-Type
            content_type = response.headers.get("content-type", "image/jpeg")

            return StreamingResponse(
                iter([response.content]),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*",
                    "Content-Disposition": "inline"
                }
            )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"无法加载图片: HTTP {e.response.status_code}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="图片加载超时")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"无法加载图片: {str(e)}")


@app.get("/api/files/{file_type}/{filename}")
async def get_file(file_type: str, filename: str):
    file_path = f"{UPLOAD_DIR}/{file_type}s/{filename}"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

@app.get("/api/judges/ai-analyze/{participant_id}")
async def ai_analyze_participant(participant_id: int):
    """使用 AI 分析参赛作品并给出评分建议"""
    try:
        # 从数据库获取参赛者信息
        result = supabase.table("participants").select("*").eq("id", participant_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Participant not found")
        p = result.data[0]

        # 构建分析 prompt
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
1. 创新性（0-10分）：技术或商业模式的创新程度
2. 技术实现（0-10分）：技术选型合理性、实现难度、代码质量
3. 市场价值（0-10分）：市场需求、商业前景、用户价值
4. Demo 演示（0-10分）：产品完成度、演示效果、用户体验

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

        # 调用 OpenRouter API
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
        # 提取 JSON（可能被包裹在 ```json 中）
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
