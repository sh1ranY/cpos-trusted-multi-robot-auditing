# Collaborative Proof-of-Sensing for Trusted Multi-Robot Auditing

**SURF 2026 · Blockchain Security Group · Research prototype**

This project studies how autonomous robots can submit verifiable sensing evidence without placing raw sensor data on-chain. A sensing digest and metadata pointer are registered on a local Ethereum-compatible test network, while mission data remains off-chain.

## Prototype components

- Solidity `SensingRegistry` contract for digest submission, retrieval, confidence scores, timestamps, and audit events.
- Hardhat local network with deterministic deployment and transaction evidence.
- `ethers.js` client for submit, retrieve, and list operations.
- Separate ROS 2 Jazzy, Gazebo Harmonic, and PX4 SITL multi-UAV simulation work for namespace and flight-workflow validation.

## Verified local workflow

```bash
npm install
npm run node
npm run compile
npm run deploy
npm run client:demo
npm run client:get -- --id 1
```

The local demo submitted records, decoded `SensingDataSubmitted` events, retrieved a record, and listed record IDs. Raw sensing data is intentionally not stored in the contract.

## Research boundary

The blockchain prototype and the flight simulation are separate validated components. The current work does **not** claim end-to-end verification from physical sensors through a deployed multi-robot mission. Signed multi-source evidence, identity management, and physical-sensing integration remain future research directions.

## Personal contribution

I developed and tested the local EVM workflow, Solidity sensing registry, and `ethers.js` client, documented transaction and gas evidence, and built the ROS 2/Gazebo/PX4 simulation environment used to validate the headless take-off, hover, waypoint, return, and landing workflow.

## Repository hygiene

This public release excludes raw training material, internal meeting notes, unrelated papers, personal data, generated dependency directories, and private credentials. The Hardhat default accounts are local test accounts only and must never be used with real funds.

---

[Peixuan Yang's profile](https://github.com/sh1ranY)
