# Decentralized Hotel Review System

## Descrizione
Questo progetto implementa un sistema decentralizzato per la gestione di recensioni di strutture alberghiere, sviluppato per il corso di **Blockchain (A.A. 2024–2025)**.

L’obiettivo è migliorare l’affidabilità dei sistemi di recensioni online, contrastando problemi come:
- recensioni false
- manipolazione delle valutazioni
- mancanza di trasparenza
- scarsa fiducia degli utenti

La soluzione utilizza blockchain, identità decentralizzate e meccanismi di incentivazione.

---

## Obiettivi
Il sistema consente di:
- pubblicare recensioni **solo a utenti verificati**
- garantire autenticità e integrità dei dati
- permettere modifica/eliminazione controllata delle recensioni
- votare l’utilità delle recensioni
- incentivare comportamenti onesti tramite token

---

## Architettura
Il sistema è composto da:

- **Smart Contract (Solidity)**
  - gestione recensioni
  - sistema di incentivi (token)
  - registry identità

- **DID (Decentralized Identifier)**
  - autenticazione utenti
  - pseudo-anonimato

- **Verifiable Credentials**
  - prova del soggiorno

- **IPFS**
  - storage off-chain delle recensioni

- **Blockchain**
  - registrazione immutabile delle operazioni

---

## 🔐 Proprietà di Sicurezza
Il sistema garantisce:
- **Confidenzialità** → pseudo-anonimato utenti  
- **Integrità** → dati immutabili su blockchain  
- **Trasparenza** → operazioni verificabili  
- **Usabilità** → interazione semplice  

---

## Funzionalità
- Pubblicazione recensioni verificate  
- Modifica/eliminazione controllata 
- Sistema di incentivi  
- Risposta degli hotel  

---

## Autori
- Alessia Lettieri (ale0799)
- Marco Panico (mpanico20)
- Pasquale Messina (PaskMess)

## Esecuzione
L’ordine di esecuzione dei file è così definito:
1.	Compilare e deployare tutti i contratti presenti nella cartella contract;
2.	Creare VP e VC, create_vc_prenotazione.js, create_vc_hotel.j e create_vp.js. Saranno presenti nella cartella Wallet/utente e verranno utilizzate per l’identificazione dell’utente. 
3.	Sostituire correttamente gli address dei contratti deployati all'interno dei file javascript dove necessario;
4.	Per simulare il sistema di recensioni:
 -	insert_rec.js
 - 	modify_rec.js
 - 	answer.js
 - 	viewRec.js
 - 	delete_rec.js

   
L'ordine dopo la insert_rec è puramente arbitrario; 
Per inserire recensioni con utenti diversi, bisogna modificare l'indirizzo utilizzato scegliendo opportunamente quello dell'utente desiderato
