# ModelZone 独立站开发交接文档

> 版本: 1.0 | 日期: 2026-04-30
> 作者: AI 开发助手 (基于完整代码审计和部署实操)
>
> 本文档面向后续接手的开发者或 AI 开发助手。目标是让你在不问任何人的情况下，
> 完全理解项目现状、知道哪些能用哪些有问题、以及下一步该做什么。

---

## 一、项目是什么

ModelZone 是一个跨境电商独立站，卖一款叫 Wind Chaser 64（追风者 64）的桌面风洞，
目标客户是海外的 1:64 车模爱好者。网站需要实现完整的「浏览商品 → 下单 → 付款 →
发货 → 售后」交易闭环。

这不是用 Shopify 建的，是完全自研的前后端分离架构。

## 二、技术栈一句话总结

pnpm monorepo，三个包：

- `frontend`：Next.js 14 + Tailwind + Radix UI，部署在 Vercel
- `backend`：Express + Socket.io + Mongoose，部署在 Render (Docker)
- `shared`：Zod schemas + TypeScript 类型，前后端共享

数据库 MongoDB Atlas 免费集群，支付用 PayPal REST API v2。

## 三、线上地址

| 什么     | 地址                                          | 状态       |
| -------- | --------------------------------------------- | ---------- |
| 前端主站 | https://www.modelzone.cc                      | ✅ 在线    |
| 后端 API | https://modelzone-api.onrender.com            | ✅ 在线    |
| 健康检查 | https://modelzone-api.onrender.com/api/health | ✅ 返回 ok |
| GitHub   | https://github.com/SunnyKlara/mojingweb       | main 分支  |

## 四、现状评估：做到了哪里

用独立站的标准来评估，一个能正式运营的跨境电商独立站需要以下模块。
打 ✅ 的是已完成的，打 ⚠️ 的是做了但有问题的，打 ❌ 的是还没做的。

### 4.1 品牌展示层

| 功能          | 状态 | 说明                                                         |
| ------------- | ---- | ------------------------------------------------------------ |
| 首页品牌展示  | ✅   | Hero、产品海报、规格参数、包装清单、保修、FAQ、CTA，完成度高 |
| 多语言 (i18n) | ✅   | 中英双语，next-intl，messages/en.json + zh.json              |
| SEO 基础      | ✅   | JSON-LD 结构化数据、Open Graph、sitemap、robots.txt          |
| 博客/案例     | ✅   | /blog、/cases，MDX 内容，已有文章                            |
| 响应式设计    | ✅   | Tailwind 响应式，移动端适配                                  |
| 暗色主题      | ✅   | next-themes，默认暗色                                        |

**评价**：品牌展示层完成度 90%，质量不错。

### 4.2 交易闭环层

| 功能             | 状态 | 说明                                                      |
| ---------------- | ---- | --------------------------------------------------------- |
| 商品数据模型     | ✅   | Product model，多语言名称，变体(SKU/库存)，美分价格       |
| 商品 API         | ✅   | GET /api/products (公开)，CRUD /api/admin/products (管理) |
| 商品管理后台页面 | ❌   | 后端 API 有了，前端 /admin/products 页面没做              |
| 结算页           | ⚠️   | 页面做了，但商品数据硬编码在前端，不从 API 获取           |
| PayPal 支付创建  | ✅   | POST /api/orders → 创建订单 + PayPal checkout             |
| PayPal 支付捕获  | ✅   | POST /api/orders/payments/paypal/capture                  |
| PayPal 退款      | ✅   | PATCH /api/admin/orders/:id/refund                        |
| PayPal Webhook   | ❌   | verifyWebhookSignature() 写好了，路由没创建               |
| 订单数据模型     | ✅   | Order model，商品快照冻结，状态机，完整                   |
| 订单管理后台     | ✅   | 列表、详情、发货操作、退款操作、支付事件时间线            |
| 订单查询 (买家)  | ✅   | GET /api/orders/lookup，邮箱+订单号                       |
| 订单查询页面     | ✅   | /order-lookup 页面                                        |
| 库存管理         | ✅   | 原子扣减 (findOneAndUpdate + $elemMatch)                  |
| 运费计算         | ⚠️   | 固定运费表做了，但数字是占位值不是真实报价                |
| 订单超时清理     | ✅   | 每 5 分钟清理 30 分钟未付款订单                           |
| 支付事件日志     | ✅   | PaymentEvent model，保留 PayPal 原始响应                  |

