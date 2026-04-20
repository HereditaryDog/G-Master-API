# G-Master API Apifox 文档包

这套文件用于把 `G-Master API` 快速整理成类似 Apifox 在线文档站的结构。

当前线上公开文档入口：

- AI 客户端配置文档：<https://gmapi.fun/docs/ai-client>
- OpenClaw 英文页：<https://gmapi.fun/docs/openclaw-en>

以上两个站内地址会通过 `302` 跳转到 Apifox 公开分享页，不在站内反代 Apifox 内容。

## 目录说明

- `dist/gmaster-public.openapi.json`
  适合对外公开的接口规范，包含模型中转接口和用户侧系统接口。
- `dist/gmaster-relay.openapi.json`
  仅模型中转接口，适合独立做开发者文档。
- `dist/gmaster-admin.openapi.json`
  后台与用户接口全集，建议仅内部使用。
- `pages/`
  可直接复制到 Apifox 文档目录中的 Markdown 页面草稿。

## 生成方式

在仓库根目录执行：

```bash
./bin/build-apifox-docs.sh
```

如需指定不同域名：

```bash
./bin/build-apifox-docs.sh https://your-domain.example
```

## 推荐的 Apifox 搭建方式

1. 新建一个 Apifox 项目。
2. 导入 `docs/apifox/dist/gmaster-public.openapi.json`。
3. 在文档目录中新增页面，并按 `docs/apifox/pages/` 的顺序粘贴内容。
4. 配置环境变量：
   - `base_url=https://gmapi.fun`
   - `openai_base_url=https://gmapi.fun/v1`
   - `api_key=你的令牌`
   - `access_token=用户访问令牌（如需系统 API 调试）`
   - `new_api_user=当前用户 ID（如需系统 API 调试）`
5. 发布公开文档。

## 推荐目录结构

- 引言
- 在线调试说明
- 发出请求
- API 快速开始指南
- 代理接口调用地址
- 系统 API
- Python 配置方式
- Node.js 配置方式
- 各种插件 / 软件使用教程
- 帮助中心
- Chat / Responses / Images / Audio / Video

## 备注

- `Apifox` 负责页面展现、调试面板和在线发布。
- 这套仓库文件负责提供导入用 OpenAPI 规范和页面原稿。
- 如果后续要做得更像 `ZEN-AI`，重点是在 Apifox 里继续补“示例请求”“示例响应”“目录排序”和“页面封面图”。
