const circomlib = require("circomlib");
const snarkjs = require("snarkjs");
const fs = require("fs");
const { groth, Circuit, bigInt } = snarkjs;

const { stringifyBigInts, unstringifyBigInts } = require("snarkjs/src/stringifybigint");

const { buildGroth16 } = require("websnark");
const buildpkey = require("./buildpkey.js");
const buildwitness = require("./buildwitness.js");
const crypto = require("crypto");


const _pedersen = require("circomlib/src/pedersenHash.js");
const babyJub = require("circomlib/src/babyjub.js");
const _ = require("lodash");



function pedersen(x, size) {
  return babyJub.unpackPoint(_pedersen.hash(bigInt.leInt2Buff(x, Math.ceil(size / 8)), size))[0];
}


function randrange(from, to) {
  if (from == to)
    return from;
  if (from > to)
    [from, to] = [to, from];
  const interval = to - from;

  if (typeof from === "number")
    return from + Math.floor(Math.random() * interval);

  let t = 0;
  while (interval > bigInt.one.shl(t))
    t++;
  return from + bigInt.leBuff2int(crypto.randomBytes(t)) % interval;
}



const fload = f => unstringifyBigInts(JSON.parse(fs.readFileSync(f)))




function witness(input, name) {
  const circuit = new Circuit(fload(`${__dirname}/../circuitsCompiled/${name}.json`));
  const witness = circuit.calculateWitness(input);
  return witness;
}

let wasmgroth = undefined;
async function proof(input, name) {
  if (typeof (wasmgroth) === "undefined") {
    wasmgroth = await buildGroth16();
  }

  const circuit = new Circuit(fload(`${__dirname}/../circuitsCompiled/${name}.json`));
  const pk = fload(`${__dirname}/../circuitsCompiled/${name}_pk.json`);
  const witness = circuit.calculateWitness(input);
  const proof = unstringifyBigInts(await wasmgroth.proof(buildwitness(witness), buildpkey(pk)));
  proof.protocol = "groth";

  return { proof, publicSignals: witness.slice(1, circuit.nPubInputs + circuit.nOutputs + 1) };
}

function verify({ proof, publicSignals }, name) {
  const vk = fload(`./circuitsCompiled/${name}_vk.json`);
  return groth.isValid(vk, proof, publicSignals);
}

function pubkey(pk) {
  return babyJub.mulPointEscalar(babyJub.Base8, pk)[0];
}


_.assign(exports, { randrange, pedersen, witness, fload, verify, pubkey });