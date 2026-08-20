# EE CRS Planner

[![Deploy](https://img.shields.io/github/actions/workflow/status/muhac/ee-crs-planner/deploy.yml?style=flat-square&label=deploy)](https://github.com/muhac/ee-crs-planner/actions/workflows/deploy.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fmuhac.github.io%2Fee-crs-planner%2F&style=flat-square)](https://muhac.github.io/ee-crs-planner/)
![PWA](https://img.shields.io/badge/PWA-offline_ready-1e2a44?style=flat-square)
[![IRCC tables](https://img.shields.io/badge/IRCC_tables-verified_2026--08-1e2a44?style=flat-square)](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[English](./README.md) · 简体中文

**在线使用：https://muhac.github.io/ee-crs-planner/**

先算清现在的 CRS 分数，再推演未来：加拿大工作再攒一年、雅思刷个分、或者学门法语，分数能涨到多少。

![主页——所有档案的置顶推演叠在同一张图上，不可入池区间为虚线](docs/home.jpg)

![档案页——实时分数明细，含技能迁移封顶与入池资格](docs/profile.jpg)

- **打分** —— 全因子 CRS 实时明细。语言成绩可直接填 CLB/NCLC 等级，也可填 IELTS / CELPIP / PTE / TEF / TCF 原始分，按 IRCC 官方对照表自动换算。
- **推演** —— 年龄自动增长、工作经验逐月累积，定了日期的事件（语言重考、学历提升、省提名）按时生效，画成逐月分数曲线。
- **规划** —— 多档案、多方案并排对比；逐项检查 CEC / FSW（含 67 分选拔表）/ FST 入池资格并解释差在哪，标出每个方案最早的入池月份。

此外：可安装为 PWA（完全离线可用），适配手机，界面支持六种语言（English / Français / Español / 简体中文 / 繁體中文 / हिन्दी）。

## 隐私设计

所有数据只存在你的浏览器里：档案保存在 localStorage，分享链接把数据编码在 URL 本身，JSON 导入/导出即备份。没有服务器、无需注册、没有任何统计埋点。

## 准确性

分数表转录自 [IRCC 官方 CRS 标准](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html)（2026 年 6 月版），并逐值核对过官方在线页面——CRS 分数表、语言成绩对照表与项目资格规则（2026 年 8 月）。仅供参考，一切以 IRCC 为准。发现与官方不一致？欢迎提 issue。

## 开发

```bash
npm install
npm run dev      # 本地开发服务器
npm test         # 打分引擎 + 存储测试（vitest）
npm run build    # 静态产物输出到 dist/，可部署到任何静态托管
```

技术栈：Vite + React 19 + TypeScript · Tailwind CSS v4 + shadcn/ui · Recharts · react-i18next · Vitest。打分引擎与 UI 完全解耦：IRCC 规则变化时只需更新 `src/engine/tables.ts`，测试套件守住其余部分。目录结构详见[英文 README](./README.md#stack--structure)。
