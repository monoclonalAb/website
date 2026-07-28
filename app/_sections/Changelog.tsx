import Link from "next/link";

export default function Changelog() {
  return (
    <>
      <h1>
        changelog<span>:</span>
      </h1>
      <p>the update log!! will implement RSS when time permits!!!</p>
      <dl className="sidebar">
        <dt>
          <span className="release">1.2.1</span> <time>06/07/2025</time>
        </dt>
        <dd>
          added a <b>table of contents</b> to every article, reformatting all{" "}
          <i>blog</i> and <i>leetcode</i> posts
        </dd>
        <br />
        <dt>
          <span className="release">1.2.0</span> <time>18/05/2025</time>
        </dt>
        <dd>
          third blog post of the year on <i>c++</i> (I am not slacking)
        </dd>
        <br />
        <dt>
          <span className="release">1.1.1</span> <time>10/03/2025</time>
        </dt>
        <dd>
          minor <i>infrastructure</i> changes (e.g. change to leetcode file
          structure) and <i>style changes</i> (e.g. slightly muted colours, can
          actually differentiate what a link looks like now)
        </dd>
        <br />
        <dt>
          <span className="release">1.1.0</span> <time>26/02/2025</time>
        </dt>
        <dd>
          second blog post of the year on <i>competitive programming</i>
        </dd>
        <br />
        <dt>
          <span className="release">1.0.3</span> <time>08/02/2025</time>
        </dt>
        <dd>
          <b>update</b> design of <Link href="/leetcode">./leetcode</Link> page
          and using <b>Eiko</b> as my header font
        </dd>
        <br />
        <dt>
          <span className="release">1.0.2</span> <time>28/01/2025</time>
        </dt>
        <dd>
          created a <b>Makefile command</b> to catch up with older problems
        </dd>
        <br />
        <dt>
          <span className="release">1.0.1</span> <time>18/01/2025</time>
        </dt>
        <dd>
          <b>creation</b> of the <Link href="/leetcode">./leetcode</Link> page
        </dd>
        <br />
        <dt>
          <span className="release">1.0.0</span> <time>09/01/2025</time>
        </dt>
        <dd>
          <b>official launch</b> of the site & wrote a blog post on{" "}
          <i>group theory</i>
        </dd>
      </dl>
    </>
  );
}
