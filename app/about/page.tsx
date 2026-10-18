import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { pageMetadata } from "@/lib/metadata";
import { getPhotos } from "@/lib/photos";
import Photos from "./Photos";
import styles from "./about.module.css";

export const metadata = pageMetadata(
  "About",
  "/about",
  "about eric zheng, a highly caffeinated working class citizen",
);

export default async function AboutPage() {
  const photos = await getPhotos();
  return (
    <ReadingPage current="about" className={styles.about}>
      <div className={styles.intro}>
        <h1 id="about-me" className={styles.heading}>
          about me<span>:</span>
        </h1>
        <p className={styles.biography}>
          you are visiting the site of <em>Eric Zheng</em>, a highly caffeinated
          working class citizen, who is probably on a (conversational) long run
          or catching up on his latest book recommendation.
        </p>
        <Photos photos={photos} />
        <div className={styles.peers}>
          <p>like many of his peers, he:</p>
          <ul className={styles.list}>
            <li>
              is a <em>little</em> below average height on a good day
            </li>
            <li>dreams about becoming a fabled &apos;10x developer&apos;</li>
            <li>
              worries about getting replaced by the next{" "}
              <a href="https://en.wikipedia.org/wiki/Devin_AI">devin</a>
            </li>
            <li>is desperately trying to reducing his screen time</li>
          </ul>
        </div>
      </div>

      <div className={styles.interests}>
        <p>outside of university, he:</p>
        <ul className={styles.list}>
          <li>
            is an aspiring runner, hoping that his weekly mileage shows some
            consistency
          </li>
          <li>maximises development card production in Catan</li>
          <li>
            (un)professionally uses light-mode (
            <a href="https://catppuccin.com/">catppuccin latte</a>)
          </li>
          <li>
            hopes to maintain a semi-active semi-academic{" "}
            <Link href="/blog">blog</Link>
          </li>
        </ul>
      </div>

      <section className={styles.note}>
        <h2 id="fun-fact">
          fun fact<span>:</span>
        </h2>
        <p>
          when i was 11, i did so happen to write in my yearbook that{" "}
          <em>
            &quot;i wanted to be a computer scientist when i grow up&quot;
          </em>
          . apparently dreams <b>do</b> come true...
        </p>
      </section>

      <section className={styles.note}>
        <h2 id="about-this-site">
          about this site<span>:</span>
        </h2>
        <p>
          to be completely transparent, the website itself was heavily inspired
          by <a href="https://www.ericzheng.org/">eric zheng</a>&#32;(a
          different one). as a person that enjoys the art of story-telling,
          i&apos;ve definitely romanticised having some sort of public, personal
          substack and his website served as the perfect trigger to get started.
          as a <em>second-generation</em> eric zheng with a website, i hope this
          website serves as a good exemplar to spur on the{" "}
          <em>third generation</em>&#32;of eric zheng&apos;s to get started on
          their own.
        </p>

        <p>
          on that note, i do have to give a special shout-out to{" "}
          <a href="https://koutaroyumiba.com/">koutaro yumiba</a>, whose
          persistence in reminding me to update my website is matched only by
          his commitment to not posting on the{" "}
          <a href="https://www.instagram.com/ericzhengfanpage/">
            eric zheng fan page
          </a>
          . i&apos;ve had a revamped website in the works for a good year or so,
          and given my recent graduation from university and my (begrudging)
          first steps into full-time employment, now is <em>probably</em> the
          most optimal time to properly maintain it (although i suspect i had
          more time for this at uni).
        </p>

        <p>
          as for what i want to do with this space, it&apos;s mostly an excuse
          for me to write about topics that interest me, encouraging me to
          properly explore them so i don&apos;t end up spreading misinformation
          on the internet. building the site also helped me make the switch over
          to neovim away from vscode (although my growing dependence on
          terminal-based coding agents probably deserves more of the credit).
        </p>
        <p>
          consequently, as i do hope to remain employed, it is probably an
          adequate time to say that &quot;
          <em>
            all opinions expressed on this website are my own and do not reflect
            the views or positions of any current or past employers
          </em>
          &quot;.
        </p>
      </section>
    </ReadingPage>
  );
}
