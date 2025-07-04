const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const { createVerifiableCredentialJwt, verifyCredential} = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');

(async () => {
  try {
    const providerUrl = 'HTTP://127.0.0.1:7545';
    const web3 = new Web3(providerUrl);

    // Retrieve hotel account and chainId from Ganache
    const accounts = await web3.eth.getAccounts();
    const address = accounts[3];
    const chainId = await web3.eth.getChainId();

    // Retrieve user account from Ganache
    const address_user = accounts[0];

    //Private key user account
    const privateKey_user = '0x8166db38999b04c3c51f7d2c7826f05c592c0b9537a35a4db1d1f53bc9b81708'

    //Private Key hotel account
    const privateKey = '0x139a2d1597daee5e60cd2098e38f179224a364e7c36038025011a54644fd49ac'

    //Creation DID for Hotel x
    const ethrDid = new EthrDID({
      identifier: address,
      privateKey,
      provider: web3.currentProvider,
      chainNameOrId: chainId,
    });

    console.log("Hoitel x DID is:", ethrDid.did);

    //Creation DID for user x
    const ethrDid_user = new EthrDID({
      identifier: address_user,
      privateKey_user,
      provider: web3.currentProvider,
      chainNameOrId: chainId,
    });

    console.log("User x DID is:", ethrDid_user.did);

    //Crete constant for date
    const CheckIn_date = new Date("2025-07-10T15:10:00Z");
    const CheckOut_date = new Date("2025-07-15T10:45:00Z");
    const start = new Date(CheckIn_date.toDateString());
    const end = new Date(CheckOut_date.toDateString());
    const num_notti = Math.ceil((end - start) / (1000*60*60*24))

    const release_date = CheckOut_date;

    // Create the payload for the Verifiable Credential
    const vcPayload = {
      sub: ethrDid_user.did,
      // "nbf" indicates the validity starting from (timestamp in seconds)
      nbf: Math.floor(Date.now() / 1000),
      // The "vc" field contains the VC document
      vc: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        id: "http://hotelx.example/credentials/0001",
        type: ["VerifiableCredential", "Hotelx"],
        issuer: ethrDid.did,
        credentialSubject: {
          id: ethrDid_user.did,
          Stay: {
            CheckIn: CheckIn_date,
            CheckOut: CheckOut_date,
            N_notti: num_notti,
            Release: release_date
          }
        }
      }
    };
    
    const vcJwt = await createVerifiableCredentialJwt(vcPayload, ethrDid);
    console.log("Verifiable Credential JWT:", vcJwt);

    console.log("VC Payload:", JSON.stringify(vcPayload, null, 2));

    //Saving the payload and jwt
    const fs = require('fs');

    fs.writeFileSync('vc_jwt.txt', vcJwt, 'utf-8');
    fs.writeFileSync('vcPayload.txt', JSON.stringify(vcPayload, null, 2), 'utf-8');

  } catch (error){
    console.error("Error:", error);
  }
})();