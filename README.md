# Misaki Shop

Misaki Shop 是一个基于 Next.js 的单商品 PayPal 收款站点。它包含前台商品页、PayPal Checkout、Webhook 支付状态兜底、订单后台、商品和图片管理、邮件模板、发货通知、浮窗入口和 Markdown 文章页。

## 功能概览

- 前台单商品购买页，支持固定金额、自定义金额、数量选择。
- PayPal Checkout 创建订单、捕获支付，并校验金额和币种。
- PayPal Webhook 校验签名，只在 `PAYMENT.CAPTURE.COMPLETED` 且金额匹配时标记已支付。
- 用户支付后即使关闭 PayPal 弹窗，Webhook 仍可补全本地支付状态。
- 后台登录、概览、商品、订单、图片、邮件、PayPal 设置、浮窗、文章管理。
- 订单筛选、导出 CSV、复制订单号/邮箱/PayPal ID、内部备注。
- 订单详情支持查看 PayPal 买家信息、收货信息、邮件状态、重发邮件、填写发货单号并发送发货邮件。
- SMTP 邮件配置，支持买家邮件、管理员邮件、发货邮件和测试发送。
- 图片上传到 `public/uploads`，可直接选为商品图片或浮窗图片。
- Docker 单容器部署，启动时自动同步数据库结构，空库时自动初始化默认数据。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript 6
- Prisma 6
- MySQL
- PayPal Orders API + Webhook Signature Verification
- Nodemailer
- TipTap 富文本邮件编辑
- Docker / Docker Buildx

## 目录结构

```text
app/                       Next.js 页面和 API Route
app/api/checkout/          前台创建 PayPal 订单、捕获支付
app/api/paypal/webhook/    PayPal Webhook 回调入口
app/admin/                 后台页面
components/                前台和后台通用 React 组件
lib/                       PayPal、配置、邮件、订单、认证等服务代码
prisma/schema.prisma       MySQL 数据模型
prisma/seed.mjs            默认数据初始化
prisma/seed-if-empty.mjs   仅空库时初始化
scripts/start.mjs          本地 standalone 启动脚本
Dockerfile                 生产镜像构建文件
```

## 核心数据模型

- `Admin`：后台管理员账号。
- `Product`：唯一商品配置，包括标题、图片、金额选项、默认数量、详情文案。
- `Article`：后台维护的 Markdown 文章。
- `SiteConfig`：站点配置，包含 PayPal、SMTP、浮窗、前台输入项开关等。
- `Order`：订单、PayPal 信息、买家信息、邮件状态、发货信息、内部备注。
- `WebhookEvent`：PayPal Webhook 事件记录，用于去重和排查。

## 环境变量

可以复制 `.env.example`：

```bash
cp .env.example .env
```

常用配置如下：

```env
APP_URL=
PORT=4000
DATABASE_URL=mysql://misaki:misaki@localhost:3306/misaki

JWT_SECRET=change-me-to-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456

PAYPAL_ENV=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=

PAYPAL_SANDBOX_CLIENT_ID=
PAYPAL_SANDBOX_CLIENT_SECRET=
PAYPAL_SANDBOX_WEBHOOK_ID=
PAYPAL_LIVE_CLIENT_ID=
PAYPAL_LIVE_CLIENT_SECRET=
PAYPAL_LIVE_WEBHOOK_ID=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Misaki Shop
SUPPORT_EMAIL=support@example.com
ADMIN_NOTIFY_EMAIL=owner@example.com
```

配置优先级：

- PayPal 后台设置页保存到数据库 `SiteConfig`，优先级高于环境变量。
- 兼容旧变量：`PAYPAL_CLIENT_ID`、`PAYPAL_CLIENT_SECRET`、`PAYPAL_WEBHOOK_ID`。
- 新部署建议按环境分开使用 `PAYPAL_SANDBOX_*` 和 `PAYPAL_LIVE_*`。
- `PAYPAL_ENV=sandbox` 使用 Sandbox 配置，`PAYPAL_ENV=live` 使用 Live 配置。

## 本地开发

安装依赖：

```bash
npm install
```

准备 `.env` 并配置 MySQL：

```bash
cp .env.example .env
```

同步数据库结构：

```bash
npm run db:push
```

初始化默认数据：

```bash
npm run db:seed
```

启动开发服务：

```bash
npm run dev
```

访问地址：

```text
前台：http://localhost:4000
后台：http://localhost:4000/admin
```

默认后台账号来自 `.env`：

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

## 常用命令

```bash
npm run dev              # 开发服务，端口 4000
npm run build            # 生产构建
npm run start            # 启动 standalone 生产服务
npm run db:push          # 同步 Prisma schema 到 MySQL
npm run db:seed          # 写入默认管理员、商品、文章和配置
npm run db:seed:if-empty # 仅数据库为空时写入默认数据
npx tsc --noEmit         # TypeScript 检查
```

