#!/usr/bin/env sh
set -eu

docker compose up -d --build

printf 'Local G-Master API stack rebuilt and started.\n'
