const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');
const {
  createVerifiableCredentialJwt,
  createVerifiablePresentationJwt,
  verifyPresentation
} = require('did-jwt-vc');
const { Resolver } = require('did-resolver');
const ethrDidResolver = require('ethr-did-resolver');

(async () => {
  const providerUrl = 'http://127.0.0.1:7545'; // Ganache
  const web3 = new Web3(providerUrl);

  // Retrieve accounts from Ganache
  const accounts = await web3.eth.getAccounts();
  const address_subject = accounts[0]; 

  //Change
  const privateKey_subject = '0x8166db38999b04c3c51f7d2c7826f05c592c0b9537a35a4db1d1f53bc9b81708'; 
  const chainId = await web3.eth.getChainId();


    const subject = new EthrDID({
      identifier: address_subject,
      privateKey: privateKey_subject,
      provider: web3.currentProvider,
      chainNameOrId: chainId
    });
    console.log("\n S:\n", subject);
  
//CHANGE
  const vcJwt = "eyJhbGciOiJFUzI1NkstUiIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6Imh0dHA6Ly9ob3RlbHguZXhhbXBsZS9jcmVkZW50aWFscy8wMDAxIiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCIsIkhvdGVseCJdLCJpc3N1ZXIiOiJkaWQ6ZXRocjoweDUzOToweDg5YjgwOTE0Rjg1RkJkOTUxMzAyODQwOWZCNjhhOTkxOTAzQjdkNjUiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpldGhyOjB4NTM5OjB4YmVBN0RDQmI4QmYyYUNFQTNBOWNhRUQ5Nzk1RkVEMEViNzQ4NTJkRSIsIlN0YXkiOnsiQ2hlY2tJbiI6IjIwMjUtMDctMTBUMTU6MTA6MDAuMDAwWiIsIkNoZWNrT3V0IjoiMjAyNS0wNy0xNVQxMDo0NTowMC4wMDBaIiwiTl9ub3R0aSI6NSwiUmVsZWFzZSI6IjIwMjUtMDctMTVUMTA6NDU6MDAuMDAwWiJ9fX0sInN1YiI6ImRpZDpldGhyOjB4NTM5OjB4YmVBN0RDQmI4QmYyYUNFQTNBOWNhRUQ5Nzk1RkVEMEViNzQ4NTJkRSIsIm5iZiI6MTc1MTY1NDAwOCwiaXNzIjoiZGlkOmV0aHI6MHg1Mzk6MHg4OWI4MDkxNEY4NUZCZDk1MTMwMjg0MDlmQjY4YTk5MTkwM0I3ZDY1In0.2ZVNEEMY6SVzdDllmLmDbghSSmGtaC_W_aN6ic-FfNNMLoBuY94xGLJ8Hc5OcDP9KmBS9BasDVexkbwV4EujpwA"
  console.log("\n Verifiable Credential JWT:\n", vcJwt);

  // === CREATION OF THE VP ===
  const vpPayload = {
    vp: {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiablePresentation"],
      verifiableCredential: [vcJwt]
    }
  };
 
  const vpJwt = await createVerifiablePresentationJwt(vpPayload, subject);
  console.log("\n Verifiable Presentation JWT:\n", vpJwt);

  // === CONFIGURATION OF THE RESOLVER ===
  const registryAddress = '0x82BC042117c2e4af9e0885db4F5e2EF4E05222bc'; // <-- replace with the DID contract address
  const resolverConfig = {
    networks: [{
      name: chainId,
      rpcUrl: providerUrl,
      chainId: chainId,
      registry: registryAddress
    }]
  };
  const didResolver = new Resolver(ethrDidResolver.getResolver(resolverConfig));
  // === VERIFICATION OF THE VP ===
  try {
    console.log("\n \n \n \n STAMPA \n \n \n \n \n ")
    const result = await verifyPresentation(vpJwt, didResolver);
    console.log("\n Verification completed:\n", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("\n Error during the presentation verification:", err);
  }
})();
