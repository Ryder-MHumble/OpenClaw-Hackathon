#!/bin/bash
# ─────────────────────────────────────────
#  OpenClaw Frontend — 启动脚本
#  用法: ./start-frontend.sh
# ─────────────────────────────────────────

FRONTEND_DIR="$(cd "$(dirname "$0")/frontend" && pwd)"
PORT=3000

# 颜色输出
GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

echo -e "${BOLD}${CYAN}▸${RESET} 启动前端服务..."
echo -e "  目录: $FRONTEND_DIR"
echo -e "  端口: ${BOLD}$PORT${RESET}"
echo ""

cd "$FRONTEND_DIR"

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${BOLD}${CYAN}▸${RESET} 安装依赖..."
    npm install
fi

# 启动开发服务器
echo -e "${BOLD}${CYAN}▸${RESET} 启动 Vite 开发服务器..."
echo -e "${GREEN}✓${RESET} 前端已启动: ${CYAN}http://0.0.0.0:$PORT${RESET}"
echo ""

npm run dev -- --host 0.0.0.0 --port $PORT