**评价**：交易闭环的后端逻辑完成度 85%，前端完成度 70%。核心支付流程能跑通
（本地 Sandbox 已验证），但线上还有环境变量问题待修。

### 4.3 通知层

| 功能             | 状态 | 说明                                      |
| ---------------- | ---- | ----------------------------------------- |
| 邮件基础设施     | ✅   | Nodemailer + SMTP，mailer.service.ts 已有 |
| 新 Lead 邮件通知 | ✅   | 表单提交后通知管理员                      |
| 新消息邮件通知   | ✅   | 客服聊天新消息通知                        |
| 订单确认邮件     | ❌   | 代码里有 TODO 标记，模板没写              |
| 发货通知邮件     | ❌   | 代码里有 TODO 标记，模板没写              |
| 退款通知邮件     | ❌   | 代码里有 TODO 标记，模板没写              |
| SMTP 配置        | ❌   | Render 环境变量里 SMTP 相关全部留空       |

**评价**：通知层完成度 30%。基础设施有了，但交易相关的三个关键邮件都没做。
这是上线前必须补的——买家付了钱没收到确认邮件，会直接发起 PayPal 纠纷。

### 4.4 客服层

| 功能                 | 状态 | 说明                                                |
| -------------------- | ---- | --------------------------------------------------- |
| 实时聊天 (Socket.io) | ✅   | 访客/管理员双向通信，打字指示器，已读回执           |
| 聊天管理后台         | ✅   | 会话列表、消息历史、快捷回复、声音提醒              |
| ChatWidget 组件      | ⚠️   | 代码完整，但首页注释掉了（需要后端 Socket.io 部署） |

**评价**：客服层完成度 90%，但线上没启用（ChatWidget 被注释了）。
需要确认 Render 的 WebSocket 支持后再启用。

### 4.5 安全层

| 功能              | 状态 | 说明                                          |
| ----------------- | ---- | --------------------------------------------- |
| CSRF 防护         | ✅   | 双提交 Cookie，公开端点豁免                   |
| JWT 认证          | ✅   | 双 token (access 15min + refresh 7d httpOnly) |
| JWT 密钥隔离      | ✅   | visitor 和 admin 用不同密钥                   |
| Token 吊销        | ✅   | tokenVersion 校验                             |
| 输入校验          | ✅   | Zod 全链路 (body + params + query)            |
| 速率限制          | ✅   | 全局 300/min，登录 5/min，下单 10/min         |
| Helmet 安全头     | ✅   | HSTS、X-Frame-Options、nosniff 等             |
| CSP               | ✅   | 生产环境启用                                  |
| NoSQL 注入防护    | ✅   | 查询参数白名单                                |
| 审计日志          | ✅   | 所有关键操作记录                              |
| 日志脱敏          | ✅   | authorization、cookie、password、token        |
| 错误监控 (Sentry) | ❌   | 代码集成了，但 DSN 没配，线上不工作           |
| PayPal 金额验证   | ✅   | capture 时比对金额                            |
| PCI DSS           | ✅   | 不接触卡信息，SAQ-A 级别                      |

**评价**：安全层完成度 90%，在自研独立站里算很好了。唯一缺的是 Sentry 没配。

### 4.6 运维层

| 功能         | 状态 | 说明                                                     |
| ------------ | ---- | -------------------------------------------------------- |
| Docker 化    | ✅   | Dockerfile.api，tsx 全局安装直接运行 TS                  |
| CI/CD        | ⚠️   | Husky + lint-staged 本地有，GitHub Actions CI 有但会失败 |
| 自动部署     | ✅   | Render autoDeploy + Vercel auto deploy                   |
| 域名 + HTTPS | ✅   | modelzone.cc → Vercel，自动 SSL                          |
| 冷启动防护   | ❌   | Render 免费套餐 15 分钟休眠，没配 UptimeRobot            |
| 数据库备份   | ❌   | Atlas M0 免费版没有自动备份                              |
| 日志聚合     | ❌   | 只有 Render 内置日志，保留时间短                         |

**评价**：运维层完成度 60%。能跑，但不够稳。

### 4.7 合规层

