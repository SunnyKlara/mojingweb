# ModelZone 项目进度报告与开发交接文档

> 日期: 2026-04-30 | 版本: 1.0
>
> 本文档完整记录了 ModelZone (Wind Chaser 64) 独立站从品牌展示站升级为
> 完整交易闭环独立站的全部工作内容、当前状态、已知问题和后续待办。
> 供项目负责人、后续开发者或 AI 开发助手参考。

---

## 一、项目概述

### 1.1 项目定位

ModelZone 是深圳模境工作室的品牌独立站，核心产品是 Wind Chaser 64
（追风者 64）——一款面向海外 1:64 车模爱好者的桌面风洞。

网站定位为跨境电商独立站，需要实现完整的
「品牌展示 → 商品浏览 → 下单支付 → 履约发货 → 售后退款」交易闭环。

### 1.2 技术架构

| 层       | 技术栈                                                                              | 部署位置                 |
| -------- | ----------------------------------------------------------------------------------- | ------------------------ |
| Frontend | Next.js 14 App Router + Tailwind CSS + Radix UI + next-intl (zh/en) + Framer Motion | Vercel (免费)            |
| Backend  | Express + Socket.io + MongoDB (Mongoose) + JWT + Zod + Pino + Sentry                | Render (免费, Singapore) |
| Database | MongoDB Atlas M0 (免费, 集群: cluster0.h6ru5u7.mongodb.net)                         | MongoDB Cloud            |
| Shared   | `@mojing/shared` — Zod schemas + TypeScript types + Socket.io events                | workspace package        |
| 包管理   | pnpm 9.x monorepo (frontend, backend, shared)                                       | —                        |

### 1.3 线上地址

| 服务          | URL                                           |
| ------------- | --------------------------------------------- |
| 前端 (主域名) | https://www.modelzone.cc                      |
| 前端 (Vercel) | https://modelzone-tawny.vercel.app            |
| 后端 API      | https://modelzone-api.onrender.com            |
| 后端健康检查  | https://modelzone-api.onrender.com/api/health |
| GitHub 仓库   | https://github.com/SunnyKlara/mojingweb       |

### 1.4 关键账号和服务

| 服务                | 用途     | 备注                            |
| ------------------- | -------- | ------------------------------- |
| GitHub (SunnyKlara) | 代码仓库 | mojingweb 仓库                  |
| Vercel (sunnyklara) | 前端部署 | Hobby 免费套餐                  |
| Render              | 后端部署 | Free 套餐, Docker 部署          |
| MongoDB Atlas       | 云数据库 | M0 免费集群, 用户 modelzone-api |
| PayPal Developer    | 支付集成 | Sandbox 模式, App: modelzone    |
| 阿里云              | 域名 DNS | modelzone.cc                    |

---

## 二、已完成工作详细清单

### 2.1 安全加固 (2026-04-29)

所有安全修复已通过 33 个单元测试验证。

| 项目                       | 文件                                                               | 说明                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| CSRF 双提交 Cookie 防护    | `backend/src/middleware/csrf.middleware.ts`                        | 每个响应设置 `mojing_csrf` cookie, POST/PUT/PATCH/DELETE 请求需在 `X-CSRF-Token` 头回传。公开端点 (下单、lead、登录等) 豁免。 |
| Visitor/Admin JWT 密钥隔离 | `backend/src/services/token.service.ts`                            | visitor session 用 HMAC 派生独立密钥签名, `verifyAccessToken()` 增加 payload 结构校验                                         |
| Refresh Token 版本校验     | `backend/src/routes/auth.routes.ts`                                | `/api/auth/refresh` 比对 token 的 iat 与用户 tokenVersion, 密码修改后旧 token 失效                                            |
| NoSQL 注入防护             | `backend/src/routes/lead.routes.ts`                                | lead 列表 status 查询参数白名单校验                                                                                           |
| CSP 启用                   | `backend/src/server.ts`                                            | 生产环境启用 Content-Security-Policy (default-src self, frame-src none 等)                                                    |
| Session 创建限速           | `backend/src/routes/chat.routes.ts`                                | `/api/chat/session` 10次/分钟                                                                                                 |
| 图片域名白名单             | `frontend/next.config.mjs`                                         | remotePatterns 从 `**` 收紧到已知域名                                                                                         |
| 前端 CSRF 自动传递         | `frontend/lib/api.ts`, `frontend/components/site/contact-form.tsx` | api() 和原生 fetch 自动附加 X-CSRF-Token                                                                                      |

