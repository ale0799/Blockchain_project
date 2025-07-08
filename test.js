const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const { createVerifiableCredentialJwt, verifyCredential } = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');


async function main() {
    const vcJwt = fs.readFileSync("vc_jwt.txt",'utf-8');

    const decoded = jwt.decode(vcJwt, { complete: true });

    const payload = decoded.payload;

    console.log("Il subject è:", decoded);
    
}

main().catch(console.error);