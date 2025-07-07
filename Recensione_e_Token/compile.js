const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

async function compileContract(contractName, fileName) {
  const contractPath = path.resolve(__dirname, fileName);
  const source = await fs.readFile(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      [fileName]: { content: source }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compile error:', errors);
      throw new Error('Errore compilazione');
    }
  }

  const contract = output.contracts[fileName][contractName];
  await fs.ensureDir(path.resolve(__dirname, 'build'));
  await fs.writeJson(
    path.resolve(__dirname, 'build', `${contractName}.json`),
    contract,
    { spaces: 2 }
  );

  console.log(`✅ Compilato ${contractName}`);
}

async function main() {
  await compileContract('ReviewToken', 'ReviewToken.sol');
  await compileContract('GestioneRecensioni', 'GestioneRecensioni.sol');
}

main().catch(console.error);