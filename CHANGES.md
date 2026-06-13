# 改动清单

> 本次为安全加固、部署稳定性与代码质量整理。所有验证已通过：
> - `npx prisma validate` ✅
> - `npx prisma migrate status` ✅
> - `npx tsc --noEmit` ✅
> - `npm run lint` ✅（0 errors，25 warnings 均为 `<img>` 性能提示）
> - `npm run build` ✅（无 warning）

---

## 1. 认证与访问控制

| 文件 | 改动 |
|------|------|
| `proxy.ts` | 重命名并导出 `proxy` 函数；Admin 页面/API 未登录时重定向或返回 401。 |
| `app/admin/layout.tsx` | 未认证用户跳转 `/admin/login`。 |
| `app/api/admin/login/route.ts` | JWT_SECRET 强制 ≥32 位；cookie SameSite=strict；增加时延均衡与登录限流。 |
| `lib/session.ts` | 管理员会话管理。 |

## 2. 部署与配置安全

| 文件 | 改动 |
|------|------|
| `Dockerfile` | 启动改为 `node scripts/migrate-deploy.mjs && node prisma/seed-if-empty.mjs && node server.js`；healthcheck 指向 `/api/health`；runner 阶段复制 `scripts` 目录。 |
| `docker-compose.yml` | healthcheck 指向 `/api/health`。 |
| `scripts/migrate-deploy.mjs` | 新增：无迁移历史的现有库自动 baseline 后执行 `prisma migrate deploy`。 |
| `scripts/start.mjs` | 使用 dotenv 加载环境变量。 |
| `next.config.mjs` | 收紧图片远程域名；增加安全响应头（CSP、X-Frame-Options 等）。 |
| `package.json` | `lint` 脚本改为 `eslint . --ext .ts,.tsx,.mjs,.js`。 |
| `.env.example` | 清理示例配置，移除 `UPLOAD_DIR`。 |

## 3. 核心支付与前端可靠性

| 文件 | 改动 |
|------|------|
| `components/SubmitButton.tsx` | 修复提交后按钮永久 loading；增加 optimistic loading 状态并在 action 结束后重置。 |
| `lib/use-paypal-buttons.ts` | 新增 PayPal SDK 加载/渲染 Hook，带重试与卸载清理。 |
| `components/Storefront.tsx` | 使用该 Hook；数量输入简化；买家信息懒加载初始化。 |
| `app/pay/[token]/PaymentRequestClient.tsx` | 使用该 Hook。 |
| `app/select/checkout/[token]/page.tsx` | 使用该 Hook。 |
| `app/admin/payment-requests/PaymentRequestFormDialog.tsx` | `AmountTagEditor` 逗号解析修复；图片选项状态派生替代 effect 同步。 |
| `components/FloatingWidget.tsx` | URL 校验加强。 |

## 4. 后端安全与输入校验

| 文件 | 改动 |
|------|------|
| `lib/redirect.ts` | 不再信任 `X-Forwarded-*` 头；增加 `safeReturnTo` 防止开放重定向。 |
| `app/api/admin/product/image/route.ts` | 拒绝 SVG；按 MIME 推导扩展名。 |
| `lib/uploads.ts` | 上传目录固定为 `public/uploads`；避免 `process.env.UPLOAD_DIR` 动态路径导致 Turbopack 全项目追踪。 |
| `lib/selection-excel.ts` | 验证上传路径；阻止内网 IP 请求；使用本地 `UPLOAD_DIR` 常量。 |
| `lib/admin-save.ts` | 校验金额、端口、PayPal 环境、slug。 |
| `app/admin/email/page.tsx` | 过滤敏感配置字段。 |

## 5. 数据一致性与并发

| 文件 | 改动 |
|------|------|
| `lib/order-service.ts` | `markOrderPaid` 使用事务；金额比较改为容差比较。 |
| `app/api/checkout/capture-order/route.ts` | 容差比较。 |
| `app/api/paypal/webhook/route.ts` | webhook 去重原子化；保留 `paidAt`；金额容差比较。 |
| `lib/audit-log.ts` | 移除 raw-SQL 兜底。 |

## 6. Schema 与数据库加固

