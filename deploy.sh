#!/bin/bash
# ─────────────────────────────────────────
#  OpenClaw Hackathon — 线上服务器部署脚本
#
#  用法:
#    首次部署:  ./deploy.sh
#    更新部署:  ./deploy.sh --update
#
#  服务架构（单服务器）:
#    Frontend  → Nginx 静态文件 (port 80/443)
#    Backend   → uvicorn (port 8000, systemd 守护)
#    Nginx     → 反向代理 /api/* → :8000
#
#  依赖: python3, node, npm, nginx, systemd
# ─────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
SERVICE_NAME="openclaw-backend"

# ── 颜色输出 ──
RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}▸${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }
die()     { error "$*"; exit 1; }

# ── 参数解析 ──
UPDATE_ONLY=false
for arg in "$@"; do
    case "$arg" in --update|-u) UPDATE_ONLY=true ;; esac
done

# ─────────────────────────────────────────
header "🦞  OpenClaw 服务器部署"
echo "────────────────────────────────────"
echo -e "  模式: ${BOLD}$([ "$UPDATE_ONLY" = true ] && echo "增量更新" || echo "完整部署")${RESET}"
echo -e "  目录: $ROOT_DIR"
echo "────────────────────────────────────"

# ── 0. 前置检查 ──
header "[ 检查 ] 依赖环境"

command -v python3 >/dev/null 2>&1 || die "未找到 python3"
command -v node    >/dev/null 2>&1 || die "未找到 node"
command -v npm     >/dev/null 2>&1 || die "未找到 npm"
command -v nginx   >/dev/null 2>&1 || warn "未找到 nginx，跳过 Nginx 配置步骤"
command -v systemctl >/dev/null 2>&1 || warn "未找到 systemctl，将使用后台进程方式运行 Backend"

[ -f "$BACKEND_DIR/.env" ] || die ".env 文件不存在：$BACKEND_DIR/.env\n请先配置环境变量再部署"

success "环境检查通过"

# ── 1. 拉取最新代码 ──
header "[ 1/5 ] 更新代码"

if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    PREV_COMMIT=$(git -C "$ROOT_DIR" rev-parse --short HEAD)
    git -C "$ROOT_DIR" pull --rebase
    NEW_COMMIT=$(git -C "$ROOT_DIR" rev-parse --short HEAD)
    if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
        info "代码已是最新 ($NEW_COMMIT)，无需拉取"
    else
        success "代码已更新: $PREV_COMMIT → $NEW_COMMIT"
    fi
else
    warn "非 git 仓库，跳过代码拉取"
fi

# ── 2. 构建前端 ──
header "[ 2/5 ] 构建 Frontend"

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ] || [ "$UPDATE_ONLY" = false ]; then
    info "安装 Node 依赖..."
    npm ci --silent
fi

info "构建生产版本..."
npm run build
success "前端构建完成 → $FRONTEND_DIR/dist"

cd "$ROOT_DIR"

# ── 3. 安装后端依赖 ──
header "[ 3/5 ] 配置 Backend"

if [ ! -d "$BACKEND_DIR/venv" ]; then
    info "创建 Python 虚拟环境..."
    python3 -m venv "$BACKEND_DIR/venv"
fi

# shellcheck source=/dev/null
source "$BACKEND_DIR/venv/bin/activate"
info "安装/更新 Python 依赖..."
pip install -q --upgrade pip
pip install -q -r "$BACKEND_DIR/requirements.txt"
success "Python 依赖安装完成"

# ── 4. 配置并启动 Backend 服务 ──
header "[ 4/5 ] 启动 Backend 服务"

VENV_PYTHON="$BACKEND_DIR/venv/bin/python3"
UVICORN_BIN="$BACKEND_DIR/venv/bin/uvicorn"

if command -v systemctl >/dev/null 2>&1; then
    # ── systemd 方式（推荐）──
    SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

    if [ ! -f "$SERVICE_FILE" ] || [ "$UPDATE_ONLY" = false ]; then
        info "写入 systemd service 配置..."
        sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=OpenClaw Hackathon Backend API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$UVICORN_BIN main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
        sudo systemctl daemon-reload
        sudo systemctl enable "$SERVICE_NAME"
        success "systemd service 已注册: $SERVICE_NAME"
    fi

    sudo systemctl restart "$SERVICE_NAME"
    sleep 2
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        success "Backend 服务运行中 (systemd: $SERVICE_NAME)"
        info "查看日志: journalctl -u $SERVICE_NAME -f"
    else
        error "Backend 启动失败，查看日志:"
        journalctl -u "$SERVICE_NAME" -n 30 --no-pager
        exit 1
    fi

else
    # ── 后台进程方式（无 systemd 环境）──
    PID_FILE="$ROOT_DIR/.backend.pid"

    if [ -f "$PID_FILE" ]; then
        OLD_PID=$(cat "$PID_FILE")
        if kill -0 "$OLD_PID" 2>/dev/null; then
            info "停止旧 Backend 进程 (PID: $OLD_PID)..."
            kill "$OLD_PID"
            sleep 1
        fi
        rm -f "$PID_FILE"
    fi

    cd "$BACKEND_DIR"
    nohup "$UVICORN_BIN" main:app \
        --host 0.0.0.0 --port 8000 --workers 2 \
        >> "$ROOT_DIR/backend.log" 2>&1 &
    echo $! > "$PID_FILE"
    cd "$ROOT_DIR"
    success "Backend 已在后台启动 (PID: $(cat $PID_FILE))"
    info "查看日志: tail -f $ROOT_DIR/backend.log"
fi

# ── 5. 配置 Nginx ──
header "[ 5/5 ] 配置 Nginx"

if ! command -v nginx >/dev/null 2>&1; then
    warn "未找到 nginx，跳过。前端 dist/ 请手动配置 Web 服务器"
else
    NGINX_CONF="/etc/nginx/sites-available/openclaw"
    NGINX_ENABLED="/etc/nginx/sites-enabled/openclaw"

    if [ ! -f "$NGINX_CONF" ] || [ "$UPDATE_ONLY" = false ]; then
        info "写入 Nginx 配置..."
        sudo tee "$NGINX_CONF" > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    # 前端静态文件（端口 3000 由 Node.js 直接提供）
    # 此处配置用于 API 反向代理

    # 反向代理 API 请求到后端
    location /api/ {
        proxy_pass         http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   Connection "";
        proxy_read_timeout 120s;
    }

    client_max_body_size 50M;
}
EOF
        [ -L "$NGINX_ENABLED" ] || sudo ln -s "$NGINX_CONF" "$NGINX_ENABLED"
    fi

    info "检查 Nginx 配置..."
    sudo nginx -t
    sudo systemctl reload nginx
    success "Nginx 配置已更新并重载"
fi

echo "════════════════════════════════════"
echo -e "${GREEN}${BOLD}  🎉 部署完成！${RESET}"
echo "════════════════════════════════════"
echo -e "  后端 API   →  ${CYAN}http://<服务器IP>:8000${RESET}"
echo -e "  API 文档   →  ${CYAN}http://<服务器IP>:8000/docs${RESET}"
echo -e "  前端应用   →  ${CYAN}http://<服务器IP>:3000${RESET}  (需手动启动 Node.js)"
echo ""
echo -e "  启动前端服务: ${BOLD}cd $FRONTEND_DIR && npm run dev${RESET}"
echo -e "  更新部署命令: ${BOLD}./deploy.sh --update${RESET}"
echo "════════════════════════════════════"
