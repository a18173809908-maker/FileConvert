# 文件侠（FileConvert）项目交接文档

> 文档日期：2026-06-05  
> 交接对象：CODEX  
> 上一任负责人：Claude Sonnet 4.6

---

## 一、项目概述

**项目名称**：文件侠（原名文件快）  
**线上地址**：https://tools.aiboxpro.cn  
**GitHub 仓库**：https://github.com/a18173809908-maker/FileConvert  
**技术栈**：Next.js 16（App Router）+ TypeScript + Tailwind CSS + SQLite（better-sqlite3）  
**运行方式**：Docker 容器，通过宝塔面板 Nginx 反向代理对外提供服务

---

## 二、服务器信息

### 主力服务器（文件侠所在）
| 项目 | 值 |
|------|-----|
| 云服务商 | 阿里云 ECS |
| 地域 | 华南1（深圳）|
| 公网 IP | 119.23.45.149 |
| 私有 IP | 172.17.27.136 |
| 规格 | 通用型 2 vCPU 4 GiB，ESSD 50 GiB |
| 镜像 | 宝塔 Linux 面板 阿里云专享版 11.1.0 |
| 到期时间 | 2027-05-30 |
| SSH 登录用户 | admin（需要 sudo）|

### 另一台服务器（暂无应用，可备用）
| 项目 | 值 |
|------|-----|
| 地域 | 华东2（上海）|
| 公网 IP | 106.14.183.197 |
| 规格 | 通用型 2 vCPU 4 GiB，ESSD 50 GiB |
| 镜像 | Docker 26.1.3 |
| 到期时间 | 2026-06-27（即将到期）|
| 备注 | 轻量应用服务器（非 ECS），防火墙在控制台页面内配置 |

---

## 三、域名与 DNS

| 域名 | 记录类型 | 指向 |
|------|---------|------|
| tools.aiboxpro.cn | A | 119.23.45.149（深圳服务器）|
| aiboxpro.cn 主站 | A | 119.23.45.149（同服务器）|

DNS 服务商：阿里云云解析  
SSL 证书：Let's Encrypt，由宝塔面板自动签发（已启用强制 HTTPS）

---

## 四、部署架构

```
用户请求
  ↓ HTTPS（443）
宝塔 Nginx（反向代理）
  ↓ http://127.0.0.1:3001
Docker 容器（fileconvert）
  ↓ 内部端口 3000
Next.js 应用（standalone 模式）
  ↓
SQLite 数据库（/app/data/fileconvert.db）
  ↓ 持久化挂载
宿主机：/www/wwwroot/fileconvert/data/
```

### Docker 容器信息
```bash
# 容器名
fileconvert

# 当前运行命令（重建时使用）
sudo docker run -d --name fileconvert --restart always -p 3001:3000 \
  -v /www/wwwroot/fileconvert/data:/app/data \
  crpi-ea0imjikgqza2442.cn-shenzhen.personal.cr.aliyuncs.com/fileconvert299/fileconvert:latest

# 查看状态
sudo docker ps | grep fileconvert

# 查看日志
sudo docker logs fileconvert --tail 100 -f

# 重启
sudo docker restart fileconvert
```

---

## 五、容器启动脚本

服务器上已创建一键启动脚本：`/www/wwwroot/fileconvert/start.sh`

**每次更新镜像或修改环境变量后执行：**
```bash
sudo bash /www/wwwroot/fileconvert/start.sh
```

**脚本内容（如需新增 Adobe Key，编辑此文件加 `_4`, `_5`...）：**
```bash
# 用 vi 编辑
sudo vi /www/wwwroot/fileconvert/start.sh
```

---

## 六、环境变量说明

| 变量名 | 说明 |
|--------|------|
| `SESSION_SECRET` | iron-session 加密密钥，**必须 32 位以上** |
| `COOKIE_SECURE` | 设为 `true` 启用 HTTPS Only Cookie |
| `ADOBE_CLIENT_ID_N` | Adobe PDF API 第 N 个账号的 Client ID |
| `ADOBE_CLIENT_SECRET_N` | Adobe PDF API 第 N 个账号的 Secret |
| `DB_PATH` | SQLite 数据库路径（默认 `/app/data/fileconvert.db`）|
| `ADOBE_POLL_TIMEOUT_MS` | Adobe PDF API 任务轮询超时（建议 `240000`，大 PDF 转 Word/Excel/PPT 需要更久）|
| `PDF2DOCX_TIMEOUT_MS` | pdf2docx 兜底转换超时（建议 `180000`）|
| `HEAVY_ACQUIRE_TIMEOUT_MS` | 重型转换等待队列超时（建议 `60000`）|

**Adobe Key 池说明：**
- 目前配置了 3 个 Key，每个账号免费 500 次/月，合计 1500 次/月
- 额度用完自动切换下一个 Key（冷却 1 小时）
- 新增 Key：在 start.sh 中加 `-e ADOBE_CLIENT_ID_4=xxx -e ADOBE_CLIENT_SECRET_4=xxx`

---

## 七、数据库维护

数据库文件位置：`/www/wwwroot/fileconvert/data/fileconvert.db`

