#!/usr/bin/env bash
# make daily [DATE=YYYY-MM-DD]: starts content/leetcode/<date>.md from that
# day's LeetCode daily problem. Defaults to today in UTC, when the daily rolls
# over. Needs curl and jq (both come with macOS).
set -euo pipefail
cd "$(dirname "$0")/.."

date=${1:-$(date -u +%Y-%m-%d)}
pattern='^([0-9]{4})-([0-9]{2})-[0-9]{2}$'
if [[ ! $date =~ $pattern ]]; then
  echo "Usage: make daily [DATE=YYYY-MM-DD]" >&2
  exit 1
fi
year=$((10#${BASH_REMATCH[1]}))
month=$((10#${BASH_REMATCH[2]}))
file=content/leetcode/$date.md
if [[ -e $file ]]; then
  echo "$file already exists." >&2
  exit 1
fi

# shellcheck disable=SC2016 # GraphQL's $variables, not the shell's
query='query ($year: Int!, $month: Int!) {
  dailyCodingChallengeV2(year: $year, month: $month) {
    challenges { date link question { questionFrontendId title difficulty } }
  }
}'
response=$(curl -fsS https://leetcode.com/graphql \
  -H 'Content-Type: application/json' \
  -H 'Referer: https://leetcode.com' \
  --data "$(jq -n --arg query "$query" --argjson year "$year" --argjson month "$month" \
    '{ query: $query, variables: { year: $year, month: $month } }')")
daily=$(jq -r --arg date "$date" '
  .data.dailyCodingChallengeV2.challenges[] | select(.date == $date)
  | [.question.title, .question.questionFrontendId, .link, .question.difficulty] | @tsv' <<<"$response")
if [[ -z $daily ]]; then
  echo "LeetCode has no daily problem for $date." >&2
  exit 1
fi
IFS=$'\t' read -r title id link difficulty <<<"$daily"

# Quote the title if YAML would read it as something other than plain text.
special="^[][{}#&*!|>'\"%@\`,?:-]|: | #"
quote="'"
if [[ $title =~ $special ]]; then title="$quote${title//$quote/$quote$quote}$quote"; fi

cat >"$file" <<EOF
---
title: $title
date: $date
problemId: $id
problemUrl: https://leetcode.com$link
difficulty: $difficulty
---

## code

\`\`\`cpp

\`\`\`

### complexity

> - Time:
> - Space:

### learnings

> -

### time taken

> -
EOF
echo "Created $file: $title"
