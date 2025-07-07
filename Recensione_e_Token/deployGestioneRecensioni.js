const { Web3 } = require('web3');
const fs = require('fs-extra');
const path = require('path');

async function deployGestioneRecensioni() {
  const web3 = new Web3('http://localhost:7545');
  const accounts = await web3.eth.getAccounts();

  const gestioneData = await fs.readJson(path.resolve(__dirname, 'build', 'GestioneRecensioni.json'));
  const gestioneContract = new web3.eth.Contract(gestioneData.abi);

  const deployTx = gestioneContract.deploy({ data: '0x' + gestioneData.evm.bytecode.object });
  const gasEstimate = await deployTx.estimateGas({ from: accounts[0] });
  const gestioneInstance = await deployTx.send({ from: accounts[0], gas: gasEstimate + BigInt(100000) });

  console.log('GestioneRecensioni deployato a:', gestioneInstance.options.address);

  await fs.writeJson(
    path.resolve(__dirname, 'build', 'deployed-recensioni.json'),
    { address: gestioneInstance.options.address, abi: gestioneData.abi },
    { spaces: 2 }
  );

  // Collega token al contratto gestione (deve essere già deployato)
  const tokenDeployPath = path.resolve(__dirname, 'build', 'deployed-token.json');
  if (!fs.existsSync(tokenDeployPath)) {
    console.warn('⚠️ ReviewToken non deployato. Esegui prima deployReviewToken.js');
    return;
  }
  const tokenInfo = await fs.readJson(tokenDeployPath);
  await gestioneInstance.methods.setReviewToken(tokenInfo.address).send({ from: accounts[0] });
  console.log('Token collegato al contratto GestioneRecensioni');

  // Collega gestione al token
  const tokenData = await fs.readJson(path.resolve(__dirname, 'build', 'ReviewToken.json'));
  const tokenContract = new web3.eth.Contract(tokenData.abi, tokenInfo.address);
  await tokenContract.methods.setGestioneRecensioni(gestioneInstance.options.address).send({ from: accounts[0] });
  console.log('GestioneRecensioni collegato al token');
}

if (require.main === module) {
  deployGestioneRecensioni().catch(console.error);
}

module.exports = { deployGestioneRecensioni };