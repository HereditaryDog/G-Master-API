# G-Master API 宝塔部署说明

这份文档是面向 `G-Master API` 的宝塔部署适配说明，推荐用于你已经有 Linux 服务器和宝塔面板的场景。

## 推荐方式

优先使用源码目录 + Docker Compose：

```bash
git clone https://github.com/HereditaryDog/G-Master-API.git
cd G-Master-API
cp .env.example .env
docker compose up -d --build
```

## 宝塔准备

1. 安装宝塔面板
2. 在宝塔中安装 Docker / Docker Compose
3. 创建项目目录，例如 `/www/wwwroot/G-Master-API`
4. 把仓库拉到该目录

## 关键配置

编辑 `.env`，至少确认下面几项：

- `POSTGRES_PASSWORD`
- `SESSION_SECRET`
- `CRYPTO_SECRET`
- `TZ`

如果准备公网开放，请额外处理：

- HTTPS 与反向代理
- 域名解析
- 防火墙和安全组
- 定期数据库备份

## 启动

```bash
cd /www/wwwroot/G-Master-API
docker compose up -d --build
```

## 备份

```bash
docker compose exec -T g-master-api-postgres \
  pg_dump -U gmaster g_master_api > backup-g-master-api.sql
```

## 回滚

```bash
git checkout <commit-or-tag>
docker compose up -d --build
```

## 相关文件

- [`../../docker-compose.yml`](../../docker-compose.yml)
- [`../../.env.example`](../../.env.example)
- [`../../ACKNOWLEDGMENTS.md`](../../ACKNOWLEDGMENTS.md)
