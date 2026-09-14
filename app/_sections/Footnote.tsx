/* eslint-disable react/no-unescaped-entities */
import styles from "./Footnote.module.css";

export default function Footnote() {
  return (
    <details className={styles.footnote}>
      <summary>a footnote on why this site exists</summary>
      <div className={styles.body}>
        <h3 id="footnote">
          footnote<span>:</span>
        </h3>
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
          adequate time to say that "
          <em>
            All opinions expressed on this website are my own and do not reflect
            the views or positions of any current or past employers.
          </em>
          "
        </p>
        <h3 id="fun-fact">
          fun fact<span>:</span>
        </h3>
        <p>
          when I was 11, I wrote in my yearbook that “I wanted to be a computer
          scientist” when I grow up. Apparently dreams do come true...
        </p>
        <h3 id="about-this-site">
          about this site<span>:</span>
        </h3>
        <p>
          This site is built with Next.js, with hand-authored content and local
          fonts. Its original inspiration was{" "}
          <a href="https://www.ericzheng.org/">Eric Zheng</a>.
        </p>
      </div>
    </details>
  );
}
