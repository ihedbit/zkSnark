/*++++++++++++++++++++++++++++++++++++++++*/
// Modules and Libraries
/*++++++++++++++++++++++++++++++++++++++++*/

import * as fs from "fs";
import { groth16, rbuffer, toBigIntLE, pedersenHash, genProofArgs } from "./circuit";
import { MerkleTree } from "./merkleTree";

/*++++++++++++++++++++++++++++++++++++++++*/
// interfaces
/*++++++++++++++++++++++++++++++++++++++++*/

interface NestedMapping {
    [key: string]: string[];
}

/*++++++++++++++++++++++++++++++++++++++++*/
// Variables
/*++++++++++++++++++++++++++++++++++++++++*/


let used_commitment:string[] = []; 

let nullifier_mapping: NestedMapping = {};

let commitment2nullifier = new Map<string, any>();

/*++++++++++++++++++++++++++++++++++++++++*/
// generateProof
/*++++++++++++++++++++++++++++++++++++++++*/
async function generateProof(merkleProof: any, wasmPath: string, zkeyPath: string, secret: string,nullifier: string,nullifierHash:any) {
    
    const input = {
        root: merkleProof.root,
        nullifierHash:nullifierHash,
        secret: secret,
        nullifier: nullifier,
        pathElements: merkleProof.pathElements,
        pathIndices: merkleProof.pathIndices,
    };


    let { proof, publicSignals } = await groth16.fullProve(input, wasmPath, zkeyPath);
    const args = await genProofArgs(proof, publicSignals);
    console.log("+-+-+-+-+-+-+-+");
    console.log(args);
    console.log("+-+-+-+-+-+-+-+");
    console.log(proof);
    console.log("+-+-+-+-+-+-+-+");
    console.log(publicSignals);
    console.log("+-+-+-+-+-+-+-+");
    console.log("\nProof is generated successfully!\n")
    return { proof, publicSignals };
}

/*++++++++++++++++++++++++++++++++++++++++*/
// verifyProof
/*++++++++++++++++++++++++++++++++++++++++*/

async function verifyProof(publicSignals: any, proof: any) {
    const vKey = JSON.parse(fs.readFileSync("verification_key.json").toString());
    const res = await groth16.verify(vKey, publicSignals, proof);
    if (res === true) {
        console.log("\nProof is Verified successfully!")
        return true;
    } else {
        console.log("Invalid proof");
        return false;
    }
}

/*++++++++++++++++++++++++++++++++++++++++*/
// checkProof
/*++++++++++++++++++++++++++++++++++++++++*/

async function checkProof(tree: any,commitment: any) {
    const mt_proof = tree.proof(tree.getIndex(commitment.toString()))
    if (mt_proof) {
        console.log("\nProof is Exists.\n");
    } else {
        console.log("\nProof is not found!!!\n");
    }
}

/*++++++++++++++++++++++++++++++++++++++++*/
// useProof
/*++++++++++++++++++++++++++++++++++++++++*/

async function withdrawProof(publicSignals: any,proof: any,commitment: any,nullifierHash:any) {
    if (used_commitment.indexOf(commitment.toString()) === -1 && commitment2nullifier.get(commitment.toString()) === nullifierHash){
        if(await verifyProof(publicSignals,proof)){
            used_commitment.push(commitment.toString());
            console.log("\nProof used successfully.\n");
        }else{
            console.log("\nProof is not Exists.\n");
        }
    }
}

/*++++++++++++++++++++++++++++++++++++++++*/
// generateCommitment
/*++++++++++++++++++++++++++++++++++++++++*/

async function generateCommitment(secret_key_buffer: any,nullifier_buffer:any,public_key_buffer:any) {
    const public_key = toBigIntLE(public_key_buffer).toString();
    const nullifierHash = toBigIntLE(nullifier_buffer).toString();
    if(public_key in nullifier_mapping){
        if(nullifier_mapping[public_key].indexOf(nullifierHash) === -1){
            const commitment = pedersenHash(Buffer.concat([nullifier_buffer,secret_key_buffer]));
            nullifier_mapping[public_key].push(nullifierHash);
            commitment2nullifier.set(commitment.toString(),pedersenHash(nullifier_buffer));
            console.log("\nCommitment generated successfully.\n");
            return commitment;
        }
        else{
            return false;
        }
    }else{
        console.log("test");
        const commitment = pedersenHash(Buffer.concat([nullifier_buffer,secret_key_buffer]));
        console.log(commitment);
        nullifier_mapping[public_key] = [nullifierHash];
        commitment2nullifier.set(commitment.toString(),pedersenHash(nullifier_buffer));
        console.log("\nCommitment generated successfully.\n");
        return commitment;
    }
    
}

/*++++++++++++++++++++++++++++++++++++++++*/
// Example usage
/*++++++++++++++++++++++++++++++++++++++++*/

async function test() {
    const levels = 20;
    const wasmPath = "withdraw.wasm";
    const zkeyPath = "withdraw_final.zkey";

    const public_key_buffer = rbuffer(31);
    const secret_key_buffer = rbuffer(31);
    const nullifier_buffer = rbuffer(31);
    
    const secret = toBigIntLE(secret_key_buffer).toString();
    const nullifier = toBigIntLE(nullifier_buffer).toString();
    const nullifierHash = pedersenHash(nullifier_buffer)

    console.log("+-+-+-+-+-+-+-+-+-+");
    console.log("Commitment Generation\n");
    console.log("+-+-+-+-+-+-+-+-+-+");

    const commitment = await generateCommitment(secret_key_buffer,nullifier_buffer,public_key_buffer)

    console.log(commitment);

    const leafIndex = 2;
    const leaves = ["123", "456", commitment.toString(), "789"];
    const tree = new MerkleTree(levels, leaves);
    const merkleProof = tree.proof(leafIndex);
    
    console.log("+-+-+-+-+-+-+-+-+-+");
    console.log("proof Generation\n");
    console.log("+-+-+-+-+-+-+-+-+-+");
    
    const { proof, publicSignals } = await generateProof(merkleProof, wasmPath, zkeyPath, secret,nullifier,nullifierHash);

    console.log("+-+-+-+-+-+-+-+-+-+");
    console.log("Verification\n");
    console.log("+-+-+-+-+-+-+-+-+-+");
    
    await verifyProof(publicSignals, proof);

    console.log("+-+-+-+-+-+-+-+-+-+");
    console.log("Proof Status\n");
    console.log("+-+-+-+-+-+-+-+-+-+");

    await checkProof(tree , commitment);

    console.log("+-+-+-+-+-+-+-+-+-+");
    console.log("Use Proof\n");
    console.log("+-+-+-+-+-+-+-+-+-+");

    await withdrawProof(publicSignals, proof, commitment,nullifierHash);
}

test().then(() => {
    process.exit(0);
});