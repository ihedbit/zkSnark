
## Table of Contents

- [Groth16](#groth16)
- [Pedersen Hash](#pedersen-hash)
- [Functions](#functions)
  - [generateProof](#generateproof)
  - [verifyProof](#verifyproof)
  - [checkProof](#checkproof)
  - [withdrawProof](#withdrawproof)
  - [generateCommitment](#generatecommitment)
- [Usage Scenario](#scenario)
- [How to Use?](#usage)

## Groth16

The Groth16 algorithm allows a prover to compute a quadratic arithmetic program over elliptic curve points derived from a trusted setup, efficiently verified by a verifier. It employs auxiliary elliptic curve points from the trusted setup to prevent forged proofs.

[Read more about Groth16](https://www.zeroknowledgeblog.com/index.php/groth16)

## Pedersen Hash

The 4-bit window Pedersen hash function is a secure hash function that maps a sequence of bits to a compressed point on an elliptic curve (Libert, Mouhartem, and Stehlé, n.d.).

This proposal aims to standardize this hash function primarily for use within arithmetic circuits of zero-knowledge proofs, as well as for other generic uses such as Merkle trees or any use cases requiring a secure hash function.

[Learn about Pedersen Hash](https://iden3-docs.readthedocs.io/en/latest/iden3_repos/research/publications/zkproof-standards-workshop-2/pedersen-hash/pedersen.html)

## Functions

### generateProof

- Description: Generates a zk-SNARK proof for a given set of inputs using the Groth16 algorithm.
- Parameters:
  - merkleProof: Merkle proof for the leaf node.
  - wasmPath: Path to the WebAssembly file.
  - zkeyPath: Path to the zk-SNARK proving key file.
  - secret: Secret input for proof generation.
  - nullifier: Nullifier input for proof generation.
- Returns: An object containing the proof and public signals.

### verifyProof

- Description: Verifies a zk-SNARK proof using the Groth16 algorithm.
- Parameters:
  - publicSignals: Public signals used in the proof.
  - proof: Proof generated by the generateProof function.
- Returns: Boolean value indicating whether the proof is valid or not.

### checkProof

- Description: Checks if a proof exists for a given commitment in a Merkle tree.
- Parameters:
  - tree: Merkle tree object.
  - commitment: The commitment to be checked.
- Prints: Message indicating whether the proof exists or not.

### withdrawProof

- Description: Checks if a proof can be used and marks the commitment as used if the proof is valid.
- Parameters:
  - publicSignals: Public signals used in the proof.
  - proof: Proof generated by the generateProof function.
  - commitment: The commitment to be checked and marked as used.
  - nullifier: related nullifier to commitment
- Prints: Message indicating whether the proof was successfully used or not.

### generateCommitment

- Description: Generates a commitment using Pedersen hash.
- Parameters:
  - secret_key_buffer: Buffer containing the secret key.
  - nullifier_buffer: Buffer containing the nullifier.
  - public_key_buffer: Buffer containing the public key.
- Returns: The generated commitment or false if the commitment already exists in the mapping.

## Scenario

### Step 1 (generateCommitment)

In the generateCommitment function, three parameters are passed: secret_key_buffer, nullifier_buffer, and public_key_buffer.

Firstly, the nullifier and secret are concatenated to create the commitment. Subsequently, the nullifier is stored in a mapping called nullifier_mapping. This mapping uses each public_key as a key, with an associated array storing nullifier values, ensuring that a nullifier cannot be reused for creating commitments.

Following this, the generated commitment is added to a Merkle tree. Subsequently, the Merkle proof related to that commitment is retrieved for the subsequent steps.

### Step 2 (generateProof)

In this step, the generateProof function is utilized. The merkleProof, secret, nullifier, as well as the paths to the wasm file and zkey file, are provided. These inputs are used to generate a zero-knowledge proof (zk-proof) for the commitment.

### Step 3 (withdrawProof)


In this step, we begin by checking whether the commitment has been previously withdrawn. If it hasn't, we proceed to verify the proof using the verifyProof function. If the proof is successfully verified, we mark the commitment as used and return a success status.

## Usage

Step 0: Build the circuit and dependencies. To do this, run the build.sh file using the command (place all the files next to index.ts and index.js):

```bash
# run in project directory

npm install -g circomlib

npm install -g snarkjs

# run this command in the circuit directory

./build_circuits.sh
```
Or manually:
```bash
npm install -g circomlib

npm install -g snarkjs

# constants

TARGET_CIRCUIT=withdraw.circom
PTAU_FILE=pot15_final.ptau
ENTROPY_FOR_ZKEY=mnbvc

# Generating withdraw.r1cs & withdraw.sym & withdraw.wasm

circom $TARGET_CIRCUIT --r1cs withdraw.r1cs --wasm withdraw.wasm --sym withdraw.sym

# Generating withdraw_0000.zkey

snarkjs zkey new withdraw.r1cs $PTAU_FILE withdraw_0000.zkey

# Generating withdraw_final.zkey

echo $ENTROPY_FOR_ZKEY | snarkjs zkey contribute withdraw_0000.zkey withdraw_final.zkey 


# Generating verification_key.json

snarkjs zkey export verificationkey withdraw_final.zkey verification_key.json

```

Step 1: Build .ts file to .js

```bash
npx tsc 
```

Step 2: Run the file

```bash
node index.js 
```