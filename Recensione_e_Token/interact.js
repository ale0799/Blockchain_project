const { Web3 } = require('web3');
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

class RecensioniManager {
    constructor() {
        this.web3 = new Web3('http://localhost:7545');
        this.recensioniContract = null;
        this.tokenContract = null;
        this.accounts = [];
        this.recensioniAddress = null;
        this.tokenAddress = null;
    }

    async init() {
        console.log('🔧 Inizializzazione RecensioniManager...');

        try {
            await this.web3.eth.net.isListening();
            console.log('✅ Connesso a Ganache');
        } catch (error) {
            throw new Error('❌ Ganache non è avviato. Avvia con: npx ganache-cli --accounts 10 --host 0.0.0.0 --port 7545');
        }

        this.accounts = await this.web3.eth.getAccounts();
        if (this.accounts.length === 0) {
            throw new Error('❌ Nessun account disponibile');
        }
        console.log('👥 Account caricati:', this.accounts.length);

        // Carica info contratto recensioni
        const recensioniDeployPath = path.resolve(__dirname, 'build', 'deployed-recensioni.json');
        if (!fs.existsSync(recensioniDeployPath)) {
            throw new Error('❌ Contratto recensioni non deployato. Esegui prima: node deploy-recensioni.js');
        }
        const recensioniDeployInfo = JSON.parse(fs.readFileSync(recensioniDeployPath, 'utf8'));
        this.recensioniAddress = recensioniDeployInfo.address;
        this.recensioniContract = new this.web3.eth.Contract(recensioniDeployInfo.abi, this.recensioniAddress);
        console.log('📄 Contratto Recensioni caricato:', this.recensioniAddress);

        // Carica info contratto token
        const tokenDeployPath = path.resolve(__dirname, 'build', 'deployed-token.json');
        if (!fs.existsSync(tokenDeployPath)) {
            throw new Error('❌ Contratto token non deployato. Esegui prima: node deploy-token.js');
        }
        const tokenDeployInfo = JSON.parse(fs.readFileSync(tokenDeployPath, 'utf8'));
        this.tokenAddress = tokenDeployInfo.address;
        this.tokenContract = new this.web3.eth.Contract(tokenDeployInfo.abi, this.tokenAddress);
        console.log('📄 Contratto Token caricato:', this.tokenAddress);

        // Imposta gestione recensioni nel token (il contratto recensioni è il solo autorizzato a mintare)
        // Solo se non già settato (puoi fare un controllo o settarlo sempre)
        try {
            const currentGestore = await this.tokenContract.methods.gestioneRecensioni().call();
            if (currentGestore.toLowerCase() !== this.recensioniAddress.toLowerCase()) {
                console.log('🔧 Settaggio gestione recensioni nel token...');
                await this.tokenContract.methods
                    .setGestioneRecensioni(this.recensioniAddress)
                    .send({ from: this.accounts[0] });
                console.log('✅ Gestione recensioni settata nel token');
            } else {
                console.log('ℹ️ Gestione recensioni già settata nel token');
            }
        } catch (error) {
            console.warn('⚠️ Errore nel settaggio gestione recensioni:', error.message);
        }
    }

    async callMethod(contract, methodName, args = [], fromAccount = 0, gasPadding = 50000) {
        try {
            console.log(`Chiamata metodo: ${methodName} con args:`, args);
            const gasEstimateRaw = await contract.methods[methodName](...args).estimateGas({ from: this.accounts[fromAccount] });
            const gasEstimate = typeof gasEstimateRaw === 'bigint' ? Number(gasEstimateRaw) : gasEstimateRaw;

            return await contract.methods[methodName](...args).send({
                from: this.accounts[fromAccount],
                gas: gasEstimate + gasPadding
            });
        } catch (error) {
            console.error(`❌ Errore in ${methodName}:`, error.message);
            throw error;
        }
    }

    // ----------- Funzioni contratto recensioni --------------

