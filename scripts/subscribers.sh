#!/usr/bin/env bash
# make subscribers: lists who is on the list for emails about new posts
# (api/subscribe.mjs keeps it), oldest first, with the day each one
# confirmed. Then it lists the addresses that signed up but haven't clicked
# their confirm link yet; those drop off after 7 days. It only reads, so
# nothing changes.
#
#   make subscribers            the real list
#   make subscribers PREVIEW=1  the test list (keys starting preview:), which
#                               sign-ups on make serve join
#
# It reads the database with KV_REST_API_URL and KV_REST_API_READ_ONLY_TOKEN
# from .env.local (docs/writing.md).
#
# Needs curl and jq (macOS 15 and later have both).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v jq >/dev/null || {
  echo "subscribers.sh needs jq: brew install jq" >&2
  exit 1
}

# The two settings it needs, from .env.local, unless they're already set.
if [[ -f .env.local ]]; then
  while IFS='=' read -r name value; do
    case $name in
    KV_REST_API_URL | KV_REST_API_READ_ONLY_TOKEN)
      value=${value%\"}
      value=${value#\"}
      [[ -n ${!name:-} ]] || export "$name=$value"
      ;;
    esac
  done <.env.local
fi
if [[ -z ${KV_REST_API_URL:-} || -z ${KV_REST_API_READ_ONLY_TOKEN:-} ]]; then
  echo "subscribers.sh needs KV_REST_API_URL and KV_REST_API_READ_ONLY_TOKEN in .env.local (see docs/writing.md)" >&2
  exit 1
fi
if [[ ${1:-} == --preview ]]; then
  prefix=${COMMENTS_PREFIX-preview:}
  list="test list"
else
  prefix=${COMMENTS_PREFIX-}
  list=list
fi

# Sends one Redis command, as JSON, to the database.
redis() {
  local answer
  answer=$(curl -sS -X POST -H "Authorization: Bearer $KV_REST_API_READ_ONLY_TOKEN" \
    -H "Content-Type: application/json" --data-binary "$1" "$KV_REST_API_URL")
  if ! jq -e 'has("result")' <<<"$answer" >/dev/null 2>&1; then
    echo "subscribers.sh: the database said: $answer" >&2
    exit 1
  fi
  printf '%s\n' "$answer"
}

# Everyone on the list: their address and when they confirmed.
people=$(redis "$(jq -cn --arg key "${prefix}subscribers" '["HGETALL", $key]')" |
  jq -c '.result | [range(0; length; 2) as $i | {email: .[$i], time: (.[$i + 1] | fromjson | .since)}] | sort_by(.time)')

# Everyone still to click their confirm link: one key each, found with SCAN.
keys='[]'
cursor=0
while :; do
  page=$(redis "$(jq -cn --arg cursor "$cursor" --arg match "${prefix}unconfirmed:*" '["SCAN", $cursor, "MATCH", $match, "COUNT", "1000"]')")
  cursor=$(jq -r '.result[0]' <<<"$page")
  keys=$(jq -c --argjson keys "$keys" '$keys + .result[1]' <<<"$page")
  [[ $cursor == 0 ]] && break
done
waiting='[]'
if [[ $keys != '[]' ]]; then
  waiting=$(redis "$(jq -c '["MGET"] + .' <<<"$keys")" |
    jq -c '.result | map(select(. != null) | fromjson | {email, time}) | sort_by(.time)')
fi

count=$(jq length <<<"$people")
if ((count == 0)); then
  echo "Nobody's on the $list yet."
else
  echo "$count $( ((count == 1)) && echo person || echo people) on the $list, oldest first:"
  jq -r '.[] | "  \(.time[:10])  \(.email)"' <<<"$people"
fi
count=$(jq length <<<"$waiting")
if ((count > 0)); then
  echo
  echo "$count signed up but haven't confirmed yet (their link runs out after 7 days):"
  jq -r '.[] | "  \(.time[:10])  \(.email)"' <<<"$waiting"
fi