| 功能            | 状态 | 说明                                           |
| --------------- | ---- | ---------------------------------------------- |
| 隐私政策页面    | ❌   | PayPal 审核和 GDPR 都需要                      |
| 服务条款页面    | ❌   | 跨境电商法律要求                               |
| Cookie 同意横幅 | ❌   | GDPR 要求（欧洲买家）                          |
| 退换货政策页面  | ⚠️   | 首页有提到 180 天质保/7 天退货，但没有独立页面 |

**评价**：合规层完成度 20%。正式收款前必须补。

## 五、已知 Bug 和问题清单

每个问题都标注了：严重程度、影响范围、根因、修复方案。

### BUG-001：线上结算页请求发到 localhost:4000（阻塞）

- **严重程度**：P0 — 线上交易完全不可用
- **影响**：买家点 PayPal 按钮报 "Failed to fetch"
- **根因**：Vercel 环境变量 `NEXT_PUBLIC_BACKEND_URL` 添加时选了 Preview 环境，
  不是 Production。且 `NEXT_PUBLIC_` 变量是构建时注入的，添加后没有重新构建。
- **修复方案**：
  1. Vercel → Settings → Environment Variables
  2. 编辑 `NEXT_PUBLIC_BACKEND_URL`，确认 Environments 包含 **Production**
  3. 值为 `https://modelzone-api.onrender.com`
  4. Deployments → 最新部署 → Redeploy（取消 Use existing Build Cache）
- **验证**：F12 Console 看请求 URL 是否指向 modelzone-api.onrender.com
- **状态**：已触发 Redeploy，等待确认

### BUG-002：结算页商品价格硬编码（中等）

- **严重程度**：P1 — 改价格要改代码
- **影响**：前端显示的价格可能和后端数据库不一致
- **根因**：`checkout/page.tsx` 第 80 行 `price: 29900` 写死，`buy.tsx` 第 23 行
  `PRICE_CENTS = 29900` 写死
- **修复方案**：
  1. 结算页 `useEffect` 里调 `GET /api/products/wind-chaser-64` 获取商品数据
  2. 用 API 返回的 price、variants、images 替换硬编码值
  3. Buy 组件同理，或者用 React Context 共享商品数据
- **涉及文件**：
  - `frontend/app/[locale]/checkout/page.tsx`
  - `frontend/components/site/buy.tsx`

### BUG-003：线上数据库没有商品数据（阻塞）

- **严重程度**：P0 — 下单会返回 "Product not found for SKU"
- **影响**：即使 BUG-001 修好了，下单也会失败
- **根因**：Atlas 数据库是新建的，没有 seed 商品数据
- **修复方案**：通过 API 创建商品（需要先登录拿 admin token）
- **具体命令**：见 docs/PROGRESS-REPORT.md 第 4.2 节

### BUG-004：结算页金额缺少 $ 符号（低）

- **严重程度**：P2 — 显示问题
- **影响**：订单摘要里金额显示为 `299.00` 而不是 `$299.00`
- **根因**：`checkout/page.tsx` 的 `cents()` 函数返回值没有加 `$` 前缀
- **修复方案**：改 `cents()` 函数，加 `$` 前缀
- **注意**：PayPal 按钮上的金额是正确的（有 $），只是摘要区域缺

### BUG-005：支付成功页刷新报错（已修复）

- **严重程度**：P2 — 已修复
- **影响**：刷新 /checkout/success 页面会显示 PayPal 原始错误
- **根因**：重复 capture 同一笔订单，PayPal 返回 ORDER_ALREADY_CAPTURED
- **修复**：success 页面现在检测 "ALREADY_CAPTURED" 关键词，显示成功而非错误
- **状态**：✅ 已修复

### BUG-006：GitHub Actions CI 失败（低）

- **严重程度**：P3 — 不影响部署
- **影响**：GitHub 发失败邮件，但 Render 和 Vercel 的部署不受影响
- **根因**：CI 配置可能引用了旧的依赖或脚本
- **修复方案**：检查 `.github/workflows/` 下的 CI 配置，更新或禁用

### BUG-007：本地开发 Node 版本不兼容（低）

