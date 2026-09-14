import styles from "./SiteFooter.module.css";

export default function SiteFooter({ page }: { page: string }) {
  return (
    <footer className={styles.footer}>
      <a href={`#${page}-top`}>back to top ↑</a>
    </footer>
  );
}
