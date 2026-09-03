"use client";

import { Fragment, type CSSProperties, type ReactNode } from "react";
import styles from "./HomePage.module.css";
import { useCursorRepel } from "./useCursorRepel";

type LettersToken = { kind: "letters"; text: string };
type NameToken = { kind: "name"; text: string };
type LinkToken = {
  kind: "link";
  before: string;
  text: string;
  href: string;
  after: string;
};
type Token = LettersToken | NameToken | LinkToken;

const letters = (text: string): LettersToken => ({ kind: "letters", text });
const name = (text: string): NameToken => ({ kind: "name", text });
const link = (
  before: string,
  text: string,
  href: string,
  after = "",
): LinkToken => ({ kind: "link", before, text, href, after });

const step = (n: number) => `calc(var(--expand) * ${n})`;

export default function HomePage() {
  const { register, registerStatic, containerProps } = useCursorRepel(true);

  const letter = (
    ch: string,
    key: string | number,
    opts: { repel?: boolean; extra?: string; spread?: string } = {},
  ) => {
    const { repel = true, extra, spread } = opts;
    return (
      <span
        key={key}
        className={extra ? `${styles.letter} ${extra}` : styles.letter}
        ref={repel ? register : registerStatic}
        data-letter
        data-frozen={repel ? undefined : ""}
        style={spread ? ({ "--spread-x": spread } as CSSProperties) : undefined}
      >
        <span className={styles.glyph}>{ch === " " ? " " : ch}</span>
      </span>
    );
  };

  const renderRun = (
    text: string,
    o: { repel?: boolean; extra?: string; spread?: string; keyPrefix: string },
  ) =>
    Array.from(text).map((ch, i) =>
      letter(ch, `${o.keyPrefix}${i}`, {
        repel: o.repel,
        extra: o.extra,
        spread: o.spread,
      }),
    );

  const renderLink = (tok: LinkToken, c: number) => [
    ...Array.from(tok.before).map((ch, i) =>
      letter(ch, `b${i}`, { spread: step(-c) }),
    ),
    <a href={tok.href} aria-label={tok.text} key="link">
      {Array.from(tok.text).map((ch, i) =>
        letter(ch, i, { repel: false, spread: step(i - c) }),
      )}
    </a>,
    ...Array.from(tok.after).map((ch, i) =>
      letter(ch, `a${i}`, { spread: step(c) }),
    ),
  ];

  const segment = (cls: string, segs: ReactNode[], spread?: string) => (
    <span
      className={cls}
      style={spread ? ({ "--spread-x": spread } as CSSProperties) : undefined}
    >
      {segs.map((s, i) => (
        <Fragment key={i}>{s}</Fragment>
      ))}
    </span>
  );

  const line = (tokens: Token[]) => {
    const last = tokens[tokens.length - 1];
    const leftTokens = tokens.slice(0, -1);

    let right: ReactNode[];
    let leftSpread: string | undefined;

    if (last.kind === "link") {
      const c = (last.text.length - 1) / 2;
      leftSpread = step(-c);
      right = renderLink(last, c);
    } else {
      right = renderRun(last.text, {
        repel: last.kind === "letters",
        extra: last.kind === "name" ? styles.name : undefined,
        keyPrefix: "r",
      });
    }

    const left = leftTokens.map((tok, t) =>
      renderRun(tok.text, {
        repel: tok.kind === "letters",
        extra: tok.kind === "name" ? styles.name : undefined,
        keyPrefix: `l${t}-`,
      }),
    );

    return (
      <span className={styles.line}>
        {segment(styles.leftSeg, left, leftSpread)}
        {segment(styles.rightSeg, right)}
      </span>
    );
  };

  return (
    <div id="top" className={styles.siteContainer} {...containerProps}>
      <h1 className={styles.title} aria-label="Eric Zheng">
        {line([letters("ABCDEF"), letters("abcdefg")])}
        {line([letters("GHIJKL"), link("h", "about", "#about", "ij")])}
        {line([
          letters("M"),
          name("ERIC"),
          letters("N"),
          link("klm", "blog", "#blog", "n"),
        ])}
        {line([
          letters("O"),
          name("ZHENG"),
          link("o", "contents", "#contents"),
        ])}
        {line([letters("PQRSTU"), link("p", "changelog", "#changelog")])}
        {line([letters("VWXYZ"), letters("qrstuvwxyz")])}
      </h1>
    </div>
  );
}
