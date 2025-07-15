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
