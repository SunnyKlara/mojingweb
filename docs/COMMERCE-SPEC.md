# ModelZone 交易闭环技术规格文档

> 版本: 1.0 | 日期: 2026-04-29 | 状态: 待审阅
>
> 本文档定义 ModelZone (Wind Chaser 64) 独立站从"品牌展示站"升级为
> "完整交易闭环独立站"的全部技术规格。覆盖数据模型、API 设计、支付集成、
> 安全策略、前端页面、运维部署。所有后续开发和测试以本文档为准。

---

## 目录

1. [项目现状与目标](#1-项目现状与目标)
2. [核心技术决策](#2-核心技术决策)
3. [数据模型设计](#3-数据模型设计)
4. [API 路由设计](#4-api-路由设计)
5. [PayPal 支付集成](#5-paypal-支付集成)
6. [库存管理策略](#6-库存管理策略)
7. [前端页面规划](#7-前端页面规划)
8. [运费策略](#8-运费策略)
9. [邮件通知系统](#9-邮件通知系统)
10. [安全加固清单](#10-安全加固清单)
11. [Shared 包扩展](#11-shared-包扩展)
12. [环境变量](#12-环境变量)
13. [开发排期](#13-开发排期)
14. [测试策略](#14-测试策略)
15. [附录: 已完成的安全加固](#15-附录-已完成的安全加固)

---

## 1. 项目现状与目标

### 1.1 现有架构

| 层       | 技术栈                                                                          | 部署               |
| -------- | ------------------------------------------------------------------------------- | ------------------ |
| Frontend | Next.js 14 App Router + Tailwind + Radix UI + next-intl (zh/en) + Framer Motion | Vercel             |
| Backend  | Express + Socket.io + MongoDB (Mongoose) + JWT + Zod + Pino + Sentry            | Render (Singapore) |
| Shared   | `@mojing/shared` — Zod schemas + TypeScript types + Socket.io events            | workspace package  |

Monorepo 管理: pnpm 9.x workspaces (`frontend`, `backend`, `shared`)

### 1.2 已完成功能

- 品牌展示首页 (Hero, 产品海报, 规格参数, 包装清单, 保修, FAQ, CTA)
- 管理后台 (/admin — 登录, Lead 管理, 实时客服聊天)
- 实时客服 (Socket.io 双向通信, 打字指示器, 已读回执, 会话管理)
- Lead 表单收集 (Zod 校验 + 蜜罐 + 速率限制 + 邮件通知 + Web3Forms 降级)
- JWT 双 token 认证 (access 15min + refresh 7d httpOnly cookie, 自动轮换)
- 审计日志系统
- i18n 国际化 (en/zh)
- Docker 化部署 (API + Frontend 独立 Dockerfile)
- CI/CD (Husky + commitlint + lint-staged + Prettier)

### 1.3 目标

在现有架构上实现完整的 **品牌展示 → 商品浏览 → 下单支付 → 履约发货 → 售后退款**
交易闭环, 使 ModelZone 成为可独立收款的跨境电商独立站。

### 1.4 不在 V1 范围内

- 多币种定价 (V2)
- 买家注册/登录账户体系 (V2)
- 购物车 (单品直购, 不需要)
- 信用卡直接收单 / 内嵌收银台 (V2, 需对接连连/Airwallex)
- 物流 API 自动对接 (V2, V1 手动填单号)
- 优惠券/折扣系统 (V2)
- AI 客服助手 (V2, 见 ADR-0004)

---

## 2. 核心技术决策

### 2.1 定价币种: USD only

**决策**: V1 所有商品以美元 (USD) 定价, 价格在系统内部以 **美分整数** 存储。

**理由**:

- USD 是跨境独立站的事实标准定价货币。PayPal 和所有信用卡收单机构在买家侧
  自动完成本币转换, 买家看到的是信用卡账单上的本币金额。
- JavaScript 浮点运算存在精度问题 (`0.1 + 0.2 = 0.30000000000000004`)。
  所有金融系统 (Stripe, Shopify, PayPal 内部) 都用最小货币单位的整数运算。
  传输层做 `(price / 100).toFixed(2)` 转换为 PayPal 要求的美元字符串。
- 零额外开发成本。多币种是规模化后的优化项 (提升欧洲/日本市场转化率)。
- Order model 预留 `currency` 字段, 未来扩展无需迁移。

### 2.2 买家账户: 游客下单 (Guest Checkout)

**决策**: V1 不做买家注册/登录, 采用游客下单模式。

**理由**:

- **转化率**: Baymard Institute 研究数据显示强制注册导致 24% 购物车放弃率。
  新品牌零信任基础, 多一步注册多流失四分之一用户。
- **开发成本**: 买家账户体系 = 注册/登录/忘记密码/邮箱验证/账户安全/GDPR 合规/
  密码重置邮件, 至少 4-5 天工作量, 每一个都是安全敏感面。
- **产品特性**: Wind Chaser 64 是高客单价低频购买品, 复购场景极少,
  账户体系的"方便下次购买"价值接近零。

**实现**: 买家填邮箱 + 收货地址下单 → 系统生成唯一订单号 → 付款成功发确认邮件
(含订单号) → 买家通过"邮箱 + 订单号"查询订单状态和物流。
这是 Shopify 默认的 guest checkout 模式, 经过千万级独立站验证。

**迁移路径**: 日均订单稳定后加账户体系, 用"订单号一键绑定历史订单"做平滑迁移。

### 2.3 库存管理: 原子扣减, 单字段

**决策**: 在 Product variants 上维护 `stock` 字段, 支付成功后原子扣减。

**理由**:

- **防超卖是底线**。两个买家同时下单最后一件, 没有库存校验就会超卖。
  超卖 = 退款 + 道歉邮件 + PayPal 纠纷, 对新品牌信誉是致命打击。
- **实现成本极低**。MongoDB `findOneAndUpdate` + `$elemMatch` + `$inc`
  原子操作, 10 行代码。
- **扣减时机**: PayPal capture 成功后扣减, 不在创建订单时扣。
  因为买家可能创建订单但放弃付款, 提前扣减会锁死库存。

**不做**: SKU 级库存表、仓库管理、库存预警、库存同步。V1 管理员后台手动调整。

### 2.4 支付方式: PayPal Checkout (Orders API v2)

**决策**: V1 仅对接 PayPal, 使用服务端跳转模式 (redirect flow)。

**理由**:

- 甲方需求方案 1 (入门极速上线版), 门槛最低, 1-3 天跑通。
- 服务端跳转模式是 PayPal 官方推荐的"最安全"集成方式, 所有敏感操作在后端完成,
  前端零支付逻辑。
- PayPal JS SDK 内嵌按钮体验更好但引入 CSP 复杂度和 SDK 版本维护成本,
  V2 再考虑。
- PayPal Sandbox 即时可用, 不需要等企业账户审核。

### 2.5 物流: V1 手动录入

**决策**: 管理员在后台手动填写物流商名称 + 单号 + 查询链接。

**理由**: 初期订单量不支撑 API 对接成本。云途/4PX 的 API 对接留到日均稳定出单后。

---

## 3. 数据模型设计

### 3.1 Product Model

文件: `backend/src/models/Product.model.ts`

```typescript
{
  // ---- 基本信息 ----
  name: {
    zh: String,                    // 中文商品名, 如 "追风者 64 桌面风洞"
    en: String,                    // 英文商品名, 如 "Wind Chaser 64 Desktop Wind Tunnel"
  },
  slug: String,                    // URL 友好标识, 如 "wind-chaser-64", unique index
  description: {
    zh: String,                    // 中文描述 (支持 markdown)
    en: String,                    // 英文描述
  },

  // ---- 价格 ----
  price: Number,                   // 单位: 美分 (整数). 如 29900 = $299.00
  compareAtPrice: Number,          // 划线价 (美分), 可选, 用于显示折扣
  currency: String,                // 固定 'USD', 预留扩展

  // ---- 变体 (颜色/规格) ----
  variants: [{
    sku: String,                   // 如 "WC64-BLK", "WC64-WHT", unique
    name: { zh: String, en: String },  // 如 { zh: "曜石黑", en: "Obsidian Black" }
    stock: Number,                 // 当前库存数量, >= 0
    image: String,                 // 变体主图路径 (相对 /public 或 CDN URL)
    weight: Number,                // 克, 用于运费计算 (可覆盖产品级)
  }],

  // ---- 媒体 ----
  images: [String],                // 商品图片组 (轮播)

  // ---- 物理属性 ----
  weight: Number,                  // 默认重量 (克), 变体可覆盖
  dimensions: {
    length: Number,                // mm
    width: Number,                 // mm
    height: Number,                // mm
  },

  // ---- 状态 ----
  status: String,                  // 'active' | 'draft' | 'archived'
  featured: Boolean,               // 首页推荐标记

  // ---- 时间戳 ----
  createdAt: Date,
  updatedAt: Date,
}
```

**索引**:

- `{ slug: 1 }` unique — 商品详情页查询
- `{ status: 1 }` — 商品列表过滤
- `{ 'variants.sku': 1 }` unique — SKU 查询和库存扣减

**设计说明**:

- 变体用嵌套数组而非独立 SKU 表: Wind Chaser 64 只有黑/白两个颜色, 变体极少。
  独立 SKU 表适合几十上百个变体组合的服装类产品。嵌套数组查询更快、代码更简单,
  `findOneAndUpdate` + `$elemMatch` 可做原子库存扣减。
- `compareAtPrice` 用于营销场景 (原价 ~~$399~~ 现价 $299), 不影响实际收款逻辑。

### 3.2 Order Model

文件: `backend/src/models/Order.model.ts`

```typescript
{
  // ---- 订单标识 ----
  orderNo: String,                 // 人类可读, 如 "MZ-20260429-A3F8", unique index
  email: String,                   // 买家邮箱 (游客下单的唯一标识), index

  // ---- 状态机 ----
  status: String,                  // 见下方状态流转图
  // 合法值: 'pending_payment' | 'paid' | 'shipped' | 'delivered'
  //        | 'cancelled' | 'refunded'

  // ---- 商品快照 (下单时冻结) ----
  items: [{
    productId: ObjectId,           // 关联 Product._id
    sku: String,                   // 冻结时的 SKU
    name: String,                  // 冻结时的商品名 (按 locale)
    price: Number,                 // 冻结时的单价 (美分)
    quantity: Number,
    image: String,                 // 冻结时的商品图
  }],

  // ---- 金额 ----
  subtotal: Number,                // 商品小计 (美分) = sum(price * quantity)
  shipping: Number,                // 运费 (美分)
  total: Number,                   // 总计 (美分) = subtotal + shipping
  currency: String,                // 'USD'

  // ---- 收货地址 ----
  shippingAddress: {
    fullName: String,
    line1: String,
    line2: String,                 // 可选
    city: String,
    state: String,
    postalCode: String,
    country: String,               // ISO 3166-1 alpha-2, 如 "US", "GB", "DE"
    phone: String,                 // 可选
  },

  // ---- 支付信息 ----
  payment: {
    method: String,                // 'paypal' (V1 固定)
    paypalOrderId: String,         // PayPal 订单 ID
    paypalCaptureId: String,       // 支付捕获 ID (退款时需要)
    paidAt: Date,                  // 付款完成时间
  },

  // ---- 履约信息 ----
  fulfillment: {
    carrier: String,               // 物流商名称, 如 "云途", "4PX", "DHL"
    trackingNo: String,            // 物流单号
    shippedAt: Date,               // 发货时间
    trackingUrl: String,           // 物流查询链接
  },

  // ---- 元数据 ----
  locale: String,                  // 'en' | 'zh', 决定邮件模板语言
  ip: String,                      // 下单 IP
  userAgent: String,               // 下单 UA
  notes: String,                   // 管理员备注

  // ---- 时间戳 ----
  createdAt: Date,
  updatedAt: Date,
}
```

**索引**:

- `{ orderNo: 1 }` unique — 订单查询
- `{ email: 1, orderNo: 1 }` — 游客订单查询 (邮箱 + 订单号)
- `{ status: 1, createdAt: -1 }` — 管理员订单列表
- `{ 'payment.paypalOrderId': 1 }` — PayPal 回调查询
- `{ createdAt: -1 }` — 时间排序

**订单号生成规则**: `MZ-{YYYYMMDD}-{4位随机hex大写}`

- 示例: `MZ-20260429-A3F8`
- 日均万单以下碰撞概率可忽略 (65536 种组合/天)
- 人类可读, 便于邮件展示和客服沟通

**订单状态流转**:

```
                    ┌──────────────┐
                    │   cancelled  │
                    └──────┬───────┘
                           ▲ (超时未付/买家取消)
                           │
┌─────────────────┐   ┌────┴──────────┐   ┌────────┐   ┌───────────┐
│ pending_payment ├──►│     paid      ├──►│shipped ├──►│ delivered │
└─────────────────┘   └───────┬───────┘   └────────┘   └───────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │   refunded    │
                      └───────────────┘
```

**商品快照冻结说明**: 订单 items 里存储的是下单瞬间的商品名、价格、图片副本,
不是 Product 的引用。原因:

1. 改了商品价格后历史订单显示不能变
2. PayPal 退款纠纷要求提供"买家下单时看到的价格", 订单记录必须自洽
3. 这是所有电商系统的铁律 (Shopify, WooCommerce, 淘宝都这么做)

### 3.3 PaymentEvent Model (支付事件日志)

文件: `backend/src/models/PaymentEvent.model.ts`

```typescript
{
  orderId: ObjectId,               // 关联 Order._id
  orderNo: String,                 // 冗余存储, 方便查询
  event: String,                   // 'created' | 'approved' | 'captured'
                                   // | 'refunded' | 'disputed' | 'error'
  provider: String,                // 'paypal'
  providerId: String,              // PayPal 的 order/capture/refund ID
  amount: Number,                  // 美分
  currency: String,                // 'USD'
  raw: Mixed,                      // PayPal 原始 API 响应 (完整 JSON)
  ip: String,                      // 请求来源 IP
  createdAt: Date,
}
```

**索引**:

- `{ orderId: 1, createdAt: 1 }` — 按订单查事件时间线
- `{ providerId: 1 }` — PayPal webhook 去重
- `{ event: 1, createdAt: -1 }` — 按事件类型查询

**为什么需要独立的支付事件表**:

- **合规要求**: 跨境支付有 180 天拒付期 (chargeback window), 买家可在半年内
  发起信用卡拒付。需要完整的支付时间线举证。
- **原始响应保留**: PayPal 的 API 响应必须原样保存在 `raw` 字段, 不能只存
  status。这是纠纷时的关键证据。
- **对账数据源**: 每月结算时核对 PayPal 后台金额和系统记录是否一致。
- **调试利器**: 支付问题排查时, 完整的事件流比单个 status 字段有用得多。

---

## 4. API 路由设计

### 4.1 商品路由 (公开)

```
GET /api/products
```

- 返回所有 `status: 'active'` 的商品列表 (含变体、库存、价格)
- 无需认证
- 响应示例:

```json
[
  {
    "slug": "wind-chaser-64",
    "name": { "zh": "追风者 64", "en": "Wind Chaser 64" },
    "price": 29900,
    "currency": "USD",
    "variants": [
      {
        "sku": "WC64-BLK",
        "name": { "zh": "曜石黑", "en": "Obsidian Black" },
        "stock": 50,
        "image": "/brand/product-black.jpg"
      },
      {
        "sku": "WC64-WHT",
        "name": { "zh": "皓月白", "en": "Lunar White" },
        "stock": 30,
        "image": "/brand/product-white.jpg"
      }
    ],
    "images": ["/brand/0.png", "/brand/1.png"],
    "weight": 850,
    "dimensions": { "length": 220, "width": 99, "height": 59 }
  }
]
```

```
GET /api/products/:slug
```

- 返回单个商品详情
- 无需认证

### 4.2 商品管理路由 (管理员)

```
POST   /api/admin/products          # 创建商品
PATCH  /api/admin/products/:id      # 更新商品 (含库存调整)
DELETE /api/admin/products/:id       # 归档商品 (软删除, status → archived)
```

- 全部需要 `requireAdmin` 中间件
- 请求体通过 Zod schema 校验

### 4.3 订单路由 (公开 — 游客下单)

```
POST /api/orders
```

- 创建订单并返回 PayPal 支付链接
- 请求体:

```json
{
  "email": "buyer@example.com",
  "locale": "en",
  "items": [{ "sku": "WC64-BLK", "quantity": 1 }],
  "shippingAddress": {
    "fullName": "John Doe",
    "line1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "country": "US",
    "phone": "+1-555-0100"
  }
}
```

- 响应:

```json
{
  "orderNo": "MZ-20260429-A3F8",
  "total": 34400,
  "currency": "USD",
  "approveUrl": "https://www.sandbox.paypal.com/checkoutnow?token=xxx"
}
```

- 速率限制: 10 次/分钟/IP
- 处理流程:
  1. Zod 校验请求体
  2. 查询商品, 校验 SKU 存在且 status=active
  3. 校验库存充足 (不扣减, 只检查)
  4. 计算小计 + 运费 + 总计
  5. 生成订单号
  6. 调 PayPal Create Order API
  7. 创建 Order 文档 (status: pending_payment)
  8. 记录 PaymentEvent (event: created)
  9. 返回 orderNo + approveUrl

```
GET /api/orders/lookup?email=xxx&orderNo=xxx
```

- 游客订单查询 (邮箱 + 订单号)
- 返回订单状态、物流信息 (脱敏, 不返回完整地址)
- 速率限制: 10 次/分钟/IP

### 4.4 支付路由

```
POST /api/payments/paypal/capture
```

- PayPal 支付完成后的捕获端点
- 请求体: `{ "paypalOrderId": "xxx" }`
- 处理流程:
  1. 根据 paypalOrderId 查找 Order
  2. 校验订单状态为 pending_payment
  3. 调 PayPal Capture Order API
  4. 验证 capture 状态为 COMPLETED
  5. 验证 capture 金额与订单 total 一致 (**关键安全校验**)
  6. 原子扣减库存 (见 §6)
  7. 更新订单状态 → paid, 记录 paypalCaptureId + paidAt
  8. 记录 PaymentEvent (event: captured, raw: PayPal 完整响应)
  9. 异步发送订单确认邮件
  10. 返回更新后的订单

```
POST /api/payments/paypal/webhook
```

- PayPal Webhook 接收端点 (退款、纠纷等异步通知)
- 验证 webhook 签名 (PayPal-Transmission-Sig)
- 处理事件类型:
  - `PAYMENT.CAPTURE.REFUNDED` → 更新订单状态为 refunded
  - `CUSTOMER.DISPUTE.CREATED` → 记录 PaymentEvent (event: disputed)
- 幂等处理: 通过 providerId 去重

### 4.5 订单管理路由 (管理员)

```
GET    /api/admin/orders                # 订单列表 (分页, 状态过滤)
GET    /api/admin/orders/:id            # 订单详情 (含支付事件时间线)
PATCH  /api/admin/orders/:id/ship       # 标记发货
PATCH  /api/admin/orders/:id/refund     # 发起退款
```

**标记发货** 请求体:

```json
{
  "carrier": "云途",
  "trackingNo": "YT2026042900001",
  "trackingUrl": "https://www.yuntrack.com/track?no=YT2026042900001"
}
```

- 更新 fulfillment 字段 + status → shipped
- 异步发送发货通知邮件

**发起退款** 请求体:

```json
{
  "amount": 34400,
  "reason": "Customer requested refund"
}
```

- 调 PayPal Refund Capture API
- 更新订单状态 → refunded
- 记录 PaymentEvent (event: refunded)
- 异步发送退款通知邮件

---

## 5. PayPal 支付集成

### 5.1 集成方式: Server-side Redirect Flow (Orders API v2)

```
┌─────────┐     ┌──────────┐     ┌─────────┐
│  前端    │     │  后端     │     │ PayPal  │
└────┬────┘     └────┬─────┘     └────┬────┘
     │  POST /api/orders              │
     │  {items, address, email}       │
     ├──────────────►│                │
     │               │ 1. 校验库存    │
     │               │ 2. 计算总价    │
     │               │ 3. 创建 Order (pending_payment)
     │               │ 4. POST /v2/checkout/orders
     │               │────────────────►│
     │               │  {id, links[approve]}
     │               │◄────────────────│
     │  {orderNo, approveUrl}         │
     │◄──────────────│                │
     │                                │
     │  window.location = approveUrl  │
     ├────────────────────────────────►│
     │  买家在 PayPal 完成付款         │
     │◄────────────────────────────────│
     │  重定向 → /checkout/success?token=xxx&PayerID=yyy
     │                                │
     │  POST /api/payments/paypal/capture
     │  {paypalOrderId}               │
     ├──────────────►│                │
     │               │ 5. POST /v2/checkout/orders/{id}/capture
     │               │────────────────►│
     │               │  {status: COMPLETED, purchase_units}
     │               │◄────────────────│
     │               │ 6. 验证金额匹配 │
     │               │ 7. 原子扣库存   │
     │               │ 8. Order → paid │
     │               │ 9. PaymentEvent │
     │               │ 10. 发确认邮件  │
     │  {order}      │                │
     │◄──────────────│                │
```

### 5.2 PayPal API 调用细节

**认证**: OAuth 2.0 Client Credentials

```
POST https://api-m.sandbox.paypal.com/v1/oauth2/token
Authorization: Basic base64(CLIENT_ID:CLIENT_SECRET)
Content-Type: application/x-www-form-urlencoded
Body: grant_type=client_credentials
```

- Access token 缓存在内存, 过期前自动刷新
- 生产环境 base URL: `https://api-m.paypal.com`

**创建订单**:

```
POST /v2/checkout/orders
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "reference_id": "MZ-20260429-A3F8",
    "description": "Wind Chaser 64 - Obsidian Black x1",
    "amount": {
      "currency_code": "USD",
      "value": "344.00",
      "breakdown": {
        "item_total": { "currency_code": "USD", "value": "299.00" },
        "shipping": { "currency_code": "USD", "value": "45.00" }
      }
    },
    "items": [{
      "name": "Wind Chaser 64 - Obsidian Black",
      "sku": "WC64-BLK",
      "unit_amount": { "currency_code": "USD", "value": "299.00" },
      "quantity": "1",
      "category": "PHYSICAL_GOODS"
    }],
    "shipping": {
      "name": { "full_name": "John Doe" },
      "address": {
        "address_line_1": "123 Main St",
        "admin_area_2": "San Francisco",
        "admin_area_1": "CA",
        "postal_code": "94102",
        "country_code": "US"
      }
    }
  }],
  "application_context": {
    "return_url": "https://modelzone.com/en/checkout/success",
    "cancel_url": "https://modelzone.com/en/checkout/cancel",
    "brand_name": "ModelZone",
    "shipping_preference": "SET_PROVIDED_ADDRESS",
    "user_action": "PAY_NOW"
  }
}
```

**捕获支付**:

```
POST /v2/checkout/orders/{paypal_order_id}/capture
```

- 响应中的 `purchase_units[0].payments.captures[0].amount.value` 必须与
  订单 total 一致, 否则拒绝 (防止金额篡改攻击)

**退款**:

```
POST /v2/payments/captures/{capture_id}/refund
{
  "amount": { "currency_code": "USD", "value": "344.00" },
  "note_to_payer": "Refund for order MZ-20260429-A3F8"
}
```

### 5.3 PayPal Service 架构

文件: `backend/src/services/paypal.service.ts`

```typescript
class PayPalService {
  private baseUrl: string // sandbox vs live
  private clientId: string
  private clientSecret: string
  private accessToken: string | null
  private tokenExpiresAt: number

  // 自动管理 OAuth token 生命周期
  private async getAccessToken(): Promise<string>

  // 核心方法
  async createOrder(params: CreatePayPalOrderParams): Promise<PayPalOrder>
  async captureOrder(paypalOrderId: string): Promise<PayPalCapture>
  async refundCapture(captureId: string, amount: number): Promise<PayPalRefund>
  async verifyWebhookSignature(headers: Record<string, string>, body: string): Promise<boolean>
}
```

- 单例模式, 应用启动时初始化
- Access token 内存缓存, 过期前 60 秒自动刷新
- 所有 API 调用带超时 (10s) 和重试 (1 次, 仅网络错误)
- 完整的错误映射: PayPal 错误码 → 用户友好的错误消息

### 5.4 安全关键点

1. **金额验证**: capture 响应的金额必须与订单 total 精确匹配, 防止中间人篡改
2. **幂等性**: capture 操作用 paypalOrderId 做幂等键, 重复请求不会重复扣款
3. **Webhook 签名验证**: 所有 webhook 请求必须验证 PayPal 签名, 防止伪造
4. **HTTPS only**: PayPal API 调用全部走 HTTPS, 生产环境 return_url 必须 HTTPS
5. **Secret 不落前端**: PAYPAL_CLIENT_SECRET 只在后端使用, 前端只需要 CLIENT_ID

---

## 6. 库存管理策略

### 6.1 扣减时机

**PayPal capture 成功后扣减**, 不在创建订单时扣减。

理由: 买家可能创建订单后放弃付款 (关闭 PayPal 页面)。如果创建时就扣库存,
这些库存会被"锁死"直到订单超时取消。对于非秒杀场景, 付款后扣减是最简单可靠的策略。

### 6.2 原子扣减实现

```typescript
// 单个 SKU 的原子扣减
async function deductStock(productId: string, sku: string, quantity: number): Promise<boolean> {
  const result = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
      variants: {
        $elemMatch: {
          sku: sku,
          stock: { $gte: quantity }, // 条件: 库存 >= 需求量
        },
      },
    },
    {
      $inc: { 'variants.$.stock': -quantity }, // 原子减少
    },
    { new: true },
  )
  return result !== null // null = 库存不足, 扣减失败
}
```

**为什么不用"先查后扣"两步操作**: 并发场景下会超卖。两个请求同时查到 stock=1,
都认为够, 都去扣减, 结果 stock=-1。`findOneAndUpdate` 是原子操作,
查询条件和更新在同一个数据库操作中完成, 不会出现竞态条件。

### 6.3 多 SKU 订单的扣减

如果订单包含多个不同 SKU (V1 不太可能, 但预留):

```typescript
// 使用 MongoDB session 做事务, 保证全部成功或全部回滚
const session = await mongoose.startSession()
try {
  await session.withTransaction(async () => {
    for (const item of order.items) {
      const ok = await deductStock(item.productId, item.sku, item.quantity)
      if (!ok) throw new Error(`库存不足: ${item.sku}`)
    }
  })
} finally {
  await session.endSession()
}
```

注意: MongoDB 事务需要 replica set。MongoDB Atlas M0 (免费版) 支持事务。
本地开发用 `mongodb-memory-server` 也支持。

### 6.4 库存恢复

退款时需要恢复库存:

```typescript
await ProductModel.findOneAndUpdate(
  { _id: productId, 'variants.sku': sku },
  { $inc: { 'variants.$.stock': quantity } },
)
```

### 6.5 超时订单清理

创建后 30 分钟未付款的订单自动取消:

```typescript
// 定时任务 (每 5 分钟执行一次)
const expiredOrders = await OrderModel.find({
  status: 'pending_payment',
  createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
})
for (const order of expiredOrders) {
  order.status = 'cancelled'
  await order.save()
  // 不需要恢复库存, 因为 pending_payment 阶段没有扣减
}
```

实现方式: `setInterval` 在后端进程内运行。V1 单实例部署, 不需要分布式锁。

---

## 7. 前端页面规划

### 7.1 新增页面

| 路径                         | 类型             | 说明                                                 |
| ---------------------------- | ---------------- | ---------------------------------------------------- |
| `/[locale]/checkout`         | Client Component | 结算页: 商品确认 + 地址表单 + 运费计算 + PayPal 按钮 |
| `/[locale]/checkout/success` | Client Component | 支付成功落地页: 触发 capture, 显示订单确认           |
| `/[locale]/checkout/cancel`  | Static           | 支付取消页: 提示 + 返回商品页链接                    |
| `/[locale]/order-lookup`     | Client Component | 订单查询: 邮箱 + 订单号 → 订单状态 + 物流            |
| `/admin/orders`              | Client Component | 管理员订单列表                                       |
| `/admin/orders/[id]`         | Client Component | 管理员订单详情 + 发货/退款操作                       |
| `/admin/products`            | Client Component | 管理员商品管理 (CRUD + 库存调整)                     |

### 7.2 结算页设计

```
┌─────────────────────────────────────────────────┐
│  ModelZone Checkout                              │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┐  Wind Chaser 64               │
│  │   商品图片    │  Obsidian Black               │
│  │              │  Qty: 1                        │
│  └──────────────┘  $299.00                       │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  收货信息                                        │
│  ┌─────────────────────────────────────────┐    │
│  │ Full Name    [                         ] │    │
│  │ Address      [                         ] │    │
│  │ City         [            ] State [    ] │    │
│  │ Postal Code  [            ] Country [▼] │    │
│  │ Phone        [                         ] │    │
│  │ Email *      [                         ] │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  Subtotal                           $299.00      │
│  Shipping (US Standard)              $45.00      │
│  ─────────────────────────────────────────────── │
│  Total                              $344.00      │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │     🔒 Pay with PayPal — $344.00       │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  🔒 Secure checkout · 180-day buyer protection  │
│                                                  │
└─────────────────────────────────────────────────┘
```

**关键 UX 决策**:

- 单页完成, 不分步骤。步骤越多, 流失越大。
- 国家选择后立即计算运费并更新总价。
- Email 必填且放在地址区域内 (不单独一步), 减少摩擦。
- PayPal 按钮上显示总价, 消除"点了才知道多少钱"的焦虑。
- 底部安全标识 (锁图标 + buyer protection) 建立信任。

### 7.3 现有首页 Buy 组件改造

当前 `buy.tsx` 的 CTA 按钮指向 `#contact`。改造为:

- 新增颜色选择器 (黑/白)
- 显示实时库存状态 ("In Stock" / "Low Stock" / "Out of Stock")
- CTA 按钮改为 "Buy Now — $299" → 点击跳转 `/checkout?sku=WC64-BLK`

---

## 8. 运费策略

### 8.1 V1: 固定运费表

按目的国 ISO 3166-1 alpha-2 代码查表, 不对接物流 API。

```typescript
// backend/src/config/shipping.ts
export const SHIPPING_RATES: Record<string, number> = {
  // 美洲
  US: 4500, // $45.00 — 美国专线 7-15 工作日
  CA: 5000, // $50.00 — 加拿大

  // 欧洲
  GB: 5500, // $55.00 — 英国
  DE: 5500, // $55.00 — 德国
  FR: 5500, // $55.00 — 法国
  IT: 5500, // $55.00 — 意大利
  ES: 5500, // $55.00 — 西班牙
  NL: 5500, // $55.00 — 荷兰

  // 亚太
  JP: 4000, // $40.00 — 日本
  KR: 4000, // $40.00 — 韩国
  AU: 6000, // $60.00 — 澳大利亚
  NZ: 6500, // $65.00 — 新西兰
  SG: 3500, // $35.00 — 新加坡

  // 默认
  DEFAULT: 6500, // $65.00 — 其他国家
}

export function getShippingRate(countryCode: string): number {
  return SHIPPING_RATES[countryCode.toUpperCase()] ?? SHIPPING_RATES.DEFAULT!
}
```

**说明**:

- 以上价格为占位值, 需根据实际物流商 (云途/4PX) 报价填入
- Wind Chaser 64 包装尺寸 220×99×59mm, 重量约 850g
- 运费包含出口报关、国际运输、目的国清关、末端配送全链路
- 前端结算页选择国家后立即调用此表计算运费, 无需后端请求

### 8.2 V2 规划: 物流 API 对接

日均稳定出单后:

- 对接云途/4PX API, 实时获取运费报价
- 支持多物流方式选择 (标准/快递)
- 自动同步物流轨迹到订单
- 自动发送物流更新邮件

---

## 9. 邮件通知系统

### 9.1 复用现有基础设施

基于现有 `backend/src/services/mailer.service.ts` 扩展。
使用 Nodemailer + SMTP (已配置), 新增三个邮件模板。

### 9.2 邮件模板

#### 9.2.1 订单确认邮件 (付款成功后)

触发时机: PayPal capture 成功, 订单状态 → paid
收件人: 买家 email
主题: `[ModelZone] Order Confirmed — {orderNo}` / `[ModelZone] 订单确认 — {orderNo}`

内容:

- 订单号
- 商品名称、SKU、数量、单价
- 小计、运费、总计
- 收货地址
- 预计配送时间
- 订单查询链接: `{SITE_URL}/{locale}/order-lookup?orderNo={orderNo}`
- 客服联系方式

#### 9.2.2 发货通知邮件 (管理员标记发货后)

触发时机: 管理员填写物流信息, 订单状态 → shipped
收件人: 买家 email
主题: `[ModelZone] Your Order Has Shipped — {orderNo}`

内容:

- 订单号
- 物流商名称
- 物流单号
- 物流查询链接 (可点击)
- 预计送达时间

#### 9.2.3 退款通知邮件 (发起退款后)

触发时机: PayPal 退款成功, 订单状态 → refunded
收件人: 买家 email
主题: `[ModelZone] Refund Processed — {orderNo}`

内容:

- 订单号
- 退款金额
- 退款方式 (原路退回 PayPal)
- 预计到账时间 (3-5 个工作日)

### 9.3 邮件语言

根据订单的 `locale` 字段决定邮件模板语言 (en/zh)。
HTML 模板使用内联样式, 兼容主流邮件客户端 (Gmail, Outlook, Apple Mail)。

---

## 10. 安全加固清单

### 10.1 已完成 (2026-04-29, 见附录 §15)

- [x] CSRF 双提交 Cookie 防护
- [x] Visitor/Admin JWT 密钥隔离
- [x] Refresh token 版本校验 (tokenVersion)
- [x] NoSQL 注入防护 (查询参数白名单)
- [x] CSP 启用 (生产环境)
- [x] Session 创建速率限制
- [x] Next.js 图片域名白名单
- [x] 前端 CSRF token 自动传递

### 10.2 交易闭环新增安全要求

- [ ] PayPal capture 金额验证 (后端比对, 防篡改)
- [ ] PayPal webhook 签名验证
- [ ] 订单创建速率限制 (10/min/IP)
- [ ] 订单查询速率限制 (10/min/IP, 防枚举)
- [ ] 支付回调幂等性 (paypalOrderId 去重)
- [ ] 敏感字段脱敏 (订单查询不返回完整地址)
- [ ] PayPal credentials 仅后端使用, 不暴露到前端
- [ ] 退款操作审计日志
- [ ] CSP 更新: 添加 PayPal 域名到 connect-src
- [ ] 订单超时自动取消 (30 分钟)

### 10.3 PCI DSS 合规说明

本系统 **不处理信用卡信息**。V1 使用 PayPal 托管收银台 (redirect flow),
买家在 PayPal 官方页面输入支付信息, 我们的服务器从不接触卡号、CVV 等敏感数据。
这使我们处于 PCI DSS SAQ-A 级别 (最低合规要求), 无需额外的 PCI 认证。

V2 对接信用卡收单时, 必须使用收单机构提供的 PCI DSS 合规收银台组件
(如连连/Airwallex 的 iframe 嵌入), 绝不自行处理卡信息。

---

## 11. Shared 包扩展

### 11.1 新增 Schema 文件

```
shared/src/schemas/product.schema.ts    # Product 相关 Zod schemas + types
shared/src/schemas/order.schema.ts      # Order 相关 Zod schemas + types
shared/src/schemas/payment.schema.ts    # PaymentEvent + PayPal 相关 types
shared/src/schemas/shipping.schema.ts   # ShippingAddress schema
```

### 11.2 新增常量

```typescript
// shared/src/constants.ts (追加)

/** Product statuses. */
export const PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

/** Order statuses. */
export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Payment event types. */
export const PAYMENT_EVENTS = [
  'created',
  'approved',
  'captured',
  'refunded',
  'disputed',
  'error',
] as const
export type PaymentEventType = (typeof PAYMENT_EVENTS)[number]

/** Payment methods. */
export const PAYMENT_METHODS = ['paypal'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** Supported shipping countries (ISO 3166-1 alpha-2). */
export const SHIPPING_COUNTRIES = [
  'US',
  'CA',
  'GB',
  'DE',
  'FR',
  'IT',
  'ES',
  'NL',
  'JP',
  'KR',
  'AU',
  'NZ',
  'SG',
] as const
```

### 11.3 导出更新

```typescript
// shared/src/schemas/index.ts (追加)
export * from './product.schema'
export * from './order.schema'
export * from './payment.schema'
export * from './shipping.schema'
```

---

## 12. 环境变量

### 12.1 Backend 新增 (.env)

```env
# ---- PayPal ----
# Sandbox: https://developer.paypal.com/dashboard/applications/sandbox
# Live:    https://developer.paypal.com/dashboard/applications/live
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox                    # sandbox | live
PAYPAL_WEBHOOK_ID=your_webhook_id      # Webhook 签名验证用

# ---- Order ----
ORDER_EXPIRY_MINUTES=30                # 未付款订单超时时间 (分钟)
```

### 12.2 Frontend 新增 (.env.local)

```env
# PayPal Client ID (公开, 用于构建 approve URL 的 fallback)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
```

### 12.3 Render Dashboard Secrets 新增

```
PAYPAL_CLIENT_ID      (sync: false)
PAYPAL_CLIENT_SECRET  (sync: false)
PAYPAL_MODE           (value: live)
PAYPAL_WEBHOOK_ID     (sync: false)
```

### 12.4 Zod 环境校验更新

`backend/src/config/env.ts` 的 `EnvSchema` 追加:

```typescript
PAYPAL_CLIENT_ID: z.string().min(1, 'PAYPAL_CLIENT_ID is required'),
PAYPAL_CLIENT_SECRET: z.string().min(1, 'PAYPAL_CLIENT_SECRET is required'),
PAYPAL_MODE: z.enum(['sandbox', 'live']).default('sandbox'),
PAYPAL_WEBHOOK_ID: z.string().optional(),
ORDER_EXPIRY_MINUTES: z.coerce.number().int().positive().default(30),
```

---

## 13. 开发排期

### 13.1 阶段划分

| 阶段    | 内容                                           | 预估     | 依赖   |
| ------- | ---------------------------------------------- | -------- | ------ |
| **P1**  | Shared schemas + Product model + 商品 CRUD API | 1 天     | 无     |
| **P2**  | 管理员商品管理页面                             | 0.5 天   | P1     |
| **P3**  | Order + PaymentEvent model + 下单 API          | 1 天     | P1     |
| **P4**  | PayPal Service + 支付集成 (create + capture)   | 1.5 天   | P3     |
| **P5**  | 前端结算页 + 成功/取消页                       | 1.5 天   | P4     |
| **P6**  | 首页 Buy 组件改造 (颜色选择 + Buy Now)         | 0.5 天   | P1, P5 |
| **P7**  | 管理员订单列表/详情/发货                       | 1 天     | P4     |
| **P8**  | 邮件模板 (确认/发货/退款)                      | 0.5 天   | P7     |
| **P9**  | PayPal Webhook + 退款流程                      | 1 天     | P4     |
| **P10** | 订单查询页 + 超时清理                          | 0.5 天   | P4     |
|         | **总计**                                       | **9 天** |        |

### 13.2 关键路径

```
P1 → P3 → P4 → P5 (结算页可用, 支付闭环跑通)
                 ↘ P7 → P8 (管理端可用)
                 ↘ P9 (Webhook + 退款)
```

**最短可演示路径**: P1 → P3 → P4 → P5 = 5 天, 可跑通完整的
"浏览商品 → 下单 → PayPal 付款 → 订单确认" 闭环。

### 13.3 并行任务

- PayPal 企业账户注册 (甲方操作, 与开发并行, 1-3 工作日)
- Sandbox 开发不依赖企业账户审核
- P2 (商品管理页面) 和 P3 (Order model) 可并行

---

## 14. 测试策略

### 14.1 单元测试 (Vitest)

| 测试文件                | 覆盖内容                                 |
| ----------------------- | ---------------------------------------- |
| `product.test.ts`       | Product CRUD, 库存扣减原子性, 变体校验   |
| `order.test.ts`         | 订单创建, 状态流转, 订单号生成, 超时取消 |
| `paypal.test.ts`        | PayPal API mock, 金额验证, 错误处理      |
| `payment-event.test.ts` | 事件记录, 幂等性                         |
| `shipping.test.ts`      | 运费计算, 国家代码校验                   |

### 14.2 集成测试 (Supertest)

| 测试文件                           | 覆盖内容                                       |
| ---------------------------------- | ---------------------------------------------- |
| `orders.integration.test.ts`       | 完整下单流程 (mock PayPal), 库存扣减, 邮件发送 |
| `admin-orders.integration.test.ts` | 管理员订单操作, 发货, 退款                     |
| `products.integration.test.ts`     | 商品 CRUD API, 权限校验                        |

### 14.3 PayPal Sandbox 端到端测试

手动测试清单:

- [ ] 创建订单 → 跳转 PayPal → 完成付款 → 回调成功
- [ ] 创建订单 → 跳转 PayPal → 取消付款 → 回调取消页
- [ ] 重复 capture 同一订单 (幂等性)
- [ ] 库存不足时下单 (应拒绝)
- [ ] 管理员发起退款 → PayPal 退款成功
- [ ] Webhook 接收退款/纠纷通知
- [ ] 订单超时自动取消
- [ ] 邮件发送 (确认/发货/退款)

### 14.4 前端测试

| 测试文件                | 覆盖内容                           |
| ----------------------- | ---------------------------------- |
| `checkout.test.tsx`     | 结算页表单校验, 运费计算, 提交流程 |
| `order-lookup.test.tsx` | 订单查询表单, 结果展示             |

---

## 15. 附录: 已完成的安全加固

> 以下安全修复已于 2026-04-29 实施并通过全部 33 个测试。

### 15.1 CSRF 双提交 Cookie 防护

**文件**: `backend/src/middleware/csrf.middleware.ts`

**机制**: 每个响应设置 `mojing_csrf` cookie (JS 可读, 非 httpOnly)。
所有 POST/PUT/PATCH/DELETE 请求必须在 `X-CSRF-Token` 头中回传 cookie 值。
跨站攻击者无法读取我们的 cookie (SameSite + CORS 限制), 因此无法伪造该头。

**豁免**:

- GET/HEAD/OPTIONS 请求 (安全方法)
- 携带 Bearer token 的请求 (非 cookie 认证, 不受 CSRF 影响)
- 但 `/api/auth/refresh` 即使有 Bearer 也强制校验 (因为它依赖 cookie)
- 测试环境 (NODE_ENV=test) 跳过

**前端适配**:

- `frontend/lib/api.ts`: `api()` 函数自动在非安全方法上附加 `X-CSRF-Token`
- `frontend/components/site/contact-form.tsx`: 原生 fetch 调用也已适配

### 15.2 Visitor/Admin JWT 密钥隔离

**文件**: `backend/src/services/token.service.ts`

**问题**: visitor session token 和 admin access token 共用 `JWT_ACCESS_SECRET`。
理论上精心构造的 visitor token 可能被误认为 admin token。

**修复**:

- visitor session 现在用 `HMAC-SHA256(JWT_ACCESS_SECRET, 'visitor-session-v1')`
  派生的独立密钥签名
- `verifyAccessToken()` 增加 payload 结构校验 (必须包含 sub + role + username)

### 15.3 Refresh Token 版本校验

**文件**: `backend/src/routes/auth.routes.ts`

**问题**: User model 有 `tokenVersion` 字段但从未使用。refresh token 签发后
在过期前无法吊销。

**修复**: `/api/auth/refresh` 现在比对 token 的 `iat` 与用户的 `tokenVersion`。
密码修改或账户禁用后, 递增 `tokenVersion` 即可使所有旧 refresh token 失效。

### 15.4 NoSQL 注入防护

**文件**: `backend/src/routes/lead.routes.ts`

**问题**: `req.query.status` 直接放入 MongoDB 查询, 攻击者可传
`?status[$ne]=null` 绕过过滤。

**修复**: status 参数现在白名单校验, 只接受 `LEAD_STATUSES` 中的合法值。

### 15.5 CSP 启用

**文件**: `backend/src/server.ts`

**修复**: 生产环境启用 Content-Security-Policy:

- `default-src: 'self'`
- `script-src: 'self'`
- `style-src: 'self' 'unsafe-inline'` (Tailwind 需要)
- `frame-src: 'none'`
- `object-src: 'none'`
- `form-action: 'self'`

交易闭环上线时需更新 `connect-src` 添加 PayPal API 域名。

### 15.6 其他修复

- `/api/chat/session` 新增 10 次/分钟速率限制
- Next.js `images.remotePatterns` 从 `**` 收紧到已知域名白名单
- 日志 redact 规则已覆盖 authorization, cookie, password, token

---

> **文档结束**
>
> 本文档随开发进展持续更新。每个阶段完成后在对应章节标注完成日期。
> 重大设计变更需在 `docs/DECISIONS.md` 中新增 ADR 条目并交叉引用。
