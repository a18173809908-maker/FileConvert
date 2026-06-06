# 文件侠 SEO 后续开发计划

## 背景

文件侠部署在二级域名：

- 工具站：`https://tools.aiboxpro.cn/`
- 母站：`https://www.aiboxpro.cn/`

后续 SEO 不能把工具站当成孤立站点处理。推荐结构是：

- 母站负责品牌、权威、工具聚合和入口分发。
- 工具站负责具体工具页面和长尾搜索流量承接。

这样可以让母站给工具站传递品牌信任，同时避免工具站标题和内容抢母站的品牌词。

## 域名分工

### 母站 www.aiboxpro.cn

母站主打品牌和泛工具词：

- AIBoxPro
- AI 工具箱
- 在线工具合集
- 免费 AI 工具
- 实用工具导航

母站应该提供明显入口链接到文件侠工具站，例如：

- 在线文件转换工具
- PDF 转 Word / 图片转换 / PDF 加密
- 更多实用工具：文件侠

建议母站后续增加 `/tools` 或类似聚合页，展示 AI 工具、文件转换工具、图片工具等，并链接到工具站核心页面。

### 工具站 tools.aiboxpro.cn

工具站主打具体转换需求和长尾词：

- PDF 转 Word
- Word 转 PDF
- PDF 转 Excel
- PDF 转 PPT
- PDF 加密
- PDF 解密
- PDF 合并
- PDF 拆分
- HEIC 转 JPG
- EPUB 转 PDF

工具站标题、描述和页面内容应聚焦“文件侠在线文件转换工具”，不要把首页标题写成“AIBoxPro 官网”。

工具站可以在页脚或 CTA 链回母站，但链接文案应保持自然，例如：

- 更多 AI 工具
- 前往 AIBoxPro 主站
- 查看更多实用工具

## Canonical 和 Sitemap 规则

1. 工具站页面 canonical 指向工具站自身。
   - 示例：`https://tools.aiboxpro.cn/pdf-to-word`
   - 不要 canonical 到母站。

2. 母站页面 canonical 指向母站自身。
   - 示例：`https://www.aiboxpro.cn/tools`

3. 工具站 sitemap 只放工具站 URL。
   - `https://tools.aiboxpro.cn/`
   - `https://tools.aiboxpro.cn/formats`
   - `https://tools.aiboxpro.cn/help`
   - `https://tools.aiboxpro.cn/pdf-to-word`

4. 母站 sitemap 只放母站 URL。

5. Search Console、百度搜索资源平台建议分别验证：
   - `www.aiboxpro.cn`
   - `tools.aiboxpro.cn`

## 首批 SEO 落地页

先做 10 个高价值页面，不要一次铺太多低质量页面。

| URL | 页面标题 | 默认转换方向 | 优先级 |
| --- | --- | --- | --- |
| `/pdf-to-word` | PDF 转 Word - 免费在线转换 DOCX | PDF → DOCX | P0 |
| `/word-to-pdf` | Word 转 PDF - 免费在线转换 | DOCX → PDF | P0 |
| `/pdf-to-excel` | PDF 转 Excel - 在线转换 XLSX | PDF → XLSX | P0 |
| `/pdf-to-ppt` | PDF 转 PPT - 在线转换 PPTX | PDF → PPTX | P1 |
| `/pdf-encrypt` | PDF 加密 - 在线给 PDF 设置密码 | PDF 加密 | P0 |
| `/pdf-decrypt` | PDF 解密 - 在线去除 PDF 密码 | PDF 解密 | P0 |
| `/pdf-merge` | PDF 合并 - 多个 PDF 合成一个文件 | PDF 合并 | P1 |
| `/pdf-split` | PDF 拆分 - 按页拆分 PDF 文件 | PDF 拆分 | P1 |
| `/heic-to-jpg` | HEIC 转 JPG - 免费图片格式转换 | HEIC → JPG | P1 |
| `/epub-to-pdf` | EPUB 转 PDF - 在线电子书转换 | EPUB → PDF | P1 |

## 落地页要求

每个落地页必须是“可用工具页”，不能只是文章页。

页面进入后应做到：

1. 自动选中对应转换方向。
2. 首屏可以直接上传文件。
3. 页面有独立 metadata：
   - `title`
   - `description`
   - `alternates.canonical`
   - `openGraph`
4. 页面正文包含自然说明，不堆关键词。
5. 页面 FAQ 至少 3 条，围绕真实问题：
   - 是否免费
   - 文件是否安全
   - 转换需要多久
   - 为什么转换失败
   - 文件大小限制
