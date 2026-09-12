import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import solc from "solc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const contractPath = path.join(projectRoot, "contracts", "SensingRegistry.sol");
const artifactPath = path.join(projectRoot, "artifacts", "SensingRegistry.json");

const source = await fs.readFile(contractPath, "utf8");

const compilerInput = {
  language: "Solidity",
  sources: {
    "SensingRegistry.sol": {
      content: source
    }
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object", "metadata"]
      }
    }
  }
};

const compilerOutput = JSON.parse(solc.compile(JSON.stringify(compilerInput)));
const errors = compilerOutput.errors ?? [];

for (const error of errors) {
  const label = error.severity === "error" ? "ERROR" : "WARN";
  console.error(`[${label}] ${error.formattedMessage.trim()}`);
}

if (errors.some((error) => error.severity === "error")) {
  process.exitCode = 1;
} else {
  const compiled = compilerOutput.contracts["SensingRegistry.sol"].SensingRegistry;
  const artifact = {
    contractName: "SensingRegistry",
    sourceName: "SensingRegistry.sol",
    abi: compiled.abi,
    bytecode: `0x${compiled.evm.bytecode.object}`,
    deployedBytecode: `0x${compiled.evm.deployedBytecode.object}`,
    compiler: {
      name: "solc-js",
      version: solc.version()
    },
    updatedAt: new Date().toISOString()
  };

  await fs.mkdir(path.dirname(artifactPath), { recursive: true });
  await fs.writeFile(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);

  console.log("Compiled contract: SensingRegistry");
  console.log(`Compiler: ${artifact.compiler.name} ${artifact.compiler.version}`);
  console.log(`ABI entries: ${artifact.abi.length}`);
  console.log(`Bytecode size: ${(artifact.bytecode.length - 2) / 2} bytes`);
  console.log(`Artifact: ${artifactPath}`);
}