| 文件 | 改动 |
|------|------|
| `prisma/schema.prisma` | 状态字段改为 enum；增加索引；`Product` 移除 `@@unique([isActive])`；`SelectionSubmissionItem.item` 恢复 `onDelete: SetNull`；`AuditLog` 增加 `updatedAt`。 |
| `prisma/migrations/20240613000000_init/migration.sql` | 初始迁移。 |
| `prisma/migrations/20240613000001_schema_hardening/migration.sql` | 状态值规范化、enum 约束、`AuditLog.updatedAt`、索引；移除 MySQL 不支持的 `IF EXISTS` 语法与多余的外键变更。 |

## 7. 前端细节与无障碍

| 文件 | 改动 |
|------|------|
| `app/layout.tsx` | `<html lang="zh-CN">`。 |
| `components/CopyLinkButton.tsx`、`components/CopyVariableButton.tsx` | 复制失败给出反馈。 |
| 多处 admin 页面 | 移除硬编码邮箱；使用公开配置文本。 |

## 8. 清理与最终验证

| 文件 | 改动 |
|------|------|
| `eslint.config.mjs` | 重写为有效 flat config；忽略构建产物、迁移文件等。 |
| 多个组件 | 修复 `setState in effect`、hook 命名、无用 import 等 lint error。 |
| `lib/order-filters.ts` | `$Enums` 改为字符串 + 类型导入；使用本地常量数组校验状态。 |
| `app/admin/page.tsx`、`lib/email.ts`、相关 API 路由 | `$Enums.Xxx.yyy` 全部改为字符串字面量，避免运行时 `undefined`。 |
| `app/api/health/route.ts` | 新增公开 `GET /api/health`，用于 Docker 探活。 |
| `.gitignore` | 增加 `*.tsbuildinfo`、`.tmp*/`、`*.log`。 |
| `dev-server.log`、`next-start.err.log`、`next-start.out.log`、`tsconfig.tsbuildinfo` | 从 Git 索引移除（`git rm --cached`）。 |
| `README.md`、`PRD.md`、`app/admin/upload/page.tsx` | 移除 `UPLOAD_DIR` 相关说明。 |

---

## 9. 复核后补充修复

| 文件 | 改动 |
|------|------|
| `app/api/admin/login/route.ts` | 限流 key 在无 `x-forwarded-for` 时回退到登录邮箱，避免所有未代理客户端共享一个桶。 |
| `app/api/paypal/webhook/route.ts` | webhook 去重改为原子 `updateMany` 抢占，避免并发重复处理。 |
| `app/admin/upload/page.tsx`、`app/admin/selection-pages/SelectionItemForm.tsx` | 移除 SVG 支持文案与 `accept` 属性，和后端校验保持一致。 |
| `lib/selection-checkout.ts`、`app/select/checkout/[token]/page.tsx` | `SelectionCheckoutStatus` 统一为英式拼写 `cancelled`；同步 CSS 与前端标签。 |
| `lib/order-filters.ts` | 移除 `_page` 占位变量，消除 lint warning。 |
| `prisma/seed.mjs` | 导出 `seedAdmin`/`seedAll` 等函数；被 import 时不再无条件执行 `main()`，避免副作用。新增 `seedAll()` 统一初始化。 |
| `prisma/seed-if-empty.mjs` | 空库时调用 `seedAll()` 而非仅 import `seed.mjs`。 |
| `lib/auth.ts`、`app/api/checkout/create-order/route.ts` | 规范化混用 CRLF/LF 的行尾。 |
| 新增文件 | 已 `git add`：`CHANGES.md`、`app/api/health/route.ts`、`eslint.config.mjs`、`lib/upload-security.ts`、`lib/use-paypal-buttons.ts`、`prisma/migrations/`、`scripts/migrate-deploy.mjs`。 |

---

## 仍保留的 warning（不影响构建/上线）

- 25 条 `@next/next/no-img-element`：建议使用 Next.js `<Image />`，当前使用原生 `<img>` 出于简单和外部图片域名不确定。

## 上线前 checklist

1. 备份 MySQL 数据库。
2. 在 staging/测试环境用生产数据副本执行一次 `docker-compose up -d --build`。
3. 确认 `prisma migrate deploy` 成功且应用功能正常。
4. 如需删除/重命名字段，务必先确认数据已迁移或备份。
