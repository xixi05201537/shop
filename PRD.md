# PayPal 单商品页网站 PRD

## 1. 项目概述

### 1.1 产品目标

构建一个支持 Docker 部署的 PayPal 单商品页网站，用于展示唯一一个商品并完成在线付款。网站需要提供前台商品购买体验、PayPal 支付能力、PayPal Webhook 支付状态增强校验、用户信息记忆、购买后邮件通知、后台商品配置、PayPal 配置、订单查看，以及一个可配置的悬浮入口跳转到 Markdown 文章页。

### 1.2 目标用户

- 购买商品的普通访客
- 网站管理员/运营人员

### 1.3 核心价值

- 访客可以快速选择金额、数量并通过 PayPal 或信用卡完成付款
- 管理员可以在后台配置商品、支付参数、邮件参数和订单信息
- 购买成功后自动通知买家和站点管理员
- 支持 Docker 部署，方便迁移和上线

## 2. 范围说明

### 2.1 本期包含

- 单商品首页
- 全站只支持一个商品，不需要多商品扩展
- 固定金额选项：0.1 美元、1 美元、10 美元、30 美元、50 美元
- 数量选择
- 用户邮箱必填，昵称选填
- PayPal Checkout 支付
- PayPal Webhook 支付状态同步
- PayPal 支持信用卡付款入口
- 商品详情简介展示
- 可配置悬浮窗
- 多个 Markdown 文章页
- 后台管理登录
- 后台商品配置，商品图片支持本地上传或 URL
- 后台 PayPal client ID/client secret 配置
- 后台支持邮箱配置
- 后台邮件发送配置，邮件模板支持富文本编辑
- 后台订单列表和订单详情
- 买家购买成功邮件
- 管理员订单通知邮件
- 记住用户邮箱、昵称等信息
- Docker 部署

### 2.2 本期不包含

- 多商品商城，本项目明确只做单商品
- 购物车
- 优惠码
- 会员系统
- 复杂库存管理
- 退款流程自动化
- 物流发货管理
- 多语言
- 多币种，默认美元 USD

## 3. 前台功能需求

### 3.1 首页商品页

首页为左右布局的单商品购买页。

桌面端布局：

- 左侧展示商品图片
- 右侧展示商品标题、商品简介、价格选项、数量选择、用户信息表单和支付按钮

移动端布局：

- 商品图片在上
- 商品信息和支付区域在下
- 所有控件需要适配手机宽度

### 3.2 商品图片

- 商品图片由后台配置
- 支持上传图片或填写图片 URL
- 前台展示主图
- 图片需要有合理的占位状态
- 图片加载失败时展示默认占位图

### 3.3 商品标题

- 商品标题由后台配置
- 首页右侧醒目展示
- 后台为空时前台应展示默认标题或隐藏，具体由实现时确定

### 3.4 商品简介

商品简介分为两部分：

- 首页右侧的短简介
- 商品下方的详细简介

短简介用于快速说明商品内容。详细简介显示在商品购买区域下方，支持 Markdown 或富文本形式，建议后台使用 Markdown 编辑。

### 3.5 金额选项

前台固定展示以下美元金额：

- USD 0.10
- USD 1.00
- USD 10.00
- USD 30.00
- USD 50.00

交互要求：

- 用户必须选择一个金额
- 默认可选中后台配置的默认金额，若未配置则默认 USD 1.00
- 当前选中的金额需要有清晰视觉状态
- 后台可以配置是否启用每个金额选项

### 3.6 数量选择

- 用户可以选择购买数量
- 默认数量为 1
- 最小数量为 1
- 最大数量由后台配置
- 支持加减按钮和手动输入
- 总金额 = 选择金额 * 数量
- 支付按钮附近需要展示最终应付金额

### 3.7 用户信息输入

支付前需要用户填写信息：

- 邮箱：必填
- 昵称：选填

校验要求：

- 邮箱必须符合基本邮箱格式
- 昵称可为空，但若填写则需要去除首尾空格并限制最大长度
- 表单未通过校验时不能创建支付订单

记忆要求：

- 用户成功填写后，将邮箱和昵称保存在浏览器本地
- 用户下次进入网站时自动填充邮箱和昵称
- 本地保存可使用 localStorage 或 cookie
- 前台需要提供清除或修改信息的能力

