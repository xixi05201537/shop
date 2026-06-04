# Misaki Shop 部署说明

Misaki Shop 是一个单商品 PayPal 收款网站，包含前台商品页、PayPal 付款、订单记录、后台管理、商品配置、图片上传、邮件模板、浮窗链接和 Markdown 文章页。

## 功能

- 单商品付款页
- PayPal Checkout 创建订单和确认付款
- PayPal Webhook 增强支付状态可靠性
- 后台登录
- 商品图片、标题、价格、简介、数量配置
- 订单列表和订单详情
- 邮件 SMTP 配置
- 买家/管理员邮件模板
- 小浮窗跳转配置
- Markdown 文章页
- Docker 部署

## 技术栈

- Next.js 16
- React 19
- Prisma 6
- MySQL
- PayPal Checkout API
- Nodemailer
- Docker

## 环境变量

项目配置写在 `.env` 文件里。可以复制 `.env.example`：

```bash
cp .env.example .env
```

示例：

```env
# 可选。为空时自动使用当前访问域名。
APP_URL=

# 应用端口
PORT=4000

# MySQL 连接地址
DATABASE_URL=mysql://misaki:misaki@localhost:3306/misaki

# 后台登录和会话
JWT_SECRET=change-me-to-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=

# 邮件 SMTP
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Misaki Shop

# 联系邮箱和通知邮箱
SUPPORT_EMAIL=support@example.com
ADMIN_NOTIFY_EMAIL=owner@example.com

# 上传目录
UPLOAD_DIR=./public/uploads
```

## MySQL 配置

当前推荐使用已有 MySQL，不在本项目的 `docker-compose.yml` 里额外启动 MySQL。

本机运行项目，并连接本机 Docker 暴露出来的 MySQL：

```env
DATABASE_URL=mysql://misaki:misaki@localhost:3306/misaki
```

如果应用也运行在 Docker 容器里，`localhost` 指的是应用容器本身，不能直接代表宿主机。Docker Desktop 可以使用：

```env
DATABASE_URL=mysql://misaki:misaki@host.docker.internal:3306/misaki
```

如果 MySQL 和应用在同一个 Docker 网络中，并且 MySQL 容器名是 `mysql`：

```env
DATABASE_URL=mysql://misaki:misaki@mysql:3306/misaki
```

1Panel 或服务器容器环境中，请使用实际 MySQL 容器名或内网地址，例如：

```env
DATABASE_URL=mysql://misaki:misaki@1Panel-mysql-xxxx:3306/misaki
```

## PayPal 配置从哪里获取

PayPal 配置在 PayPal Developer 后台获取：

- PayPal Developer Dashboard: https://developer.paypal.com/dashboard/applications/
- PayPal REST API 文档: https://developer.paypal.com/api/rest/
- PayPal Webhook 文档: https://developer.paypal.com/api/rest/webhooks/

步骤：

1. 登录 PayPal Developer Dashboard。
2. 打开 `Apps & Credentials`。
3. 选择 `Sandbox` 或 `Live`。
4. 创建一个 REST API App，或者打开已有 App。
5. 在 App 页面复制：
   - `Client ID` 填入 `PAYPAL_CLIENT_ID`
   - `Secret` 填入 `PAYPAL_CLIENT_SECRET`
6. 如果使用测试环境：
   ```env
   PAYPAL_ENV=sandbox
   ```
7. 如果使用正式环境：
   ```env
   PAYPAL_ENV=live
   ```

注意：`sandbox` 必须配 Sandbox 的 Client ID 和 Secret，`live` 必须配 Live 的 Client ID 和 Secret。环境不匹配时，PayPal 通常会返回 `invalid_client`。

## PayPal Webhook 配置

Webhook 也在 PayPal Developer 的 App 页面配置。

Webhook URL：

```text
https://你的域名/api/paypal/webhook
```

本地测试没有公网域名时，需要使用 ngrok、Cloudflare Tunnel 或类似工具把本地服务转发到公网。

推荐订阅事件：

```text
PAYMENT.CAPTURE.COMPLETED
CHECKOUT.ORDER.APPROVED
```

创建 Webhook 后，PayPal 会生成一个 Webhook ID，把它填到：

```env
PAYPAL_WEBHOOK_ID=
```

## 邮件配置

邮件用于：

- 买家付款后收到感谢邮件
- 管理员收到新订单通知

