#!/usr/bin/env bash
# make announce POST=<slug>: emails a blog post to everyone who subscribed
# (api/subscribe.mjs keeps the list), once it's live on ericzheng.nz. It reads
# the post's title, date and summary as build.sh does, saves the email as
# out.email.html to look at, says how many people it goes to, and sends only
# when you press y. Each post goes out once: the list remembers which have.
#
#   make announce POST=group-theory            the real list
#   make announce POST=group-theory PREVIEW=1  the test list (keys starting
#                                              preview:), which sign-ups on
#                                              make serve join; its links go to
#                                              http://localhost:4000
#
# It reads the list with KV_REST_API_URL and KV_REST_API_TOKEN, and sends
# through Resend with RESEND_API_KEY, all from .env.local (docs/writing.md).
# The email's words and design are in emails/post.html and emails/post.txt.
# Resend's free plan sends 100 emails a day, sign-ups' confirm emails included;
# if the list is longer than what's left today, it stops before sending any.
#
# Needs curl and jq (macOS 15 and later have both).
set -euo pipefail
cd "$(dirname "$0")/.."
command -v jq >/dev/null || {
  echo "announce.sh needs jq: brew install jq" >&2
  exit 1
}

FROM='eric zheng <posts@ericzheng.nz>' # the same two as api/subscribe.mjs
REPLY_TO=ericzheng.nz@gmail.com
DAILY=100 # emails a day on Resend's free plan

slug=${1:-}
if [[ ! $slug =~ ^[A-Za-z0-9_-]+$ ]]; then
  echo "Which post? make announce POST=<slug>, the name of its folder in content/blog/" >&2
  exit 1
fi

