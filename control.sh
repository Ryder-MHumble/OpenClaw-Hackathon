#!/bin/bash
# OpenClaw Hackathon 统一控制脚本
# 用法:
#   ./control.sh start    - 启动所有服务
#   ./control.sh stop     - 停止所有服务
#   ./control.sh restart  - 重启所有服务
#   ./control.sh status   - 查看服务状态
#   ./control.sh logs     - 查看日志
#   ./control.sh deploy   - 完整部署（拉取代码+构建+启动）

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}▸${RESET} $*"; }
success() { echo -e "${GREEN}✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}!${RESET} $*"; }
error()   { echo -e "${RED}✗${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${RESET}"; }

# 项目路径
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_PID_FILE="$PROJECT_ROOT/.backend.pid"
FRONTEND_PID_FILE="$PROJECT_ROOT/.frontend.pid"
BACKEND_LOG="$PROJECT_ROOT/backend.log"
FRONTEND_LOG="$PROJECT_ROOT/frontend.log"

# 显示使用说明
show_usage() {
    echo "OpenClaw Hackathon 服务控制脚本"
    echo ""
    echo "用法: ./control.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start    - 启动所有服务"
    echo "  stop     - 停止所有服务"
    echo "  restart  - 重启所有服务"
    echo "  status   - 查看服务状态"
    echo "  logs     - 查看实时日志"
    echo "  deploy   - 完整部署（拉取代码+构建+启动）"
    echo ""
}

# 停止服务
stop_services() {
    header "停止服务"

    # 停止后端
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            info "停止后端服务 (PID: $BACKEND_PID)..."
            kill $BACKEND_PID 2>/dev/null || true
            success "后端已停止"
        fi
        rm -f "$BACKEND_PID_FILE"
    fi

    # 停止前端
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            info "停止前端服务 (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID 2>/dev/null || true
            success "前端已停止"
        fi
        rm -f "$FRONTEND_PID_FILE"
    fi

    # 强制清理残留进程
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "serve.*dist" 2>/dev/null || true

    sleep 1
    success "所有服务已停止"
}

# 启动服务
start_services() {
    header "启动服务"

    # 检查后端 .env
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        error "后端 .env 文件不存在，请先配置"
        exit 1
    fi

    # 启动后端
    info "启动后端服务..."
    cd "$BACKEND_DIR"

    if [ ! -d "venv" ]; then
        error "虚拟环境不存在，请先运行: ./control.sh deploy"
        exit 1
    fi

    source venv/bin/activate
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2 > "$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$BACKEND_PID_FILE"
    sleep 2

    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        success "后端服务已启动 (PID: $BACKEND_PID)"
    else
        error "后端启动失败，查看日志: tail -f $BACKEND_LOG"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # 启动前端
    info "启动前端服务..."
    cd "$FRONTEND_DIR"

    if [ ! -d "dist" ]; then
        error "前端构建文件不存在，请先运行: ./control.sh deploy"
        exit 1
    fi

    nohup npx serve -s dist -l 3000 > "$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$FRONTEND_PID_FILE"
    sleep 2

    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        success "前端服务已启动 (PID: $FRONTEND_PID)"
    else
        error "前端启动失败，查看日志: tail -f $FRONTEND_LOG"
        exit 1
    fi

    cd "$PROJECT_ROOT"

    # 健康检查
    sleep 2
    if curl -s http://localhost:8000/ > /dev/null; then
        success "后端健康检查通过"
    else
        warn "后端可能未就绪"
    fi

    if curl -s http://localhost:3000/ > /dev/null; then
        success "前端健康检查通过"
    else
        warn "前端可能未就绪"
    fi

    echo ""
    echo "════════════════════════════════════"
    echo -e "${GREEN}${BOLD}  ✓ 服务已启动${RESET}"
    echo "════════════════════════════════════"
    echo -e "  前端: ${CYAN}http://43.98.254.243:3000${RESET}"
    echo -e "  后端: ${CYAN}http://43.98.254.243:8000${RESET}"
    echo -e "  文档: ${CYAN}http://43.98.254.243:8000/docs${RESET}"
    echo "════════════════════════════════════"
}