SMTP 配置填写在后台 `Email` 页面，也可以在 `.env` 中提供默认值：

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-account@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=your-account@example.com
SMTP_FROM_NAME=Misaki Shop
SUPPORT_EMAIL=support@example.com
ADMIN_NOTIFY_EMAIL=owner@example.com
```

不同邮箱服务商的 SMTP 地址不同，请到对应邮箱服务商后台获取。

## 本地开发

安装依赖：

```bash
npm install
```

准备 `.env`：

```bash
cp .env.example .env
```

同步数据库表结构：

```bash
npm run db:push
```

首次写入默认数据：

```bash
npm run db:seed
```

启动开发服务：

```bash
npm run dev
```

访问：

```text
http://localhost:4000
```

后台：

```text
http://localhost:4000/admin
```

后台账号来自 `.env`：

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

## Docker Compose 部署

`docker-compose.yml` 只启动应用，不启动 MySQL。请先准备好 MySQL，并在 `.env` 里写好 `DATABASE_URL`。

启动：

```bash
docker compose up -d --build
```

访问：

```text
http://localhost:4000
```

上传图片会挂载到：

```text
./uploads -> /app/public/uploads
```

## Docker Run 部署

示例：

```bash
docker run -d \
  --name misakishop \
  --restart unless-stopped \
  -p 4000:4000 \
  -e PORT="4000" \
  -e APP_URL="" \
  -e DATABASE_URL="mysql://misaki:wHtXZBGkkpRM8ARe@1Panel-mysql-SwmD:3306/misaki" \
  -e JWT_SECRET="replace-with-a-long-random-secret" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="admin123456" \
  -e PAYPAL_CLIENT_ID="your-paypal-client-id" \
  -e PAYPAL_CLIENT_SECRET="your-paypal-client-secret" \
  -e PAYPAL_ENV="sandbox" \
  -e PAYPAL_WEBHOOK_ID="" \
  -v /opt/misakishop/uploads:/app/public/uploads \
  aoizzz/misakishop:latest
```

如果部署在 Linux 服务器上，`host.docker.internal` 不一定可用，请换成你的 MySQL 内网地址、容器名或服务器 IP。

## Docker 镜像推送

登录 Docker Hub：

```bash
docker login
```

构建并推送 amd64 镜像：

```bash
docker buildx build --platform linux/amd64 -t aoizzz/misakishop:latest --push .
```

拉取镜像：

```bash
docker pull aoizzz/misakishop:latest
```

## 数据库更新说明

同步表结构：

```bash
npm run db:push
```

`db:push` 只同步数据库结构，例如新增字段、新增表、修改字段类型。它不会把已有数据改回默认值。

首次初始化默认数据：

```bash
npm run db:seed
```

`db:seed` 会写入默认管理员、默认商品、默认文章和默认配置。现在 seed 使用 `upsert(update: {})`，不会覆盖已经存在的数据。

Docker 容器启动命令是：

```bash
npx prisma db push && node prisma/seed-if-empty.mjs && node server.js
```

也就是说：

- 每次启动会自动同步表结构。
- 只有数据库为空时才写入默认数据。
- 后续更新网站不会因为重启 Docker 就清空或重置你的数据库数据。

## 常用命令

```bash
npm run dev              # 本地开发，端口 4000
npm run build            # 构建生产版本
npm run start            # 启动生产版本，端口 4000
npm run db:push          # 同步数据库结构
npm run db:seed          # 手动写入默认数据
npm run db:seed:if-empty # 只有数据库为空时才写默认数据
```

## 常见问题

### PayPal 提示 invalid_client

检查：

- `PAYPAL_CLIENT_ID` 是否填写
- `PAYPAL_CLIENT_SECRET` 是否填写
- `PAYPAL_ENV` 是否和凭证环境一致
- 修改 `.env` 后是否重启服务

### Docker 里连不上 MySQL

如果应用在 Docker 容器中，`localhost` 是应用容器自己，不是宿主机。

可以尝试：

```env
DATABASE_URL=mysql://misaki:misaki@host.docker.internal:3306/misaki
```

或者使用 MySQL 容器名：

```env
DATABASE_URL=mysql://misaki:misaki@mysql:3306/misaki
```

### 上传图片不显示

确认挂载了上传目录：

```bash
-v /opt/misakishop/uploads:/app/public/uploads
```

上传目录现在只通过 `.env` 里的 `UPLOAD_DIR` 配置，后台不再单独修改上传目录。Docker 部署时推荐保持：

```text
./public/uploads
```
