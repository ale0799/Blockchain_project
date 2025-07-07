const { Web3 } = require('web3');
const fs = require('fs-extra');
const path = require('path');

async function deployReviewToken() {
  const web3 = new Web3('http://localhost:7545');
  const accounts = await web3.eth.getAccounts();

  const tokenData = await fs.readJson(path.resolve(__dirname, 'build', 'ReviewToken.json'));
  const TokenContract = new web3.eth.Contract(tokenData.abi);

  const deployTx = TokenContract.deploy({ data: '0x' + tokenData.evm.bytecode.object });
  const gasEstimate = await deployTx.estimateGas({ from: accounts[0] });
  const tokenInstance = await deployTx.send({ from: accounts[0], gas: gasEstimate + BigInt(100000) });

  console.log('ReviewToken deployato a:', tokenInstance.options.address);

  await fs.writeJson(
    path.resolve(__dirname, 'build', 'deployed-token.json'),
    { address: tokenInstance.options.address, abi: tokenData.abi },
    { spaces: 2 }
  );
}

if (require.main === module) {
  deployReviewToken().catch(console.error);
}

module.exports = { deployReviewToken };