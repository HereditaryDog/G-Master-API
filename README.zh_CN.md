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

## 公网隧道内测

如果你想做小规模内部测试，可以直接用下面这组脚本拉起一个临时公网地址：

```bash
./bin/start-quick-tunnel.sh
./bin/smoke-test-public.sh
```

测试结束后关闭隧道：

```bash
./bin/stop-quick-tunnel.sh
```

这套方案基于临时 Cloudflare Quick Tunnel，只适合短时间内测，不适合长期生产暴露。

## 自有域名 + Cloudflare Tunnel

如果你已经买了自己的域名，比如 `gmapi.fun`，并且当前服务还跑在本机上，推荐把临时 Quick Tunnel 升级成“Cloudflare Tunnel + 自有域名”的固定入口。这样本地测试阶段就能用正式域名，后面再迁移到腾讯云服务器时，只需要切换回源方式，不必改对外访问地址。

### 1. 先在 Cloudflare 接管 `gmapi.fun`

1. 在 Cloudflare 添加站点 `gmapi.fun`
2. 按 Cloudflare 提示，把腾讯云域名控制台里的 nameserver 改成 Cloudflare 分配的那两条
3. 等待 Cloudflare 把站点状态变成 `Active`

### 2. 在 Cloudflare 控制台创建 Tunnel

推荐用 Cloudflare Dashboard 创建一个远程托管的 Tunnel：

1. 打开 Zero Trust 控制台
2. 创建一个 `Cloudflared` Tunnel，例如命名为 `g-master-api-local`
3. 给这个 Tunnel 添加一个 Public Hostname：

```text
Hostname: gmapi.fun
Service: http://127.0.0.1:3000
```

4. 保存后，Cloudflare 会给你一条带 `--token` 的安装命令
5. 复制里面的 token

### 3. 在本机填入 token 并启动

```bash
cp .cloudflared-domain.env.example .cloudflared-domain.env
```

把 `.cloudflared-domain.env` 里的 token 和域名改好：

```text
CLOUDFLARE_TUNNEL_TOKEN=你的_tunnel_token
CLOUDFLARE_TUNNEL_HOSTNAME=gmapi.fun
TUNNEL_TARGET=http://127.0.0.1:3000
```

然后启动命名隧道：

```bash
./bin/start-domain-tunnel.sh
```

停止命名隧道：

```bash
./bin/stop-domain-tunnel.sh
```

### 4. 把系统里的对外地址切成正式域名

```bash
./bin/update-server-address.sh https://gmapi.fun
./bin/smoke-test-public.sh https://gmapi.fun
```

这样后台生成的回调地址、OAuth 重定向地址、Passkey origin、页面里展示的服务器地址就会统一走 `https://gmapi.fun`。

### 5. 以后迁移到腾讯云服务器

等你后面把项目迁到腾讯云服务器，有两种做法：

- 继续用 Cloudflare：把 Tunnel 的回源改成腾讯云服务器
- 不再用 Cloudflare：把 `gmapi.fun` 的 DNS/回源切回腾讯云，再执行一次 `./bin/update-server-address.sh https://gmapi.fun`

无论走哪条路，只要域名还是 `gmapi.fun`，客户端接入地址都不用变。

## 许可证与归属

本项目继续使用 `AGPL-3.0`。上游归属、分叉来源和本次改造说明见 [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md)。

## 下一阶段建议

- 先完成本地 Docker 验收
- 继续清理低频页面里残留的旧品牌兼容文案
- 再迁移到 VPS 做小范围公测
- 最后接自己的发布流程和镜像仓库
