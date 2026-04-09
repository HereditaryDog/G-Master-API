# 系统 API

这部分接口主要用于用户自助管理，不建议与管理员接口混在同一个公开文档目录中。

## 推荐公开的系统接口

### 系统状态

- `GET /api/status`
- `GET /api/status/test`

### 模型与价格

- `GET /api/models`
- `GET /api/pricing`

### 用户信息

- `POST /api/user/login`
- `POST /api/user/register`
- `POST /api/user/logout`
- `GET /api/user/self`
- `PUT /api/user/self`

### 令牌管理

- `GET /api/token/`
- `POST /api/token/`
- `PUT /api/token/`
- `GET /api/token/search`
- `DELETE /api/token/{id}`
- `POST /api/token/batch`

### 个人数据

- `GET /api/data/self`
- `GET /api/log/self`
- `GET /api/log/self/stat`
- `GET /api/task/self`
- `GET /api/mj/self`

## 不建议公开的接口

以下内容更适合放到内部文档：

- 渠道管理
- 用户管理全量接口
- 日志全集
- 系统设置
- 供应商与模型同步
- 充值回调 / 支付回调
