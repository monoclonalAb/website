#!/usr/bin/env bash
# make comments: goes through the comments waiting under blog posts and on
# pages (/birthday-2026), oldest first. For each it shows the post, the name,
# the email, when it was sent and the text, then reads one key:
#
#   a  approve: it shows under the post straight away
#   e  approve as Eric: the same, set on the rule his replies use
#   d  delete it
#   s  skip it for now
#   q  stop
#
# Approving or deleting drops the email, which is never shown. It talks to the
# Upstash Redis database that api/comments.mjs uses, with the address and token
# in .env.local (docs/writing.md). The real comments by default; make comments
# PREVIEW=1 (--preview) for the test ones that previews and make serve use.
#
# Needs curl and jq (macOS 15 and later have both).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v jq >/dev/null || {
  echo "comments.sh needs jq: brew install jq" >&2
  exit 1
}

# The two settings it needs, from .env.local, unless they're already set.
if [[ -f .env.local ]]; then
  while IFS='=' read -r name value; do
    case $name in
    KV_REST_API_URL | KV_REST_API_TOKEN)
      value=${value%\"}
      value=${value#\"}
      [[ -n ${!name:-} ]] || export "$name=$value"
      ;;
    esac
  done <.env.local
fi
if [[ -z ${KV_REST_API_URL:-} || -z ${KV_REST_API_TOKEN:-} ]]; then
  echo "comments.sh needs KV_REST_API_URL and KV_REST_API_TOKEN in .env.local (see docs/writing.md)" >&2
  exit 1
fi
if [[ ${1:-} == --preview ]]; then
  prefix=${COMMENTS_PREFIX-preview:}
  kind="test comment"
else
  prefix=${COMMENTS_PREFIX-}
  kind=comment
fi
[[ -n $prefix ]] && keys=" (keys starting $prefix)" || keys=""

# Sends Redis commands, as JSON, to the database: one command to /, or a list
# of them to /multi-exec, which runs them together or not at all.
redis() {
  local answer
  answer=$(curl -sS -X POST -H "Authorization: Bearer $KV_REST_API_TOKEN" \
    -H "Content-Type: application/json" --data-binary "$2" "$KV_REST_API_URL$1")
  if ! jq -e 'if type == "array" then all(.[]; has("result")) else has("result") end' <<<"$answer" >/dev/null 2>&1; then
    echo "comments.sh: the database said: $answer" >&2
    exit 1
  fi
  printf '%s\n' "$answer"
}

# Every waiting comment, each as one line of JSON: the exact text stored, so
# that removing it removes that one and no other.
waiting=()
while IFS= read -r line; do
  waiting+=("$line")
done < <(redis / "$(jq -cn --arg key "${prefix}pending" '["LRANGE", $key, "0", "-1"]')" | jq -c '.result[]')

total=${#waiting[@]}
if ((total == 0)); then
  echo "No ${kind}s waiting$keys."
  exit 0
fi
echo "$total $kind$( ((total == 1)) || echo s) waiting$keys, oldest first."
done_count=0
for ((i = 0; i < total; i++)); do
  raw=${waiting[i]}
  echo
  jq -r 'fromjson | "\(.post) · \(.name) <\(.email)> · \(.time)\n\(.text | split("\n") | map("  " + .) | join("\n"))"' <<<"$raw"
  while :; do
    printf '[a]pprove, approve as [e]ric, [d]elete, [s]kip, [q]uit? '
    key=
    IFS= read -r -n 1 key || key=q
    echo
    case $key in a | e | d | s | q) break ;; esac
  done
  case $key in
  a | e)
    eric=$([[ $key == e ]] && echo true || echo false)
    redis /multi-exec "$(jq -cn --argjson raw "$raw" --arg prefix "$prefix" --argjson eric "$eric" '
      ($raw | fromjson) as $c
      | [["RPUSH", "\($prefix)comments:\($c.post)", ({id: $c.id, name: $c.name, text: $c.text, time: $c.time, eric: $eric} | tojson)],
         ["LREM", "\($prefix)pending", "1", $raw]]')" >/dev/null
    echo "approved$([[ $eric == true ]] && echo ' as Eric'): it shows under the post now."
    done_count=$((done_count + 1))
    ;;
  d)
    redis / "$(jq -cn --argjson raw "$raw" --arg key "${prefix}pending" '["LREM", $key, "1", $raw]')" >/dev/null
    echo "deleted."
    done_count=$((done_count + 1))
    ;;
  s) echo "skipped: it'll be here next time." ;;
  q) break ;;
  esac
done
echo
echo "Done: $done_count of $total dealt with."