## PayPal 配置

在 PayPal Developer Dashboard 创建 REST API App：

- Sandbox Dashboard: https://developer.paypal.com/dashboard/applications/sandbox
- Live Dashboard: https://developer.paypal.com/dashboard/applications/live
- REST API 文档: https://developer.paypal.com/api/rest/

推荐在后台 `/admin/settings` 填写：

- Sandbox Client ID
- Sandbox Client Secret
- Sandbox Webhook ID
- Live Client ID
- Live Client Secret
- Live Webhook ID
- 当前环境：`sandbox` 或 `live`

也可以用 `.env` 配置：

```env
PAYPAL_ENV=sandbox
PAYPAL_SANDBOX_CLIENT_ID=
PAYPAL_SANDBOX_CLIENT_SECRET=
PAYPAL_SANDBOX_WEBHOOK_ID=
```

环境必须匹配。Sandbox 的 Client ID、Secret、Webhook ID 只能配 `sandbox`；Live 的配置只能配 `live`。环境不匹配时，PayPal 通常会返回 `invalid_client` 或 Webhook 签名失败。

## PayPal Webhook

Webhook URL：

```text
https://你的域名/api/paypal/webhook
```

推荐只订阅：

```text
PAYMENT.CAPTURE.COMPLETED
```

当前代码会：

- 保存 Webhook 原始 payload 到 `WebhookEvent`。
- 使用 PayPal `verify-webhook-signature` 校验签名。
- 根据 PayPal Order ID 查找本地订单。
- 校验回传金额、币种和本地订单一致。
- 标记订单为 `paid`，写入 PayPal capture 信息。
- 触发买家邮件和管理员通知邮件。
- 对重复 Webhook 事件返回 `duplicate: true`，避免重复处理。

`CHECKOUT.ORDER.APPROVED` 不会被当成已支付，因为 approved 只代表买家批准，不代表款项已经 capture 成功。

Docker 日志中会打印 Webhook 详细信息：

```text
[paypal-webhook] received
[paypal-webhook] marked-paid
[paypal-webhook] processed
[paypal-webhook] signature-failed
[paypal-webhook] capture-not-applied
[paypal-webhook] duplicate
```

查看日志：

```bash
docker logs -f misakishop
```

## 支付流程

1. 用户在首页选择金额和数量。
2. 前端调用 `/api/checkout/create-order`。
3. 服务端创建本地订单，调用 PayPal Orders API 创建 PayPal 订单。
4. 用户在 PayPal 弹窗完成付款。
5. 前端回调 `/api/checkout/capture-order`，服务端 capture 并校验金额。
6. 如果用户支付后立刻关闭弹窗，PayPal Webhook 会调用 `/api/paypal/webhook` 补全支付状态。
7. 订单变为 `paid` 后发送买家邮件和管理员邮件。

## 后台模块

- `/admin`：订单、收入、文章数量概览。
- `/admin/product`：商品标题、图片、金额选项、自定义金额、数量和详情文案。
- `/admin/upload`：上传商品或浮窗图片，支持 PNG、JPG、WebP、GIF、SVG，最大 5MB。
- `/admin/orders`：订单筛选、分页、导出 CSV、备注列、复制信息。
- `/admin/orders/[id]`：订单详情、内部备注、PayPal 信息、邮件重发、发货单号。
- `/admin/email`：SMTP、买家邮件、管理员邮件、发货邮件模板和测试发送。
- `/admin/settings`：PayPal Sandbox/Live 配置和前台输入项开关。
- `/admin/floating-widget`：首页浮窗链接、图片、大小、位置。
- `/admin/articles`：Markdown 文章管理，公开访问路径为 `/article/[slug]`。

## Docker Compose 部署

`docker-compose.yml` 只启动应用，不包含 MySQL。需要先准备好 MySQL，并在 `.env` 写好 `DATABASE_URL`。

```bash
docker compose up -d --build
```

访问：

```text
http://localhost:4000
```

上传目录挂载：

```text
./uploads -> /app/public/uploads
```

## Docker Run 部署

```bash
docker run -d \
  --name misakishop \
  --restart unless-stopped \
  -p 4000:4000 \
  -e PORT="4000" \
  -e APP_URL="https://你的域名" \
  -e DATABASE_URL="mysql://misaki:password@mysql-host:3306/misaki" \
  -e JWT_SECRET="replace-with-a-long-random-secret" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="admin123456" \
  -e PAYPAL_ENV="sandbox" \
  -e PAYPAL_SANDBOX_CLIENT_ID="your-sandbox-client-id" \
  -e PAYPAL_SANDBOX_CLIENT_SECRET="your-sandbox-client-secret" \
  -e PAYPAL_SANDBOX_WEBHOOK_ID="your-sandbox-webhook-id" \
  -v /opt/misakishop/uploads:/app/public/uploads \
  aoizzz/misakishop:latest
```

