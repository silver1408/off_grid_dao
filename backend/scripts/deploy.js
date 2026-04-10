import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import hre from 'hardhat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'ETH');

  // Deploy SimpleWallet
  console.log('\n📦 Deploying SimpleWallet...');
  const walletFactory = await hre.ethers.getContractFactory('SimpleWallet');
  const wallet = await walletFactory.deploy();
  await wallet.waitForDeployment();

  const walletAddress = await wallet.getAddress();
  console.log('✅ SimpleWallet deployed at:', walletAddress);

  const walletArtifact = {
    contractName: 'SimpleWallet',
    address: walletAddress,
    abi: wallet.interface.formatJson ? JSON.parse(wallet.interface.formatJson()) : wallet.interface.fragments,
  };

  const walletOutputPath = path.join(__dirname, '..', 'artifacts', 'simpleWallet.json');
  fs.mkdirSync(path.dirname(walletOutputPath), { recursive: true });
  fs.writeFileSync(walletOutputPath, JSON.stringify(walletArtifact, null, 2));
  console.log('📄 Artifact saved to:', walletOutputPath);

  // Deploy DAO
  console.log('\n📦 Deploying DAO...');
  const daoFactory = await hre.ethers.getContractFactory('DAO');
  const dao = await daoFactory.deploy();
  await dao.waitForDeployment();

  const daoAddress = await dao.getAddress();
  console.log('✅ DAO deployed at:', daoAddress);

  const daoArtifact = {
    contractName: 'DAO',
    address: daoAddress,
    abi: dao.interface.formatJson ? JSON.parse(dao.interface.formatJson()) : dao.interface.fragments,
  };

  const daoOutputPath = path.join(__dirname, '..', 'artifacts', 'dao.json');
  fs.mkdirSync(path.dirname(daoOutputPath), { recursive: true });
  fs.writeFileSync(daoOutputPath, JSON.stringify(daoArtifact, null, 2));
  console.log('📄 Artifact saved to:', daoOutputPath);

  // Save deployment info
  const deploymentInfo = {
    deploymentTime: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      SimpleWallet: walletAddress,
      DAO: daoAddress,
    },
  };

  const infoPath = path.join(__dirname, '..', 'artifacts', 'deployment.json');
  fs.writeFileSync(infoPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\n📋 Deployment info saved to:', infoPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
