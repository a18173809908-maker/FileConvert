#!/usr/bin/env bash
# 一键部署脚本：在阿里云 ECS（Docker 已装）上构建并运行 FileConvert
# 用法：在项目根目录下执行  bash deploy.sh
set -euo pipefail

IMAGE_NAME="fileconvert"
CONTAINER_NAME="fileconvert"
HOST_PORT="${HOST_PORT:-3000}"
CONTAINER_PORT=3000
DATA_DIR="${DATA_DIR:-$HOME/fileconvert-data}"
SESSION_SECRET="${SESSION_SECRET:-$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64)}"

mkdir -p "${DATA_DIR}"

echo "==> 构建镜像 ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}:latest" .

echo "==> 移除旧容器（若存在）"
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

echo "==> 启动新容器，监听宿主机 ${HOST_PORT} 端口"
# 2C4G 服务器：限容器最多用 2.5GB 内存 + 1.5 核 CPU，给系统留余量
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  --memory="${MEM_LIMIT:-2560m}" \
  --memory-swap="${MEM_LIMIT:-2560m}" \
  --cpus="${CPU_LIMIT:-1.5}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -v "${DATA_DIR}:/app/data" \
  -e SESSION_SECRET="${SESSION_SECRET}" \
  ${COOKIE_SECURE:+-e COOKIE_SECURE="${COOKIE_SECURE}"} \
  ${WECHAT_APP_ID:+-e WECHAT_APP_ID="${WECHAT_APP_ID}"} \
  ${WECHAT_APP_SECRET:+-e WECHAT_APP_SECRET="${WECHAT_APP_SECRET}"} \
  ${WECHAT_REDIRECT_URI:+-e WECHAT_REDIRECT_URI="${WECHAT_REDIRECT_URI}"} \
  ${QQ_APP_ID:+-e QQ_APP_ID="${QQ_APP_ID}"} \
  ${QQ_APP_KEY:+-e QQ_APP_KEY="${QQ_APP_KEY}"} \
  ${QQ_REDIRECT_URI:+-e QQ_REDIRECT_URI="${QQ_REDIRECT_URI}"} \
  "${IMAGE_NAME}:latest"

echo
echo "==> 部署完成"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo
echo "访问：http://<服务器公网IP>:${HOST_PORT}"
echo "查看日志：docker logs -f ${CONTAINER_NAME}"
echo "数据库挂载：${DATA_DIR}"
echo
echo "首次启动如已生成 SESSION_SECRET，下次部署请固定它："
echo "  export SESSION_SECRET='${SESSION_SECRET}'"