Linux 服务器里，容器内的 `localhost` 是应用容器自己，不是宿主机。MySQL 地址应使用实际容器名、同 Docker 网络内服务名、内网 IP 或服务器可访问地址。

## Docker 镜像发布

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

## GitHub 自动发布 Docker 镜像

仓库包含 GitHub Actions 工作流 `.github/workflows/docker-publish.yml`。推送到 `master` 分支时会自动构建 `linux/amd64` 镜像并推送到 Docker Hub：

- `aoizzz/misakishop:latest`
- `aoizzz/misakishop:1.<自动递增编号>`

一般部署使用 `latest` 即可；如果需要指定某次构建，可以在 GitHub Actions 运行记录里看到编号，例如 `1.23`。

首次使用前，在 GitHub 仓库里配置：

1. 打开 `Settings` -> `Secrets and variables` -> `Actions`。
2. 新增 `DOCKERHUB_USERNAME`，值为 Docker Hub 用户名。
3. 新增 `DOCKERHUB_TOKEN`，值为 Docker Hub Access Token，不建议使用账号密码。

也可以在 GitHub 的 `Actions` 页面手动运行 `Docker Publish` 工作流。

当前 Dockerfile 使用 `node:22-alpine`。如果构建环境的 Docker Hub 镜像代理不可用，可以临时换成可访问的官方镜像源构建，但不要把临时文件提交到仓库。

## 数据库初始化和更新

容器启动命令：

```bash
node scripts/db-push-safe.mjs && node prisma/seed-if-empty.mjs && node server.js
```

含义：

- 每次容器启动都会执行 `db push` 同步表结构。
- 只有数据库完全为空时才执行默认数据初始化。
- 已有数据不会因为容器重启被覆盖。

手动同步：

```bash
npm run db:push
```

手动初始化默认数据：

```bash
npm run db:seed
```

## 邮件配置

邮件配置在 `/admin/email`。SMTP 正常后会用于：

- 买家付款成功邮件。
- 管理员新订单通知。
- 发货通知邮件。
- 测试邮件发送。

模板变量包括：

```text
{{orderId}}
{{email}}
{{nickname}}
{{productName}}
{{amount}}
{{quantity}}
{{totalAmount}}
{{currency}}
{{paidAt}}
{{trackingNumber}}
```

如果 SMTP 未配置，订单仍可标记为已支付，但邮件状态会记录为 failed/skipped/disabled，后台订单详情可查看错误并重发。

## 上传文件

默认上传目录：

```text
public/uploads
```

Docker 部署推荐挂载：

```bash
-v /opt/misakishop/uploads:/app/public/uploads
```

上传后的公开路径为：

```text
/uploads/文件名
```

## 常见问题

### PayPal 提示 invalid_client

检查：

- 当前 `PAYPAL_ENV` 是 `sandbox` 还是 `live`。
- Client ID 和 Client Secret 是否来自同一个环境。
- 后台设置页保存的配置是否覆盖了 `.env`。
- 修改 `.env` 后是否重启容器。

### Webhook 签名失败

检查：

- PayPal App 里生成的 Webhook ID 是否填到了当前环境。
- Webhook URL 是否是公网可访问的 `https://你的域名/api/paypal/webhook`。
- Sandbox/Live Webhook ID 是否和 `PAYPAL_ENV` 匹配。
- Docker 日志里是否出现 `[paypal-webhook] signature-failed`。

### 支付后关闭弹窗，本地订单没变 paid

检查：

- PayPal Webhook 是否订阅 `PAYMENT.CAPTURE.COMPLETED`。
- Docker 日志是否收到 `[paypal-webhook] received`。
- 是否出现 `[paypal-webhook] capture-not-applied`，如果有，通常是金额、币种或 PayPal Order ID 不匹配。
- 本地订单是否已经有 `paypalOrderId`。

### Docker 里连不上 MySQL

容器内 `localhost` 不代表宿主机。可以使用：

```env
DATABASE_URL=mysql://misaki:misaki@host.docker.internal:3306/misaki
```

或同网络内 MySQL 容器名：

```env
DATABASE_URL=mysql://misaki:misaki@mysql:3306/misaki
```

1Panel 等环境请使用实际 MySQL 容器名或内网地址。

### 上传图片不显示

检查：

- Docker 是否挂载 `/app/public/uploads`。
- 上传文件是否在容器内存在。
- 页面上使用的路径是否是 `/uploads/文件名`。

### Next build 出现 NFT trace warning

当前构建可能因为上传目录相关文件读取出现 Next.js NFT trace warning。只要 build 成功、standalone 文件正常生成，一般不影响运行。
