# `src/main.ts` 中 `import 'dotenv/config'` 的作用分析

> 项目：xiangxiang-ai ｜ 更新：2026-11-20

## 结论

这不是 NestJS 的要求，而是 **Prisma 7 升级的配套补丁**：在应用进程启动时把根目录 `.env` 加载进 `process.env`，供 [PrismaService](../src/prisma/prisma.service.ts) 读取 `DATABASE_URL`。

- 引入于提交 `6aacdae`（2026-11-18，与 Prisma 7 改造同一提交）。
- 项目没有安装 `@nestjs/config`，运行时没有其他 `.env` 加载器。
- [prisma.config.ts:9](../prisma.config.ts) 里还有一份同款 import，服务的是 Prisma CLI 进程，两者不能互相替代。

## 为什么需要

| 进程 | 入口 | 加载者 |
|------|------|--------|
| Prisma CLI（generate / migrate） | `prisma.config.ts` | 该文件第 9 行的 dotenv |
| Node 应用（`nest start` / `node dist/main.js`） | `src/main.ts` | 该文件第 1 行的 dotenv |

Prisma 6 的 CLI 会自动读 `.env`，v7 移除了这个行为，要求显式加载。同时 Prisma 7 的运行时改用 `pg.Pool` + `PrismaPg`，连接串直接取 `process.env.DATABASE_URL`——整条链路上没有库会替我们读文件。

**不加会怎样**：`DATABASE_URL` 为 `undefined`，`pg` 会静默回退到 `localhost:5432` + 当前系统用户名 + 同名库（已实测），报错看起来像数据库问题，很难联想到环境变量。本地开发必现；Docker 不受影响，见下文。

**为什么放第一行**：ESM 静态 import 按声明顺序求值，放首行可保证依赖链求值前 env 就绪。不过 `PrismaService` 是在构造函数里读取，实际时机更晚，放首行更多是保险。

## dotenv 的实际行为（已实测）

| 行为 | 结果 | 注意 |
|------|------|------|
| 与已有 `process.env` 冲突 | 不覆盖，进程内已有的值优先 | Docker 注入的值不会被 `.env` 覆盖 |
| `.env` 不存在 | 静默跳过，不报错 | 配置缺失会推迟到连接数据库时才暴露 |
| 查找路径 | 默认 `process.cwd()/.env` | 必须在项目根目录启动 |
| 打包与依赖 | `dist/main.js` 保留该 import；dotenv 在 `dependencies` | 生产安装 `--only=production` 也能用 |

## 部署对照

| 场景 | 变量来源 | `main.ts` 的 dotenv |
|------|----------|---------------------|
| 本地 `start:dev` / `start:prod` | 根目录 `.env` | ✅ 唯一加载者 |
| Docker Compose | `.env.docker` 经 `env_file` 注入 | ⭕ 空操作（容器内无 `.env`，且不覆盖已有变量） |

## 后续待办（未改代码）

| # | 问题 | 建议 |
|---|------|------|
| 1 | [main.ts:9](../src/main.ts) 硬编码 `app.listen(3000)`，`PORT` 未被读取 | `app.listen(Number(process.env.PORT ?? 3000))` |
| 2 | [prisma.config.ts:28](../prisma.config.ts) 用 `as string`，变量缺失时静默传 `undefined` | 改用 Prisma 7 的 `env('DATABASE_URL')`，缺失即抛错 |

## 保留还是迁移 `@nestjs/config`

当前只有 1 个环境变量读取点，保留这一行 dotenv 足够，引入 `@nestjs/config` 属于过度设计。等需要多环境文件、变量校验或 `ConfigService` 注入时再迁移；**迁移时务必删掉这一行**，避免双重加载导致"哪个文件生效"难以判断。

## 自查

```bash
node --input-type=module -e "import 'dotenv/config'; console.log('DATABASE_URL 已加载:', Boolean(process.env.DATABASE_URL))"
```

```bash
head -1 dist/main.js
```
