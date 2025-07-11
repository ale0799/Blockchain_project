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
const crypto = require('crypto');

async function createDID(address, privateKey, provider, chainID) {
    const ethrDid = new EthrDID({
        identifier: address,
        privateKey,
        provider: provider,
        chainNameOrId: chainID,
    });

    return ethrDid;
}

async function generateSalt(lenght = 32){
    return crypto.randomBytes(lenght).toString('hex');
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
    const registryAddress = address_r;
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
            console.log("The subject (user) and the issuer of the vp are not equal!");
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
            console.log("The subject of the VC does not match the VP issuer!");
            exit;
        }

    

        //Check release_date of Hotel VC (+12 hours)
        const releaseDateStr = decoded_h.payload.vc.credentialSubject.Stay.Release;
        if (releaseDateStr) {
        const release_dateH = new Date(releaseDateStr);
        const twelveHoursLater = new Date(release_dateH.getTime() + 12 * 60 * 60 * 1000);
        ///// ELIMINARE IL CONTENUTO IN NOW now attuale dichiarato su si puo eliminare sta sezione 
        const now = new Date("2025-07-15T23:45:00.000Z");
        console.log(release_dateH.toISOString(), now.toISOString());
        console.log(release_dateH.toDateString(), now.toDateString());

        if (now < twelveHoursLater) {
            console.log("12 hours have not passed since hotel VC issuance!");
            //exit;
        } else console.log("12 hours have passed since hotel VC issuance!");

        } else {
        console.log("Release date not found in Hotel VC:", decoded_h.vc.credentialSubject.Stay);
        }

        // Check coherence between VC data Da modificare
        const hotelId_h = decoded_h.payload.vc.credentialSubject.Stay.Add_hotel;
        const hotelId_b = decoded_b.payload.vc.credentialSubject.Book.Add_hotel;
        console.log(hotelId_b, hotelId_h);

        if (hotelId_b !== hotelId_h) {
            console.log("Hotel ID mismatch between booking and hotel VCs!");
            //exit;
        }

        const CheckIn_h = decoded_h.payload.vc.credentialSubject.Stay.CheckIn;
        const CheckOut_h = decoded_h.payload.vc.credentialSubject.Stay.CheckOut;
        const CheckIn_b = decoded_b.payload.vc.credentialSubject.Book.CheckIn;
        const CheckOut_b = decoded_b.payload.vc.credentialSubject.Book.CheckOut;

        if (CheckIn_b !== CheckIn_h || CheckOut_b !== CheckOut_h) {
            console.log("Check-in/check-out dates do not match between VCs!" );
            //exit;
        } 
        const num_people_h = decoded_h.payload.vc.credentialSubject.Stay.Num_person;
        const num_people_b = decoded_b.payload.vc.credentialSubject.Book.Num_person;
        console.log (num_people_b, num_people_h);
        if (num_people_b !== num_people_h){
            console.log("Number of people do not match between VCs!" );
            //exit;
        }

        //Upload the file that contains the mapping between id and salt used
        const fileIdPath = "idHash.json";
        const idHashFile = fs.readFileSync(fileIdPath, 'utf-8');
        const parseIdHash = JSON.parse(idHashFile);
        const mapIdHash = new Map(Object.entries(parseIdHash));

        const vcId = decoded_h.payload.vc.id;
        console.log(vcId);
        if(mapIdHash.get(vcId) != null){
            console.log("Vc already used!");
            return;
        }

        const salt = await generateSalt();
        console.log(salt);

        mapIdHash.set(vcId, salt);

        fs.writeFileSync(fileIdPath, JSON.stringify(Object.fromEntries(mapIdHash), null, 2));

        const combined = vcId + salt;
        const hash = Web3.utils.keccak256(combined);
        console.log(combined, hash);

        console.log(CheckIn_b, CheckIn_h, CheckOut_b, CheckOut_h);
        console.log("VP and VCs validated successfully!");

        console.log("The vcs are:", subjB);

        return hash;

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

    console.log("prova")
    const address_r = "0x66fe5bE386de94499A00F6C44b60a932D84E4BDe"; // <-- replace with the DID contract address

    await checkVP(userDID, hotelDID, bookingDID, vpJwt, address_r, chainId, providerUrl);

  } catch(err) {
    console.log("Error:", err);

  }
  
}

main().catch(console.error);
