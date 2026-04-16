![G-Master API](./web/public/logo.png)

# G-Master API

**自托管 AI 网关、中转服务与模型资产管理面板**

简体中文（默认） | [繁體中文](./README.zh_TW.md) | [日本語](./README.ja.md) | [Français](./README.fr.md)

[![Release](https://img.shields.io/github/v/release/HereditaryDog/G-Master-API?display_name=tag)](https://github.com/HereditaryDog/G-Master-API/releases)
[![License](https://img.shields.io/github/license/HereditaryDog/G-Master-API)](./LICENSE)
[![Go](https://img.shields.io/badge/Go-1.25%2B-00ADD8?logo=go&logoColor=white)](./go.mod)
[![GHCR](https://img.shields.io/badge/GHCR-g--master--api-2496ED?logo=docker&logoColor=white)](https://github.com/HereditaryDog/G-Master-API/pkgs/container/g-master-api)

快速开始 • 主要特性 • 部署方式 • 文档 • 更新日志 • 帮助与反馈

## 项目说明

> [!IMPORTANT]
> - `G-Master API` 是基于 [`QuantumNous/new-api`](https://github.com/QuantumNous/new-api) 持续同步的品牌化分支，继续保留 `AGPL-3.0` 与上游致谢。
> - 本仓库面向 **自托管、多模型统一接入、用户与令牌管理、渠道管理、计费与控制台运营** 场景。
> - 当前公开站点为 `https://gmapi.fun`，OpenAI 兼容基址为 `https://gmapi.fun/v1`，用户/管理接口基址为 `https://gmapi.fun/api`。
> - 若你计划对公网开放服务，请自行评估合规、资费、安全、日志留存、备份和运维责任。

当前稳定版本：[`v0.12.11-gmaster.1`](https://github.com/HereditaryDog/G-Master-API/releases/tag/v0.12.11-gmaster.1)

## 与上游的主要差异

- 对外产品名统一为 `G-Master API`，仓库链接、公共文案、主页与文档入口都以当前品牌为准。
- 默认部署方式调整为 **直接构建当前仓库源码**，而不是仅依赖上游镜像。
- 默认服务名、容器名、systemd 服务名统一为 `g-master-api`。
- 面向当前业务保留 `标准用户组 / VIP用户组` 等分组策略，以及相关充值升级逻辑。
- 维护独立的 GitHub Release、GHCR 镜像、Apifox 导入产物与中文优先文档。

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone https://github.com/HereditaryDog/G-Master-API.git
cd G-Master-API

# 复制环境变量模板
cp .env.example .env

# 启动服务
docker compose up -d --build
```

启动完成后，访问 `http://127.0.0.1:3000` 即可进入初始化流程。

### 升级当前部署

```bash
git pull
docker compose up -d --build
```

### 回滚到指定版本

```bash
git checkout <commit-or-tag>
docker compose up -d --build
```

> [!TIP]
> 升级或回滚前，建议先备份数据库与 `data/`、`logs/` 目录。

## 文档

| 分类 | 链接 | 说明 |
| --- | --- | --- |
| 对外文档 | [gmapi.fun/docs](https://gmapi.fun/docs) | 公开站点文档入口 |
| 部署说明 | [docs/installation/BT.md](./docs/installation/BT.md) | 宝塔 / VPS 场景说明 |
| 接口整理 | [docs/apifox/README.md](./docs/apifox/README.md) | Apifox 导入与接口整理 |
| 贡献指南 | [CONTRIBUTING.md](./CONTRIBUTING.md) | 提交 PR、Issue 与协作约定 |
| 更新日志 | [CHANGELOG.md](./CHANGELOG.md) | 版本历史与发布记录 |
| 上游致谢 | [ACKNOWLEDGMENTS.md](./ACKNOWLEDGMENTS.md) | 分支来源、授权与归属 |
| 安全策略 | [.github/SECURITY.md](./.github/SECURITY.md) | 漏洞反馈与安全提醒 |

## 主要特性

### 网关与协议兼容

- 兼容 OpenAI Chat Completions、Responses、Realtime 等主流接口。
- 支持 Claude Messages、Google Gemini 原生格式，以及 Embeddings、Images、Audio、Video、Rerank 等能力。
- 支持模型映射、参数透传、渠道级能力控制与多模型统一路由。

### 控制台与运营能力

- 用户、令牌、渠道、模型、订阅、兑换码、分组、系统设置统一在同一套管理面板完成。
- 提供数据看板、日志查询、额度与成本展示、模型价格展示等运营能力。
- 支持 OAuth 登录、2FA、Passkey、访问限制、风控与多种支付/充值流程。

### 存储与部署兼容

- 支持 SQLite、MySQL、PostgreSQL。
- 支持 Redis 与内存缓存组合。
- 默认提供源码构建的 Docker Compose 部署方式，适合本地验收与服务器部署。

### G-Master 分支交付层

- 中文优先的仓库文档、对外主页与文档门户。
- 独立 GitHub Release 与 GHCR 镜像发布链路。
- 独立维护的 Apifox 导入文件、公共链接和品牌资源。

## 部署方式

### 1. 本地或服务器源码部署

适合需要完整保留当前仓库品牌资源、前端页面和最新文档的场景。

```bash
docker compose up -d --build
```

### 2. GitHub Release 成品

- 发布页：<https://github.com/HereditaryDog/G-Master-API/releases>
- 适合下载预编译二进制做自定义部署。

### 3. GHCR 镜像

- 镜像地址：`ghcr.io/hereditarydog/g-master-api:latest`
- 适合纳入现有 CI/CD 或镜像仓库流程。

### 4. 宝塔 / 腾讯云 / Cloudflare

- 宝塔部署说明见 [docs/installation/BT.md](./docs/installation/BT.md)
- 当前公开站点接入了 `Cloudflare DNS / TLS`
- 若沿用 `gmapi.fun` 域名，可继续复用现有公开接入地址

## 仓库结构

- [`router/`](./router) HTTP 路由入口
- [`controller/`](./controller) 控制器与请求处理
- [`service/`](./service) 业务逻辑
- [`model/`](./model) GORM 数据模型与数据库访问
- [`relay/`](./relay) 模型中转、协议兼容与渠道适配
- [`web/`](./web) React 前端控制台
- [`docs/`](./docs) 部署文档、Apifox 资料与说明
- [`bin/`](./bin) 辅助脚本、备份和部署工具

## 常用文件

- [`docker-compose.yml`](./docker-compose.yml)
- [`.env.example`](./.env.example)
- [`VERSION`](./VERSION)
- [`CHANGELOG.md`](./CHANGELOG.md)
- [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md)
- [`docs/installation/BT.md`](./docs/installation/BT.md)

## 帮助与反馈

- 问题反馈：<https://github.com/HereditaryDog/G-Master-API/issues>
- 版本发布：<https://github.com/HereditaryDog/G-Master-API/releases>
- 安全问题：<https://github.com/HereditaryDog/G-Master-API/security/advisories/new>

提交 Issue 之前，建议先确认：

- 是否已经阅读 [README](./README.md)、[部署说明](./docs/installation/BT.md) 与 [更新日志](./CHANGELOG.md)
- 是否能稳定复现问题
- 是否已经确认不是上游已知行为或配置问题

## 许可证与上游致谢

本项目继续使用 [`AGPL-3.0`](./LICENSE)。

上游来源与授权说明请见 [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md)。如果你要二次分发、商用或对外提供网络服务，请先确认自己理解 AGPL 在网络服务场景下的义务。

---

如果这个仓库对你有帮助，欢迎 Star。
