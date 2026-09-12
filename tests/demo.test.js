import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { ethers } from 'ethers';
import fs from 'node:fs';

test('demo records contain real, correctly labelled Keccak-256 digests', async () => {
  execFileSync(process.execPath, ['client/client.js','demo']);
  const d = JSON.parse(fs.readFileSync('deployments/local.json'));
  const a = JSON.parse(fs.readFileSync('artifacts/SensingRegistry.json'));
  const p = new ethers.JsonRpcProvider(d.rpcUrl);
  try {
    const c = new ethers.Contract(d.address,a.abi,p);
    const n = await c.totalRecords();
    const r = await c.getRecord(n-1n);
    assert.equal(r.dataHash, 'keccak256:' + ethers.keccak256(ethers.toUtf8Bytes('cpos-demo-uav-altitude')).slice(2));
  } finally { p.destroy(); }
});
