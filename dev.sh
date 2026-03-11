#!/bin/bash
# ─────────────────────────────────────────
#  OpenClaw Hackathon — 本地开发启动脚本
#  用法: ./dev.sh
# ─────────────────────────────────────────
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PID_FILE="$ROOT_DIR/.backend.pid"

# ── 颜色输出 ──
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▸${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# ── 清理函数（Ctrl+C 时调用）──
cleanup() {
    echo ""
    header "正在停止所有服务..."
    if [ -f "$BACKEND_PID_FILE" ]; then
        BPID=$(cat "$BACKEND_PID_FILE")
        if kill -0 "$BPID" 2>/dev/null; then
            kill "$BPID" && success "Backend 已停止 (PID: $BPID)"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi
    # 停止 tmux 中的前端（如果存在）
    tmux kill-session -t openclaw-dev 2>/dev/null && success "Frontend 已停止" || true
    echo ""
    success "所有服务已关闭。再见！"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ───────────────────────────────────────
header "🦞  OpenClaw 本地开发环境"
echo "────────────────────────────────────"

# ── 后端 ──
header "[ 1/2 ] 启动 Backend (FastAPI)"

if [ ! -f "$BACKEND_DIR/.env" ]; then
    error ".env 文件不存在：$BACKEND_DIR/.env"
    warn "请参考 backend/.env.example 创建 .env 文件"
    exit 1
fi

if [ ! -d "$BACKEND_DIR/venv" ]; then
    info "创建 Python 虚拟环境..."
    python3 -m venv "$BACKEND_DIR/venv"
fi

# shellcheck source=/dev/null
source "$BACKEND_DIR/venv/bin/activate"

# 检查是否需要安装/更新依赖
if [ ! -f "$BACKEND_DIR/venv/.deps_installed" ] || \
   [ "$BACKEND_DIR/requirements.txt" -nt "$BACKEND_DIR/venv/.deps_installed" ]; then
    info "安装 Python 依赖..."
    pip install -q -r "$BACKEND_DIR/requirements.txt"
    touch "$BACKEND_DIR/venv/.deps_installed"
fi

if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "端口 8000 已占用，跳过 Backend 启动"
else
    cd "$BACKEND_DIR"
    python3 main.py &
    BPID=$!
    echo "$BPID" > "$BACKEND_PID_FILE"
    cd "$ROOT_DIR"
    success "Backend 已启动 (PID: $BPID) → http://localhost:8000"
fi

# ── 前端 ──
header "[ 2/2 ] 启动 Frontend (Vite dev server)"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    info "安装 Node 依赖..."
    cd "$FRONTEND_DIR" && npm install && cd "$ROOT_DIR"
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    warn "端口 3000 已占用，跳过 Frontend 启动"
else
    # 在 tmux session 中运行（保留日志可查看）
    if command -v tmux >/dev/null 2>&1; then
        tmux kill-session -t openclaw-dev 2>/dev/null || true
        tmux new-session -d -s openclaw-dev -c "$FRONTEND_DIR" "npm run dev"
        success "Frontend 已启动（tmux session: openclaw-dev）→ http://localhost:3000"
        info "查看前端日志: tmux attach -t openclaw-dev"
    else
        # 没有 tmux 就直接后台运行
        cd "$FRONTEND_DIR" && npm run dev &
        cd "$ROOT_DIR"
        success "Frontend 已启动 → http://localhost:3000"
    fi
fi

# ── 访问地址汇总 ──
echo ""
echo "────────────────────────────────────"
echo -e "${BOLD}📍 访问地址${RESET}"
echo -e "   前端页面   →  ${CYAN}http://localhost:3000${RESET}"
echo -e "   后端 API   →  ${CYAN}http://localhost:8000${RESET}"
echo -e "   API 文档   →  ${CYAN}http://localhost:8000/docs${RESET}"
echo ""
echo -e "${BOLD}🔐 评委入口${RESET}"
echo -e "   http://localhost:3000/judge/login"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "────────────────────────────────────"

# 等待（保持脚本前台运行以响应 Ctrl+C）
wait
