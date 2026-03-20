from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse

from routers import participants, judges, files, voting_auth, voting_core, voting_admin

app = FastAPI(
    title="OpenClaw Hackathon API",
    docs_url=None,  # 禁用默认的 Swagger UI
    redoc_url=None,  # 禁用 ReDoc
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://43.98.254.243:3000",
        "http://43.98.254.243",
        "https://claw.lab.bza.edu.cn",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(participants.router)
app.include_router(judges.router)
app.include_router(files.router)
app.include_router(voting_auth.router)
app.include_router(voting_core.router)
app.include_router(voting_admin.router)


@app.on_event("startup")
async def startup_event():
    await participants.initialize_participant_services()


@app.on_event("shutdown")
async def shutdown_event():
    await participants.shutdown_participant_services()


@app.get("/")
async def root():
    return {"message": "OpenClaw Hackathon API", "status": "running"}


@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    """使用 Scalar 渲染 API 文档"""
    return HTMLResponse(
        content=f"""
<!doctype html>
<html>
  <head>
    <title>OpenClaw Hackathon API - Documentation</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-configuration='{{"theme":"purple","layout":"modern","defaultHttpClient":{{"targetKey":"python","clientKey":"requests"}}}}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
        """,
        status_code=200,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
