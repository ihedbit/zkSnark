#!/bin/bash

# This file should be store in ./scripts of the project folder
# This script will build following files in the ./build/circuits
#
# circuit.r1cs
# circuit.sym
# circuit.wasm
# powersOfTau28_hez_final_11.ptau
# circuit_0000.zkey
# circuit_final.zkey
# verification_key.json

# constants
TARGET_CIRCUIT=withdraw.circom
PTAU_FILE=pot15_final.ptau
ENTROPY_FOR_ZKEY=mnbvc

# generate circuit.r1cs & circuit.sym & circuit.wasm

echo 'Generating withdraw.r1cs & withdraw.sym & withdraw.wasm'
circom $TARGET_CIRCUIT --r1cs withdraw.r1cs --wasm withdraw.wasm --sym withdraw.sym

# generate circuit_0000.zkey
echo "Generating withdraw_0000.zkey"
snarkjs zkey new withdraw.r1cs $PTAU_FILE withdraw_0000.zkey

# generate circuit_final.zkey
echo "Generating withdraw_final.zkey"
echo $ENTROPY_FOR_ZKEY | snarkjs zkey contribute withdraw_0000.zkey withdraw_final.zkey

# generate verification_key.json
echo "Generating verification_key.json"
snarkjs zkey export verificationkey withdraw_final.zkey verification_key.json