### 2.2 数据模型 (2026-04-29)

| Model        | 文件                                       | 说明                                                                    |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------- |
| Product      | `backend/src/models/Product.model.ts`      | 多语言名称/描述, 美分价格, 变体数组 (SKU/库存/图片), 物理属性, 状态管理 |
| Order        | `backend/src/models/Order.model.ts`        | 人类可读订单号, 商品快照冻结, 收货地址, 支付信息, 履约信息, 状态机      |
| PaymentEvent | `backend/src/models/PaymentEvent.model.ts` | 支付事件日志, 保留 PayPal 原始响应, 用于纠纷举证和对账                  |

对应的 Zod schemas 在 shared 包:

- `shared/src/schemas/product.schema.ts`
- `shared/src/schemas/order.schema.ts`
- `shared/src/schemas/payment.schema.ts`
- `shared/src/schemas/shipping.schema.ts`

常量定义在 `shared/src/constants.ts`:

- ProductStatus, OrderStatus, PaymentEventType, PaymentMethod, ShippingCountry

### 2.3 后端 API 路由 (2026-04-29)

| 路由        | 文件                                       | 端点                                                 |
| ----------- | ------------------------------------------ | ---------------------------------------------------- |
| 商品 (公开) | `backend/src/routes/product.routes.ts`     | `GET /api/products`, `GET /api/products/:slug`       |
| 商品 (管理) | `backend/src/routes/product.routes.ts`     | `POST/PATCH/DELETE /api/admin/products`              |
| 下单        | `backend/src/routes/order.routes.ts`       | `POST /api/orders` — 创建订单 + PayPal checkout      |
| 支付捕获    | `backend/src/routes/order.routes.ts`       | `POST /api/orders/payments/paypal/capture`           |
| 订单查询    | `backend/src/routes/order.routes.ts`       | `GET /api/orders/lookup?email=&orderNo=`             |
| 订单管理    | `backend/src/routes/admin-order.routes.ts` | `GET /api/admin/orders`, `GET /api/admin/orders/:id` |
| 发货        | `backend/src/routes/admin-order.routes.ts` | `PATCH /api/admin/orders/:id/ship`                   |
| 退款        | `backend/src/routes/admin-order.routes.ts` | `PATCH /api/admin/orders/:id/refund`                 |

### 2.4 PayPal 支付集成 (2026-04-29)

文件: `backend/src/services/paypal.service.ts`

| 功能             | 方法                       | PayPal API                                      |
| ---------------- | -------------------------- | ----------------------------------------------- |
| OAuth token 管理 | `getAccessToken()`         | POST /v1/oauth2/token                           |
| 创建订单         | `createPayPalOrder()`      | POST /v2/checkout/orders                        |
| 捕获支付         | `capturePayPalOrder()`     | POST /v2/checkout/orders/{id}/capture           |
| 退款             | `refundPayPalCapture()`    | POST /v2/payments/captures/{id}/refund          |
| Webhook 验证     | `verifyWebhookSignature()` | POST /v1/notifications/verify-webhook-signature |

当前状态: **Sandbox 模式** (测试环境, 不涉及真钱)

支付流程:

1. 前端 POST /api/orders → 后端创建订单 + 调 PayPal Create Order
2. 前端跳转 PayPal 收银台 → 买家付款
3. PayPal 重定向回 /checkout/success → 前端 POST capture
4. 后端验证金额 → 原子扣库存 → 更新订单 → 记录 PaymentEvent

### 2.5 前端页面 (2026-04-29)

| 页面         | 文件                                              | 说明                              |
| ------------ | ------------------------------------------------- | --------------------------------- |
| 结算页       | `frontend/app/[locale]/checkout/page.tsx`         | 地址表单 + 实时运费 + PayPal 按钮 |
| 支付成功     | `frontend/app/[locale]/checkout/success/page.tsx` | 触发 capture, 显示订单确认        |
| 支付取消     | `frontend/app/[locale]/checkout/cancel/page.tsx`  | 引导返回商品页                    |
| 订单查询     | `frontend/app/[locale]/order-lookup/page.tsx`     | 邮箱+订单号查询                   |
| 管理订单列表 | `frontend/app/(admin)/admin/orders/page.tsx`      | 订单列表, 状态过滤, 搜索          |
| 管理订单详情 | `frontend/app/(admin)/admin/orders/[id]/page.tsx` | 发货操作, 退款, 支付事件时间线    |

Buy 组件改造: `frontend/components/site/buy.tsx`