    async inserisciRecensione(cidIPFS, sentiment, hotelAddress, vcHash, fromAccount = 0) {
        console.log('➕ Inserimento recensione con vcHash:', vcHash);
        const result = await this.callMethod(
            this.recensioniContract,
            'inserisciRecensione',
            [cidIPFS, sentiment, hotelAddress, vcHash],
            fromAccount
        );
        const event = result.events?.RecensioneInserita;
        if (event) {
            console.log('✅ Recensione inserita! ID:', event.returnValues.id);
            return event.returnValues.id;
        }
        return null;
    }


    async modificaRecensione(id, nuovoCidIPFS, fromAccount = 0) {
        console.log('✏️ Modifica recensione ID:', id);
        await this.callMethod(this.recensioniContract, 'modificaRecensione', [id, nuovoCidIPFS], fromAccount);
        console.log('✅ Recensione modificata!');
    }

    async cancellaRecensione(id, fromAccount = 0) {
        console.log('🗑️ Cancellazione recensione ID:', id);
        await this.callMethod(this.recensioniContract, 'cancellaRecensione', [id], fromAccount);
        console.log('✅ Recensione cancellata!');
    }

    async visualizzaRecensioniNonCancellate() {
        console.log('📄 Visualizzazione CID delle recensioni non cancellate...');
        const cids = await this.recensioniContract.methods.visualizzaRecensioniNonCancellate().call();
        if (!cids || cids.length === 0) {
            console.log('🟡 Nessuna recensione trovata.');
            return [];
        }
        cids.forEach((cid, i) => console.log(`📦 Recensione #${i + 1}: CID = ${cid}`));
        return cids;
    }

    async visualizzaRecensioniHotel(hotelIndex = 1) {
        const from = this.accounts[hotelIndex];
        console.log('🏨 Visualizzazione recensioni per hotel:', from);
        const cids = await this.recensioniContract.methods.visualizzaRecensioniHotel().call({ from });
        if (!cids || cids.length === 0) {
            console.log('🟡 Nessuna recensione trovata.');
            return [];
        }
        cids.forEach((cid, i) => console.log(`📦 Recensione #${i + 1}: CID = ${cid}`));
        return cids;
    }

    async ottieniRecensione(id) {
        console.log('🔎 Ottenimento dettagli recensione ID:', id);
        const r = await this.recensioniContract.methods.recensioni(id).call();
        console.log(r);
        return r;
    }

    // ------------- Funzioni contratto token -------------------

    async mintToken(to, amount, fromAccount = 0) {
        if (!amount) {
            throw new Error('Amount non definito o nullo in mintToken');
        }
        console.log(`💰 Mint di ${this.web3.utils.fromWei(amount)} token a ${to}...`);
        await this.callMethod(this.tokenContract, 'mint', [to, amount], fromAccount);
        console.log('✅ Mint completato!');
    }


    async balanceOf(account) {
        const balance = await this.tokenContract.methods.balanceOf(account).call();
        const balanceStr = balance.toString();
        console.log(`💼 Balance di ${account}: ${this.web3.utils.fromWei(balanceStr, 'ether')} RVT`);
        return balanceStr;
    }


    async burnToken(amount, fromAccount = 0) {
        if (!amount) {
            throw new Error('Amount non definito o nullo in burnToken');
        }
        console.log(`🔥 Burn di ${this.web3.utils.fromWei(amount, 'ether')} token da account ${this.accounts[fromAccount]}...`);
        await this.callMethod(this.tokenContract, 'burn', [amount], fromAccount);
        console.log('✅ Burn completato!');
    }


    async getDiscountCount(user) {
        const count = await this.tokenContract.methods.getDiscountCount(user).call();
        console.log(`🎟️ Codici sconto riscattati da ${user}: ${count}`);
        return Number(count);
    }

