#!/usr/bin/env bash
# 一键部署脚本：在阿里云 ECS（Docker 已装）上构建并运行 FileConvert
# 用法：在项目根目录下执行  bash deploy.sh
set -euo pipefail

IMAGE_NAME="fileconvert"
CONTAINER_NAME="fileconvert"
HOST_PORT="${HOST_PORT:-3000}"
CONTAINER_PORT=3000

echo "==> 构建镜像 ${IMAGE_NAME}"
docker build -t "${IMAGE_NAME}:latest" .

echo "==> 移除旧容器（若存在）"
docker rm -f "${CONTAINER_NAME}" 2>/dev/null || true

echo "==> 启动新容器，监听宿主机 ${HOST_PORT} 端口"
docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  "${IMAGE_NAME}:latest"

echo
echo "==> 部署完成"
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo
echo "访问：http://<服务器公网IP>:${HOST_PORT}"
echo "查看日志：docker logs -f ${CONTAINER_NAME}"
