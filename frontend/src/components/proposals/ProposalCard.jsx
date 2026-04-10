import styles from './ProposalCard.module.css';

export function ProposalCard({ proposal, onVote }) {
  const totalVotes = proposal.votesYes + proposal.votesNo;
  const yesPercent = totalVotes > 0 ? Math.round((proposal.votesYes / totalVotes) * 100) : 0;

  return (
    <article className={styles.proposalCard}>
      <div className={styles.proposalHeader}>
        <h4 className={styles.proposalTitle}>{proposal.title}</h4>
        <span className={`${styles.proposalCategory} ${styles[`category${proposal.category}`] || ''}`}>
          {proposal.category}
        </span>
      </div>

      <p className={styles.proposalDesc}>{proposal.description}</p>

      <div className={styles.proposalFunds}>
        Funds Requested:
        <span className={styles.proposalFundsAmount}>{proposal.fundsRequested.toLocaleString()} DAO Tokens</span>
      </div>

      <div className={styles.voteBarContainer}>
        <div className={styles.voteBarLabels}>
          <span className={styles.voteYesLabel}>👍 Yes: {proposal.votesYes}</span>
          <span className={styles.voteNoLabel}>👎 No: {proposal.votesNo}</span>
        </div>
        <div className={styles.voteBar}>
          <div className={styles.voteBarFill} style={{ width: `${yesPercent}%` }} />
        </div>
      </div>

      <div className={styles.voteButtons}>
        <button className={`${styles.voteBtn} ${styles.voteBtnYes}`} onClick={() => onVote(proposal.id, 'yes')}>
          👍 Vote Yes
        </button>
        <button className={`${styles.voteBtn} ${styles.voteBtnNo}`} onClick={() => onVote(proposal.id, 'no')}>
          👎 Vote No
        </button>
      </div>
    </article>
  );
}