    async getDiscountCode(user, index) {
        const code = await this.tokenContract.methods.getDiscountCode(user, index).call();
        console.log(`🎫 Codice sconto #${index} per ${user}: ${code}`);
        return code;
    }

    async mostraAccount() {
        console.log('👥 Elenco account:');
        for (let i = 0; i < this.accounts.length; i++) {
            const balance = await this.web3.eth.getBalance(this.accounts[i]);
            console.log(`${i}. ${this.accounts[i]} (${this.web3.utils.fromWei(balance, 'ether')} ETH)`);
        }
    }
}

async function testInteraction() {
    try {
        const manager = new RecensioniManager();
        await manager.init();

        await manager.mostraAccount();

        const hotelAddress = manager.accounts[1];
        if (!manager.web3.utils.isAddress(hotelAddress)) throw new Error("Indirizzo hotel non valido");

        function generaVcHash(vc, salt) {
            const input = vc + salt;
            const hash = crypto.createHash('sha3-256'); // compatibile con keccak256
            hash.update(input);
            return '0x' + hash.digest('hex'); // formato compatibile con Solidity (bytes32)
        }

        // Uso in testInteraction:
        const vc = "VC-UNICO-1";
        const salt = Date.now().toString(); // o un random

        const vcHash = generaVcHash(vc, salt);

        // Step 1: inserisci recensione (dovrebbe mintare 0.1 token automaticamente)
        const reviewId = await manager.inserisciRecensione(
            'QmXoYpz5nNrYWNFGmBz2dQhNYGFt7dJhNvHgwCfwTzKxEg',
            true,
            hotelAddress,
            vcHash,
            0
        );

        try {
            await manager.inserisciRecensione(
                'QmDuplicatoCID',
                false,
                hotelAddress,
                vcHash,
                0
            );
        } catch (e) {
            console.log('🛑 Tentativo di inserire recensione duplicata bloccato correttamente:', e.message);
        }

        // Step 2: verifica balance token dopo mint
        await manager.balanceOf(manager.accounts[0]);

        // Step 3: inserisci altre 9 recensioni per arrivare a 1 token (0.1 * 10)
        for (let i = 0; i < 9; i++) {
            const vc = "VC-UNICO-" + (i + 2);
            const salt = (Date.now() + i).toString();
            const vcHash = generaVcHash(vc, salt);

            await manager.inserisciRecensione(
                `QmDummyCID${i}`,
                i % 2 === 0,
                hotelAddress,
                vcHash,
                0
            );
        }

        await manager.balanceOf(manager.accounts[0]);

        // Step 4: burn 1 token per riscattare codice sconto
        await manager.burnToken(manager.web3.utils.toWei('1', 'ether'), 0);

        // Step 5: mostra quanti codici sconto ha riscattato
        const discountCount = await manager.getDiscountCount(manager.accounts[0]);
        if (discountCount > 0) {
            // Mostra tutti i codici riscattati
            for (let i = 0; i < discountCount; i++) {
                await manager.getDiscountCode(manager.accounts[0], i);
            }
        }

        // Step 6: modifica una recensione (prima inserita)
        if (reviewId) {
            await manager.modificaRecensione(reviewId, 'QmNuovoCIDModificato', 0);
            const updatedReview = await manager.ottieniRecensione(reviewId);
            console.log('🔄 Recensione modificata:', updatedReview.cidIPFS);
        }

        // Step 7: cancella una recensione (ultima inserita)
        await manager.cancellaRecensione(reviewId, 0);

        // Step 8: visualizza tutte le recensioni non cancellate
        await manager.visualizzaRecensioniNonCancellate();

        // Step 9: visualizza recensioni per hotel
        await manager.visualizzaRecensioniHotel(1);

        console.log('✅ Test completato con successo!');
    } catch (error) {
        console.error('❌ Errore nel test:', error.message);
    }
}

if (require.main === module) {
    testInteraction();
}

module.exports = { RecensioniManager };