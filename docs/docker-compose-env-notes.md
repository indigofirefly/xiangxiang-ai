# Docker Compose 环境变量配置备忘录

> 项目：xiangxiang-ai ｜ 更新：2026-11-20

## 摘要

本文档记录 Docker Compose 配置环境变量的**两种操作方法**，二选一：

| 方法 | 核心写法 | 说明 |
|------|----------|------|
| **注入形式：`env_file`**<br>✅ **业内常用，推荐** | `env_file: - .env.docker` | 变量直接注入容器，配置集中、批量维护方便；缺文件会显式报错，容易发现 |
| **插值形式：`${}`** | `POSTGRES_USER: ${POSTGRES_USER}` + `--env-file` | 变量在 yml 中显式可见；变量多时冗长，漏带 `--env-file` 只警告不报错 |

两种方法都分**本地**（`docker-compose.local.yml` + `.env.docker`）与**生产**（`docker-compose.production.yml` + `.env.production`）两套文件。

## 0. 先记住两条规则

1. **不指定时，docker compose 只自动读项目根目录的 `.env`**（用于 `${}` 插值）。
2. **两种机制互不相通**：
   - `env_file:` → 把文件里的变量**注入容器**，容器内 `process.env` 可读；文件名写死在 yml 里。
   - `${VAR}` → Compose 解析 yml 时**替换成字面值**；变量来自 shell 环境、项目根目录 `.env` 或 `--env-file` 指定的文件，**读不到 `env_file` 列出的文件**。

> 下面两种形式是**二选一**，yml 文件名相同（`docker-compose.local.yml` / `docker-compose.production.yml`），不会同时存在。

---

## 1. 环境变量文件

### `.env.docker`（本地）

```dotenv
# PostgreSQL 初始化（仅数据卷为空、首次启动时生效）
POSTGRES_USER=<用户名>
POSTGRES_PASSWORD=<密码>
POSTGRES_DB=<库名>

# host 必须是容器服务名 postgres，不能写 localhost
DATABASE_URL=postgresql://<用户名>:<密码>@postgres:5432/<库名>?schema=public

NODE_ENV=development
PORT=3000
```

### `.env.production`（生产）

暂时**直接复制 `.env.docker`**，后续再替换为生产值。

- 只放生产服务器，不提交 git（建议在 `.gitignore` 补 `.env.production`）。
- `POSTGRES_*` 与 `DATABASE_URL` 里的用户名、密码、库名必须一致，host 同样写 `postgres`。

### 生产部署时创建 `.env.production` 的时机与步骤

**时机**：项目文件已上传到生产服务器、**首次执行 `up` 命令之前**。文件只在服务器上创建，不要提交 git；方案一（`env_file`）缺这个文件会直接启动失败。

**1. 登录服务器并进入项目目录**

```bash
ssh <用户名>@<服务器>
cd <项目目录>
```

**2. 创建文件**（二选一）

方式 A：在服务器上直接创建（vim，文件不存在时打开即新建）

```bash
vim .env.production
```

- 按 `i` 进入插入模式，粘贴下面的内容
- 按 `Esc`，输入 `:wq` 回车保存退出（`:q!` 放弃修改退出）

方式 B：本地已有 `.env.production` 时，直接 scp 上传，**不需要 vim**

```bash
scp .env.production <用户名>@<服务器>:<项目目录>/.env.production
```

> 在本地项目根目录执行。上传后跳过第 3 步，直接做第 4 步收紧权限。

**3. 粘贴内容**（方式 A 使用；暂与 `.env.docker` 一致，后续再替换生产值）

```dotenv
POSTGRES_USER=<用户名>
POSTGRES_PASSWORD=<密码>
POSTGRES_DB=<库名>

DATABASE_URL=postgresql://<用户名>:<密码>@postgres:5432/<库名>?schema=public

NODE_ENV=production
PORT=3000
```

**4. 收紧权限**（文件含密码，仅本人可读）

```bash
chmod 600 .env.production
```

**5. 启动前确认变量能读到**

```bash
docker compose -f docker-compose.production.yml config | grep -E 'POSTGRES_USER|DATABASE_URL'
```

确认输出里是真实的用户名和连接串后，再启动：

```bash
docker compose -f docker-compose.production.yml up -d --build
```

> 若采用插值形式（方案二），启动命令改为：`docker compose -f docker-compose.production.yml --env-file .env.production up -d --build`。

**后续修改**：改完 `.env.production` 后容器不会自动拿到新值，需要重建：

```bash
docker compose -f docker-compose.production.yml up -d --force-recreate
```

> `POSTGRES_*` 只在数据卷为空、首次初始化时生效；生产已有数据时修改这些值不会改变数据库里的账号密码。

---

## 2. 注入形式：`env_file`（推荐）

两个**互相独立、完整**的 yml 文件，区别只在 `env_file` 一行。

### 2.1 `docker-compose.local.yml`

