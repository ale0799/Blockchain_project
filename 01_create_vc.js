const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const { createVerifiableCredentialJwt, berifyCredential} = require('did-jwt-vc');
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
    const CheckIn_date = new Date("2025-07-10");
    const CheckOut_date = new Date("2025-07-11");
    const num_notti = Math.ceil((CheckOut_date - CheckIn_date) / (1000*60*60*25))

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
            N_notti: num_notti
          }
        }
      }
    };
    
    const vcJwt = await createVerifiableCredentialJwt(vcPayload, ethrDid);
    console.log("Verifiable Credential JWT:", vcJwt);

    console.log("VC Payload:", JSON.stringify(vcPayload, null, 2));


    module.exports = { vcJwt };

  } catch (error){
    console.error("Error:", error);
  }
})();