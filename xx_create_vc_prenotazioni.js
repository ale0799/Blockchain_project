const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const { createVerifiableCredentialJwt, verifyCredential } = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');
const fs = require('fs');
const path = require('path');

const counterPath = path.join(__dirname, 'counter_1.json');

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
    const id = `http://prenotazionex.example/credentials/${padded}`;
    data.counter++;
    fs.writeFileSync(counterPath, JSON.stringify(data, null, 2));
    return id;
}

async function createVCBooking(issuer, subject, checkInDate, checkOutDate, add_hotel, Num_person) {
    const id = generaID();

    num_notti ="";
    // Create the payload for the Verifiable Credential
    const vcPayload = {
      sub: subject,
      // "nbf" indicates the validity starting from (timestamp in seconds)
      nbf: Math.floor(Date.now() / 1000),
      // The "vc" field contains the VC document
      vc: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        id: id,
        type: ["VerifiableCredential", "Bookingx"],
        issuer: issuer.did,
        credentialSubject: {
          id: subject,
          Book: {
            Num_person: Num_person,
            Num_notti: num_notti,
            CheckIn: checkInDate.toDateString(),
            CheckOut: checkOutDate.toDateString(),
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

    //Booking data
    const bookingAccount = accounts[9];
    const privateKeyBooking = "0x637b8191a4b48aa684cf97f80b43bfb3f0784a8ee156409583fd529edac40383";

    //Create User DID
    const userDID = await createDID(userAccount, privateKeyUser, provider, chainId);

    //Create booking DID
    const bookingDID = await createDID(bookingAccount, privateKeyBooking, provider, chainId);

    //Hotel where Usere booked
    const hotel = accounts[1];

    console.log("User DID is:", userDID.did);
    console.log("Booking DID is:", bookingDID.did);
    console.log("Hotel DID is:", hotel);

    //VC creation
    const checkInDate = new Date("2025-07-10");
    const checkOutDate = new Date("2025-07-11");
    const num_person = 3;
    const vcJwt = await createVCBooking(bookingDID, userDID.did, checkInDate, checkOutDate, hotel, num_person);

    //Saving the vcJwt
    fs.writeFileSync('vc_jwt_booking.txt', vcJwt, 'utf-8');

  } catch(err) {
    console.log("Error:", err);

  }
  
}

main().catch(console.error);