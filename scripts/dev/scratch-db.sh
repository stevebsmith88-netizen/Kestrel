#!/usr/bin/env bash
# Development only. Builds a throwaway Postgres 16 database, runs every migration twice, and prints the check table.
# Then you can run row level security tests against it with psql. Written for the Linux cloud session used to build Kestrel
# (Postgres binaries in /usr/lib/postgresql/16/bin, a postgres user). Adjust the paths elsewhere.
#   bash scripts/dev/scratch-db.sh            # creates /tmp/kestrel-scratch on port 5544 and a database called kestrel
#   psql -h /tmp/kestrel-scratch -p 5544 -U postgres -d kestrel
set -euo pipefail
DIR=/tmp/kestrel-scratch; PORT=5544; BIN=/usr/lib/postgresql/16/bin
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if ! psql -h "$DIR" -p $PORT -U postgres -d postgres -c "select 1" >/dev/null 2>&1; then
  rm -rf "$DIR"; mkdir -p "$DIR"; chown postgres "$DIR"
  su postgres -c "$BIN/initdb -D $DIR/data -A trust >/dev/null && $BIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR' -l $DIR/log start >/dev/null"
  sleep 2
fi
P="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -d postgres -c "drop database if exists kestrel" -c "create database kestrel"
$P -d kestrel -f "$ROOT/scripts/dev/auth-stub.sql"
for pass in 1 2; do
  $P -d kestrel -f "$ROOT/supabase/combined/run-everything.sql" -t -A 2>&1 | grep -v NOTICE | awk -F'|' 'NF==2{print $2}' | sort | uniq -c | tr '\n' ' '
  echo "<- migrations, run $pass (every row should be OK, apart from one NOT YET for CV storage)"
done
