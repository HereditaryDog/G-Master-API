# Gaster Code OAuth 登录管理设计

## 背景

管理员需要在 G-Master API 控制台查看哪些用户通过 OAuth 授权登录了 Gaster Code 桌面端，以及这些授权产生的用量。当前 Gaster Code 登录链路已经记录授权请求、桌面会话和自动创建的 `Gaster Code Desktop` provider token，但缺少面向管理员的聚合查询和页面。

## 目标

- 在管理员侧边栏新增 `OAuth登录管理` 页面。
- 按 Gaster Code OAuth 授权会话展示记录，一次授权一行。
- 展示用户、分组、客户端、授权状态、provider token 分组、用量、请求数、token 数、授权时间、最后使用时间和过期时间。
- 用量只统计该会话绑定的 `provider_token_id` 对应调用日志，避免混入用户网页端或其他 API Key 的用量。

## 非目标

- 不管理普通第三方 OAuth 账号绑定记录。
- 不提供撤销会话或禁用 provider token 的操作按钮。
- 不新增数据库表。
- 不改变 Gaster Code 登录、发 token 或计费逻辑。

## 后端设计

新增管理员接口：

`GET /api/gaster-code/admin/oauth-logins`

权限：`middleware.AdminAuth()`

查询参数：

- `p`、`page_size`：复用现有分页参数。
- `keyword`：可匹配用户名、显示名、邮箱、客户端名或用户 ID。
- `status`：可选 `active`、`expired`、`revoked`。

返回结构复用 `common.PageInfo`：

- `items`：会话行数据。
- `total`：过滤后的总数。

每行字段：

- `session_id`
- `user_id`
- `username`
- `display_name`
- `email`
- `user_group`
- `user_status`
- `client_name`
- `client_version`
- `provider_token_id`
- `provider_token_name`
- `provider_token_group`
- `provider_token_status`
- `provider_token_used_quota`
- `session_status`
- `created_at`
- `last_used_at`
- `expires_at`
- `revoked_at`
- `request_count`
- `used_quota`
- `prompt_tokens`
- `completion_tokens`

状态计算：

- `revoked_at > 0` => `revoked`
- 否则 `expires_at <= now` => `expired`
- 否则 `active`

用量统计：

- 从 `logs` 表按 `token_id = provider_token_id` 且 `type = LogTypeConsume` 聚合。
- 聚合字段为 `count(*)`、`sum(quota)`、`sum(prompt_tokens)`、`sum(completion_tokens)`。
- `provider_token_id = 0` 的会话用量返回 0。
- 查询使用 GORM 构建，保持 SQLite、MySQL、PostgreSQL 兼容。

## 前端设计

新增页面路由：

`/console/oauth-login`

入口：

- `web/src/App.jsx` 新增 lazy page 和 `AdminRoute`。
- `web/src/components/layout/SiderBar.jsx` 管理员区域新增 `OAuth登录管理`。
- `web/src/hooks/common/useSidebar.js` 与管理员侧边栏设置默认配置新增 `oauth_login`。
- 系统设置中的侧边栏模块管理新增该开关。

页面布局：

- 使用现有 `CardPro` + `CardTable` 风格。
- 顶部提供关键词输入、状态筛选、刷新按钮。
- 表格支持分页和移动端紧凑模式。
- 使用已有 `renderQuota`、`renderNumber`、`timestamp2string`、`renderGroup`。

表格列：

- 用户：用户名、显示名、用户 ID。
- 用户分组。
- 客户端：名称和版本。
- 授权状态：active / expired / revoked。
- Provider Key：token ID、名称、分组、状态。
- 用量：聚合消耗额度，辅助显示 provider token 累计已用额度。
- 请求数。
- Tokens：prompt + completion。
- 授权时间。
- 最后使用。
- 过期时间。

## 测试计划

后端按 TDD 增加模型层测试：

- 有两个 Gaster Code 会话时，接口模型返回两行并按创建时间倒序。
- 每行只统计对应 provider token 的消费日志。
- `active`、`expired`、`revoked` 状态过滤正确。
- keyword 可匹配用户名和客户端名。

前端验证：

- `bun run build` 通过。
- 如本地依赖允许，打开控制台页面确认路由、侧边栏入口和表格渲染。

## 风险与处理

- `logs` 表在部分部署中可能与主表分库。当前项目默认 `LOG_DB` 可独立，第一版先使用两步聚合：先查会话行，再按 provider token IDs 从 `LOG_DB` 批量统计，避免跨库 join。
- 历史会话未领取 provider token 时无法统计用量，页面显示 0 并保留会话记录。
- 同一用户多次授权会显示多行，这是本方案的预期行为，方便管理员区分设备和客户端版本。
