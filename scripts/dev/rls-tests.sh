#!/usr/bin/env bash
# Development only. Builds a throwaway Postgres 16 database, runs every migration twice, then runs the access tests in rls-tests.sql
# (who can read and change what). Never point this at the live or demo database: it only ever talks to the throwaway server in /tmp.
#
#   bash scripts/dev/rls-tests.sh supabase    # a database that copies Supabase's habit of granting every permission on new tables (use this one)
#   bash scripts/dev/rls-tests.sh plain       # a plain database, which hides permission mistakes, kept as a second opinion
#   bash scripts/dev/rls-tests.sh both        # one after the other (the default)
#   COMBINED=/path/to/an/older/run-everything.sql bash scripts/dev/rls-tests.sh supabase   # test an older copy of the combined file
#
# The last line says how many tests passed. The script ends with an error if any test fails or any check row is MISSING.
set -euo pipefail
DIR=/tmp/kestrel-scratch; PORT=5544; BIN=/usr/lib/postgresql/16/bin
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
COMBINED="${COMBINED:-$ROOT/supabase/combined/run-everything.sql}"
MODE="${1:-both}"

if ! psql -h "$DIR" -p $PORT -U postgres -d postgres -c "select 1" >/dev/null 2>&1; then
  rm -rf "$DIR"; mkdir -p "$DIR"; chown postgres "$DIR"
  su postgres -c "$BIN/initdb -D $DIR/data -A trust >/dev/null && $BIN/pg_ctl -D $DIR/data -o '-p $PORT -k $DIR' -l $DIR/log start >/dev/null"
  sleep 2
fi
P="psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"

run_one() {
  local kind="$1" db="kestrel_$1" failed=0
  echo "== $kind database ($db) =="
  $P -d postgres -c "drop database if exists $db" -c "create database $db"
  $P -d "$db" -f "$ROOT/scripts/dev/auth-stub.sql"
  if [ "$kind" = supabase ]; then
    # What Supabase does for every new project: anything created in the public schema is granted to these 3 roles in full.
    $P -d "$db" -c "alter default privileges in schema public grant all on tables to anon, authenticated, service_role" \
                -c "alter default privileges in schema public grant all on sequences to anon, authenticated, service_role" \
                -c "alter default privileges in schema public grant all on functions to anon, authenticated, service_role"
  fi
  for pass in 1 2; do
    local raw out
    if ! raw="$($P -d "$db" -f "$COMBINED" -t -A 2>&1)"; then
      echo "The combined file stopped with an error on run $pass:"; echo "$raw" | grep -v NOTICE | grep -A3 ERROR; return 1
    fi
    out="$(echo "$raw" | grep -v NOTICE | awk -F'|' 'NF==2{print $2}' | sort | uniq -c | tr '\n' ' ')"
    echo "migrations, run $pass: $out"
    if echo "$out" | grep -q MISSING; then failed=1; fi
  done
  $P -d "$db" -f "$ROOT/scripts/dev/rls-tests.sql" >/dev/null
  $P -d "$db" -t -A -F ' | ' -c "select 'FAIL', finding, label, 'wanted: ' || want, 'got: ' || got || coalesce(' (' || detail || ')', '') from t.results where not pass order by n"
  local summary
  summary="$($P -d "$db" -t -A -c "select count(*) filter (where pass) || ' of ' || count(*) || ' access tests passed' from t.results")"
  echo "$summary"
  if [ "$($P -d "$db" -t -A -c "select count(*) from t.results where not pass")" != 0 ]; then failed=1; fi
  return $failed
}

status=0
case "$MODE" in
  supabase|plain) run_one "$MODE" || status=1 ;;
  both) run_one supabase || status=1; run_one plain || status=1 ;;
  *) echo "Use: supabase, plain or both"; exit 2 ;;
esac
exit $status
