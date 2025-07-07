// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IReviewToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title GestioneRecensioni
 * @dev Contratto per gestire inserimento, modifica e cancellazione di recensioni
 */
contract GestioneRecensioni {
    
    // Enumerazione per definire gli stati della recensione
    enum Stato {
        INSERITA,    // 00 - Recensione appena inserita
        MODIFICATA,  // 01 - Recensione modificata
        CANCELLATA   // 10 - Recensione cancellata (equivale a 2 in decimale)
    }
    
    // Struttura per memorizzare i dati di una recensione
    struct Recensione {
        string cidIPFS;           // CID IPFS della recensione
        bool sentiment;           // true = positiva, false = negativa (non modificabile)
        uint256 timestampCreazione; // Timestamp di creazione
        Stato stato;              // Stato attuale della recensione
        address hotel;            // Indirizzo dell'hotel recensito
        bool esiste;              // Flag per verificare se la recensione esiste
    }
    
    // Mapping per memorizzare le recensioni (chiave: ID recensione)
    mapping(uint256 => Recensione) public recensioni;
    
    // Mapping per tenere traccia delle recensioni per hotel
    mapping(address => uint256[]) public recensioniPerHotel;

    // Mapping per tracciare i vcHash usati
    mapping(bytes32 => bool) private vcHashUsati;
    
    // Array per tenere traccia di tutti gli ID delle recensioni
    uint256[] private tuttiGliId;
    
    // Contatore per assegnare ID univoci alle recensioni
    uint256 private prossimoId;
    
    // Costanti per la validazione
    uint256 public constant TEMPO_MODIFICA = 24 hours; // 24 ore in secondi
    
    // Eventi per tracciare le operazioni
    event RecensioneInserita(
        uint256 indexed id,
        string cidIPFS,
        bool sentiment,
        uint256 timestamp
    );
    
    event RecensioneModificata(
        uint256 indexed id,
        string nuovoCidIPFS,
        uint256 timestamp
    );
    
    event RecensioneCancellata(
        uint256 indexed id,
        uint256 timestamp
    );
    
    /**
     * @dev Costruttore del contratto
     */
    constructor() {
        prossimoId = 1; // Iniziamo con ID 1
    }
    
    IReviewToken public reviewToken;

    // Imposta l'indirizzo del token (chiamabile solo una volta o da admin se vuoi)
    function setReviewToken(address _tokenAddress) external {
        require(address(reviewToken) == address(0), "Token gia settato");
        reviewToken = IReviewToken(_tokenAddress);
    }
    
    /**
     * @dev Inserisce una nuova recensione
     * @param _cidIPFS CID IPFS della recensione
     * @param _sentiment Sentiment della recensione (true=positiva, false=negativa)
     * @param _hotel Indirizzo dell'hotel recensito
     * @return id ID della recensione inserita
     */
    function inserisciRecensione(
        string memory _cidIPFS,
        bool _sentiment,
        address _hotel,
        bytes32 vcHash
    ) public returns (uint256) {
        
        // Validazione del CID IPFS (non deve essere vuoto)
        require(bytes(_cidIPFS).length > 0, "CID IPFS non puo essere vuoto");
        
        // Validazione dell'indirizzo hotel
        require(_hotel != address(0), "Indirizzo hotel non valido");

        // Controllo unicità vcHash
        require(!vcHashUsati[vcHash], "VC gia usato per una recensione");

        // Marca il vcHash come usato
        vcHashUsati[vcHash] = true;
        
        // Ottieni l'ID per la nuova recensione
        uint256 nuovoId = prossimoId;
        prossimoId++;
        
        // Crea la nuova recensione
        recensioni[nuovoId] = Recensione({
            cidIPFS: _cidIPFS,
            sentiment: _sentiment,
            timestampCreazione: block.timestamp,
            stato: Stato.INSERITA,
            hotel: _hotel,
            esiste: true
        });
        
        // Aggiungi l'ID agli array di tracciamento
        tuttiGliId.push(nuovoId);
        recensioniPerHotel[_hotel].push(nuovoId);
        
        // Emetti l'evento
        emit RecensioneInserita(
            nuovoId,
            _cidIPFS,
            _sentiment,
            block.timestamp
        );

        // **MINT 0.1 token** (considerando 18 decimali)
        if (address(reviewToken) != address(0)) {
            reviewToken.mint(msg.sender, 1e17); // 0.1 token
        }
        
        return nuovoId;
    }
    
    /**
     * @dev Modifica una recensione esistente (solo entro 24 ore)
     * @param _id ID della recensione da modificare
     * @param _nuovoCidIPFS Nuovo CID IPFS della recensione
     */
    function modificaRecensione(
        uint256 _id,
        string memory _nuovoCidIPFS
    ) public {
        // Verifica che la recensione esista
        require(recensioni[_id].esiste, "Recensione non esistente");
        
        // Verifica che la recensione non sia cancellata
        require(recensioni[_id].stato != Stato.CANCELLATA, "Recensione cancellata");
        
        // Verifica che siano passate meno di 24 ore
        require(
            block.timestamp <= recensioni[_id].timestampCreazione + TEMPO_MODIFICA,
            "Tempo per la modifica scaduto (24 ore)"
        );
        
        // Validazione del nuovo CID IPFS
        require(bytes(_nuovoCidIPFS).length > 0, "CID IPFS non puo essere vuoto");
        
        // Aggiorna la recensione
        recensioni[_id].cidIPFS = _nuovoCidIPFS;
        recensioni[_id].stato = Stato.MODIFICATA;
        
        // Emetti l'evento
        emit RecensioneModificata(_id, _nuovoCidIPFS, block.timestamp);
    }
    
    /**
     * @dev Cancella una recensione (la marca come cancellata)
     * @param _id ID della recensione da cancellare
     */
    function cancellaRecensione(uint256 _id) public {
        // Verifica che la recensione esista
        require(recensioni[_id].esiste, "Recensione non esistente");
        
        // Verifica che la recensione non sia già cancellata
        require(recensioni[_id].stato != Stato.CANCELLATA, "Recensione gia cancellata");
        
        // Marca la recensione come cancellata
        recensioni[_id].stato = Stato.CANCELLATA;
        
        // Emetti l'evento
        emit RecensioneCancellata(_id, block.timestamp);
    }
    
    /**
     * @dev Visualizza tutte le recensioni non cancellate
     * @return ids Array degli ID delle recensioni non cancellate
     */
    function visualizzaRecensioniNonCancellate() public view returns (string[] memory) {
        // Conta le recensioni non cancellate
        uint256 contatore = 0;
        for (uint256 i = 0; i < tuttiGliId.length; i++) {
            if (recensioni[tuttiGliId[i]].stato != Stato.CANCELLATA) {
                contatore++;
            }
        }
        
        // Crea l'array con la dimensione corretta
        string[] memory recensioniNonCancellate = new string[](contatore);
        uint256 indice = 0;
        
        // Popola l'array con gli ID delle recensioni non cancellate
        for (uint256 i = 0; i < tuttiGliId.length; i++) {
            if (recensioni[tuttiGliId[i]].stato != Stato.CANCELLATA) {
                recensioniNonCancellate[indice] = recensioni[tuttiGliId[i]].cidIPFS;
                indice++;
            }
        }
        
        return recensioniNonCancellate;
    }
    
    /**
     * @dev Permette ad un hotel di vedere tutte le sue recensioni (comprese quelle cancellate)
     * @return ids Array degli ID di tutte le recensioni dell'hotel
     */
    function visualizzaRecensioniHotel() public view returns (string[] memory) {
        uint256[] memory ids = recensioniPerHotel[msg.sender];
        string[] memory cids = new string[](ids.length);

        for (uint i = 0; i < ids.length; i++) {
            cids[i] = recensioni[ids[i]].cidIPFS;
        }

        return cids;
    }
}