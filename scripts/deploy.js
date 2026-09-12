import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const DEFAULT_RPC_URL = "http://127.0.0.1:8545";
// Public Hardhat development key; never fund or use this account on a live network.
const DEFAULT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const rpcUrl = process.env.RPC_URL ?? DEFAULT_RPC_URL;
const privateKey = process.env.PRIVATE_KEY ?? DEFAULT_PRIVATE_KEY;
const artifactPath = path.join(projectRoot, "artifacts", "SensingRegistry.json");
const deploymentPath = path.resolve(projectRoot, process.env.DEPLOYMENT_FILE ?? "deployments/local.json");

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

const artifact = await readJson(artifactPath).catch((error) => {
  console.error(`Cannot read artifact at ${artifactPath}. Run "npm run compile" first.`);
  throw error;
});

const provider = new ethers.JsonRpcProvider(rpcUrl);

let network;
try {
  network = await provider.getNetwork();
} catch (error) {
  console.error(`Cannot connect to local blockchain at ${rpcUrl}.`);
  console.error('Start it in another terminal with "npm run node", then run deployment again.');
  throw error;
}

const deployer = new ethers.Wallet(privateKey, provider);
const balance = await provider.getBalance(deployer.address);

console.log("Deploying SensingRegistry");
console.log(`RPC URL: ${rpcUrl}`);
console.log(`Chain ID: ${network.chainId.toString()}`);
console.log(`Deployer: ${deployer.address}`);
console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);
const contract = await factory.deploy();
const deploymentTx = contract.deploymentTransaction();

console.log(`Deployment transaction sent: ${deploymentTx.hash}`);

await contract.waitForDeployment();
const address = await contract.getAddress();
const receipt = await deploymentTx.wait();

const deployment = {
  contractName: artifact.contractName,
  address,
  rpcUrl,
  chainId: network.chainId.toString(),
  deployer: deployer.address,
  transactionHash: deploymentTx.hash,
  blockNumber: receipt.blockNumber,
  gasUsed: receipt.gasUsed.toString(),
  deployedAt: new Date().toISOString(),
  artifact: path.relative(projectRoot, artifactPath)
};

await fs.mkdir(path.dirname(deploymentPath), { recursive: true });
await fs.writeFile(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

console.log(`Contract address: ${address}`);
console.log(`Block number: ${receipt.blockNumber}`);
console.log(`Gas used: ${receipt.gasUsed.toString()}`);
console.log(`Deployment metadata: ${deploymentPath}`);
