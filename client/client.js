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

function parseArgs(argv) {
  const [command = "help", ...rest] = argv;
  const options = {};

  for (let i = 0; i < rest.length; i += 1) {
    const item = rest[i];
    if (!item.startsWith("--")) {
      continue;
    }

    const key = item.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      i += 1;
    }
  }

  return { command, options };
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function loadContract() {
  const deploymentPath = path.resolve(projectRoot, process.env.DEPLOYMENT_FILE ?? "deployments/local.json");
  const artifactPath = path.join(projectRoot, "artifacts", "SensingRegistry.json");
  const deployment = await readJson(deploymentPath);
  const artifact = await readJson(artifactPath);
  const rpcUrl = process.env.RPC_URL ?? deployment.rpcUrl ?? DEFAULT_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY ?? DEFAULT_PRIVATE_KEY;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(deployment.address, artifact.abi, wallet);

  return { contract, deployment, provider, wallet, rpcUrl };
}

function formatRecord(record) {
  const [id, submitter, dataHash, metadataURI, confidenceScore, timestamp] = record;
  return {
    id: id.toString(),
    submitter,
    dataHash,
    metadataURI,
    confidenceScore: confidenceScore.toString(),
    timestamp: timestamp.toString(),
    timestampISO: new Date(Number(timestamp) * 1000).toISOString()
  };
}

function parseSubmissionEvent(contract, receipt) {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "SensingDataSubmitted") {
        return parsed;
      }
    } catch {
      // Ignore logs from other contracts.
    }
  }
  return undefined;
}

async function submitRecord(options) {
  const { contract, rpcUrl, wallet, deployment } = await loadContract();
  const dataHash =
    options.hash ??
    `keccak256:${ethers.keccak256(ethers.toUtf8Bytes(`cpos-sample-${Date.now()}`)).slice(2)}`;
  const metadataURI = options.uri ?? "ipfs://cpos-demo/uav-flight-telemetry.json";
  const confidenceScore = Number(options.score ?? 95);

  if (!Number.isInteger(confidenceScore) || confidenceScore < 0 || confidenceScore > 100) {
    throw new Error("--score must be an integer between 0 and 100");
  }

  console.log("Submitting sensing data");
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Contract: ${deployment.address}`);
  console.log(`Sender: ${wallet.address}`);
  console.log(`Data hash: ${dataHash}`);
  console.log(`Metadata URI: ${metadataURI}`);
  console.log(`Confidence score: ${confidenceScore}`);

  const tx = await contract.submitData(dataHash, metadataURI, confidenceScore);
  console.log(`Transaction sent: ${tx.hash}`);

  const receipt = await tx.wait();
  const event = parseSubmissionEvent(contract, receipt);

  console.log(`Transaction mined in block: ${receipt.blockNumber}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);

  if (event) {
    console.log("Event SensingDataSubmitted:");
    console.log(`  recordId: ${event.args.recordId.toString()}`);
    console.log(`  submitter: ${event.args.submitter}`);
    console.log(`  dataHash: ${event.args.dataHash}`);
    console.log(`  metadataURI: ${event.args.metadataURI}`);
    console.log(`  confidenceScore: ${event.args.confidenceScore.toString()}`);
    console.log(`  timestamp: ${event.args.timestamp.toString()}`);
  }

  return event?.args.recordId;
}

async function getRecord(options) {
  const { contract, deployment } = await loadContract();
  const id = options.id;

  if (!id) {
    throw new Error('Missing required option: --id. Example: npm run client:get -- --id 1');
  }

  console.log(`Querying record ${id}`);
  console.log(`Contract: ${deployment.address}`);

  const record = await contract.getRecord(id);
  console.log(JSON.stringify(formatRecord(record), null, 2));
}

async function listRecords(options) {
  const { contract, deployment, wallet } = await loadContract();
  const account = options.account ?? wallet.address;

  console.log("Querying record ids by submitter");
  console.log(`Contract: ${deployment.address}`);
  console.log(`Submitter: ${account}`);

  const ids = await contract.getRecordIdsBySubmitter(account);
  console.log(`Record IDs: ${ids.map((id) => id.toString()).join(", ") || "(none)"}`);
}

async function runDemo() {
  const { contract, deployment, provider, wallet, rpcUrl } = await loadContract();
  const network = await provider.getNetwork();

  console.log("CPoS SensingRegistry client demo");
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Chain ID: ${network.chainId.toString()}`);
  console.log(`Contract: ${deployment.address}`);
  console.log(`Client account: ${wallet.address}`);
  console.log(`Initial totalRecords: ${(await contract.totalRecords()).toString()}`);
  console.log("");

  const firstId = await submitRecord({
    hash: `keccak256:${ethers.keccak256(ethers.toUtf8Bytes('cpos-demo-uav-altitude')).slice(2)}`,
    uri: "ipfs://cpos-demo/uav-001-altitude-window-01.json",
    score: "92"
  });

  console.log("");

  await submitRecord({
    hash: `keccak256:${ethers.keccak256(ethers.toUtf8Bytes('cpos-demo-uav-location')).slice(2)}`,
    uri: "ipfs://cpos-demo/uav-001-location-proof-01.json",
    score: "88"
  });

  console.log("");
  console.log(`Total records after submissions: ${(await contract.totalRecords()).toString()}`);

  if (firstId) {
    console.log(`Retrieving first submitted record: ${firstId.toString()}`);
    const record = await contract.getRecord(firstId);
    console.log(JSON.stringify(formatRecord(record), null, 2));
  }

  const ids = await contract.getRecordIdsBySubmitter(wallet.address);
  console.log(`Record IDs for client account: ${ids.map((id) => id.toString()).join(", ")}`);
}

function printHelp() {
  console.log(`Usage:
  node client/client.js demo
  node client/client.js submit --hash <dataHash> --uri <metadataURI> --score <0-100>
  node client/client.js get --id <recordId>
  node client/client.js list [--account <address>]

Environment:
  RPC_URL          Defaults to http://127.0.0.1:8545
  PRIVATE_KEY      Defaults to Hardhat local account #0
  DEPLOYMENT_FILE  Defaults to deployments/local.json`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (command === "submit") {
    await submitRecord(options);
  } else if (command === "get") {
    await getRecord(options);
  } else if (command === "list") {
    await listRecords(options);
  } else if (command === "demo") {
    await runDemo();
  } else {
    printHelp();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
