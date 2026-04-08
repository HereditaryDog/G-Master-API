# G-Master API

G-Master API is a self-hosted AI gateway derived from [QuantumNous/new-api](https://github.com/QuantumNous/new-api). This repository is the branded fork maintained by `yangjunyu`, with the current focus on local Docker verification first and small-scope rollout second.

Current release: `v0.12.1-gmaster.2`

Release notes: [`CHANGELOG.md`](./CHANGELOG.md)

## What changed in this fork

- The public product name is now `G-Master API`
- Local Docker builds this repository directly instead of pulling upstream images
- Default service, container, binary, and systemd names now use `g-master-api`
- Project-facing links point to this repository
- The upstream `AGPL-3.0` license is preserved

## Latest release highlights

- A rebuilt landing page styled after the `Zen-AI` one-page experience, adapted to `G-Master API` branding and copy
- A unified dashboard and model pricing theme with refreshed gradients, glassmorphism cards, and updated header/sidebar visuals
- A refreshed default logo treatment and page background system for more consistent brand presentation
- Fixes for homepage typing animation stability and dashboard stat icon visibility

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

## Internal testing via public tunnel

Use the helper scripts below to open a temporary public URL for small-scale internal testing:

```bash
./bin/start-quick-tunnel.sh
./bin/smoke-test-public.sh
```

Stop the tunnel when testing is complete:

```bash
./bin/stop-quick-tunnel.sh
```

This uses a temporary Cloudflare Quick Tunnel and is intended for short-lived internal testing only, not production exposure.

## Custom domain via Cloudflare Tunnel

If you already own a domain such as `gmapi.fun` and the stack is still running on your local machine, you can replace the temporary Quick Tunnel with a named Cloudflare Tunnel and keep a stable public hostname during the local testing phase.

### 1. Move `gmapi.fun` to Cloudflare DNS

1. Add `gmapi.fun` to Cloudflare
2. Replace the Tencent Cloud nameservers with the two nameservers assigned by Cloudflare
3. Wait until the zone becomes `Active`

### 2. Create a Cloudflare Tunnel in the dashboard

Use the Cloudflare dashboard to create a remotely-managed `Cloudflared` tunnel, for example `g-master-api-local`, and add this public hostname:

```text
Hostname: gmapi.fun
Service: http://127.0.0.1:3000
```

Cloudflare will show you an install command containing a `--token` value. Copy that token.

### 3. Store the token locally and start the tunnel

```bash
cp .cloudflared-domain.env.example .cloudflared-domain.env
```

Fill in the token and hostname, then start the named tunnel:

```bash
./bin/start-domain-tunnel.sh
```

Stop it when needed:

```bash
./bin/stop-domain-tunnel.sh
```

### 4. Update the public server address

```bash
./bin/update-server-address.sh https://gmapi.fun
./bin/smoke-test-public.sh https://gmapi.fun
```

This keeps callbacks, OAuth redirects, Passkey origin values, and UI-facing server links aligned with `https://gmapi.fun`.

### 5. Later migration to Tencent Cloud

When you move the stack to a Tencent Cloud server later, you can either keep Cloudflare in front and point the tunnel/origin to the VPS, or switch DNS/origin handling back to Tencent Cloud and run `./bin/update-server-address.sh https://gmapi.fun` again. As long as the public domain stays `gmapi.fun`, clients do not need a base URL change.

## License and attribution

This project continues to ship under `AGPL-3.0`. Upstream attribution and fork notes live in [`ACKNOWLEDGMENTS.md`](./ACKNOWLEDGMENTS.md).

## Next stage

- Finish local Docker verification
- Clean up remaining old-brand compatibility text in low-traffic UI areas
- Move the stack to a VPS for small-scale public testing
- Set up release automation for your own repository and registry
