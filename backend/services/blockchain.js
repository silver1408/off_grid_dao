import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const walletArtifactPath = path.join(__dirname, '..', 'artifacts', 'simpleWallet.json');
const daoArtifactPath = path.join(__dirname, '..', 'artifacts', 'dao.json');

let provider;
let signer;
let walletContract;
let daoContract;
let walletArtifactCache;
let daoArtifactCache;

// ─────────────────────────────────────────────
// ARTIFACT LOADING
// ─────────────────────────────────────────────

function loadArtifact() {
  if (!fs.existsSync(walletArtifactPath)) {
    throw new Error('Contract artifact not found. Run npm run deploy first.');
  }

  const raw = fs.readFileSync(walletArtifactPath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!parsed.address || !parsed.abi) {
    throw new Error('Invalid artifact file. Expected address and abi fields.');
  }

  const contractAddress = process.env.CONTRACT_ADDRESS || parsed.address;

  walletArtifactCache = {
    ...parsed,
    address: contractAddress,
  };
  return walletArtifactCache;
}

function loadDAOArtifact() {
  if (!fs.existsSync(daoArtifactPath)) {
    throw new Error('DAO artifact not found. Run npm run deploy first.');
  }

  const raw = fs.readFileSync(daoArtifactPath, 'utf-8');
  const parsed = JSON.parse(raw);

  if (!parsed.address || !parsed.abi) {
    throw new Error('Invalid DAO artifact. Expected address and abi fields.');
  }

  const contractAddress = process.env.DAO_ADDRESS || parsed.address;

  daoArtifactCache = {
    ...parsed,
    address: contractAddress,
  };
  return daoArtifactCache;
}

// ─────────────────────────────────────────────
// PROVIDER & SIGNER
// ─────────────────────────────────────────────

function getProvider() {
  if (!provider) {
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  return provider;
}

function getSigner() {
  if (!signer) {
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      signer = new ethers.Wallet(privateKey, getProvider());
    } else {
      signer = getProvider().getSigner(0);
    }
  }

  return signer;
}

// ─────────────────────────────────────────────
// CONTRACT INSTANCES
// ─────────────────────────────────────────────

function getContract() {
  if (!walletContract) {
    const artifact = walletArtifactCache || loadArtifact();
    walletContract = new ethers.Contract(artifact.address, artifact.abi, getSigner());
  }

  return walletContract;
}

function getDAOContract() {
  if (!daoContract) {
    const artifact = daoArtifactCache || loadDAOArtifact();
    daoContract = new ethers.Contract(artifact.address, artifact.abi, getSigner());
  }

  return daoContract;
}

// ─────────────────────────────────────────────
// SIMPLE WALLET FUNCTIONS
// ─────────────────────────────────────────────

async function getWalletDetails(targetAddress) {
  const wallet = getContract();
  const activeSigner = await getSigner();
  const signerAddress = await activeSigner.getAddress();
  const accountAddress = targetAddress || signerAddress;

  const [userBalance, contractFunds, chainNetwork] = await Promise.all([
    wallet.balances(accountAddress),
    wallet.getBalance(accountAddress),
    getProvider().getNetwork(),
  ]);

  return {
    owner: signerAddress,
    account: accountAddress,
    contractAddress: wallet.target,
    chainId: Number(chainNetwork.chainId),
    userBalanceWei: userBalance.toString(),
    userBalanceEth: ethers.formatEther(userBalance),
    contractBalanceWei: contractFunds.toString(),
    contractBalanceEth: ethers.formatEther(contractFunds),
  };
}

async function getBalance(targetAddress) {
  const wallet = getContract();
  const activeSigner = await getSigner();
  const signerAddress = await activeSigner.getAddress();
  const accountAddress = targetAddress || signerAddress;
  const balance = await wallet.balances(accountAddress);

  return {
    account: accountAddress,
    balanceWei: balance.toString(),
    balanceEth: ethers.formatEther(balance),
  };
}

async function deposit(amountEth) {
  const wallet = getContract();
  const value = ethers.parseEther(String(amountEth));
  const tx = await wallet.deposit({ value });
  const receipt = await tx.wait();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    amountEth: String(amountEth),
  };
}

async function withdraw(amountEth) {
  const wallet = getContract();
  const value = ethers.parseEther(String(amountEth));
  const tx = await wallet.withdraw(value);
  const receipt = await tx.wait();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    amountEth: String(amountEth),
  };
}

// ─────────────────────────────────────────────
// DAO FUNCTIONS - PROPOSALS
// ─────────────────────────────────────────────

async function createProposal(title, description, fundsRequested = 0) {
  const dao = getDAOContract();
  const tx = await dao.createProposal(title, description, fundsRequested);
  const receipt = await tx.wait();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    status: 'submitted',
  };
}

