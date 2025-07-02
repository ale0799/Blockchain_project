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
    const privateKeyUser0 = '0x8d0653f96653885ea8c392735f65b22c00ecbe2b9de2bf54e75b28048fa082d7';
    const privateKeyUser1 = '0xd01db3d78e6a594c6c371760d3816eac16262afe3f23f76ee6729cfa7dae6ca5';
    const privateKeyUser2 = '0x920557ea8096160f295b8335006da5e59723004fdb9229c1e19334875496e77b';
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
    const privateKeyHotel0 = '0x3ecfd369de245233d6396c733c38697bff6d47e398ced9c7f72e02c126ea9af9';
    const privateKeyHotel1 = '0xbf7beb2dfc8c7227f8547d179dc042703f511488a169ed08d5c674cbd82cdebb';
    const privateKeyHotel2 = '0x5a2176e3f4b535d25f30aa5d6d7c0e800a2c53da11916ebc79138dc91b991de5';
  
    

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
