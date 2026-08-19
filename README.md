# EE CRS 计算器

**在线使用:https://muhac.github.io/ee-crs-planner/**

非官方的加拿大 Express Entry **CRS(Comprehensive Ranking System)分数计算器**:

- 输入个人档案(年龄、教育、语言 CLB/NCLC、工作经验、配偶、附加项),实时查看总分和逐项拆解
- **未来推演**:年龄自动增长、工作经验按方案累积、语言重考 / 学历提升 / 省提名等事件按日期生效,逐月画出分数曲线
- 多档案、多方案对比;数据只存在本机浏览器(localStorage)
- 支持 JSON 导出/导入备份,以及把档案编码进 URL hash 的分享链接(数据不经过任何服务器)
- 桌面端双栏工作台布局;移动端单栏 + 底部悬浮分数条
- 多语言界面:English / Français / 简体中文 / 繁體中文 / हिन्दी / Español,首次访问跟随浏览器语言

分数表转录自 [IRCC 官方 CRS 标准](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html)(2026-06 版,不含已于 2025-03-25 取消的 job offer 加分)。结果仅供参考,以官方为准。

## 开发

```bash
npm install
npm run dev      # 本地开发
npm test         # 计分引擎 + 存储层测试(vitest)
npm run build    # 产物输出到 dist/,可部署到任意静态托管
```

## 技术栈与结构

Vite + React 19 + TypeScript · Tailwind CSS v4 + shadcn/ui · Recharts · Vitest

```
src/
├── engine/       # 纯 TS 计分引擎:官方分数表(tables.ts)、计分(crs.ts)、逐月推演(simulate.ts)
├── storage/      # localStorage 持久化、JSON/分享链接编解码(lz-string)
├── hooks/        # useAppData:档案 CRUD + 自动持久化
├── components/   # 表单、分数面板、推演图表等 UI
└── lib/          # 中文文案、默认值
```

计分引擎与 UI 完全解耦:IRCC 调整规则时只需修改 `src/engine/tables.ts` 并让测试通过。
