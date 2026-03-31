# G-Master API

G-Master API is a self-hosted AI gateway derived from [QuantumNous/new-api](https://github.com/QuantumNous/new-api). This repository is the branded fork maintained by `yangjunyu`, with the current focus on local Docker verification first and small-scope rollout second.

## What changed in this fork

- The public product name is now `G-Master API`
- Local Docker builds this repository directly instead of pulling upstream images
- Default service, container, binary, and systemd names now use `g-master-api`
- Project-facing links point to this repository
- The upstream `AGPL-3.0` license is preserved

## Stack

- Backend: Go + Gin
- Frontend: React + Vite
- Runtime: Docker Compose + PostgreSQL + Redis

## Local quick start

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up -d --build
```

3. Open:

```text
http://127.0.0.1:3000
```

4. Finish the first-run setup in the web UI.

## Important files

- [`docker-compose.yml`](./docker-compose.yml)
- [`.env.example`](./.env.example)
- [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md)
- [`docs/installation/BT.md`](./docs/installation/BT.md)
- [`bin/backup-postgres.sh`](./bin/backup-postgres.sh)
- [`bin/restore-postgres.sh`](./bin/restore-postgres.sh)
- [`bin/rebuild-local.sh`](./bin/rebuild-local.sh)

## Backup and restore

### Backup PostgreSQL

```bash
./bin/backup-postgres.sh
```

### Restore PostgreSQL

```bash
./bin/restore-postgres.sh backup-g-master-api.sql
```

### Backup mounted data

```bash
tar -czf g-master-api-data.tar.gz data logs
```

## Upgrade and rollback

### Upgrade the current checkout

```bash
git pull
./bin/rebuild-local.sh
```

### Roll back to a previous commit or tag

```bash
git checkout <commit-or-tag>
./bin/rebuild-local.sh
```

Always create a database backup before upgrades or rollbacks.

## License and attribution

This project continues to ship under `AGPL-3.0`. Upstream attribution and fork notes live in [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md).

## Next stage

- Finish local Docker verification
- Clean up remaining old-brand compatibility text in low-traffic UI areas
- Move the stack to a VPS for small-scale public testing
- Set up release automation for your own repository and registry
