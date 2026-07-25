# SelfRulesGuard 🛡️

**关键动作拦截台 —— 个人决策与行为干预系统**

个人经验触发与决策纠偏系统。通过结构化确认、复盘与规则沉淀，拦截高风险动作（关键操作失误、物品丢失、高额冲动支出、人际越界、过度执行等）。

> Built with [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Neon Postgres + Drizzle ORM.

---

## 功能域

| 路由 | 功能 |
|---|---|
| `/` | 仪表盘（关键确认拦截台） |
| `/arm`、`/quick-check` | 武装模式、快速检查 |
| `/spending-review` | 高额支出决策拦截台 |
| `/event-library` | 事件案例库（丢失/复盘/规则） |
| `/ash-memos`、`/weakness` | 灰烬备忘录、弱点模式 |
| `/relationships` | 人际关系雷达 |
| `/tasks`、`/demands` | 树状任务、需求池 |
| `/boundaries` | 过度执行边界卡 |
| `/rules` | 拦截规则库 |
| `/entertainment` | 娱乐闭环管理 |
| `/resources` | 资源配置台（资产转化） |
| `/translate` | 翻译工具 |

## 技术栈

- **框架**: Next.js 16.2.6 (App Router)
- **语言**: TypeScript 5.7 + React 19
- **样式**: Tailwind CSS v4 + shadcn/ui
- **数据库**: Neon Postgres + Drizzle ORM
- **包管理**: pnpm

## 本地开发

```bash
# 安装依赖
pnpm install

# 设置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 DATABASE_URL

# 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

## 环境变量

| 变量 | 说明 |
|---|---|
| `DATABASE_URL` | Neon Postgres 连接字符串 |

## 注意事项

- 本项目为*单用户模式*（未接入认证），所有查询通过 `default-user` 隔离
- 数据库 DDL 通过 Neon MCP 手动执行，不支持 drizzle-kit 自动迁移
- 全站中文 UI，注释使用中文

## License

MIT
