#!/usr/bin/env node
// pnpm daily [YYYY-MM-DD]: starts content/leetcode/<date>.md from that day's
// LeetCode daily problem. Defaults to today in UTC, when the daily rolls over.
import { writeFile } from "node:fs/promises";
import { stringify } from "yaml";

const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error("Usage: pnpm daily [YYYY-MM-DD]");
  process.exit(1);
}

const [year, month] = date.split("-").map(Number);
const response = await fetch("https://leetcode.com/graphql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
  },
  body: JSON.stringify({
    query: `query ($year: Int!, $month: Int!) {
      dailyCodingChallengeV2(year: $year, month: $month) {
        challenges { date link question { questionFrontendId title difficulty } }
      }
    }`,
    variables: { year, month },
  }),
});
if (!response.ok) throw new Error(`LeetCode responded ${response.status}`);
const { data } = await response.json();
const daily = data?.dailyCodingChallengeV2?.challenges.find(
  (challenge) => challenge.date === date,
);
if (!daily) {
  console.error(`LeetCode has no daily problem for ${date}.`);
  process.exit(1);
}

const frontmatter = stringify({
  title: daily.question.title,
  date,
  problemId: Number(daily.question.questionFrontendId),
  problemUrl: `https://leetcode.com${daily.link}`,
  difficulty: daily.question.difficulty,
});
const body = `## code

\`\`\`cpp

\`\`\`

### complexity

> - Time:
> - Space:

### learnings

> -

### time taken

> -
`;

const file = `content/leetcode/${date}.md`;
try {
  await writeFile(file, `---\n${frontmatter}---\n\n${body}`, { flag: "wx" });
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.error(`${file} already exists.`);
  process.exit(1);
}
console.log(`Created ${file}: ${daily.question.title}`);