# The three settings it needs, from .env.local, unless they're already set.
if [[ -f .env.local ]]; then
  while IFS='=' read -r name value; do
    case $name in
    KV_REST_API_URL | KV_REST_API_TOKEN | RESEND_API_KEY)
      value=${value%\"}
      value=${value#\"}
      [[ -n ${!name:-} ]] || export "$name=$value"
      ;;
    esac
  done <.env.local
fi
if [[ -z ${KV_REST_API_URL:-} || -z ${KV_REST_API_TOKEN:-} ]]; then
  echo "announce.sh needs KV_REST_API_URL and KV_REST_API_TOKEN in .env.local (see docs/writing.md)" >&2
  exit 1
fi
if [[ ${2:-} == --preview ]]; then
  prefix=${COMMENTS_PREFIX-preview:}
  site=http://localhost:4000
  list="test list"
else
  prefix=${COMMENTS_PREFIX-}
  site=https://ericzheng.nz
  list=list
fi

# Sends Redis commands, as JSON, to the database: one command to /, or a list
# of them to /multi-exec, which runs them together or not at all.
redis() {
  local answer
  answer=$(curl -sS -X POST -H "Authorization: Bearer $KV_REST_API_TOKEN" \
    -H "Content-Type: application/json" --data-binary "$2" "$KV_REST_API_URL$1")
  if ! jq -e 'if type == "array" then all(.[]; has("result")) else has("result") end' <<<"$answer" >/dev/null 2>&1; then
    echo "announce.sh: the database said: $answer" >&2
    exit 1
  fi
  printf '%s\n' "$answer"
}

# The post, as build.sh reads it: a build (just an update, if there's been one)
# leaves every post's line in out.posts.tsv.
./build.sh --update >/dev/null
sep=$'\037'
line=$(awk -F "$sep" -v slug="$slug" '$1 == "blog" && $2 == slug' out.posts.tsv)
if [[ -z $line ]]; then
  echo "There's no blog post called $slug (content/blog/$slug/index.md)." >&2
  exit 1
fi
IFS=$sep read -r _ _ date title summary _ <<<"$line"
months=(January February March April May June July August September October November December)
long_date="$((10#${date:8:2})) ${months[$((10#${date:5:2} - 1))]} ${date:0:4}"
url=$site/blog/$slug

if ! curl -fs -o /dev/null "$url"; then
  if [[ $list == list ]]; then
    echo "$url isn't up yet. Push the post, wait for Vercel to deploy it, then run this again." >&2
  else
    echo "$url isn't up. Start make serve in another terminal, then run this again." >&2
  fi
  exit 1
fi

sent=$(redis / "$(jq -cn --arg key "${prefix}announced:$slug" '["GET", $key]')" | jq -r '.result // empty')
if [[ -n $sent ]]; then
  echo "\"$title\" went to the $list at $sent. Each post goes out once."
  exit 0
fi

# Everyone on the list: their address and the token in their unsubscribe link.
people=$(redis / "$(jq -cn --arg key "${prefix}subscribers" '["HGETALL", $key]')" |
  jq -c '.result | [range(0; length; 2) as $i | {email: .[$i], token: (.[$i + 1] | fromjson | .token)}]')
count=$(jq length <<<"$people")
if ((count == 0)); then
  echo "Nobody's on the $list yet."
  exit 0
fi
today=$(date -u +%Y-%m-%d)
used=$(redis / "$(jq -cn --arg a "${prefix}confirms:$today" --arg b "${prefix}sent:$today" --arg c "${prefix}notices:$today" '["MGET", $a, $b, $c]')" |
  jq '.result | map(if . == null then 0 else tonumber end) | add')
left=$((DAILY - used))
if ((count > left)); then
  echo "That's $count emails, and Resend's free plan has $left of today's $DAILY left. Run this again tomorrow (the day is UTC's), or move to a paid plan." >&2
  exit 1
fi

# One email each, so each has its own unsubscribe link. The words go into the
# HTML escaped, and into the plain text as they are.
emails=$(jq -n --rawfile html emails/post.html --rawfile text emails/post.txt \
  --arg title "$title" --arg date "$long_date" --arg summary "$summary" --arg url "$url" \
  --arg site "$site" --arg from "$FROM" --arg reply_to "$REPLY_TO" --argjson people "$people" '
  def fill($values): reduce ($values | to_entries[]) as $v (.; gsub("\\{\\{" + $v.key + "\\}\\}"; $v.value));
  {title: $title, date: $date, summary: $summary, url: $url,
   preview: (if $summary == "" then "a new post from ericzheng.nz" else $summary end)} as $words
  | [$people[] | "\($site)/api/subscribe?unsubscribe=\(.token)" as $unsubscribe | {
      from: $from, to: [.email], reply_to: $reply_to, subject: $title,
      html: ($html | fill($words | map_values(@html) | .unsubscribe = $unsubscribe)),
      text: ($text | fill($words | .unsubscribe = $unsubscribe)),
      headers: {"List-Unsubscribe": "<\($unsubscribe)>", "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"}
    }]')
jq -r '.[0].html' <<<"$emails" >out.email.html
echo
jq -r '.[0] | "From: \(.from)\nSubject: \(.subject)\n\n\(.text)"' <<<"$emails" | sed 's/^/  /'
echo
echo "The email as it looks: out.email.html, to open in a browser."
if [[ -z ${RESEND_API_KEY:-} ]]; then
  echo "announce.sh needs RESEND_API_KEY in .env.local to send it (see docs/writing.md)." >&2
  exit 1
fi
people_word=$( ((count == 1)) && echo person || echo people)
printf 'Send it to the %s %s on the %s? [y/N] ' "$count" "$people_word" "$list"
reply=
IFS= read -r reply || true
if [[ $reply != [yY] ]]; then
  echo "Not sent."
  exit 0
fi

# Up to 100 emails a request. Each request's key makes Resend send it once,
# even if this runs again within a day after failing partway.
batch_number=0
while IFS= read -r batch; do
  batch_number=$((batch_number + 1))
  answer=$(curl -sS -X POST https://api.resend.com/emails/batch \
    -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" \
    -H "Idempotency-Key: announce-$prefix$slug-$batch_number" --data-binary @- <<<"$batch")
  if ! jq -e '.data | type == "array"' <<<"$answer" >/dev/null 2>&1; then
    echo "announce.sh: Resend said: $answer" >&2
    exit 1
  fi
done < <(jq -c '[range(0; length; 100) as $i | .[$i:$i + 100]] | .[]' <<<"$emails")

redis /multi-exec "$(jq -cn --arg announced "${prefix}announced:$slug" --arg sent "${prefix}sent:$today" \
  --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg count "$count" '
  [["SET", $announced, $time], ["INCRBY", $sent, $count], ["EXPIRE", $sent, "172800"]]')" >/dev/null
echo "Sent \"$title\" to $count $people_word."
