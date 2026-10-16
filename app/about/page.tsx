import Image from "next/image";
import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { pageMetadata } from "@/lib/metadata";
import photo from "@/public/images/eric_photo_2.jpg";
import styles from "./about.module.css";

export const metadata = pageMetadata("About", "/about", "about ");

export default function AboutPage() {
  return (
    <ReadingPage current="about" className={styles.about}>
      <div className={styles.intro}>
        <h1 id="about-me" className={styles.heading}>
          about me<span>:</span>
        </h1>
        <p className={styles.biography}>
          you are visiting the site of <em>Eric Zheng</em>, a highly caffeinated
          working class citizen, who is probably on a (conversational) long run
          or catching up on the latest book recommendation.
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
          <li>
            maximises development card production in Catan, by employing the
            Ore-Wheat-Sheep Strategy
          </li>
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
        <p>when i was 11, i did so happen to write in my yearbook that</p>
        <blockquote className={styles.quote}>
          i want to be a computer scientist when i grow up
        </blockquote>
        <p>
          apparently dreams <b>do</b> come true...
        </p>
      </section>

      <section className={styles.note}>
        <h2 id="about-this-site">
          about this site<span>:</span>
        </h2>
        <p>
          to be completely transparent, the website itself was heavily inspired
          by <a href="https://www.ericzheng.org/">eric zheng</a>&#32;(the
          original). as a person that enjoys story-telling, i&apos;ve definitely
          romanticised having some sort of public, personal blog or substack and
          his website served as the perfect trigger to get started. who knows,
          maybe this website spurs on a third generation of eric zheng&apos;s to
          get started on their own personal websit-
        </p>

        <p>
          on that note, i also have to give a special shout-out to my{" "}
          <s>
            <em>biggest fan</em>
          </s>{" "}
          good friend <a href="https://koutaroyumiba.com/">koutaro yumiba</a>,
          whose persistence in reminding me to update my website is matched only
          by his commitment to not posting on the{" "}
          <a href="https://www.instagram.com/ericzhengfanpage/">
            eric zheng fan page
          </a>
          -
        </p>

        <p>
          to be completely transparent, the creation of this blog/website was
          quite spontaneous, mainly serving as a platform me to post writings on
          topics that interest me, encouraging me to properly deepen my
          knowledge on whatever i so happen to write about (so i don&apos;t end
          up spreading misinformation on the internet). it also helped me make
          the switch over to neovim, away from vscode (although, arguably my
          dependence on terminal-based developer harnesses probably played a
          larger part).
        </p>
        <p>
          consequently, as i do hope to remain employed, it is probably an
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
