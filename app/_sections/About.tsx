import Image from "next/image";
import Link from "next/link";
import ericPhoto from "@/public/images/eric_photo_2.jpg";
import Footnote from "./Footnote";
import styles from "./About.module.css";

export default function About() {
  return (
    <>
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
            src={ericPhoto}
            alt="Eric at Parable House, August 2025"
            sizes="(max-width: 599px) 96px, 160px"
          />
          <figcaption>
            <a href="https://maps.app.goo.gl/HQVb5fpzGrYu7AyJ7">
              Parable House
            </a>
            <br />
            August 2025
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
      <blockquote id="fun-fact" className={styles.quote}>
        when I was 11, I wrote in my yearbook that I wanted to be a computer
        scientist. Apparently dreams do come true...
      </blockquote>
      <Footnote />
    </>
  );
}
