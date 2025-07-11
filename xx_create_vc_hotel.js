const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const { createVerifiableCredentialJwt, verifyCredential } = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const counterPath = path.join(__dirname, 'counter.json');

async function createDID(address, privateKey, provider, chainID) {
    const ethrDid = new EthrDID({
        identifier: address,
        privateKey,
        provider: provider,
        chainNameOrId: chainID,
    });

    return ethrDid;
}

function generaID() {
    const data = JSON.parse(fs.readFileSync(counterPath));
    const padded = String(data.counter).padStart(4, '0'); // "0001", "0002", ...
    const id = `http://hotelx.example/credentials/${padded}`;
    data.counter++;
    fs.writeFileSync(counterPath, JSON.stringify(data, null, 2));
    return id;
}

async function createVCHotel(issuer, subject, checkInDate, Num_person, add_hotel) {
    const CheckOut_date = new Date("2025-07-11");
    const release_date = CheckOut_date;
    const start = new Date(checkInDate.toDateString());
    const end = new Date(CheckOut_date.toDateString());
    const num_notti = Math.ceil((end - start) / (1000*60*60*24));

    const id = generaID();
    // Create the payload for the Verifiable Credential
    const vcPayload = {
      sub: subject,
      // "nbf" indicates the validity starting from (timestamp in seconds)
      nbf: Math.floor(Date.now() / 1000),
      // The "vc" field contains the VC document
      vc: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        id: id,
        type: ["VerifiableCredential", "Hotelx"],
        issuer: issuer.did,
        credentialSubject: {
          id: subject,
          Stay: {
            Num_person: Num_person,
            CheckIn: checkInDate.toDateString(),
            CheckOut: CheckOut_date.toDateString(),
            N_notti: num_notti,
            Release: release_date,
            Add_hotel: add_hotel
          }
        }
      }
    };

    const vcJwt = await createVerifiableCredentialJwt(vcPayload, issuer);
    return vcJwt;
}

async function main() {
  try {
    const providerUrl = 'HTTP://127.0.0.1:7545';
    const web3 = new Web3(providerUrl);

    // Retrieve hotel account and chainId from Ganache
    const accounts = await web3.eth.getAccounts();
    const chainId = await web3.eth.getChainId();
    const provider = web3.currentProvider;

    //User data
    const userAccount = accounts[3];
    const privateKeyUser = "0x139a2d1597daee5e60cd2098e38f179224a364e7c36038025011a54644fd49ac";

    //Hotel data
    const hotelAccount = accounts[1];
    const privateKeyHotel = "0x0b039446a2241a02d745abd0de558356aa8a2711631390ccfcf531b01dcde190";

    //Create User DID
    const userDID = await createDID(userAccount, privateKeyUser, provider, chainId);

    //Create Hotel DID
    const hotelDID = await createDID(hotelAccount, privateKeyHotel, provider, chainId);

    console.log("User DID is:", userDID.did);
    console.log("Hotel DID is:", hotelDID.did);
    console.log(hotelAccount);
    //VC creation
    const CheckIn_date = new Date("2025-07-10");
    const num_person = 3; 
    const vcJwt = await createVCHotel(hotelDID,userDID.did, CheckIn_date, num_person, hotelAccount);
     const decoded_h = jwt.decode(vcJwt, { complete: true});
    console.log(decoded_h.payload.vc.credentialSubject);
    //Saving the vcJwt
    fs.writeFileSync('vc_jwt.txt', vcJwt, 'utf-8');

  } catch(err) {
    console.log("Error:", err);

  }
  
}

main().catch(console.error);