### 3.8 PayPal 支付入口

前台需要展示 PayPal 官方支付按钮区域，支持：

- 使用 PayPal 账户付款
- 使用信用卡或借记卡付款，具体展示以 PayPal SDK 可用方式为准

支付流程：

1. 用户选择金额和数量
2. 用户填写邮箱，昵称可选填写
3. 用户点击 PayPal 或信用卡付款入口
4. 系统创建 PayPal 订单
5. 用户完成 PayPal 授权和付款
6. 系统确认 PayPal 付款状态
7. 付款成功后生成或更新本地订单
8. 前台展示购买成功状态
9. 系统发送邮件给买家和管理员

### 3.9 支付成功页或成功状态

支付成功后需要展示：

- 购买成功提示
- 订单编号
- 买家邮箱
- 购买金额
- 数量
- 支持邮箱入口

可以采用当前页弹窗/状态区，也可以跳转到独立成功页。建议优先使用独立成功页，便于用户刷新和重新查看。

### 3.10 支持邮箱入口

- 前台需要展示支持邮箱
- 邮箱地址由后台配置
- 用户点击后打开邮件客户端，使用 `mailto:` 链接

## 4. 可配置悬浮窗

### 4.1 悬浮窗目标

网站前台需要一个小型悬浮入口。管理员可以配置是否展示，以及点击后的跳转地址。

### 4.2 悬浮窗展示

- 支持启用/关闭
- 尺寸可配置，建议支持：
  - 小：约 1cm x 1cm
  - 中：约 2cm x 2cm
  - 自定义像素尺寸
- 支持配置显示位置：
  - 右下角
  - 左下角
  - 右侧中部
  - 左侧中部
- 支持配置图标、图片或短文本
- 悬浮窗不应遮挡核心购买按钮
- 移动端需要适配，避免挡住支付区域

### 4.3 悬浮窗跳转

- 点击悬浮窗后跳转到后台配置的 URL
- URL 可以是站内文章页，也可以是外部链接
- 外部链接建议新窗口打开
- 后台需要校验 URL 格式

## 5. Markdown 文章页

### 5.1 页面目标

提供多个用于展示文本信息的文章页，内容由 Markdown 编写。每篇文章使用唯一 slug 访问，悬浮窗可以跳转到任意一个站内文章页或外部 URL。

### 5.2 功能要求

- 支持后台配置文章标题
- 支持后台创建、编辑、发布和下线多篇文章
- 每篇文章需要配置唯一 slug
- 支持后台配置 Markdown 内容
- 前台将 Markdown 渲染为 HTML
- 支持基本 Markdown：
  - 标题
  - 段落
  - 列表
  - 链接
  - 图片
  - 引用
  - 代码块
- 需要防止 XSS，Markdown 渲染后必须做安全过滤
- 页面需要适配移动端

## 6. 后台管理功能

### 6.1 后台登录

- 后台需要登录后访问
- 支持一个管理员账号和密码，不需要多管理员系统
- 初始管理员账号密码通过环境变量配置
- 登录态需要有过期时间
- 未登录访问后台页面时跳转到登录页

### 6.2 商品配置

后台可配置：

- 商品名称
- 商品主图
- 商品主图来源：本地上传或图片 URL
- 商品短简介
- 商品详细简介
- 默认金额选项
- 启用的金额选项
- 默认数量
- 最大购买数量
- 商品是否启用

保存要求：

- 修改后前台立即生效或刷新后生效
- 需要基础表单校验
- 图片字段必须同时支持 URL 和后台本地上传
- 本地上传需要限制文件类型、文件大小，并持久化到 Docker volume

### 6.3 PayPal 配置

后台可配置：

- PayPal client ID
- PayPal client secret
- PayPal 环境：
  - Sandbox
  - Live
- Webhook ID
- Webhook 签名校验配置

安全要求：

- client secret 不应在前台暴露
- 后台展示 client secret 时默认脱敏
- 敏感配置需要存储在服务端
- PayPal Webhook 必须校验来源和签名，不能直接信任请求体

### 6.4 邮件配置

后台可配置：

- SMTP host
- SMTP port
- SMTP username
- SMTP password
- 发件人邮箱
- 发件人名称
- 支持邮箱
- 管理员通知邮箱
- 是否启用买家感谢邮件
- 是否启用管理员通知邮件
- 买家邮件主题
- 买家邮件正文模板
- 管理员邮件主题
- 管理员邮件正文模板
- 邮件模板编辑器类型：富文本编辑器

