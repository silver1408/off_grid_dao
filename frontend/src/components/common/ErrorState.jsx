import styles from './ErrorState.module.css';

export function ErrorState({ message }) {
  return (
    <div className={styles.errorWrap} role="alert">
      <h2>Unable to load data</h2>
      <p>{message}</p>
    </div>
  );
}
