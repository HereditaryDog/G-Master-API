# G-Master API

G-Master API 是基于 [QuantumNous/new-api](https://github.com/QuantumNous/new-api) 改造的自托管 AI 网关项目。这个仓库是 `yangjunyu` 维护的独立品牌版本，当前第一阶段目标是先把本地 Docker 跑稳，再进入小范围上线。

## 这个分支目前做了什么

- 对外产品名统一为 `G-Master API`
- 本地 Docker 改为直接构建当前仓库，而不是拉取上游镜像
- 二进制、容器、Compose 服务名、systemd 服务名统一为 `g-master-api`
- 默认文档和项目链接切到你自己的仓库
- 保留上游 `AGPL-3.0` 许可证与归属说明

## 技术栈

- 后端：Go + Gin
- 前端：React + Vite
- 本地运行：Docker Compose + PostgreSQL + Redis

## 本地快速启动

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 启动本地服务：

```bash
docker compose up -d --build
```

3. 打开浏览器访问：

```text
http://127.0.0.1:3000
```

4. 按页面提示完成首次初始化。

## 关键文件

- [`docker-compose.yml`](./docker-compose.yml)
- [`.env.example`](./.env.example)
- [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md)
- [`docs/installation/BT.md`](./docs/installation/BT.md)
- [`bin/backup-postgres.sh`](./bin/backup-postgres.sh)
- [`bin/restore-postgres.sh`](./bin/restore-postgres.sh)
- [`bin/rebuild-local.sh`](./bin/rebuild-local.sh)

## 备份与恢复

### 备份 PostgreSQL

```bash
./bin/backup-postgres.sh
```

### 恢复 PostgreSQL

```bash
./bin/restore-postgres.sh backup-g-master-api.sql
```

### 备份挂载目录

```bash
tar -czf g-master-api-data.tar.gz data logs
```

## 升级与回滚

### 升级当前代码

```bash
git pull
./bin/rebuild-local.sh
```

### 回滚到历史版本

```bash
git checkout <commit-or-tag>
./bin/rebuild-local.sh
```

升级或回滚之前，建议先备份数据库和 `data/`、`logs/` 目录。

## 许可证与归属

本项目继续使用 `AGPL-3.0`。上游归属、分叉来源和本次改造说明见 [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md)。

## 下一阶段建议

- 先完成本地 Docker 验收
- 继续清理低频页面里残留的旧品牌兼容文案
- 再迁移到 VPS 做小范围公测
- 最后接自己的发布流程和镜像仓库
