import Image from "next/image";
import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { pageMetadata } from "@/lib/metadata";
import photo from "@/public/images/eric_photo_2.jpg";
import styles from "./about.module.css";

export const metadata = pageMetadata(
  "About",
  "/about",
  "About Eric Zheng, an undergraduate studying Mathematics and Computer Science in Auckland, New Zealand.",
);

export default function AboutPage() {
  return (
    <ReadingPage current="about" className={styles.about}>
      <div className={styles.intro}>
        <h1 id="about-me" className={styles.heading}>
          about me<span>:</span>
        </h1>
        <p className={styles.biography}>
          you are visiting the site of Eric Zheng, an undergraduate student
          studying Mathematics and Computer Science in Auckland, New Zealand.
        </p>
        <figure className={styles.portrait}>
          <Image
            src={photo}
            alt="Eric at Parable House, August 2025"
            sizes="(max-width: 599px) 96px, 160px"
          />
          <figcaption>
            picture of me at
            <br />
            <a href="https://maps.app.goo.gl/HQVb5fpzGrYu7AyJ7">
              Parable House
            </a>
            , August 2025
          </figcaption>
        </figure>
        <div className={styles.peers}>
          <p>like many of his peers, he:</p>
          <ul className={styles.list}>
            <li>is a little below average height on a good day</li>
            <li>dreams about becoming a fabled &apos;10x developer&apos;</li>
            <li>
              worries about getting replaced by the next{" "}
              <a href="https://en.wikipedia.org/wiki/Devin_AI">Devin</a>
            </li>
            <li>
              muses over the <Link href="/leetcode">daily Leetcode</Link> on his
              journey to class
            </li>
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
          <li>
            maximises development card production in Catan, by employing the
            Ore-Wheat-Sheep Strategy
          </li>
          <li>
            professionally uses light-mode (
            <a href="https://catppuccin.com/">catppuccin latte</a>)
          </li>
          <li>
            hopes to maintain a semi-active semi-academic{" "}
            <Link href="/blog">blog</Link>
          </li>
        </ul>
      </div>

      <section className={styles.notes}>
        <h2 id="fun-fact">
          fun fact<span>:</span>
        </h2>
        <p>
          when I was 11, I did so happen to write in my yearbook that &quot;
          <em>I want[ed] to be a computer scientist</em>&quot; when I grow up.
          Apparently <b>dreams</b> do come true...
        </p>

        <h2 id="about-this-site">
          about this site<span>:</span>
        </h2>
        <p>
          now, all antics aside, the website itself was created with{" "}
          <b>Next.js</b>, and was heavily inspired by{" "}
          <a href="https://www.ericzheng.org/">Eric Zheng</a>.
        </p>

        <h2 id="footnote">
          footnote<span>:</span>
        </h2>
        <p>
          to be completely transparent, the creation of this blog/website was
          quite spontaneous, but there were <b>2 main reasons</b> why I decided
          to follow through:
        </p>
        <ol className={styles.reasons}>
          <li>
            As my career as a full-time undergraduate student is coming to an
            end, I have came to the shocking realisation that{" "}
            <em>
              I might not ever have as great of an opportunity to learn ever
              again
            </em>{" "}
            (slightly exaggerated for comedic effect). In order to combat this
            looming stagnation in my learning, I thought it would be quite
            useful to have a custom platform to post my writings on topics that
            interest me (so far, just leetcode and group theory). I hoped that
            this will then encourage me to <i>deepen my knowledge</i> on
            whatever I so happen to write about (otherwise, I might just end up
            spreading misinformation on the internet).
          </li>
          <li>
            I was also looking to migrate my editor set-up from VS-Code to
            Neovim and wanted a project to complete in order to help ease the
            transition. I did hope that upon deployment, I would eventually be
            able to come up with a good excuse for why it was imperative to swap
            editors, but realistically I just thought Neovim looked <em>fun</em>
            .
          </li>
        </ol>
        <p>
          Consequently, as I do hope to remain employed, it is probably an
          adequate time to say that &quot;
          <em>
            All opinions expressed on this website are my own and do not reflect
            the views or positions of any current or past employers.
          </em>
          &quot;
        </p>
      </section>
    </ReadingPage>
  );
}