- 黑/白颜色选择器
- 价格显示 $299.00
- Buy Now 按钮直达 /checkout?sku=WC64-BLK

所有页面支持中英双语 (i18n keys 在 `frontend/messages/en.json` 和 `zh.json` 的 `checkout` 命名空间)

### 2.6 其他后端功能

| 功能         | 文件                                            | 说明                                     |
| ------------ | ----------------------------------------------- | ---------------------------------------- |
| 运费计算     | `backend/src/config/shipping.ts`                | 按国家固定运费表 (占位值, 需替换)        |
| 订单号生成   | `backend/src/lib/order-no.ts`                   | 格式 MZ-YYYYMMDD-XXXX                    |
| 订单超时清理 | `backend/src/services/order-cleanup.service.ts` | 每5分钟清理30分钟未付款订单              |
| 环境变量校验 | `backend/src/config/env.ts`                     | PayPal + Order 相关变量已加入 Zod schema |

### 2.7 部署配置 (2026-04-30)

| 项目          | 说明                                                            |
| ------------- | --------------------------------------------------------------- |
| Dockerfile    | `docker/Dockerfile.api` — 用 tsx 直接运行 TS 源码, 全局安装 tsx |
| render.yaml   | 项目根目录, Blueprint 配置, 自动部署                            |
| 域名 DNS      | 阿里云: @ → A 216.198.79.1, www → CNAME vercel-dns              |
| MongoDB Atlas | cluster0.h6ru5u7.mongodb.net, 用户 modelzone-api, 数据库 mojing |

---

## 三、当前状态与已知问题

### 3.1 部署状态

| 服务           | 状态        | 备注                                                  |
| -------------- | ----------- | ----------------------------------------------------- |
| 后端 (Render)  | ✅ 运行中   | https://modelzone-api.onrender.com/api/health 返回 ok |
| 前端 (Vercel)  | ✅ 运行中   | https://www.modelzone.cc 可访问                       |
| 数据库 (Atlas) | ✅ 连接正常 | 后端启动日志确认 MongoDB connected                    |
| 域名           | ✅ 已绑定   | modelzone.cc + www.modelzone.cc + vercel.app          |

### 3.2 正在解决的问题

**问题: 前端 NEXT_PUBLIC_BACKEND_URL 未生效**

- 症状: 结算页点 PayPal 按钮报 "Failed to fetch", Console 显示请求发到 localhost:4000
- 原因: Vercel 环境变量 `NEXT_PUBLIC_BACKEND_URL` 添加时选了 Preview 环境而非 Production,
  且 Next.js 的 `NEXT_PUBLIC_` 变量是构建时注入的, 需要重新部署
- 解决方案: 已在 Vercel 触发 Redeploy (不使用缓存), 等待构建完成
- 验证方法: 构建完成后打开 www.modelzone.cc, F12 Console 看请求是否发到
  modelzone-api.onrender.com

**操作步骤 (如果问题仍存在)**:

1. Vercel Dashboard → modelzone → Settings → Environment Variables
2. 确认 `NEXT_PUBLIC_BACKEND_URL` 的值为 `https://modelzone-api.onrender.com`
3. 确认 Environments 选择了 **Production** (不只是 Preview)
4. Deployments → 最新部署 → ... → Redeploy (取消 Use existing Build Cache)

### 3.3 已知限制

| 限制                  | 影响                                                      | 解决方案                                    |
| --------------------- | --------------------------------------------------------- | ------------------------------------------- |
| Render 免费套餐冷启动 | 15分钟不活动后休眠, 首次请求延迟 50 秒                    | 配置 UptimeRobot 每 5 分钟 ping /api/health |
| PayPal Sandbox 模式   | 只能用测试买家账号付款, 不能收真钱                        | 等 PayPal 企业账户审核通过后切换 Live       |
| 线上数据库无商品数据  | 结算页能显示但下单会失败 (找不到 SKU)                     | 通过 API 创建商品 (见第五节)                |
| 运费占位值            | shipping.ts 里的运费不是真实报价                          | 联系云途/4PX 拿报价后替换                   |
| Node.js 版本          | 本地 Node 24, 项目要求 Node 20, Next.js 14 不兼容 Node 24 | 安装 nvm-windows, 用 Node 20 开发           |

---

## 四、未完成工作 (按优先级排序)

### P0 — 阻塞上线测试 (必须立即完成)

#### 4.1 Vercel 环境变量修复

确保 `NEXT_PUBLIC_BACKEND_URL=https://modelzone-api.onrender.com` 在 Production 环境生效。
重新部署后验证。