富文本编辑要求：

- 支持基本排版，如标题、段落、加粗、斜体、链接、列表
- 支持插入模板变量
- 保存前需要对 HTML 做安全过滤
- 邮件发送时需要同时支持 HTML 正文，建议附带纯文本兜底内容

邮件模板变量建议支持：

- `{{orderId}}`
- `{{email}}`
- `{{nickname}}`
- `{{productName}}`
- `{{amount}}`
- `{{quantity}}`
- `{{totalAmount}}`
- `{{currency}}`
- `{{paidAt}}`

### 6.5 悬浮窗配置

后台可配置：

- 是否启用
- 跳转 URL
- 打开方式：当前窗口/新窗口
- 尺寸
- 位置
- 图标、图片或文本

### 6.6 Markdown 文章配置

后台可配置：

- 文章 slug
- 文章标题
- Markdown 内容
- 是否发布

文章数量要求：

- 支持多篇 Markdown 文章
- slug 必须唯一
- 未发布文章不能被前台访问

### 6.7 订单管理

后台需要订单列表和订单详情。

订单列表字段：

- 订单编号
- PayPal 订单 ID
- 商品名称
- 买家邮箱
- 买家昵称
- 单价金额
- 数量
- 总金额
- 币种
- 支付状态
- 创建时间
- 支付完成时间

订单详情字段：

- 本地订单编号
- PayPal 订单 ID
- PayPal capture ID
- 商品名称
- 商品快照
- 买家邮箱
- 买家昵称
- 单价金额
- 数量
- 总金额
- 币种
- 支付状态
- PayPal 原始响应摘要
- 邮件发送状态
- 创建时间
- 更新时间
- 支付完成时间

订单状态建议：

- `created`：已创建，未支付
- `approved`：用户已授权
- `paid`：已付款
- `failed`：支付失败
- `cancelled`：用户取消

后台操作：

- 查看订单详情
- 按邮箱搜索
- 按状态筛选
- 按时间筛选
- 重新发送买家感谢邮件
- 重新发送管理员通知邮件

## 7. 邮件通知需求

### 7.1 买家感谢邮件

触发时机：

- PayPal 支付确认成功后

收件人：

- 买家填写的邮箱

内容：

- 感谢购买
- 商品名称
- 订单编号
- 购买数量
- 支付金额
- 支持邮箱

### 7.2 管理员通知邮件

触发时机：

- PayPal 支付确认成功后

收件人：

- 后台配置的管理员通知邮箱

内容：

- 有新订单
- 买家邮箱
- 买家昵称
- 商品名称
- 购买数量
- 支付金额
- PayPal 订单 ID
- 本地订单编号

### 7.3 发送失败处理

- 邮件发送失败不应影响支付成功状态
- 订单详情中需要记录邮件发送状态
- 后台支持重新发送
- 服务端需要记录错误日志

## 8. 数据需求

### 8.1 商品配置数据

建议字段：

- `id`
- `name`
- `imageUrl`
- `imageSource`
- `uploadedImagePath`
- `shortDescription`
- `longDescriptionMarkdown`
- `enabledAmounts`
- `defaultAmount`
- `defaultQuantity`
- `maxQuantity`
- `isActive`
- `createdAt`
- `updatedAt`

### 8.2 订单数据

建议字段：

- `id`
- `orderNumber`
- `paypalOrderId`
- `paypalCaptureId`
- `productNameSnapshot`
- `productImageSnapshot`
- `buyerEmail`
- `buyerNickname`
- `unitAmount`
- `quantity`
- `totalAmount`
- `currency`
- `status`
- `paypalRawSummary`
- `buyerEmailStatus`
- `adminEmailStatus`
- `createdAt`
- `updatedAt`
- `paidAt`

### 8.3 系统配置数据

建议分类：

- PayPal 配置
- SMTP 邮件配置
- 支持邮箱配置
- 悬浮窗配置
- Markdown 文章配置，支持多篇文章
- 单管理员账号配置

## 9. 非功能需求

### 9.1 安全

