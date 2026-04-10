import { useState } from 'react';
import styles from './CreatePage.module.css';

export default function CreatePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundsRequested, setFundsRequested] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <section className={styles.pageWrap}>
      <div className={styles.intro}>
        <h1>Create Proposal</h1>
        <p>Prepare a proposal draft. Submission API can be plugged in when backend support is enabled.</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.fieldLabel}>
          Proposal Title
          <input
            className={styles.field}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Neighborhood Tool Library"
          />
        </label>

        <label className={styles.fieldLabel}>
          Description
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Describe the proposal impact for the community."
          />
        </label>

        <label className={styles.fieldLabel}>
          Requested Funds
          <input
            className={styles.field}
            type="number"
            min="1"
            value={fundsRequested}
            onChange={(event) => setFundsRequested(event.target.value)}
            placeholder="75000"
          />
        </label>

        <button className={styles.submitBtn} type="submit" disabled>
          Submit (Backend Endpoint Pending)
        </button>
      </form>
    </section>
  );
}
