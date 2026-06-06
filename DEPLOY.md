# 部署 / 运维备忘

## 服务器
- 阿里云 ECS 华东2（上海）
- 2 vCPU / 4 GiB / ESSD 50 GiB
- 公网 IP：**106.14.183.197**
- SSH：`admin@106.14.183.197`（默认 22 端口）
- Docker 26.1.3
- 域名（未备案）：huangwei299.ccwu.cc

## 关键 ENV（必须固定，否则 session 失效）

加到 `~/.bashrc`，每次新 SSH 自动生效：

```bash
export SESSION_SECRET='b3db9901387e5d449db622df5a3375c4d35df5be0b0277b741a55e3ec960b38c'
export ADMIN_EMAILS='你的管理员登录邮箱'
```

> ⚠️ 这是全站会话密钥，**别上传到 git，别贴公开聊天**。如果泄露立刻换一个新的，所有用户会被强制登出但数据不丢。

## 切到 HTTPS 时必做（⚠️ 现在 HTTP，未来上 HTTPS 别忘了！）

cookie 的 `Secure` 标志默认关着（因为开了 HTTP 浏览器会拒收 cookie，登录直接坏）。**改 HTTPS 后必须开启**，否则 session cookie 会以明文在网络中传输，存在中间人攻击风险。

```bash
# 上 HTTPS（比如配好 Nginx + Let's Encrypt 之后）
export COOKIE_SECURE=true
echo "export COOKIE_SECURE=true" >> ~/.bashrc

# 重新部署
HOST_PORT=80 bash deploy.sh   # 或者 Nginx 反代到容器
```

## Adobe PDF Services（多 Key 池）

每个 Adobe 账号免费 500 次/月。Key 越多额度越叠加。
代码自动轮换 Key，单 Key 用完冷却 1 小时再试。

### 三种配置方式（任一种或混合都行）

**方式 A：编号后缀（推荐，shell 友好）**
```bash
export ADOBE_CLIENT_ID_1='xxx1'
export ADOBE_CLIENT_SECRET_1='p8e-xxx1'
export ADOBE_CLIENT_ID_2='xxx2'
export ADOBE_CLIENT_SECRET_2='p8e-xxx2'
# ... 最多 20 组
```

**方式 B：JSON 数组**
```bash
export ADOBE_KEYS='[{"id":"xxx1","secret":"p8e-xxx1"},{"id":"xxx2","secret":"p8e-xxx2"}]'
```

**方式 C：单 Key（兼容旧配置）**
```bash
export ADOBE_CLIENT_ID='xxx'
export ADOBE_CLIENT_SECRET='p8e-xxx'
```

三种都识别，遇到重复 Client ID 会去重。配好后重新部署：
```bash
HOST_PORT=80 bash deploy.sh
```

## 管理员日志页

部署时建议配置管理员白名单：

```bash
export ADMIN_EMAILS='admin@example.com'
# 或者使用用户 ID
export ADMIN_USER_IDS='1'
```

重新部署后访问：

```text
https://tools.aiboxpro.cn/admin/logs
```

日志页展示最近转换成功/失败事件、错误原因和耗时。日志保存在当前 Node 进程内，容器重启后会清空。

启动日志会打印：`[adobe-pool] 已加载 N 个 Adobe Key`

### 单 Key 用完会怎样？
1. 代码捕获 quota error → 标记冷却 1 小时
2. 自动切下一个 Key 重试
3. 全部 Key 都冷却中 → 抛 `AdobeAllKeysExhaustedError`
4. PDF→Word 走 pdf2docx 兜底
5. PDF→Excel/PPT 直接报错（无替代方案）

### 申请新 Key 流程
https://developer.adobe.com/console → 新项目 → 加 PDF Services API → OAuth Server-to-Server → 拿 Client ID + Secret。
注意：每个 Adobe 账号一组 500 次额度。要多额度就申请多账号（不同邮箱）。

监控用量：https://developer.adobe.com/console 项目页能看 PDF Transactions。

## 微信 / QQ OAuth 启用（凭据齐了之后）

```bash
# 微信开放平台 网站应用 (open.weixin.qq.com)
export WECHAT_APP_ID=wx_xxxx
export WECHAT_APP_SECRET=xxxx
export WECHAT_REDIRECT_URI=https://你的备案域名/api/auth/wechat/callback

# QQ 互联 (connect.qq.com)
export QQ_APP_ID=xxxx
export QQ_APP_KEY=xxxx
export QQ_REDIRECT_URI=https://你的备案域名/api/auth/qq/callback

# 加到 ~/.bashrc 持久化
HOST_PORT=80 bash deploy.sh
```

⚠️ OAuth 必备前置：
- 自有 ICP **备案过**的域名（`ccwu.cc` 这种二级域名不行）
- 微信网站应用：企业认证 ¥300/年
- 两边都要审核 1-7 天

## 部署常用命令

```bash
# 拉新代码 + 重建
cd ~/fileconvert && git pull && HOST_PORT=80 bash deploy.sh

# 查日志
docker logs -f fileconvert
docker logs --tail 50 fileconvert

# 进容器排查
docker exec -it fileconvert sh

# 看数据库
sudo sqlite3 ~/fileconvert-data/fileconvert.db
# 常用查询：
#   SELECT id, email, nickname, points FROM users;
#   SELECT * FROM points_logs ORDER BY id DESC LIMIT 20;

# 备份数据
sudo cp ~/fileconvert-data/fileconvert.db ~/backup-$(date +%F).db

# 重启容器（不重建）
docker restart fileconvert
```

## GitHub 镜像（国内访问慢时用）

```bash
git remote set-url origin https://ghfast.top/https://github.com/a18173809908-maker/FileConvert.git
```

备用：`https://gh-proxy.com/https://github.com/...`、`https://hub.gitmirror.com/https://github.com/...`

## 容器资源限制（已在 deploy.sh 里）

| 参数 | 值 | 说明 |
|---|---|---|
| `--memory` | 2560m | 给系统留 1.5G |
| `--cpus` | 1.5 | 给系统留 0.5 核 |
| `--max-old-space-size` | 2048 | Node heap 上限 |
| `CONVERT_CONCURRENCY` | 2 | 同时处理的服务端转换数 |
| `RATE_LIMIT_PER_SEC` | 0.5 | 每 IP 30 次/分钟 |
| `RATE_LIMIT_BURST` | 5 | 突发 5 个 |

调整方式：`docker run` 时 `-e CONVERT_CONCURRENCY=1` 之类的环境变量。

## 数据持久化

- SQLite 文件：宿主机 `~/fileconvert-data/fileconvert.db`
- Volume 挂载：`-v ~/fileconvert-data:/app/data`
- 容器内用户：`nextjs` uid=1001，初次挂卷可能需要：`sudo chown -R 1001:1001 ~/fileconvert-data`

## 排错速查

| 现象 | 原因 | 解决 |
|---|---|---|
| 注册成功但右上角仍显示"登录" | cookie secure=true + HTTP 访问 | 改为 `COOKIE_SECURE=false` 重部 |
| 容器一直 OOM | 上传过大文件 | 已有 50MB PDF 上限 + Node heap=2G 限制 |
| `unable to open database file` | 卷目录权限 | `sudo chown -R 1001:1001 ~/fileconvert-data` |
| 部署后所有人被登出 | SESSION_SECRET 变了 | 固定到 `~/.bashrc` |
| `git pull` 卡住 | 国内连不上 GitHub | 用 ghfast.top 镜像 |
| `npm ci` 卡 better-sqlite3 | GitHub Releases 下不动 | Dockerfile 已配 npmmirror 预编译源 |
