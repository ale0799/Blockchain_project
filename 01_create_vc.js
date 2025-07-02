const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const { createVerifiableCredentialJwt, berifyCredential} = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');

(async () => {
  try {
    const providerUrl = 'HTTP://127.0.0.1:7545';
    const web3 = new Web3(providerUrl);

    // Retrieve accounts and chainId from Ganache
    const accounts = await web3.eth.getAccounts();
    const address = accounts[0];
    const chainId = await web3.eth.getChainId();

    const ethrDid = "";

    // Create the payload for the Verifiable Credential
    const vcPayload = {
      sub: "",
      // "nbf" indicates the validity starting from (timestamp in seconds)
      nbf: Math.floor(Date.now() / 1000),
      // The "vc" field contains the VC document
      vc: {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        type: ["VerifiableCredential", "HotelProof"],
        issuer: "",
        credentialSubject: {
          id: "",
          degree: {
            type: "HotelProof",
            name: ""
          }
        }
      }
    };
    
    const vcJwt = await createVerifiableCredentialJwt(vcPayload, ethrDid);
    console.log("Verifiable Credential JWT:", vcJwt);

    module.exports = { vcJwt };

  } catch (error){
    console.error("Error:", error);
  }
})();