#### 4.2 线上商品数据创建

Atlas 数据库里还没有商品数据。需要通过管理员 API 创建 Wind Chaser 64:

```bash
# 1. 登录拿 token
curl -X POST https://modelzone-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"ModelZone2026Admin"}'

# 2. 用 token 创建商品
curl -X POST https://modelzone-api.onrender.com/api/admin/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {accessToken}" \
  -d '{
    "name": {"zh":"追风者 64 桌面风洞","en":"Wind Chaser 64 Desktop Wind Tunnel"},
    "slug": "wind-chaser-64",
    "description": {"zh":"专为 1:64 车模设计的桌面级风洞","en":"Desktop wind tunnel for 1:64 model cars"},
    "price": 29900,
    "currency": "USD",
    "variants": [
      {"sku":"WC64-BLK","name":{"zh":"曜石黑","en":"Obsidian Black"},"stock":50,"image":"/brand/product-black.jpg"},
      {"sku":"WC64-WHT","name":{"zh":"皓月白","en":"Lunar White"},"stock":30,"image":"/brand/product-white.jpg"}
    ],
    "images": ["/brand/0.png","/brand/1.png"],
    "weight": 850,
    "dimensions": {"length":220,"width":99,"height":59},
    "status": "active",
    "featured": true
  }'
```

#### 4.3 Render FRONTEND_URL 确认

确认 Render 环境变量 `FRONTEND_URL` 值为 `https://www.modelzone.cc` (CORS 和 PayPal 回调 URL 依赖此值)。

### P1 — 上线前建议完成

#### 4.4 邮件模板 (P8)

需要在 `backend/src/services/mailer.service.ts` 中新增三个邮件发送函数:

| 邮件     | 触发时机              | 内容                               |
| -------- | --------------------- | ---------------------------------- |
| 订单确认 | PayPal capture 成功后 | 订单号、商品、地址、总价、查询链接 |
| 发货通知 | 管理员标记发货后      | 物流商、单号、查询链接             |
| 退款通知 | 退款成功后            | 退款金额、预计到账时间             |

代码中已预留 `// TODO: send confirmation email` 注释标记位置:

- `backend/src/routes/order.routes.ts` (capture 成功后)
- `backend/src/routes/admin-order.routes.ts` (ship 和 refund 后)

需要配置 SMTP 环境变量 (Render Dashboard → Environment):

- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, NOTIFY_EMAIL

#### 4.5 PayPal Webhook 端点

`backend/src/services/paypal.service.ts` 中 `verifyWebhookSignature()` 已实现,
但 webhook 路由还未创建。需要:

1. 创建 `POST /api/payments/paypal/webhook` 路由
2. 在 PayPal Developer Dashboard 配置 webhook URL
3. 处理事件: PAYMENT.CAPTURE.REFUNDED, CUSTOMER.DISPUTE.CREATED
4. 将 PAYPAL_WEBHOOK_ID 添加到 Render 环境变量

#### 4.6 UptimeRobot 防冷启动

注册 https://uptimerobot.com (免费), 添加 HTTP 监控:

- URL: `https://modelzone-api.onrender.com/api/health`
- 间隔: 5 分钟
- 这样 Render 免费实例不会休眠

### P2 — 上线后优化

#### 4.7 管理后台商品管理页面

后端 API 已完成 (`/api/admin/products` CRUD), 前端页面 `/admin/products` 未创建。
目前可通过 API 或 MongoDB Atlas Data Explorer 管理商品。

#### 4.8 PayPal Live 切换

等 PayPal 企业账户 (个体工商户营业执照注册) 审核通过后:

1. 在 PayPal Developer Dashboard 创建 Live App
2. 获取 Live Client ID 和 Secret
3. 更新 Render 环境变量:
   - `PAYPAL_CLIENT_ID` → Live 值
   - `PAYPAL_CLIENT_SECRET` → Live 值
   - `PAYPAL_MODE` → `live`
4. 配置 Live Webhook

#### 4.9 运费数字替换

联系物流商 (云途/4PX) 获取实际报价, 替换 `backend/src/config/shipping.ts` 中的占位值。
Wind Chaser 64 包装: 220×99×59mm, 约 850g。

#### 4.10 信用卡收单 (V2)

甲方需求方案 2: 对接连连国际/Airwallex 内嵌收银台, 支持 Visa/Mastercard 直接付款。
需要:

- 开通收单机构账户 (个体户营业执照)
- 后端新增信用卡支付路由
- 前端嵌入收单机构的 iframe 收银台组件
- CSP 更新: 添加收单机构域名

#### 4.11 海外仓对接 (V2)

日均稳定出单后:

- 对接云途/4PX API 实时运费报价
- 自动同步物流轨迹
- 海外仓备货模式

---

## 五、环境变量完整清单

### 5.1 Render (后端) 环境变量

| Key                  | 当前值                                                                     | 说明                          |
| -------------------- | -------------------------------------------------------------------------- | ----------------------------- |
| NODE_ENV             | production                                                                 | render.yaml 中设置            |
| PORT                 | 4000                                                                       | render.yaml 中设置            |
| FRONTEND_URL         | https://www.modelzone.cc                                                   | CORS origin + PayPal 回调 URL |
| LOG_LEVEL            | info                                                                       | render.yaml 中设置            |
| MONGODB_URI          | mongodb+srv://modelzone-api:\*\*\*@cluster0.h6ru5u7.mongodb.net/mojing?... | Atlas 连接串                  |
| JWT_ACCESS_SECRET    | mz*access_prod*\*\*\*                                                      | 32+ 字符                      |
| JWT_REFRESH_SECRET   | mz*refresh_prod*\*\*\*                                                     | 32+ 字符                      |
| ADMIN_USERNAME       | admin                                                                      | 管理员用户名                  |
| ADMIN_PASSWORD       | \*\*\*                                                                     | 管理员密码 (首次启动 seed)    |
| ADMIN_EMAIL          | admin@modelzone.cc                                                         | 管理员邮箱                    |
| PAYPAL_CLIENT_ID     | Ab9Q8JJv\*\*\*                                                             | Sandbox Client ID             |
| PAYPAL_CLIENT_SECRET | EOdZwjUa\*\*\*                                                             | Sandbox Secret                |
| PAYPAL_MODE          | sandbox                                                                    | sandbox / live                |
| SMTP_HOST            | (空)                                                                       | 邮件功能未启用                |
| NOTIFY_EMAIL         | (空)                                                                       | 通知邮箱未配置                |
| SENTRY_DSN           | (空)                                                                       | 错误监控未配置                |

### 5.2 Vercel (前端) 环境变量

| Key                       | 值                                 | 环境                 | 说明                    |
| ------------------------- | ---------------------------------- | -------------------- | ----------------------- |
| NEXT_PUBLIC_BACKEND_URL   | https://modelzone-api.onrender.com | Production + Preview | 后端 API 地址           |
| NEXT_PUBLIC_WEB3FORMS_KEY | 8c39082d-\*\*\*                    | All                  | Web3Forms 表单 fallback |

**重要**: `NEXT_PUBLIC_` 变量是构建时注入的, 修改后必须重新部署才能生效。

---

## 六、项目文件结构 (新增/修改的文件)

### 6.1 Shared 包新增

```
shared/src/constants.ts              # 追加: ProductStatus, OrderStatus, PaymentEventType 等
shared/src/schemas/product.schema.ts # 新增: Product, ProductVariant, CreateProductRequest
shared/src/schemas/order.schema.ts   # 新增: Order, OrderItem, CreateOrderRequest, ShipOrderRequest 等
shared/src/schemas/payment.schema.ts # 新增: PaymentEvent
shared/src/schemas/shipping.schema.ts # 新增: ShippingAddress
shared/src/schemas/index.ts          # 修改: 追加新 schema 导出
shared/src/types/index.ts            # 修改: 追加新类型导出
```

### 6.2 Backend 新增

```
backend/src/models/Product.model.ts          # Mongoose Product model
backend/src/models/Order.model.ts            # Mongoose Order model
backend/src/models/PaymentEvent.model.ts     # Mongoose PaymentEvent model
backend/src/routes/product.routes.ts         # 商品 CRUD API (公开 + 管理)
backend/src/routes/order.routes.ts           # 下单 + 支付捕获 + 订单查询
backend/src/routes/admin-order.routes.ts     # 管理员订单操作
backend/src/services/paypal.service.ts       # PayPal REST API v2 集成
backend/src/services/order-cleanup.service.ts # 超时订单清理定时器
backend/src/middleware/csrf.middleware.ts     # CSRF 双提交 Cookie 防护
backend/src/config/shipping.ts               # 固定运费表
backend/src/lib/order-no.ts                  # 订单号生成器
backend/src/scripts/fix-product-zh.ts        # 一次性脚本 (修复中文乱码)
```

