import { ethers } from "ethers";

const HARDHAT_CHAIN_ID = 31337;

// Guard against duplicate connection requests
let connectPromise = null;

function ensureEthereumProvider() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  return window.ethereum;
}

export async function connectWallet() {
  // If a connection is already in progress, return that promise
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = (async () => {
    try {
      const ethereum = ensureEthereumProvider();
      const provider = new ethers.BrowserProvider(ethereum);

      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      return {
        provider,
        signer,
        address: await signer.getAddress(),
        chainId: Number(network.chainId),
        networkName: network.name,
        isHardhatNetwork: Number(network.chainId) === HARDHAT_CHAIN_ID,
      };
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

export async function detectNetwork() {
  const ethereum = ensureEthereumProvider();
  const provider = new ethers.BrowserProvider(ethereum);
  const network = await provider.getNetwork();

  return {
    chainId: Number(network.chainId),
    networkName: network.name,
    isHardhatNetwork: Number(network.chainId) === HARDHAT_CHAIN_ID,
  };
}

export function shortenAddress(address = "") {
  if (!address) {
    return "";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
