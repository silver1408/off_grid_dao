import styles from './LoadingState.module.css';

export function LoadingState({ label = 'Loading dashboard...' }) {
  return (
    <div className={styles.loadingWrap} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <p>{label}</p>
    </div>
  );
}