async function getAllProposals() {
  const dao = getDAOContract();
  const proposals = await dao.getAllProposals();

  return proposals.map((proposal) => ({
    id: proposal.id.toString(),
    title: proposal.title,
    description: proposal.description,
    creator: proposal.creator,
    createdAt: proposal.createdAt.toString(),
    votesYes: proposal.votesYes.toString(),
    votesNo: proposal.votesNo.toString(),
    executed: proposal.executed,
    fundsRequested: ethers.formatEther(proposal.fundsRequested),
  }));
}

async function getProposal(proposalId) {
  const dao = getDAOContract();
  const proposal = await dao.getProposal(proposalId);

  return {
    id: proposal.id.toString(),
    title: proposal.title,
    description: proposal.description,
    creator: proposal.creator,
    createdAt: proposal.createdAt.toString(),
    votesYes: proposal.votesYes.toString(),
    votesNo: proposal.votesNo.toString(),
    executed: proposal.executed,
    fundsRequested: ethers.formatEther(proposal.fundsRequested),
  };
}

// ─────────────────────────────────────────────
// DAO FUNCTIONS - VOTING
// ─────────────────────────────────────────────

async function castVote(proposalId, voteYes) {
  const dao = getDAOContract();
  const tx = await dao.vote(proposalId, voteYes);
  const receipt = await tx.wait();

  const signer = await getSigner();
  const voterAddress = await signer.getAddress();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    proposalId: proposalId.toString(),
    voter: voterAddress,
    vote: voteYes ? 'yes' : 'no',
    status: 'recorded',
  };
}

async function hasUserVoted(proposalId, voterAddress) {
  const dao = getDAOContract();
  const voted = await dao.hasUserVoted(proposalId, voterAddress);

  return voted;
}

async function getUserVote(proposalId, voterAddress) {
  const dao = getDAOContract();
  const vote = await dao.getUserVote(proposalId, voterAddress);

  return vote;
}

// ─────────────────────────────────────────────
// DAO FUNCTIONS - TREASURY
// ─────────────────────────────────────────────

async function getTreasuryStatus() {
  const dao = getDAOContract();
  const [totalFunds, allocated, available] = await dao.getTreasuryStatus();

  return {
    totalFundsWei: totalFunds.toString(),
    totalFundsEth: ethers.formatEther(totalFunds),
    allocatedWei: allocated.toString(),
    allocatedEth: ethers.formatEther(allocated),
    availableWei: available.toString(),
    availableEth: ethers.formatEther(available),
    contractBalance: ethers.formatEther(await getProvider().getBalance(await getDAOContract().getAddress())),
  };
}

async function allocateFunds(proposalId, amountEth) {
  const dao = getDAOContract();
  const amountWei = ethers.parseEther(String(amountEth));
  const tx = await dao.allocateFunds(proposalId, amountWei);
  const receipt = await tx.wait();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    proposalId: proposalId.toString(),
    amountEth: String(amountEth),
    status: 'allocated',
  };
}

async function transferFromTreasury(recipientAddress, amountEth) {
  const dao = getDAOContract();
  const amountWei = ethers.parseEther(String(amountEth));
  const tx = await dao.transferFromTreasury(recipientAddress, amountWei);
  const receipt = await tx.wait();

  return {
    transactionHash: tx.hash,
    blockNumber: receipt.blockNumber,
    recipient: recipientAddress,
    amountEth: String(amountEth),
    status: 'transferred',
  };
}

// ─────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────

function onDAOProposalCreated(callback) {
  const dao = getDAOContract();
  dao.on('ProposalCreated', (proposalId, title, creator, timestamp) => {
    callback({
      proposalId: proposalId.toString(),
      title,
      creator,
      timestamp: timestamp.toString(),
    });
  });
}

function onDAOVoteCasted(callback) {
  const dao = getDAOContract();
  dao.on('VoteCasted', (proposalId, voter, vote, timestamp) => {
    callback({
      proposalId: proposalId.toString(),
      voter,
      vote,
      timestamp: timestamp.toString(),
    });
  });
}

function onDAOFundsTransferred(callback) {
  const dao = getDAOContract();
  dao.on('FundsTransferred', (from, to, amount, timestamp) => {
    callback({
      from,
      to,
      amount: ethers.formatEther(amount),
      timestamp: timestamp.toString(),
    });
  });
}

function removeAllListeners() {
  if (daoContract) {
    daoContract.removeAllListeners();
  }
  if (walletContract) {
    walletContract.removeAllListeners();
  }
}

export {
  loadArtifact,
  loadDAOArtifact,
  getProvider,
  getSigner,
  getContract,
  getDAOContract,
  getWalletDetails,
  getBalance,
  deposit,
  withdraw,
  createProposal,
  getAllProposals,
  getProposal,
  castVote,
  hasUserVoted,
  getUserVote,
  getTreasuryStatus,
  allocateFunds,
  transferFromTreasury,
  onDAOProposalCreated,
  onDAOVoteCasted,
  onDAOFundsTransferred,
  removeAllListeners,
};