- **严重程度**：P3 — 只影响本地开发
- **影响**：本地 Node 24，Next.js 14 不兼容，前端 dev server 无法启动
- **根因**：Node 24 的 ESM 模块解析变了
- **修复方案**：安装 nvm-windows，用 Node 20 开发
- **线上不受影响**：Render Docker 用 Node 22，Vercel 自动选版本

## 六、未完成功能详细清单

每个功能都标注了：优先级、预估工时、依赖关系、涉及文件、实现要点。

### FEAT-001：订单确认邮件（P1，2 小时）

- **依赖**：SMTP 配置（Render 环境变量）
- **涉及文件**：`backend/src/services/mailer.service.ts`，
  `backend/src/routes/order.routes.ts`（capture 成功后的 TODO 位置）
- **实现要点**：
  1. 在 mailer.service.ts 新增 `notifyOrderConfirmed(order)` 函数
  2. HTML 邮件模板包含：订单号、商品名/SKU/数量/单价、小计/运费/总计、
     收货地址、预计配送时间、订单查询链接
  3. 根据 `order.locale` 选择中文或英文模板
  4. 在 order.routes.ts 的 capture 成功后调用（fire-and-forget）
  5. 收件人：`order.email`

### FEAT-002：发货通知邮件（P1，1 小时）

- **依赖**：FEAT-001 的邮件基础
- **涉及文件**：`backend/src/services/mailer.service.ts`，
  `backend/src/routes/admin-order.routes.ts`（ship 后的 TODO 位置）
- **实现要点**：
  1. 新增 `notifyOrderShipped(order)` 函数
  2. 包含：订单号、物流商、单号、查询链接、预计送达时间
  3. 在 admin-order.routes.ts 的 ship 操作后调用

### FEAT-003：退款通知邮件（P2，1 小时）

- **依赖**：FEAT-001 的邮件基础
- **涉及文件**：同上
- **实现要点**：
  1. 新增 `notifyOrderRefunded(order, amount)` 函数
  2. 包含：订单号、退款金额、退款方式、预计到账时间

### FEAT-004：PayPal Webhook 端点（P1，3 小时）

- **依赖**：PayPal Developer Dashboard 配置 webhook URL
- **涉及文件**：新建 `backend/src/routes/webhook.routes.ts`，
  修改 `backend/src/server.ts` 挂载路由
- **实现要点**：
  1. `POST /api/payments/paypal/webhook`
  2. 用 `express.raw()` 中间件获取原始 body（签名验证需要）
  3. 调用 `verifyWebhookSignature()` 验证签名
  4. 处理事件类型：
     - `PAYMENT.CAPTURE.COMPLETED`：如果订单还是 pending_payment，执行 capture 逻辑
     - `PAYMENT.CAPTURE.REFUNDED`：更新订单状态为 refunded
     - `CUSTOMER.DISPUTE.CREATED`：记录 PaymentEvent (event: disputed)
  5. 幂等处理：通过 PaymentEvent 的 providerId 去重
  6. CSRF 豁免（已在豁免列表里）
  7. 在 Render 环境变量添加 `PAYPAL_WEBHOOK_ID`

### FEAT-005：管理后台商品管理页面（P2，4 小时）

- **依赖**：无（后端 API 已完成）
- **涉及文件**：新建 `frontend/app/(admin)/admin/products/page.tsx`
- **实现要点**：
  1. 商品列表（状态过滤、搜索）
  2. 创建商品表单（名称、价格、变体、图片、规格）
  3. 编辑商品（内联编辑或弹窗）
  4. 库存调整
  5. 归档/激活切换
  6. 复用现有 admin 认证和 UI 组件

### FEAT-006：结算页从 API 获取商品数据（P1，2 小时）

- **依赖**：BUG-003 修复（数据库有商品数据）
- **涉及文件**：`frontend/app/[locale]/checkout/page.tsx`
- **实现要点**：
  1. 页面加载时 `useEffect` 调 `GET /api/products/wind-chaser-64`
  2. 用 API 返回的 price、variants、name 替换硬编码
  3. 加 loading 状态和错误处理
  4. SKU 不存在时显示错误提示
  5. 同步更新 `buy.tsx` 组件

### FEAT-007：管理后台统一导航（P2，3 小时）

