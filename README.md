# Collaborative Proof-of-Sensing for Trusted Multi-Robot Auditing

**SURF 2026 · Blockchain Security Group · Research prototype**

This project studies how autonomous robots can submit verifiable sensing evidence without placing raw sensor data on-chain. A sensing digest and metadata pointer are registered on a local Ethereum-compatible test network, while mission data remains off-chain.

## Prototype components

- Solidity `SensingRegistry` for digest submission, retrieval, confidence scores, timestamps, and audit events.
- Hardhat local network with deterministic deployment and transaction evidence.
- `ethers.js` client for submit, retrieve, and list operations.
- Separate ROS 2 Jazzy, Gazebo Harmonic, and PX4 SITL multi-UAV simulation work.

## Quick start

Use Node.js 22.10+ (or a newer supported even-numbered LTS release). Install the locked dependencies with `npm ci`.

**Terminal 1** — start the local development chain and leave it running:

```bash
npm ci
npm run node
```

**Terminal 2** — from the same project directory:

```bash
npm run compile
npm run deploy
npm run client:demo
npm run client:get -- --id 1
npm run client:list
node --test tests/demo.test.js
```

The demo submits two records, decodes audit events, retrieves a record, and lists the sender's record IDs. The integration test submits another two records. Restarting the local chain clears its state; deploy again afterwards.

The scripts use the publicly known Hardhat account #0 for local development only. No real funds are needed. Environment overrides are `RPC_URL`, `PRIVATE_KEY`, and `DEPLOYMENT_FILE`; export them in your shell (`.env.example` is documentation, not automatically loaded).

## Repository contents

| File | Purpose |
| --- | --- |
| `contracts/SensingRegistry.sol` | Append-only registry, queries, and events |
| `hardhat.config.js` | Hardhat configuration for the development network |
| `scripts/compile.js` | Compile with the installed solc-js version |
| `scripts/deploy.js` | Deploy and save generated local deployment metadata |
| `client/client.js` | Submit, retrieve, list, and demonstration commands |
| `tests/demo.test.js` | Check a demo digest against the known input |

The custom compilation script uses the solc-js version in `package-lock.json`; it does not use Hardhat's Solidity compiler selection. Demo digests use Keccak-256 and synthetic text inputs. The example `ipfs://cpos-demo/...` URIs are illustrative pointers, not uploaded files.

## Research boundary

This repository contains the local blockchain prototype. The separate flight-simulation environment is not included. The contract records a submitter-supplied confidence score and an opaque digest; it does not verify sensor authenticity, physical location, or the score itself. This work does not claim end-to-end verification from physical sensors through a deployed multi-robot mission. Signed multi-source evidence, identity management, and physical-sensing integration remain future research directions.

## My contribution

I implemented and tested the local EVM workflow, Solidity sensing registry, and `ethers.js` client, documented transaction and gas evidence, and built the ROS 2/Gazebo/PX4 simulation environment used to validate the headless take-off, hover, waypoint, return, and landing workflow.

This public release excludes internal notes, unrelated papers, personal data, generated dependencies, and private credentials.

[Peixuan Yang](https://github.com/sh1ranY)