- PayPal client secret 只能在服务端使用
- 后台必须鉴权
- 管理员密码需要哈希存储
- Markdown 内容渲染需要防 XSS
- 富文本邮件模板需要做 HTML 安全过滤
- 所有表单输入需要校验
- 支付金额必须由服务端根据配置和用户选择重新计算，不能信任前端传入总价
- PayPal 支付完成后必须由服务端调用 PayPal API 确认
- PayPal Webhook 请求必须验证签名，并与本地订单、金额、币种进行匹配
- 敏感配置在日志中需要脱敏

### 9.2 性能

- 首页首屏应快速加载
- 商品图片需要合理压缩
- 后台订单列表需要分页
- 邮件发送可同步处理，若后续订单量增加可升级为队列

### 9.3 可用性

- 前台需要移动端适配
- 支付失败、取消、网络错误都需要有明确提示
- 后台表单保存成功或失败需要提示
- 邮件配置建议提供测试发送功能
- 富文本邮件模板编辑器需要提供预览功能

### 9.4 可维护性

- 支持通过环境变量初始化关键配置
- 支持 Docker 一键启动
- 配置和订单数据需要持久化
- 日志需要能追踪支付和邮件问题

## 10. Docker 部署需求

### 10.1 部署目标

项目需要支持 Docker 部署，管理员可以通过 Docker 或 Docker Compose 启动完整服务。

### 10.2 Docker Compose 建议服务

- Web 应用服务
- MySQL 数据库服务

MySQL 要求：

- 使用 Docker volume 持久化 `/var/lib/mysql`
- 需要配置数据库名、用户名和密码
- 需要在重启容器后保留商品配置、系统配置、文章和订单数据

### 10.3 环境变量

建议支持：

- `APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `DATABASE_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`
- `SUPPORT_EMAIL`
- `ADMIN_NOTIFY_EMAIL`
- `PAYPAL_WEBHOOK_ID`

### 10.4 持久化

需要持久化：

- 数据库数据
- 上传的商品图片
- 应用日志，按实现选择

## 11. 页面清单

### 11.1 前台页面

- `/`：单商品购买页
- `/success/:orderId`：支付成功页
- `/article/:slug`：Markdown 文章页

### 11.2 后台页面

- `/admin/login`：后台登录
- `/admin`：后台概览
- `/admin/product`：商品配置
- `/admin/orders`：订单列表
- `/admin/orders/:id`：订单详情
- `/admin/paypal`：PayPal 配置
- `/admin/email`：邮件配置
- `/admin/floating-widget`：悬浮窗配置
- `/admin/articles`：文章配置

## 12. API 需求建议

### 12.1 前台 API

- `GET /api/public/product`：获取商品配置
- `GET /api/public/config`：获取公开配置，如支持邮箱、PayPal client ID、悬浮窗配置
- `GET /api/public/articles/:slug`：获取文章内容
- `POST /api/checkout/create-order`：创建 PayPal 订单
- `POST /api/checkout/capture-order`：确认并捕获 PayPal 订单
- `POST /api/paypal/webhook`：接收并校验 PayPal Webhook

### 12.2 后台 API

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/product`
- `PUT /api/admin/product`
- `POST /api/admin/product/image`：上传商品图片
- `GET /api/admin/orders`
- `GET /api/admin/orders/:id`
- `POST /api/admin/orders/:id/resend-buyer-email`
- `POST /api/admin/orders/:id/resend-admin-email`
- `GET /api/admin/paypal`
- `PUT /api/admin/paypal`
- `GET /api/admin/email`
- `PUT /api/admin/email`
- `POST /api/admin/email/test`
- `GET /api/admin/floating-widget`
- `PUT /api/admin/floating-widget`
- `GET /api/admin/articles`
- `POST /api/admin/articles`
- `PUT /api/admin/articles/:id`
- `DELETE /api/admin/articles/:id`

## 13. 支付流程细节

### 13.1 创建订单

服务端接收：

- 选择金额
- 数量
- 邮箱
- 昵称

服务端处理：

- 校验金额是否在启用金额选项中
- 校验数量范围
- 校验邮箱格式
- 根据服务端配置计算总价
- 创建本地订单，状态为 `created`
- 调用 PayPal 创建订单
- 保存 PayPal 订单 ID
- 返回 PayPal 订单 ID 给前台

### 13.2 捕获订单

服务端接收：