- **涉及文件**：`frontend/app/(admin)/layout.tsx`，新建侧边栏组件
- **实现要点**：
  1. 创建 `AdminSidebar` 组件
  2. 导航项：客服聊天、订单管理、商品管理、Lead 管理、设置
  3. 当前页面高亮
  4. 移动端折叠菜单
  5. 在 admin layout 中引入

### FEAT-008：隐私政策 + 服务条款页面（P2，2 小时）

- **涉及文件**：新建 `frontend/app/[locale]/privacy/page.tsx`，
  `frontend/app/[locale]/terms/page.tsx`
- **实现要点**：
  1. 静态页面，MDX 或纯 JSX
  2. 内容需要覆盖：数据收集范围、使用目的、保留期限、第三方共享（PayPal）、
     用户权利（GDPR）、联系方式
  3. 中英双语
  4. Footer 里添加链接

### FEAT-009：UptimeRobot 防冷启动（P0，10 分钟）

- **依赖**：无
- **实现要点**：
  1. 注册 https://uptimerobot.com（免费）
  2. 添加 HTTP(s) 监控
  3. URL：`https://modelzone-api.onrender.com/api/health`
  4. 间隔：5 分钟
  5. 这样 Render 免费实例永远不会休眠

### FEAT-010：Sentry 错误监控（P1，30 分钟）

- **依赖**：Sentry 账号
- **实现要点**：
  1. 注册 https://sentry.io（免费 5k errors/month）
  2. 创建两个项目：modelzone-frontend、modelzone-backend
  3. 获取 DSN
  4. 后端：Render 环境变量添加 `SENTRY_DSN`
  5. 前端：Vercel 环境变量添加 `NEXT_PUBLIC_SENTRY_DSN` 和 `SENTRY_DSN`
  6. 代码已经集成了 Sentry SDK，只需要填 DSN 就能工作

### FEAT-011：首页库存状态展示（P2，1 小时）

- **涉及文件**：`frontend/components/site/buy.tsx`
- **实现要点**：
  1. 组件加载时调 `GET /api/products/wind-chaser-64`
  2. 根据 variant.stock 显示状态：
     - stock > 10：绿色 "In Stock"
     - stock 1-10：橙色 "Low Stock — only X left"
     - stock = 0：红色 "Out of Stock"，禁用 Buy 按钮
  3. 颜色切换时更新状态

### FEAT-012：ChatWidget 线上启用（P2，30 分钟）

- **涉及文件**：`frontend/app/[locale]/page.tsx`
- **实现要点**：
  1. 取消 ChatWidget 的注释（第 23-24 行和第 87 行）
  2. 确认 Render 的 WebSocket 支持（免费套餐支持，但有 idle timeout）
  3. 测试 Socket.io 连接是否正常

## 七、环境变量完整参考

### 7.1 Render (后端) — 当前配置

| Key                  | 值                                                                         | 来源             | 备注               |
| -------------------- | -------------------------------------------------------------------------- | ---------------- | ------------------ |
| NODE_ENV             | production                                                                 | render.yaml      |                    |
| PORT                 | 4000                                                                       | render.yaml      |                    |
| FRONTEND_URL         | https://www.modelzone.cc                                                   | Dashboard 手动设 | CORS + PayPal 回调 |
| LOG_LEVEL            | info                                                                       | render.yaml      |                    |
| MONGODB_URI          | mongodb+srv://modelzone-api:\*\*\*@cluster0.h6ru5u7.mongodb.net/mojing?... | Dashboard secret |                    |
| JWT_ACCESS_SECRET    | mz*access_prod*\*\*\*                                                      | Dashboard secret | 32+ 字符           |
| JWT_REFRESH_SECRET   | mz*refresh_prod*\*\*\*                                                     | Dashboard secret | 32+ 字符           |
| ADMIN_USERNAME       | admin                                                                      | Dashboard secret |                    |
| ADMIN_PASSWORD       | \*\*\*                                                                     | Dashboard secret | 首次启动 seed      |
| ADMIN_EMAIL          | admin@modelzone.cc                                                         | Dashboard secret |                    |
| PAYPAL_CLIENT_ID     | Ab9Q8JJv\*\*\*                                                             | Dashboard secret | Sandbox            |
| PAYPAL_CLIENT_SECRET | EOdZwjUa\*\*\*                                                             | Dashboard secret | Sandbox            |
| PAYPAL_MODE          | sandbox                                                                    | Dashboard        | 正式收款改 live    |
| SMTP_HOST            | (空)                                                                       |                  | 需要配置           |
| NOTIFY_EMAIL         | (空)                                                                       |                  | 需要配置           |
| SENTRY_DSN           | (空)                                                                       |                  | 需要配置           |

