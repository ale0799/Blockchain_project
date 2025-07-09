const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const {
  createVerifiableCredentialJwt,
  createVerifiablePresentationJwt,
  verifyPresentation,
  verifyCredential
} = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { exit } = require('process');


async function createDID(address, privateKey, provider, chainID) {
    const ethrDid = new EthrDID({
        identifier: address,
        privateKey,
        provider: provider,
        chainNameOrId: chainID,
    });

    return ethrDid;
}

async function createVP(vcJwt_h, vcJwt_b, subject) {
    const vpPayload = {
        vp: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiablePresentation"],
        verifiableCredential: [vcJwt_h, vcJwt_b]
        }
    };

    const vpJwt = await createVerifiablePresentationJwt(vpPayload, subject);
    return vpJwt;
    
}


async function checkVP(subject, issuer_h, issuer_b, vpJwt, address_r, chainId, providerUrl) {
    // === CONFIGURATION OF THE RESOLVER ===
    const registryAddress = address_r; // <-- replace with the DID contract address
    const resolverConfig = {
        networks: [{
            name: chainId,
            rpcUrl: providerUrl,
            chainId: chainId,
            registry: registryAddress
        }]
    };
    const didResolver = new Resolver(ethrDidResolver.getResolver(resolverConfig));

    try {
        const result = await verifyPresentation(vpJwt, didResolver);

        //Check on the subject
        if(result.issuer != subject.did){
            console.log("The subject and the issuer of the vp are not equal!");
            exit;
        }

        const decoded = jwt.decode(vpJwt, { complete: true });

        const vpPayload = decoded.payload;
        const vcs = vpPayload.vp.verifiableCredential;

        //Check for the hotel's vc
        const verifiedVCh = await verifyCredential(vcs[0], didResolver);
        const verifiedVCb = await verifyCredential(vcs[1], didResolver);
        if(verifiedVCh.issuer != issuer_h.did){
            console.log("The hotel's vc is not signed correctly!");
            exit;
        } else if(verifiedVCb.issuer != issuer_b.did){
            console.log("The booking's vc is non signed correctly!");
            exit;
        }
        
        const decoded_h = jwt.decode(vcs[0], { complete: true});
        const decoded_b = jwt.decode(vcs[1], {complete: true});
        const subjH = decoded_h.payload.vc.credentialSubject.id;
        const subjB = decoded_b.payload.vc.credentialSubject.id;

        if(result.issuer != subjH || result.issuer != subjB){
            console.log("The subject is not correct!");
            exit;
        }

        //DA IMPLEMENTARE:
        //1) Controlli per capire che le 2 vc sono collegate, quindi sulle notti
        //2) Creazione salt + salvataggio hash(id vc hotel + salt) da vedere dove o creare un Map in js e poi salvare
        //oppure salvare su json

        console.log("The vcs are:", subjB);

    } catch(err){
        console.log("Error:", err);
    }


    
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

    //Booking data
    const bookingAccount = accounts[9];
    const privateKeyBooking = "0x637b8191a4b48aa684cf97f80b43bfb3f0784a8ee156409583fd529edac40383";

    //Booking data
    const testUser = accounts[4];
    const privateTestUser = "0xfa74c2c8f64e2204ce9e090fe232bfdf8a6f826582f0cdcb57cc7510e407a74b";

    //Create User DID
    const userDID = await createDID(userAccount, privateKeyUser, provider, chainId);

    //Create Hotel DID
    const hotelDID = await createDID(hotelAccount, privateKeyHotel, provider, chainId);

    //Create booking DID
    const bookingDID = await createDID(bookingAccount, privateKeyBooking, provider, chainId);

    //Create test user
    const testUserDID = await createDID(testUser, privateTestUser, provider, chainId);

    console.log("User DID is:", userDID.did);
    console.log("Hotel DID is:", hotelDID.did);
    console.log("Booking DID is:", bookingDID.did);
    console.log("Booking DID is:", testUserDID.did);
    //Readaing the VCs
    const vcJwt_h = fs.readFileSync("vc_Jwt.txt", 'utf-8');
    const vcJwt_b = fs.readFileSync("vc_jwt_booking.txt",'utf-8');

    //VP creation
    const vpJwt = await createVP(vcJwt_h, vcJwt_b, userDID);

    const address_r = "0x66fe5bE386de94499A00F6C44b60a932D84E4BDe";

    await checkVP(testUserDID, hotelDID, bookingDID, vpJwt, address_r, chainId, providerUrl);

  } catch(err) {
    console.log("Error:", err);

  }
  
}

main().catch(console.error);