6. 页面内链到：
   - `/formats`
   - `/help`
   - 2-3 个相关转换页
7. CTA 链回母站，但不要喧宾夺主。

## 推荐页面结构

```text
H1：PDF 转 Word
简短说明：免费在线将 PDF 转为可编辑 Word 文档...

上传/转换工具区

适用场景
- 合同、资料、教材、扫描文档等

使用步骤
1. 上传 PDF
2. 等待转换
3. 下载 DOCX

常见问题 FAQ

相关工具
- Word 转 PDF
- PDF 转 Excel
- PDF 加密
```

## 技术实现建议

### 路由

建议新增统一配置文件，例如：

- `lib/seo-pages.ts`

保存每个 SEO 页面配置：

```ts
export const SEO_TOOL_PAGES = [
  {
    slug: 'pdf-to-word',
    title: 'PDF 转 Word - 免费在线转换 DOCX',
    description: '免费在线将 PDF 转换为可编辑 Word 文档，支持大文件异步转换。',
    from: 'pdf',
    to: 'docx',
    h1: 'PDF 转 Word',
  },
]
```

然后用动态路由或静态页面生成：

- `app/[tool]/page.tsx`

如果担心影响现有路由，也可以先显式建 10 个页面，但长期建议配置驱动。

### 首页联动

当前首页支持从 URL 参数读取：

```text
/?conversion=pdf-docx
```

落地页可以复用同一套上传和队列组件，但默认传入对应转换方向。不要让用户落地后还需要自己找工具。

### Sitemap

当前已有 `app/sitemap.ts`，后续要把 `SEO_TOOL_PAGES` 合并进去，避免每加一个页面都手写 sitemap。

### Robots

保持允许抓取工具页，禁止抓取 API：

```text
Allow: /
Disallow: /api/
```

### 缓存

页面入口需要避免长时间缓存，否则新工具上线后用户和搜索引擎会看到旧页面。

当前 `next.config.mjs` 已对以下入口加了 `no-store`：

- `/`
- `/formats`
- `/help`
- `/download`
- `/robots.txt`
- `/sitemap.xml`
- `/manifest.webmanifest`

新增 SEO 落地页后，也要加入同样的页面级缓存策略，或改成统一匹配规则。

## 内容原则

1. 不写虚假能力。
   - 已上线才写“支持”。
   - 未上线写“暂未开放”。

2. 不把低质量转换包装成高精度。
   - PDF → Word 已接 Adobe 高精度转换，可以明确说明。
   - PDF → EPUB 暂未开放，原因是版式重排复杂。

3. 不堆关键词。
   - 关键词应自然出现在标题、首段、FAQ、相关工具里。

4. 不让母站和工具站互相抢词。
   - 母站写品牌和工具合集。
   - 工具站写具体工具。

5. 每个 SEO 页面都必须能完成真实转换。

## 验收标准

每批 SEO 页面上线前检查：

- `npm run build` 通过。
- `npx tsc --noEmit` 通过。
- `/sitemap.xml` 包含新增 URL。
- 每个页面 canonical 指向自身。
- 页面首屏能直接上传文件。
- 页面默认转换方向正确。
- 页面标题没有和母站品牌页冲突。
- 移动端文字不溢出。
- 线上访问不需要加随机 query 才能看到新页面。

## 推荐开发顺序

### 第一阶段：基础设施

1. 新增 `lib/seo-pages.ts`。
2. 新增 SEO 落地页模板。
3. sitemap 自动读取 SEO 页面配置。
4. 页面缓存策略覆盖新增落地页。

### 第二阶段：首批 10 个页面

优先做：

1. `/pdf-to-word`
2. `/word-to-pdf`
3. `/pdf-encrypt`
4. `/pdf-decrypt`
5. `/pdf-to-excel`

再做：

6. `/pdf-to-ppt`
7. `/pdf-merge`
8. `/pdf-split`
9. `/heic-to-jpg`
10. `/epub-to-pdf`

### 第三阶段：站长平台和数据

1. 百度搜索资源平台提交工具站 sitemap。
2. Google Search Console 提交工具站 sitemap。
3. 母站增加工具站入口和相关内链。
4. 观察 2-4 周收录、展现、点击，再决定是否扩展更多页面。

## 后续扩展候选

首批页面稳定后，再考虑：

- `/pdf-to-jpg`
- `/pdf-to-png`
- `/jpg-to-pdf`
- `/png-to-pdf`
- `/pdf-compress`
- `/pdf-rotate`
- `/markdown-to-pdf`
- `/csv-to-excel`
- `/svg-to-png`
- `/webp-to-jpg`
