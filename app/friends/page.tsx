import ReadingPage from "@/components/ReadingPage";
import { pageMetadata } from "@/lib/metadata";
import styles from "../contents/contents.module.css";

const friends = [
  {
    name: "aleck shen",
    href: "https://aleckshen.com/",
    note: "so i have a losing record to him at chess nationals-",
  },
  {
    name: "bethany yates",
    href: "https://bethany.nz/",
    note: "original wdcc membership checker dream team",
  },
  {
    name: "koutaro yumiba",
    href: "https://koutaroyumiba.com/",
    note: "i wonder what life would be like if i didn't cold approach you in singapore-",
  },
  {
    name: "owen li",
    href: "https://voxelfs.com/",
    note: "may gan called me the wrong name twice when trying to introduce me",
  },
  {
    name: "andrew qiu",
    href: "https://andrewqiu.com/",
    note: "original wdcc education team",
  },
  {
    name: "anton garay",
    href: "https://antga.dev/",
    note: "the atlassian intern",
  },
  {
    name: "josue badenas",
    href: "https://josbadenas.com/",
    note: "just a chill guy (wdcc projects)",
  },
  {
    name: "alanna santoso",
    href: "https://alanna.nz/",
    note: "forever koutaro yumiba's favourite student",
  },
];

export const metadata = pageMetadata(
  "Friends",
  "/friends",
  "people who i have met along the way",
);

export default function FriendsPage() {
  return (
    <ReadingPage>
      <h1>
        friends<span>:</span>
      </h1>
      <p>
        people who i have met along the way and a little origin story about how
        i met each one in chronological order.
      </p>
      <dl className={styles.directory}>
        {friends.map(({ name, href, note }) => (
          <div key={href}>
            <dt>
              <a href={href}>{name}</a>
            </dt>
            <dd>{note}</dd>
          </div>
        ))}
      </dl>
    </ReadingPage>
  );
}
