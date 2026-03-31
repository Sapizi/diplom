import styles from "./PageLoader.module.scss";

type PageLoaderProps = {
  label?: string;
  inline?: boolean;
};

export default function PageLoader({
  label = "Загрузка...",
  inline = false,
}: PageLoaderProps) {
  return (
    <div
      className={`${styles.loader} ${inline ? styles.inline : styles.fullscreen}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