- PayPal 订单 ID
- 本地订单 ID 或订单编号

服务端处理：

- 调用 PayPal capture API
- 确认支付状态和金额
- 更新本地订单状态为 `paid`
- 记录 capture ID 和支付时间
- 发送买家感谢邮件
- 发送管理员通知邮件
- 返回成功结果

### 13.3 Webhook 状态同步

PayPal Webhook 用于增强支付状态可靠性，尤其处理用户付款成功后关闭页面、前端回调失败、网络中断等情况。

服务端处理：

- 接收 PayPal Webhook 请求
- 使用 PayPal Webhook ID 校验事件签名
- 根据 PayPal 订单 ID 或 capture ID 查找本地订单
- 校验金额、币种和订单状态
- 对已支付订单保持幂等，不重复扣款或重复创建订单
- 若订单尚未标记为已支付，但 Webhook 确认为支付成功，则更新为 `paid`
- 若邮件尚未发送成功，则触发买家感谢邮件和管理员通知邮件
- 记录 Webhook 事件摘要和处理结果

幂等要求：

- 同一个 PayPal Webhook 事件多次到达时只能处理一次核心状态变更
- 邮件发送需要根据订单邮件状态避免重复发送，后台手动重发除外

## 14. 验收标准

### 14.1 前台验收

- 用户可以打开首页看到商品图片、标题、简介、金额选项、数量选择和支付入口
- 用户不填写邮箱时无法付款
- 用户选择金额和数量后，总价计算正确
- 用户完成 PayPal sandbox 支付后，看到成功提示或成功页
- 用户刷新或下次访问时，邮箱和昵称自动填充
- 支持邮箱点击后能打开邮件客户端
- 悬浮窗启用后显示，点击可跳转指定 URL
- 多个 Markdown 文章页能通过不同 slug 正常渲染内容

### 14.2 后台验收

- 管理员可以登录后台
- 管理员可以配置商品图片，且图片支持本地上传和 URL
- 管理员可以配置商品名称、简介、金额选项、数量限制
- 管理员可以配置 PayPal client ID/client secret、环境和 Webhook ID
- 管理员可以配置支持邮箱和邮件 SMTP 参数
- 管理员可以使用富文本编辑器配置邮件模板
- 管理员可以配置悬浮窗和多篇 Markdown 文章
- 管理员可以查看订单列表和订单详情
- 管理员可以看到买家邮箱、昵称、商品、数量、金额和付款状态
- 管理员可以重新发送邮件

### 14.3 邮件验收

- 买家付款成功后收到感谢邮件
- 管理员通知邮箱收到新订单邮件
- 邮件失败时订单仍保持支付成功，并记录失败状态
- 邮件模板可通过富文本编辑器保存和预览
- PayPal Webhook 能在前端回调失败时同步订单支付成功状态

### 14.4 部署验收

- 项目可以通过 Docker 构建
- 项目可以通过 Docker Compose 启动
- 重启容器后配置和订单数据不丢失
- 重启容器后上传的商品图片不丢失
- 环境变量可以初始化管理员账号和基础配置

## 15. 推荐技术实现方向

该 PRD 不强制具体技术栈，但推荐以下轻量实现：

- 前端/后端：Next.js 或 Remix
- 数据库：MySQL
- ORM：Prisma
- 支付：PayPal JS SDK + PayPal Orders API + PayPal Webhook
- 邮件：Nodemailer
- Markdown：react-markdown + rehype-sanitize
- 富文本邮件模板：TipTap、Lexical 或 Quill
- 部署：Docker + Docker Compose

## 16. 已确认产品决策

- 商品一定只有一个，本期不做多商品扩展
- 商品图片需要支持后台本地上传和图片 URL
- 昵称不强制必填，邮箱必填
- Markdown 文章支持多篇，通过 slug 访问
- 需要 PayPal Webhook 来增强支付状态可靠性
- 数据库使用 MySQL
- 后台只需要一个管理员账号
- 邮件模板需要富文本编辑器

## 17. 后续待确认问题

- PayPal Live 上线前使用哪个正式收款账户 :可配置
- 商品图片上传大小限制具体设置为多少，建议默认 5MB：5MB
- 邮件模板富文本编辑器最终选型：你自己定
- 是否需要后台上传图片裁剪功能：不需要
- 是否需要订单导出 CSV:不需要
