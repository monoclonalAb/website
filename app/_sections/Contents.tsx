import Link from "next/link";

export default function Contents() {
  return (
    <>
      <h1>
        contents<span>:</span>
      </h1>
      <p>
        ideally, I wanted the website to be a bit of maze, so having a{" "}
        <b>contents</b> page would be helpful to navigate the site.
      </p>

      {/* The four ids below are rail rows — see app/scroll/outline.ts. */}
      <h2 id="internal-links">
        internal links<span>:</span>
      </h2>
      <dl className="sidebar">
        <dt>
          <a href="#top">/index.html</a>
        </dt>
        <dd>cause every website needs a fancy welcome page</dd>
        <br />
        <dt>
          <a href="#about">/about.html</a>
        </dt>
        <dd>everything you need to know about the site</dd>
        <br />
        <dt>
          <a href="#blog">/blog.html</a>
        </dt>
        <dd>
          the page <b>everyone</b> is here for
        </dd>
        <br />
        <dt>
          <a href="#contents">/contents.html</a>
        </dt>
        <dd>this page (riveting)</dd>
        <br />
        <dt>
          <a href="#changelog">/changelog.html</a>
        </dt>
        <dd>
          for long time fans of the page who want to know what has{" "}
          <b>changed</b>
        </dd>
        <br />
        <dt>
          <Link href="/leetcode">/leetcode.html</Link>
        </dt>
        <dd>to keep track of my daily records</dd>
      </dl>

      <h2 id="external-links">
        external links<span>:</span>
      </h2>
      <p>
        i guess this is doubling as my contacts page, as well as advertising
        where else I am housed on the internet
      </p>

      <h3 id="emails">emails:</h3>
      <dl className="sidebar">
        <dt>
          <a href="mailto:theericzheng@gmail.com">theericzheng@gmail.com</a>
        </dt>
        <dd>
          my main <b>gmail</b>
        </dd>
        <br />
        <dt>
          <a href="mailto:eric.zheng@outlook.com">eric.zheng@outlook.com</a>
        </dt>
        <dd>
          my main <b>outlook</b>
        </dd>
        <br />
        <dt>
          <a href="mailto:ezhe473@aucklanduni.ac.nz">
            ezhe473@aucklanduni.ac.nz
          </a>
        </dt>
        <dd>
          my <span>current university email</span>
        </dd>
      </dl>

      <h3 id="social-media">social media:</h3>
      <dl className="sidebar">
        <dt>
          <a
            href="https://github.com/monoclonalAb"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/monoclonalAb
          </a>
        </dt>
        <dd>
          the only social media i use, <b>GitHub</b>
        </dd>
        <br />
        <dt>
          <a
            href="https://www.kaggle.com/monoclonal"
            target="_blank"
            rel="noopener noreferrer"
          >
            kaggle.com/monoclonal
          </a>
        </dt>
        <dd>
          my favourite networking platform, <b>Kaggle</b>
        </dd>
      </dl>
    </>
  );
}