### 7.2 Vercel (前端) — 当前配置

| Key                       | 值                                 | 环境              | 备注          |
| ------------------------- | ---------------------------------- | ----------------- | ------------- |
| NEXT_PUBLIC_BACKEND_URL   | https://modelzone-api.onrender.com | 需确认 Production | BUG-001       |
| NEXT_PUBLIC_WEB3FORMS_KEY | 8c39082d-\*\*\*                    | All               | 表单 fallback |

### 7.3 需要新增的环境变量

| 平台   | Key                    | 值                                | 用途         |
| ------ | ---------------------- | --------------------------------- | ------------ |
| Render | SMTP_HOST              | (你的 SMTP 服务商)                | 邮件发送     |
| Render | SMTP_PORT              | 587                               |              |
| Render | SMTP_USER              | (你的邮箱)                        |              |
| Render | SMTP_PASS              | (密码)                            |              |
| Render | SMTP_FROM              | ModelZone <no-reply@modelzone.cc> |              |
| Render | NOTIFY_EMAIL           | admin@modelzone.cc                | 新订单通知   |
| Render | SENTRY_DSN             | (Sentry 后端 DSN)                 | 错误监控     |
| Render | PAYPAL_WEBHOOK_ID      | (PayPal Dashboard)                | Webhook 验证 |
| Vercel | NEXT_PUBLIC_SENTRY_DSN | (Sentry 前端 DSN)                 | 错误监控     |
| Vercel | SENTRY_DSN             | (同上)                            | 服务端       |

## 八、文件索引

后续开发者需要改的文件，按功能分组：

### 支付相关

- `backend/src/services/paypal.service.ts` — PayPal API 封装
- `backend/src/routes/order.routes.ts` — 下单 + capture + 查询
- `backend/src/routes/admin-order.routes.ts` — 管理员订单操作
- `backend/src/models/Order.model.ts` — 订单数据模型
- `backend/src/models/PaymentEvent.model.ts` — 支付事件日志
- `frontend/app/[locale]/checkout/page.tsx` — 结算页
- `frontend/app/[locale]/checkout/success/page.tsx` — 支付成功页

### 商品相关

- `backend/src/models/Product.model.ts` — 商品数据模型
- `backend/src/routes/product.routes.ts` — 商品 API
- `frontend/components/site/buy.tsx` — 首页购买组件
- `backend/src/config/shipping.ts` — 运费表

### 安全相关

- `backend/src/middleware/csrf.middleware.ts` — CSRF 防护
- `backend/src/services/token.service.ts` — JWT 签发/验证
- `backend/src/middleware/auth.middleware.ts` — 认证中间件

### 邮件相关

- `backend/src/services/mailer.service.ts` — 邮件发送（需要扩展）

### 部署相关

- `docker/Dockerfile.api` — 后端 Docker 镜像
- `render.yaml` — Render Blueprint 配置
- `frontend/next.config.mjs` — Next.js 配置

### 设计文档

- `docs/COMMERCE-SPEC.md` — 862 行技术规格（数据模型、API、支付流程）
- `docs/PROGRESS-REPORT.md` — 进度报告
- `docs/HANDOVER.md` — 本文档
- `docs/DECISIONS.md` — 架构决策记录
- `docs/ARCHITECTURE.md` — 架构概览

## 九、给下一个开发者的建议

1. **先修 BUG-001 和 BUG-003**，这两个修好后线上交易就能跑通。
2. **然后配 UptimeRobot (FEAT-009)**，10 分钟搞定，防止冷启动。
3. **然后配 Sentry (FEAT-010)**，30 分钟搞定，有了错误监控才敢让甲方测试。
4. **然后做邮件 (FEAT-001/002/003)**，这是甲方测试时最容易发现的缺失。
5. **最后做 Webhook (FEAT-004)**，这是支付可靠性的保障。

不要一上来就做 V2 功能（信用卡收单、买家账户、物流 API），先把 V1 的基础打牢。

---

> 文档结束。最后更新: 2026-04-30
