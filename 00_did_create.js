const { Web3 } = require('web3');
const { EthrDID } = require('ethr-did');

// URL of the Ganache provider
const web3 = new Web3('http://127.0.0.1:7545');

(async () => {
  try {
    // Get available accounts from Ganache
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      console.error("No accounts found on Ganache.");
      return;
    }
    // Private key of the selected account. We used 3 users for our experiments
    const privateKeyUser0 = '0x8166db38999b04c3c51f7d2c7826f05c592c0b9537a35a4db1d1f53bc9b81708';
    const privateKeyUser1 = '0x0b039446a2241a02d745abd0de558356aa8a2711631390ccfcf531b01dcde190';
    const privateKeyUser2 = '0x0ff15ece665e3a4ca394ec3c43e97a26eff8e7840de310a79cd1f1767fe8e856';
    // Ensure the private key matches the chosen account. Retrieve the chain ID from the network. Ganache typically uses 1337 or 5777
    const chainId = await web3.eth.getChainId();
    // Create an Ethereum-based DID instance using the current web3 provider
    const ethrDid0 = new EthrDID({ identifier: accounts[0], privateKeyUser0, provider: web3.currentProvider, chainNameOrId: chainId });
    const ethrDid1 = new EthrDID({ identifier: accounts[1], privateKeyUser1, provider: web3.currentProvider, chainNameOrId: chainId });
    const ethrDid2 = new EthrDID({ identifier: accounts[2], privateKeyUser2, provider: web3.currentProvider, chainNameOrId: chainId });
  
    console.log("DID's user1:", ethrDid0.did);
    console.log("DID's user2:", ethrDid1.did);
    console.log("DID's user3:", ethrDid2.did);


    // Private key of the selected account. We used 3 users for our experiments
    const privateKeyHotel0 = '0x139a2d1597daee5e60cd2098e38f179224a364e7c36038025011a54644fd49ac';
    const privateKeyHotel1 = '0xfa74c2c8f64e2204ce9e090fe232bfdf8a6f826582f0cdcb57cc7510e407a74b';
    const privateKeyHotel2 = '0x333cd7a33a9f0154095c5a1366625160564cd472acd21284ae68d4e44352de21';
  
    

    // Create an Ethereum-based DID instance using the current web3 provider
    const ethrDid3 = new EthrDID({ identifier: accounts[3], privateKeyHotel0, provider: web3.currentProvider, chainNameOrId: chainId });
    const ethrDid4 = new EthrDID({ identifier: accounts[4], privateKeyHotel1, provider: web3.currentProvider, chainNameOrId: chainId });
    const ethrDid5 = new EthrDID({ identifier: accounts[5], privateKeyHotel2, provider: web3.currentProvider, chainNameOrId: chainId });
  
    console.log("DID's hotel1:", ethrDid3.did);
    console.log("DID's hotel2:", ethrDid4.did);
    console.log("DID's hotel3:", ethrDid5.did);
    } catch (err) {
        console.error("Error creating the DIDs:", err);
    }
})();
