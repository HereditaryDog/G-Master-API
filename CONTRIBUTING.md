# 贡献指南

感谢你愿意为 `G-Master API` 提交改动。

本仓库是基于 [`QuantumNous/new-api`](https://github.com/QuantumNous/new-api) 持续同步的品牌化分支，目标不是脱离上游另起炉灶，而是在保留上游能力的基础上，维护一条更适合当前业务与品牌交付的发布线。

## 提交前建议先做的事

1. 先阅读 [README.md](./README.md)、[CHANGELOG.md](./CHANGELOG.md) 和 [ACKNOWLEDGMENTS.md](./ACKNOWLEDGMENTS.md)
2. 搜索现有 [Issues](https://github.com/HereditaryDog/G-Master-API/issues) 与 [Pull Requests](https://github.com/HereditaryDog/G-Master-API/pulls)
3. 如果改动较大，建议先开 Issue 说明背景和目标

## 开发环境

### 后端

- Go 版本：`1.25+`
- Web 框架：`Gin`
- ORM：`GORM v2`

### 前端

- React 18 + Vite
- UI：`@douyinfe/semi-ui`
- 包管理器优先使用 `bun`

### 本地启动

```bash
cp .env.example .env
docker compose up -d --build
```

## 分支与提交建议

### 分支命名

建议使用清晰、短小、可追踪的命名，例如：

- `feat/xxx`
- `fix/xxx`
- `docs/xxx`
- `sync/upstream-v0.12.11`

### Commit 信息

建议直接说明结果，不要写成泛泛的“update”或“fix bug”。

示例：

- `Fix Stripe async webhook settlement`
- `Rewrite README in Chinese`
- `Release v0.12.11-gmaster.1 with upstream sync`

## Pull Request 要求

提交 PR 时，请尽量做到：

- 明确说明改了什么、为什么这样改
- 若是修复问题，请说明复现路径和根因
- 若是功能改动，请说明对用户或维护者的影响
- 附上测试结果、截图或关键日志

PR 模板中已经包含必要检查项，请不要直接删空。

## 这个分支的关键约束

以下规则对本仓库非常重要，提交前请务必确认。

### 1. JSON 处理统一走 `common/json.go`

业务代码中不要直接用 `encoding/json` 做 marshal / unmarshal，请统一通过：

- `common.Marshal`
- `common.Unmarshal`
- `common.UnmarshalJsonStr`
- `common.DecodeJson`

### 2. 数据库必须同时兼容 SQLite / MySQL / PostgreSQL

不要默认只为某一种数据库写代码。

重点注意：

- 优先使用 GORM 抽象
- 需要原生 SQL 时必须考虑三种数据库差异
- 不要引入只有单一数据库支持的字段类型或操作

### 3. 前端默认使用 `bun`

在 `web/` 目录下优先使用：

- `bun install`
- `bun run dev`
- `bun run build`

### 4. 品牌与上游致谢要同时保留

可以继续强化 `G-Master API` 品牌，但不要移除：

- `AGPL-3.0` 许可证
- 上游来源说明
- 归属与致谢文件

### 5. Relay 请求 DTO 要保留显式零值

对于会转发到上游的请求字段：

- 可选标量尽量用指针类型 + `omitempty`
- 要能区分“用户没传”和“用户明确传了 0 / false”

## 文档改动要求

如果你的改动会影响用户接入、部署方式、版本说明或公共界面，请同步更新：

- [README.md](./README.md)
- [CHANGELOG.md](./CHANGELOG.md)
- [docs/](./docs)

如果是对外行为变化，建议同时更新 Apifox 产物或相关文档说明。

## Release 相关

当前分支的发布命名约定通常为：

- `vX.Y.Z-gmaster.N`

发布前建议确认：

1. `VERSION` 已更新
2. `CHANGELOG.md` 已补齐
3. 公开文档链接和仓库链接保持一致
4. GitHub Release 与 GHCR 发布链路可正常工作

## 欢迎提交的改动方向

- 修复与上游同步时的品牌残留问题
- 补齐中文文档与部署说明
- 提升控制台使用体验
- 完善支付、分组、日志、模型管理等业务能力
- 提升发布链路、镜像与协作模板质量

## 不建议直接提交的内容

- 未经说明的大范围重构
- 只针对单一数据库生效的改动
- 删除上游致谢与许可证信息
- 没有验证结果的高风险改动

## 需要帮助？

如果你不确定改动方向是否合适，建议先提 Issue 说明：

- 你遇到的问题
- 你的预期结果
- 你准备如何修改

这样通常会比直接提交一个范围很大的 PR 更高效。
