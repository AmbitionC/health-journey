# Health Journey — 个人健康管理前端

体成分趋势 / 饮食记录与热量预算 / Apple Watch 活动数据 的移动优先 Web 应用。

- 框架：[Umi 4](https://umijs.org/) + React 18 + antd 5 + ECharts
- 后端：fe-journey-faas 的 `/health/*` 模块（阿里云 FC，独立 health 库）
- 数据仓库与系统文档：[AmbitionC/health](https://github.com/AmbitionC/health)

## 本地开发

```bash
npm install
npm run dev          # http://localhost:8000
```

首次打开到「设置」页填写：

| 项 | 值 |
|---|---|
| API 地址 | FC 函数公网地址（`https://…fcapp.run`） |
| 访问令牌 | 与后端环境变量 `HEALTH_API_TOKEN` 一致 |

也可在构建期注入默认 API 地址：`UMI_APP_API_BASE=https://…fcapp.run npm run build`（令牌不要打进构建产物，始终在设置页填写）。

## 部署到 Vercel

仓库根目录已带 `vercel.json`（构建命令 `npm run build`、产物 `dist/`、SPA 回退重写）。在 Vercel 导入本仓库即可：

1. Framework Preset 选 **Other**（vercel.json 已指定构建）
2. 可选环境变量：`UMI_APP_API_BASE` = FC 函数地址
3. 部署完成后，后端已放行 `*.vercel.app` 的 CORS；若绑定自定义域名，在 FC 环境变量 `EXTRA_CORS_ORIGINS` 追加该域名后重新部署后端

## 页面

| 路由 | 功能 |
|---|---|
| `/` | 今日总览：热量环、宏量进度、AI 建议、体重与目标、活动、90 天趋势 |
| `/body` | 体成分记录与多指标趋势（体重/体脂/内脏脂肪/肌肉/水分） |
| `/meals` | 按天饮食记录、拍照识别热量、30 天摄入对比预算 |
| `/activity` | 步数/能量消耗图表与明细（iOS 快捷指令自动同步） |
| `/settings` | 后端连接、预算说明、个人档案与减脂参数 |
