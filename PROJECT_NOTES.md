# 项目说明

## 项目简介
这是一个品牌声量追踪 Web App，输入关键词/话题后聚合社媒与新闻/PR内容，以卡片流展示并支持 CSV 导出。

## 核心功能
- 关键词/Hashtag 搜索
- 站点过滤：YouTube、Instagram、Twitter/X、Threads、TikTok、News、PR
- 次级过滤：Country(gl)、Language(hl)、Date(tbs)
- 卡片流展示：支持链接跳转、封面/占位、统计高亮
- CSV 导出
- Settings 配置：Serper Key、X/Threads 与 YT/IG/TikTok 的 Auth、Actor ID

## 搜索与抓取逻辑
- Serper 按站点拆分查询，再合并去重。
- 每个站点最多请求 5 页（每页 10 条），按抓取数量均分。
- News 走 `https://google.serper.dev/news`
- PR 走同一 News 端点，但增加更宽松的 PR 关键词。

### 当前查询模板（示例：iPhone 17 Pro）
- YouTube: `(site:youtube.com OR site:youtu.be) "iPhone 17 Pro" (review OR unboxing OR "hands on" OR "first look")`
- X/Twitter: `(site:x.com OR site:twitter.com) "iPhone 17 Pro"`
- Threads: `(site:threads.net OR site:threads.com) "iPhone 17 Pro"`
- Instagram: `site:instagram.com "iPhone 17 Pro"`
- TikTok: `site:tiktok.com "iPhone 17 Pro" (review OR unboxing OR "hands on" OR "first look")`
- News: `"iPhone 17 Pro"`
- PR: `"iPhone 17 Pro" ("press release" OR "press statement" OR "media release" OR announcement OR launch OR partnership OR funding OR newsroom OR "PR Newswire" OR "Business Wire")`

## API 说明
- X / Threads enrichment：`https://nexus-data-api.fastgrowth.app/v1/kol/performance/enrichment`
- YouTube / IG / TikTok enrichment：`https://uppapi.fastgrowth.app/kol-performance/api/enrichment`
- Serper 搜索：`https://google.serper.dev/search`
- Serper 新闻：`https://google.serper.dev/news`

## 前端字段映射（核心）
- views：来自 enrichment 的 `views`
- likes：来自 enrichment 的 `likes`
- comments：来自 enrichment 的 `comments`
- shares：来自 enrichment 的 `shares`

## 重要约定
- Endpoint 不在前端显示真实值，界面只显示 `****`。
- Gemini API Key 已移除（暂无功能）。
- 默认抓取数量为 10；用户修改后会保存在 localStorage。

## 部署说明（GitHub Pages）
当前使用 GitHub Pages + `/docs` 目录部署。

### 手动部署
```bash
cp index.html styles.css app.js docs/
git add index.html styles.css app.js docs/
git commit -m "Update site"
git push
```

### 一键部署脚本
```bash
./deploy.sh
```

## 常见问题
- 页面默认值不生效：localStorage 可能保存了旧值，删除 `brand-tracker-filters` 后刷新。
- News/PR 没结果：可能关键词过于冷门，或 Serper `/news` 权限不足。
