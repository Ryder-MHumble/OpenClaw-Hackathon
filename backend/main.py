from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from typing import Optional, List
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import aiofiles
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import PyPDF2
import json
import httpx

load_dotenv()

app = FastAPI(title="OpenClaw Hackathon API")

# CORS - 同时支持 Vite 默认端口(5173) 和自定义端口(3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
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
JUDGE_ALLOWED_DOMAIN = os.getenv("JUDGE_ALLOWED_DOMAIN", "@zgci.ac.cn")

# OpenRouter AI
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "minimax/minimax-m2.5")

# File storage
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/pdfs", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/videos", exist_ok=True)
os.makedirs(f"{UPLOAD_DIR}/posters", exist_ok=True)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def save_upload_file(upload_file: UploadFile, destination: str):
    async with aiofiles.open(destination, 'wb') as out_file:
        content = await upload_file.read()
        await out_file.write(content)

def extract_pdf_text(file_path: str) -> str:
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        return f"Error extracting PDF: {str(e)}"

@app.get("/")
async def root():
    return {"message": "OpenClaw Hackathon API", "status": "running"}

@app.post("/api/participants/register")
async def register_participant(
    fullName: str = Form(...),
    email: str = Form(...),
    organization: str = Form(...),
    github: str = Form(None),
    projectTitle: str = Form(...),
    projectDescription: str = Form(...),
    demoUrl: str = Form(None),
    repoUrl: str = Form(None),
    pdf: Optional[UploadFile] = File(None),
    video: Optional[UploadFile] = File(None),
    poster: Optional[UploadFile] = File(None)
):
    try:
        # Save files
        pdf_path = None
        video_path = None
        poster_path = None
        pdf_text = None

        if pdf:
            pdf_filename = f"{datetime.now().timestamp()}_{pdf.filename}"
            pdf_path = f"{UPLOAD_DIR}/pdfs/{pdf_filename}"
            await save_upload_file(pdf, pdf_path)
            pdf_text = extract_pdf_text(pdf_path)

        if video:
            video_filename = f"{datetime.now().timestamp()}_{video.filename}"
            video_path = f"{UPLOAD_DIR}/videos/{video_filename}"
            await save_upload_file(video, video_path)

        if poster:
            # 验证图片类型
            allowed_image_types = {"image/jpeg", "image/png", "image/webp"}
            if poster.content_type not in allowed_image_types:
                raise HTTPException(status_code=400, detail="海报仅支持 JPG / PNG / WebP 格式")
            poster_filename = f"{datetime.now().timestamp()}_{poster.filename}"
            poster_path = f"{UPLOAD_DIR}/posters/{poster_filename}"
            await save_upload_file(poster, poster_path)

        # Insert into Supabase
        data = {
            "full_name": fullName,
            "email": email,
            "organization": organization,
            "github": github,
            "project_title": projectTitle,
            "project_description": projectDescription,
            "demo_url": demoUrl,
            "repo_url": repoUrl,
            "pdf_path": pdf_path,
            "video_path": video_path,
            "poster_path": poster_path,
            "pdf_text": pdf_text,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }

        result = supabase.table("participants").insert(data).execute()

        return {"message": "Registration successful", "data": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/judges/login")
async def judge_login(email: str = Form(...)):
    email = email.strip().lower()
    if not email.endswith(JUDGE_ALLOWED_DOMAIN):
        raise HTTPException(status_code=401, detail=f"仅限研究院员工登录（邮箱须以 {JUDGE_ALLOWED_DOMAIN} 结尾）")

    token = create_access_token({"sub": email, "role": "judge"})
    return {"token": token, "message": "Login successful", "email": email}

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
        return {"data": result.data}
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