# 查看状态
show_status() {
    header "服务状态"

    # 后端状态
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat "$BACKEND_PID_FILE")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓${RESET} 后端服务运行中 (PID: $BACKEND_PID)"
            echo "  端口: 8000"
            echo "  日志: $BACKEND_LOG"
        else
            echo -e "${RED}✗${RESET} 后端服务未运行 (PID 文件存在但进程不存在)"
        fi
    else
        echo -e "${RED}✗${RESET} 后端服务未运行"
    fi

    echo ""

    # 前端状态
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat "$FRONTEND_PID_FILE")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓${RESET} 前端服务运行中 (PID: $FRONTEND_PID)"
            echo "  端口: 3000"
            echo "  日志: $FRONTEND_LOG"
        else
            echo -e "${RED}✗${RESET} 前端服务未运行 (PID 文件存在但进程不存在)"
        fi
    else
        echo -e "${RED}✗${RESET} 前端服务未运行"
    fi

    echo ""

    # 端口占用情况
    if command -v netstat >/dev/null 2>&1; then
        echo "端口占用:"
        netstat -an | grep -E ":(8000|3000).*LISTEN" || echo "  无相关端口监听"
    fi
}

# 查看日志
show_logs() {
    echo "查看实时日志 (Ctrl+C 退出)"
    echo "=================================="
    tail -f "$BACKEND_LOG" "$FRONTEND_LOG"
}

# 完整部署
deploy_all() {
    header "🦞 OpenClaw Hackathon 完整部署"
    echo "=================================="

    # 1. 停止旧服务
    header "[ 1/5 ] 停止旧服务"
    stop_services

    # 2. 拉取代码
    header "[ 2/5 ] 更新代码"
    if git -C "$PROJECT_ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        PREV_COMMIT=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)
        info "拉取最新代码..."
        git -C "$PROJECT_ROOT" pull
        NEW_COMMIT=$(git -C "$PROJECT_ROOT" rev-parse --short HEAD)
        if [ "$PREV_COMMIT" = "$NEW_COMMIT" ]; then
            info "代码已是最新版本 ($NEW_COMMIT)"
        else
            success "代码已更新: $PREV_COMMIT → $NEW_COMMIT"
        fi
    else
        warn "非 git 仓库，跳过代码拉取"
    fi

    # 3. 部署后端
    header "[ 3/5 ] 部署后端"
    cd "$BACKEND_DIR"

    if [ ! -f ".env" ]; then
        error ".env 文件不存在，请先配置环境变量"
        exit 1
    fi

    if [ ! -d "venv" ]; then
        info "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi

    info "安装 Python 依赖..."
    source venv/bin/activate
    pip install -q --upgrade pip
    pip install -q -r requirements.txt
    success "后端依赖安装完成"

    cd "$PROJECT_ROOT"

    # 4. 部署前端
    header "[ 4/5 ] 部署前端"
    cd "$FRONTEND_DIR"

    info "安装 Node 依赖..."
    npm install --silent

    info "构建前端生产版本..."
    npm run build
    success "前端构建完成"

    if ! command -v serve >/dev/null 2>&1; then
        info "安装 serve..."
        npm install -g serve
    fi

    cd "$PROJECT_ROOT"

    # 5. 启动服务
    header "[ 5/5 ] 启动服务"
    start_services

    echo ""
    echo "════════════════════════════════════"
    echo -e "${GREEN}${BOLD}  🎉 部署完成！${RESET}"
    echo "════════════════════════════════════"
    echo ""
    echo "查看状态: ./control.sh status"
    echo "查看日志: ./control.sh logs"
    echo "停止服务: ./control.sh stop"
    echo ""
}

# 主逻辑
case "${1:-}" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 1
        start_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    deploy)
        deploy_all
        ;;
    *)
        show_usage
        exit 1
        ;;
esac
