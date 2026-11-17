#!/bin/bash
# 在后台启动 profile 的 GUI，并从日志提取访问 token。
# 用法：eval $(bash gui-up.sh <profile名> [端口])
# env：RDT_GUI_PORT 默认 3210；RDT_GUI_WAIT 为等待 token 的秒数，默认 90。
set -u
PROFILE=${1:?用法: bash gui-up.sh <profile名> [端口]}
PORT=${2:-${RDT_GUI_PORT:-3210}}
PDIR=$(cygpath -u "${DSH_HOME:-$HOME/.dsh}")/profiles/$PROFILE
cd "$PDIR" || exit 1
# 端口被残留进程占用时，GUI 会因 EADDRINUSE 无法启动
PID=$(netstat -ano | grep ":$PORT " | grep LISTENING | awk '{print $5}' | head -1)
[ -n "$PID" ] && taskkill //F //PID "$PID" >/dev/null 2>&1
rm -f gui-run.log
nohup dsh --profile "$PROFILE" --no-open --port "$PORT" >gui-run.log 2>&1 &
GUI_PID=$!
for _ in $(seq 1 "${RDT_GUI_WAIT:-90}"); do
  grep -q "token=" gui-run.log 2>/dev/null && break
  kill -0 "$GUI_PID" 2>/dev/null || break
  sleep 1
done
TOKEN=$(grep -o "token=[A-Za-z0-9_-]*" gui-run.log | head -1 | cut -d= -f2)
URL=$(grep -o "http://127.0.0.1:[0-9]*[^ ]*" gui-run.log | head -1)
if [ -z "$TOKEN" ] && [ -z "$URL" ]; then
  echo "GUI 启动失败，查看 $PDIR/gui-run.log" >&2
  exit 1
fi
# 旧版宿主不启用 token，日志中只有地址
[ -n "$URL" ] || URL="http://127.0.0.1:$PORT/?token=$TOKEN"
echo "export RDT_GUI_PORT=$PORT"
echo "export RDT_GUI_TOKEN=$TOKEN"
echo "export RDT_GUI_URL='$URL'"