### 6.3 Backend 修改

```
backend/src/server.ts                # 挂载新路由, 启用 CSP, 添加 CSRF 中间件
backend/src/index.ts                 # 启动订单清理定时器
backend/src/config/env.ts            # 追加 PayPal + Order 环境变量
backend/src/services/token.service.ts # JWT 密钥隔离
backend/src/routes/auth.routes.ts    # tokenVersion 校验
backend/src/routes/lead.routes.ts    # NoSQL 注入修复
backend/src/routes/chat.routes.ts    # session 创建限速
backend/.env.example                 # 追加 PayPal 配置
```

### 6.4 Frontend 新增

```
frontend/app/[locale]/checkout/page.tsx          # 结算页
frontend/app/[locale]/checkout/success/page.tsx  # 支付成功页
frontend/app/[locale]/checkout/cancel/page.tsx   # 支付取消页
frontend/app/[locale]/order-lookup/page.tsx      # 订单查询页
frontend/app/(admin)/admin/orders/page.tsx       # 管理员订单列表
frontend/app/(admin)/admin/orders/[id]/page.tsx  # 管理员订单详情
```

### 6.5 Frontend 修改

```
frontend/components/site/buy.tsx         # 颜色选择器 + Buy Now 按钮
frontend/components/site/buy-sticky.tsx  # 底部购买栏链接更新
frontend/components/site/contact-form.tsx # CSRF token 传递
frontend/lib/api.ts                      # CSRF token 自动附加
frontend/next.config.mjs                 # 图片域名白名单
frontend/messages/en.json                # checkout 命名空间 i18n
frontend/messages/zh.json                # checkout 命名空间 i18n
```

### 6.6 部署配置

```
docker/Dockerfile.api    # 重写: tsx 全局安装, 直接运行 TS 源码
render.yaml              # 已有, Blueprint 配置
```

### 6.7 文档

```
docs/COMMERCE-SPEC.md    # 862 行技术规格文档
docs/PROGRESS-REPORT.md  # 本文档
```

---

## 七、本地开发指南

### 7.1 环境要求

- Node.js 20.x (项目 .nvmrc 指定, Next.js 14 不兼容 Node 24)
- pnpm 9.x (`corepack enable && corepack use pnpm@9.12.0`)
- Docker Desktop (用于本地 MongoDB)

### 7.2 启动步骤

```bash
# 1. 启动 MongoDB
docker compose -f docker/docker-compose.yml up -d mongo

# 2. 复制环境变量
cp backend/.env.example backend/.env
# 编辑 .env 填入 MongoDB URI, JWT secrets, PayPal credentials

# 3. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm dev          # 同时启动前端 + 后端
# 或分别启动:
pnpm dev:api      # 后端 localhost:4000
pnpm dev:web      # 前端 localhost:3000

# 5. 创建商品数据 (首次)
# 登录拿 token, 然后 POST /api/admin/products (见第四节)
```

### 7.3 测试

```bash
pnpm test                    # 运行所有测试 (shared + backend + frontend)
pnpm -r typecheck            # 所有包类型检查
pnpm lint                    # ESLint
pnpm format:check            # Prettier 格式检查
```

### 7.4 部署

代码推送到 GitHub main 分支后:

- Render 自动构建部署后端 (Docker)
- Vercel 自动构建部署前端 (Next.js)

---

## 八、关键设计决策摘要

| 决策          | 选择                         | 理由                            |
| ------------- | ---------------------------- | ------------------------------- |
| 定价币种      | USD only                     | 行业标准, PayPal 自动转换       |
| 买家账户      | 游客下单                     | 转化率优先, 省 4-5 天开发       |
| 库存管理      | 原子扣减                     | MongoDB findOneAndUpdate 防超卖 |
| 库存扣减时机  | 支付成功后                   | 避免未付款订单锁死库存          |
| 价格存储      | 美分整数                     | 避免浮点精度问题                |
| 订单商品      | 快照冻结                     | 改价后历史订单不受影响          |
| 支付方式      | PayPal redirect flow         | 最安全, 前端零支付逻辑          |
| Docker 运行时 | tsx 直接执行 TS              | 避免 shared 包 ESM/CJS 编译问题 |
| CSRF 策略     | 双提交 Cookie + 公开端点豁免 | 跨域 SPA 兼容                   |

完整设计文档见 `docs/COMMERCE-SPEC.md`。
完整架构决策记录见 `docs/DECISIONS.md`。

---

> 文档结束。最后更新: 2026-04-30T13:30+08:00
