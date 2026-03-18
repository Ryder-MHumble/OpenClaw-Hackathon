from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import participants, judges, files, voting_auth, voting_core, voting_admin

app = FastAPI(title="OpenClaw Hackathon API")

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


@app.get("/")
async def root():
    return {"message": "OpenClaw Hackathon API", "status": "running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
