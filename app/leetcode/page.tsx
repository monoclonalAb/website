import LeetcodeIndex, { leetcodeIndexMetadata } from "./LeetcodeIndex";

export const metadata = leetcodeIndexMetadata(1);

export default function LeetcodePage() {
  return <LeetcodeIndex page={1} />;
}