> ⚠️ **权限注意**：数据目录必须属于 uid 1001（容器内 nextjs 用户），否则数据库无法写入：
> ```bash
> sudo chown -R 1001:1001 /www/wwwroot/fileconvert/data/
> sudo chmod 755 /www/wwwroot/fileconvert/data/
> ```

**常用查询命令：**
```bash
# 查看所有用户
sudo sqlite3 /www/wwwroot/fileconvert/data/fileconvert.db \
"SELECT id, email, nickname, points, datetime(created_at,'unixepoch','+8 hours') FROM users ORDER BY created_at DESC;"

# 用户总数
sudo sqlite3 /www/wwwroot/fileconvert/data/fileconvert.db "SELECT COUNT(*) FROM users;"

# 修改用户积分（USER_ID 替换为实际 ID）
sudo sqlite3 /www/wwwroot/fileconvert/data/fileconvert.db \
"UPDATE users SET points = 500 WHERE id = USER_ID;"

# 重置用户密码（密码用 scrypt 加密，需用 Node.js 生成哈希）
node -e "
const {scrypt,randomBytes}=require('crypto');
const {promisify}=require('util');
const s=promisify(scrypt);
const salt=randomBytes(16);
s('新密码',salt,64).then(d=>console.log('scrypt\$'+salt.toString('hex')+'\$'+d.toString('hex')));
"
# 然后执行：
sudo sqlite3 /www/wwwroot/fileconvert/data/fileconvert.db \
"UPDATE users SET password_hash='上面生成的哈希' WHERE email='用户邮箱';"
```

---

## 八、CI/CD 流程（代码更新步骤）

1. **本地修改代码**
2. **提交推送到 GitHub**
   ```bash
   git add .
   git commit -m "描述"
   git push origin master
   ```
   > ⚠️ 如果新增 npm 包，必须先在本地运行 `npm install` 更新 `package-lock.json` 并一起提交，否则 ACR 构建会因 `npm ci` 报错失败。

3. **阿里云容器镜像服务（ACR）自动触发构建**
   - 控制台：https://cr.console.aliyun.com/cn-shenzhen/instance/repositories
   - 仓库名：`fileconvert299/fileconvert`
   - 地域：华南1（深圳）
   - 构建设置：代码变更自动构建 ✅ | 海外机器构建 ✅
   - 构建耗时：约 5~6 分钟

4. **构建成功后，服务器拉取新镜像并重启**
   ```bash
   # 登录 ACR（密码为访问凭证密码，非阿里云账号密码）
   sudo docker login --username=nick0291084238 crpi-ea0imjikgqza2442.cn-shenzhen.personal.cr.aliyuncs.com

   # 拉取新镜像
   sudo docker pull crpi-ea0imjikgqza2442.cn-shenzhen.personal.cr.aliyuncs.com/fileconvert299/fileconvert:latest

   # 停止旧容器并启动新容器
   sudo docker stop fileconvert && sudo docker rm fileconvert
   sudo docker run -d --name fileconvert --restart always -p 3001:3000 \
     -v /www/wwwroot/fileconvert/data:/app/data \
     crpi-ea0imjikgqza2442.cn-shenzhen.personal.cr.aliyuncs.com/fileconvert299/fileconvert:latest
   ```

---

## 六、项目代码结构

```
FileConvert/
├── app/                        # Next.js App Router 页面
│   ├── layout.tsx              # 全局布局（站点标题、favicon）
│   ├── page.tsx                # 主页（转换台）
│   ├── formats/page.tsx        # 格式中心
│   ├── download/page.tsx       # 应用下载页
│   ├── help/page.tsx           # 帮助页
│   └── api/
│       ├── convert/route.ts    # 文件转换主接口
│       ├── auth/               # 登录/注册/签到/OAuth
│       └── points/             # 积分扣减接口
├── components/
│   ├── header.tsx              # 顶部导航（含站点名称）
│   ├── image-tool-dialog.tsx   # 图片工具弹窗（压缩/裁剪/水印等）
│   ├── pdf-tool-dialog.tsx     # PDF 工具弹窗
│   ├── auth-dialog.tsx         # 登录/注册弹窗
│   └── ...
├── lib/
│   ├── conversion-config.ts    # 🔑 转换格式配置（单一事实来源）
│   ├── image-tools.ts          # 客户端 Canvas 图片处理
│   └── server/
│       ├── converters.ts       # 服务端转换逻辑总调度
│       ├── libreoffice.ts      # LibreOffice 调用
│       ├── adobe-pdf.ts        # Adobe PDF API（可选）
│       ├── db.ts               # SQLite 数据库操作
│       └── auth.ts             # 鉴权
├── public/
│   └── icon.svg                # 网站图标（红底白字"侠"）
├── Dockerfile                  # 多阶段构建
├── package.json
├── package-lock.json           # ⚠️ 新增包后必须更新此文件
└── HANDOVER.md                 # 本文档
```

---

## 七、核心配置文件说明

### `lib/conversion-config.ts`
所有转换格式的**单一配置入口**，修改此文件即可增减功能：