```yaml
services:
  postgres:
    image: postgres:18-alpine
    container_name: nestjs_postgres
    restart: unless-stopped
    env_file:
      - .env.docker
    ports:
      - "5433:5432"
    volumes:
      # postgres 18 起卷挂载点是 /var/lib/postgresql（不是 .../data）
      - postgres_data:/var/lib/postgresql
    networks:
      - app-network
    healthcheck:
      # $$ 由容器内展开，不依赖 Compose 插值
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  nestjs:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nestjs_app
    restart: unless-stopped
    env_file:
      - .env.docker
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: nestjs_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - nestjs
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

### 2.2 `docker-compose.production.yml`

内容与上面**完全相同**，只把**两处** `.env.docker` 改成 `.env.production`（`postgres` 与 `nestjs` 的 `env_file` 各一处）。

### 2.3 命令

本地：

```bash
docker compose -f docker-compose.local.yml up -d --build
```

生产：

```bash
docker compose -f docker-compose.production.yml up -d --build
```

> 采用本方案后，旧的 `docker-compose.yml`（混用状态）建议删除，避免不带 `-f` 的 `docker compose up` 误用它。

---

## 3. 插值形式：`${}`

两个完整 yml 文件内容**完全一致**（插值形式的环境差异由命令里的 `--env-file` 决定），保留两份只是为以后加生产专属配置留位置。

### 3.1 `docker-compose.local.yml`

```yaml
services:
  postgres:
    image: postgres:18-alpine
    container_name: nestjs_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql
    networks:
      - app-network
    healthcheck:
      # $$ 由容器内展开（environment 已注入该变量）
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  nestjs:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nestjs_app
    restart: unless-stopped
    environment:
      DATABASE_URL: ${DATABASE_URL}
      NODE_ENV: ${NODE_ENV}
      PORT: ${PORT}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: nestjs_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - nestjs
    networks:
      - app-network

volumes:
  postgres_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

### 3.2 `docker-compose.production.yml`

与 `docker-compose.local.yml` **完全相同**，直接复制一份即可。

### 3.3 命令

本地：

```bash
docker compose -f docker-compose.local.yml --env-file .env.docker up -d --build
```

生产：

```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

> ⚠️ 不带 `--env-file` 时，Compose 只读项目根目录 `.env`（当前只有 `DATABASE_URL`），`POSTGRES_*`、`NODE_ENV`、`PORT` 全部变成空字符串——**只有警告，不会报错**，务必确认命令带上了 `--env-file`。

---

## 4. 命令速查表

| 操作 | 注入形式（env_file） | 插值形式（`${}`） |
|------|----------------------|-------------------|
| 本地启动 / 重建 | `docker compose -f docker-compose.local.yml up -d --build` | `docker compose -f docker-compose.local.yml --env-file .env.docker up -d --build` |
| 生产启动 / 重建 | `docker compose -f docker-compose.production.yml up -d --build` | `docker compose -f docker-compose.production.yml --env-file .env.production up -d --build` |
| 预览最终配置 | `docker compose -f docker-compose.local.yml config` | `docker compose -f docker-compose.local.yml --env-file .env.docker config` |
| 查看日志 | `docker compose -f docker-compose.local.yml logs -f nestjs` | 同左（无需 `--env-file`） |
| 停止 | `docker compose -f docker-compose.local.yml down` | 同左 |
| 停止并清库（仅本地） | `docker compose -f docker-compose.local.yml down -v` | 同左 |
| 改了 env 不生效 | `up` 命令后加 `--force-recreate` | 同左 |

生产环境把 `docker-compose.local.yml` 换成 `docker-compose.production.yml` 即可。

嫌 `-f` 长时，可在当前终端 export 一次（后续该终端内所有 `docker compose` 命令生效）：

```bash
export COMPOSE_FILE=docker-compose.local.yml && docker compose up -d --build
```

---

## 5. 踩坑清单

1. **postgres 18 的卷挂载点是 `/var/lib/postgresql`**（`PGDATA=/var/lib/postgresql/18/docker`），写 `/var/lib/postgresql/data` 是 17 及以前的写法，在 18 上数据不会持久化到命名卷。
2. **`POSTGRES_*` 只在数据卷为空、首次初始化时生效**。已有数据后改密码无效，表现为 NestJS 连不上；本地可 `down -v` 重来，生产要保证 env 与初始化时一致。
3. **healthcheck 里用 `$$VAR`**（容器内展开），不要用 `${VAR}`。
4. **`version: '3.8'` 已废弃**，删掉。
5. **容器内连数据库用 `postgres:5432`**，不是 `localhost`。
6. **`env_file` 缺文件会直接启动失败**；`.env.production` 必须先放到生产服务器。
7. **验证变量是否进容器**：`docker compose -f docker-compose.local.yml config` 会展示 `env_file` 解析后的最终 `environment`；运行中也可以 `docker compose -f docker-compose.local.yml exec nestjs env | grep DATABASE_URL`。
