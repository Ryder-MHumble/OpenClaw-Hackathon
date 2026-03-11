#!/bin/bash
# 后端服务诊断脚本

echo "=== 后端服务检查 ==="
echo ""

echo "1. 检查 8000 端口是否监听："
sudo lsof -i :8000 2>/dev/null || echo "❌ 8000 端口没有进程监听"
echo ""

echo "2. 检查 uvicorn 进程："
ps aux | grep uvicorn | grep -v grep || echo "❌ 没有 uvicorn 进程运行"
echo ""

echo "3. 测试本地连接："
curl -s http://localhost:8000/ && echo "✅ 本地连接成功" || echo "❌ 本地连接失败"
echo ""

echo "4. 测试公网连接："
curl -s http://43.98.254.243:8000/ && echo "✅ 公网连接成功" || echo "❌ 公网连接失败"
echo ""

echo "5. 检查防火墙状态："
if command -v ufw &> /dev/null; then
    sudo ufw status | grep 8000 && echo "✅ UFW 已开放 8000" || echo "⚠️  UFW 未配置 8000"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --list-ports | grep 8000 && echo "✅ firewalld 已开放 8000" || echo "⚠️  firewalld 未配置 8000"
else
    echo "⚠️  未检测到防火墙"
fi
echo ""

echo "=== 检查完成 ==="
echo ""
echo "如果后端没有运行，请执行以下命令启动："
echo "cd backend"
echo "source venv/bin/activate"
echo "python main.py"
