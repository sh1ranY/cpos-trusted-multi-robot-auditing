# Collaborative Proof-of-Sensing for Trusted Multi-Robot Auditing

**SURF 2026 · Blockchain Security Group · Research prototype**

This project studies how autonomous robots can submit verifiable sensing evidence without placing raw sensor data on-chain. A sensing digest and metadata pointer are registered on a local Ethereum-compatible test network, while mission data remains off-chain.

## Prototype components

- Solidity `SensingRegistry` for digest submission, retrieval, confidence scores, timestamps, and audit events.
- Hardhat local network with deterministic deployment and transaction evidence.
- `ethers.js` client for submit, retrieve, and list operations.
- Separate ROS 2 Jazzy, Gazebo Harmonic, and PX4 SITL multi-UAV simulation work.

## Workflow

```bash
npm install
npm run node
npm run compile
npm run deploy
npm run client:demo
```

The local demo submitted records, decoded `SensingDataSubmitted` events, retrieved a record, and listed record IDs. Raw sensing data is intentionally not stored in the contract.

## Research boundary

The blockchain prototype and flight simulation are separate validated components. This work does not claim end-to-end verification from physical sensors through a deployed multi-robot mission. Signed multi-source evidence, identity management, and physical-sensing integration remain future research directions.

## My contribution

I implemented and tested the local EVM workflow, Solidity sensing registry, and `ethers.js` client, documented transaction and gas evidence, and built the ROS 2/Gazebo/PX4 simulation environment used to validate the headless take-off, hover, waypoint, return, and landing workflow.

This public release excludes internal notes, unrelated papers, personal data, generated dependencies, and private credentials.

[Peixuan Yang](https://github.com/sh1ranY)
