#!/usr/bin/env bash
# Development only. Builds a throwaway Postgres 16 database (the same one rls-tests.sh uses, in /tmp), runs every migration twice, then runs the
# scripted walk through in walkthrough.sql: sign up, post, apply, view, shortlist, decline, delete account. Prints every step that did not give the
# expected answer, and ends with an error if any did. Never point this at the live or demo database: it only ever talks to the throwaway server.
#
#   bash scripts/dev/walkthrough.sh       (npm run test:db runs this after the access tests)
#
# It uses the "supabase" kind of database, which copies Supabase's habit of granting every permission on new tables, so a missing permission
# rule cannot hide. Needs Linux with Postgres 16 in /usr/lib/postgresql/16/bin and a postgres user, as the other scripts here do.
set -euo pipefail
DIR=/tmp/kestrel-scratch; PORT=5544; BIN=/usr/lib/postgresql/16/bin; DB=kestrel_walk
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMBINED="${COMBINED:-$ROOT/supabase/combined/run-everything.sql}"

if ! psql -h "$DIR" -p $PORT -U postgres -d postgres -c "select 1" >/dev/null 2>&1; then
  rm -rf "$DIR"; mkdir -p "$DIR"; chown postgres "$DIR"
  su postgres -c "$BIN/initdb -D $DIR/data -A trust >/dev/null && $BIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR' -l $DIR/log start >/dev/null"
  sleep 2
fi
P="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"

$P -d postgres -c "drop database if exists $DB" -c "create database $DB"
$P -d "$DB" -f "$ROOT/scripts/dev/auth-stub.sql"
$P -d "$DB" -c "alter default privileges in schema public grant all on tables to anon, authenticated, service_role" \
            -c "alter default privileges in schema public grant all on sequences to anon, authenticated, service_role" \
            -c "alter default privileges in schema public grant all on functions to anon, authenticated, service_role"
for pass in 1 2; do
  if ! raw="$($P -d "$DB" -f "$COMBINED" -t -A 2>&1)"; then
    echo "The combined file stopped with an error on run $pass:"; echo "$raw" | grep -v NOTICE | grep -A3 ERROR; exit 1
  fi
  if echo "$raw" | grep -q MISSING; then echo "A migration check row says MISSING (run $pass)."; exit 1; fi
done
echo "Every migration ran twice. Walking through sign up, apply, shortlist, decline and delete..."

$P -d "$DB" -o /dev/null -f "$ROOT/scripts/dev/walkthrough.sql"
$P -d "$DB" -t -A -F ' | ' -c "select 'FAIL', step, label, 'wanted: ' || want, 'got: ' || coalesce(got, '(nothing)') from w.results where not pass order by n"
echo "$($P -d "$DB" -t -A -c "select count(*) filter (where pass) || ' of ' || count(*) || ' walk through checks passed' from w.results")"
[ "$($P -d "$DB" -t -A -c "select count(*) from w.results where not pass")" = 0 ]
