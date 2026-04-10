import { useMemo } from 'react';
import { ProposalList } from '../components/proposals/ProposalList';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { useDao } from '../context/daoContextStore';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const {
    loading,
    error,
    uiState,
    pendingVote,
    confirmation,
    resetCountdown,
    currentVoter,
    stats,
    proposals,
    selectVote,
    goBackToBrowse,
    tapPrompt,
    tapError,
  } = useDao();

  const selectionBadgeClass = useMemo(() => {
    if (!pendingVote) {
      return styles.selectionBadge;
    }

    return `${styles.selectionBadge} ${
      pendingVote.vote === 'yes' ? styles.selectionBadgeYes : styles.selectionBadgeNo
    }`;
  }, [pendingVote]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <section className={styles.stateSection}>
      {uiState === 'BROWSE' && (
        <div className={styles.browseContainer}>
          <div className={styles.browseHeader}>
            <h1 className={styles.browseTitle}>Community Proposals</h1>
            <p className={styles.browseSubtitle}>
              Choose a proposal to delegate your vote and then tap your NFC card to confirm.
            </p>
          </div>

          <div className={styles.browseStats}>
            <div className={styles.idleStat}>
              <span className={styles.idleStatValue}>{stats.activeProposalCount}</span>
              <span className={styles.idleStatLabel}>Active Proposals</span>
            </div>
            <div className={styles.idleStatDivider} />
            <div className={styles.idleStat}>
              <span className={styles.idleStatValue}>{stats.totalVoteCount}</span>
              <span className={styles.idleStatLabel}>Votes Cast</span>
            </div>
            <div className={styles.idleStatDivider} />
            <div className={styles.idleStat}>
              <span className={styles.idleStatValue}>{stats.blockCount}</span>
              <span className={styles.idleStatLabel}>Blocks</span>
            </div>
          </div>

          <ProposalList proposals={proposals} onVote={selectVote} />
        </div>
      )}

      {uiState === 'AWAIT_TAP' && pendingVote && (
        <div className={styles.awaitContainer}>
          <div className={styles.selectionSummary}>
            <div className={selectionBadgeClass}>{pendingVote.vote.toUpperCase()}</div>
            <div className={styles.selectionInfo}>
              <span className={styles.selectionLabel}>Your Selection</span>
              <h2 className={styles.selectionTitle}>{pendingVote.proposalTitle}</h2>
              <p className={styles.selectionFunds}>{pendingVote.fundsRequested.toLocaleString()} DAO Tokens</p>
            </div>
            <button className={styles.selectionChange} onClick={goBackToBrowse}>
              ✕ Change
            </button>
          </div>

          <div className={styles.tapPrompt}>
            <div className={styles.nfcRingContainer}>
              <div className={`${styles.nfcRing} ${styles.nfcRing1}`} />
              <div className={`${styles.nfcRing} ${styles.nfcRing2}`} />
              <div className={`${styles.nfcRing} ${styles.nfcRing3}`} />
              <div className={styles.nfcIcon}>📶</div>
            </div>

            <h1 className={`${styles.tapTitle} ${tapError ? styles.tapTitleError : ''}`}>Tap Your Card to Confirm</h1>
            <p className={styles.tapSubtitle}>{tapPrompt}</p>
          </div>
        </div>
      )}

      {uiState === 'CONFIRMED' && confirmation && (
        <div className={styles.confirmedContainer}>
          <div className={styles.confirmCheckmark}>✓</div>
          <h2 className={styles.confirmTitle}>Vote Recorded on Chain!</h2>

          <div className={styles.welcomeCard}>
            <div className={styles.welcomeAvatar}>{confirmation.voter?.avatar || currentVoter?.avatar || '🧑'}</div>
            <div className={styles.welcomeInfo}>
              <h2 className={styles.welcomeName}>{confirmation.voter?.name || currentVoter?.name || 'Community Member'}</h2>
              <p className={styles.welcomeWard}>{confirmation.voter?.ward || currentVoter?.ward || 'Local Resident'}</p>
              <div className={styles.welcomeWallet}>
                <span className={styles.walletLabel}>Wallet:</span>
                <span className={styles.walletAddress}>{confirmation.voter?.wallet || currentVoter?.wallet || '-'}</span>
              </div>
            </div>
            <div className={styles.welcomeVerified}>
              <span className={styles.verifiedIcon}>✓</span>
              <span className={styles.verifiedText}>Verified</span>
            </div>
          </div>

          <p className={styles.confirmDetail}>
            Voted {confirmation.vote?.toUpperCase()} on &quot;{confirmation.proposal?.title}&quot;
          </p>
          <div className={styles.confirmTx}>
            <span className={styles.txLabel}>TX</span>
            <span className={styles.txHash}>{confirmation.txHash}</span>
          </div>
          <p className={styles.confirmReset}>
            Returning to proposals in <span className={styles.resetCountdown}>{resetCountdown}</span>s...
          </p>
        </div>
      )}
    </section>
  );
}
