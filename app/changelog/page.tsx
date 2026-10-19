import ChangelogIndex, { changelogIndexMetadata } from "./ChangelogIndex";

export const metadata = changelogIndexMetadata(1);

export default function ChangelogPage() {
  return <ChangelogIndex page={1} />;
}
