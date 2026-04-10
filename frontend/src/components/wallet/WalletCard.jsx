import { shortenAddress } from '../../services/web3';
import styles from './WalletCard.module.css';

export function WalletCard({ wallet, onConnect, connecting }) {
  const connected = Boolean(wallet?.address);

  return (
    <section className={styles.walletCard}>
      <div>
        <h2 className={styles.title}>Wallet Connection</h2>
        <p className={styles.subtitle}>Connect MetaMask to inspect balances and trigger transactions.</p>
      </div>

      <div className={styles.grid}>
        <div>
          <span className={styles.label}>Address</span>
          <p className={styles.value}>{connected ? shortenAddress(wallet.address) : 'Not connected'}</p>
        </div>
        <div>
          <span className={styles.label}>Network</span>
          <p className={styles.value}>{wallet?.networkName || 'Unknown'}</p>
        </div>
        <div>
          <span className={styles.label}>Chain</span>
          <p className={styles.value}>{wallet?.chainId || '-'}</p>
        </div>
      </div>

      {!wallet?.isHardhatNetwork && connected && (
        <p className={styles.warning}>Switch MetaMask to Hardhat local network (chain id 31337).</p>
      )}

      <button className={styles.connectBtn} onClick={onConnect} disabled={connecting}>
        {connecting ? 'Connecting...' : connected ? 'Reconnect Wallet' : 'Connect MetaMask'}
      </button>
    </section>
  );
}
