import { useCallback, useEffect, useState } from 'react';
import { BalanceDisplay } from '../components/wallet/BalanceDisplay';
import { TransactionForm } from '../components/wallet/TransactionForm';
import { WalletCard } from '../components/wallet/WalletCard';
import { walletApi } from '../services/api';
import { connectWallet } from '../services/web3';
import styles from './WalletPage.module.css';

export default function WalletPage() {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [details, setDetails] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadDetails = useCallback(async (address) => {
    setLoadingDetails(true);
    setError('');
    try {
      const response = await walletApi.getWalletDetails(address);
      setDetails(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load wallet details.');
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError('');
    setSuccess('');
    try {
      const payload = await connectWallet();
      setWallet(payload);
      await loadDetails(payload.address);
    } catch (err) {
      setError(err.message || 'Unable to connect wallet.');
    } finally {
      setConnecting(false);
    }
  }

  async function handleDeposit(amountEth) {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await walletApi.deposit(amountEth);
      setSuccess(`Deposit submitted: ${response.data.transactionHash}`);
      await loadDetails(wallet?.address);
    } catch (err) {
      setError(err.message || 'Deposit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(amountEth) {
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await walletApi.withdraw(amountEth);
      setSuccess(`Withdrawal submitted: ${response.data.transactionHash}`);
      await loadDetails(wallet?.address);
    } catch (err) {
      setError(err.message || 'Withdraw failed.');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    walletApi
      .getWalletDetails()
      .then((response) => setDetails(response.data))
      .catch(() => undefined);
  }, []);

  return (
    <section className={styles.pageWrap}>
      <div className={styles.intro}>
        <h1>Simple Wallet</h1>
        <p>Deposit and withdraw ETH through the deployed SimpleWallet smart contract.</p>
      </div>

      <div className={styles.grid}>
        <WalletCard wallet={wallet} onConnect={handleConnect} connecting={connecting} />
        <BalanceDisplay details={details} loading={loadingDetails} />
      </div>

      <div className={styles.actions}>
        <section className={styles.actionCard}>
          <h3>Deposit</h3>
          <TransactionForm type="deposit" onSubmit={handleDeposit} submitting={submitting} />
        </section>

        <section className={styles.actionCard}>
          <h3>Withdraw</h3>
          <TransactionForm type="withdraw" onSubmit={handleWithdraw} submitting={submitting} />
        </section>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </section>
  );
}
