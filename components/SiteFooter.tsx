import styles from "./SiteFooter.module.css";

export default function SiteFooter({ home = false }: { home?: boolean }) {
  return (
    <footer className={styles.footer}>
      <p>Eric Zheng · Auckland, New Zealand</p>
      <a href={home ? "#top" : "/"}>
        {home ? "back to top ↑" : "back to home ↑"}
      </a>
    </footer>
  );
}