- `POINTS_CONFIG` — 积分规则（注册 200 分、每日登录 20 分、邀请 200 分）
- `ALLOWED_FORMATS` — 允许上传的格式白名单
- `SERVER_LIGHT_PAIRS` — 轻量服务端转换（sharp / xlsx / marked）
- `SERVER_HEAVY_PAIRS` — 重型服务端转换（LibreOffice / Adobe API）
- `CLIENT_CANVAS_PAIRS` — 纯浏览器 Canvas 转换
- `CLIENT_TOOL_PAIRS` — 打开工具弹窗（压缩/裁剪/水印等）
- `CONVERSION_CATEGORIES` — 侧边栏显示的分类与条目

### `lib/server/converters.ts`
服务端转换调度器，新增转换格式时需在此添加对应的处理函数。

---

## 八、当前已实现功能

### PDF 工具（15 项）
PDF↔Word、PDF↔Excel、PDF↔PPT、PDF↔图片、PDF↔TXT、PDF 合并/拆分/旋转

### 图片转换（12 项）
JPG/PNG/WEBP/BMP/GIF 互转，HEIC/HEIF → JPG/PNG（iPhone 照片）

### 图片工具（5 项）
图片压缩、尺寸调整、裁剪、旋转、**加水印**（支持位置/透明度/颜色/平铺）

### 表格工具（2 项）
CSV → Excel、Excel → CSV

### Markdown 工具（2 项）
Markdown → HTML（带样式）、Markdown → PDF

### 文档工具（3 项）
DOC↔DOCX、HTML → PDF

### SVG 工具（2 项）
SVG → PNG/JPG

### 电子书工具（1 项）
EPUB → PDF

### 开发者工具（1 项）
JSON 格式化/校验

---

## 九、主要依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| next | 16.2.6 | 框架 |
| sharp | ^0.34.5 | 图片转换（含 HEIC 支持）|
| pdf-lib | ^1.17.1 | PDF 生成与操作 |
| mammoth | ^1.12.0 | DOCX → TXT |
| docx | ^9.7.1 | TXT → DOCX |
| unpdf | ^1.6.2 | PDF → TXT |
| better-sqlite3 | ^12.10.0 | 数据库 |
| xlsx | ^0.18.5 | CSV ↔ Excel |
| marked | ^12.0.0 | Markdown → HTML |
| pdfjs-dist | ^6.0.227 | 客户端 PDF → 图片 |
| iron-session | ^8.0.4 | Session 鉴权 |
| LibreOffice（容器内）| 系统包 | 重型文档转换 |
| pdf2docx（容器内 Python）| pip | PDF → DOCX 兜底 |

---

## 十、待完成 / 后续建议

### 已完成
- [x] **一键启动脚本**：`/www/wwwroot/fileconvert/start.sh`，含所有环境变量
- [x] **数据库权限修复**：chown 1001:1001，数据正常持久化
- [x] **SESSION_SECRET 修复**：已设置 32 位以上密钥
- [x] **Adobe Key 池**：已配置 3 个账号（1500 次/月免费额度）

### 待完成（推荐优先级）

**完全免费，开发量小（优先做）：**
- [ ] **二维码生成**：qrcode npm 包，1天搞定，用户需求大
- [ ] **PDF 加密/解密**：pdf-lib 已装，直接支持，2小时
- [ ] **ZIP 打包下载**：jszip 已装，半天
- [ ] **Word/PPT → HTML**：LibreOffice 已有，加路由即可

**需要 API（有免费额度）：**
- [ ] **图片 OCR**：腾讯云每月 1000 次免费（多账号可叠加，但同身份证限一个）
- [ ] **图片去背景**：阿里云每月 500 次免费，超出 0.002元/次

**需要安装 ffmpeg（免费但占资源）：**
- [ ] **音频转换**：MP3/WAV/AAC/FLAC 互转，需在 Dockerfile 加 ffmpeg

**不建议（2C4G 服务器撑不住）：**
- [ ] ~~视频转换~~：ffmpeg 转视频极耗 CPU
- [ ] ~~本地 AI 模型~~：4G 内存不够

### 其他
- [ ] **ACR Webhook 自动部署**：构建完自动拉镜像，无需手动执行 start.sh
- [ ] **站名缓存**：部分用户浏览器缓存旧站名"文件快"，属正常现象，等待过期即可

---

## 十一、注意事项

1. **新增 npm 包后必须提交 `package-lock.json`**，否则 Docker 构建的 `npm ci` 步骤会失败
2. **数据库文件**挂载在宿主机 `/www/wwwroot/fileconvert/data/fileconvert.db`，重建容器不会丢失数据
3. **Adobe PDF API** 为可选功能，未配置时 PDF→Excel/PPT 功能会提示不可用，其余功能不受影响
4. **端口占用**：3000 端口被主站（aiboxpro）Node 进程占用，文件侠使用 3001 端口映射
5. **宝塔面板**访问地址通过 `sudo bt default` 命令查询
6. **服务器安全组**已放行：22（SSH）、80（HTTP）、443（HTTPS）、8888（宝塔，已改端口）
