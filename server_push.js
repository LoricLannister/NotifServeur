
// site de recherhe des modules : http://nodetoolbox.com/ 

const express = require('express') , app = express() ,bodyParser = require('body-parser');

const http = require('http').Server(app) , io = require('socket.io')(http);
const fs =  require('fs') , buffer = require('buffer');

let crypto ;

try {
     crypto = require('crypto');
}
catch(err) {console.log(err);}


// tableau d'objets des clients et des livreurs 

let users = {} , delivery = {} , pharm = {} , data_user = {} ;

// variable pour la validation de la livraison par le livreur 

let delivery_success = false ; 

// nom des videos de chaque pharmacie 

let settings_video = {};

// utilisation des middlewares

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended : false 
}));

app.use(require('./middleware/func').get_url);

app.set('engine view' , 'twig');


// configuration du serveur

const server = {

    port : process.env.PORT || 4000,
};

// affichage de la page pour le test du systeme de notification

app.get('/delivery' , (requete , reponse) => {

    reponse.render('index.html.twig');
    
});



// Lancement du serveur websocket 

io.on('connection' , (socket) =>{
    
    // affichage des id connectés 
    
    console.log(`Utilisateur ${socket.id} connecté ...`);

    // enregistrement des clients connectés : en ligne

    socket.on('user_join' , (data) =>{ // emit cote client
        /*
        data = {
            nom,
            quartier,
            photo 
            ville,
            @email
        }
        */
        
       
        
        users[data.nom] = socket;

        
        console.log(`Le client ${data.nom} est en ligne ... `);
    });

    // enregistrement des livreurs connectés : en nplligne

    socket.on('delivery_join' , (data) => { // emit cote livreur

        /*
        data= {
            nom,
            quartier,
            photo,
            ville,
            localisation,
            @email
        }
        */

        delivery[data.nom] = {

           socket : socket , 

            data : data,

            work : false // le livreur n'est pas en livraison ...
        };
        // affichage des livreurs en ligne

        console.log(`Le livreur ${data.nom} est en ligne ... `);

    });

    // enregistrement des pharmacies connectées : en ligne 

    socket.on('pharm_join' , (data) =>{ // emit cote pharmacie
 
        /*
        data = {
            nom ,
            quartier,
            localisation,
            ville,
            photo,
            @mail,
            work_night : booleen 
        }
        */
        pharm[data.nom] = {
            
            socket : socket ,

            data : data 
        
        } ;

        // affichage des pharmacies en ligne
        
        console.log(`La pharmacie ${data.nom} est en ligne ...`);
        
    });

    // deconnexion : client , livreur , pharmacie

    socket.on('disconnect' , () => {
        // deconnexion des clients 

        require('./middleware/func').who_deconnected(users,socket,'Client');

        // deconnexion des livreurs 

        require('./middleware/func').who_deconnected(delivery,socket,'Livreur');

        // deconnexion des pharmacies 

        require('./middleware/func').who_deconnected(pharm,socket,'Pharmacie');

    });

    // Demande de livraison du client : recherche de livreur se trouvant dans la meme ville 

    socket.on('demand_user' , (data) => { // emit cote client 

        console.log(`Demande de livraison du client ${data.nom} ...`);

        /*Envoi JSON
        data = {
            nom ,
            quartier,
            photo,
            ville,
            nom_medicament ,
            nom_pharmarcie,
            quantite
            lieu_ordonnance,
            lieu_rdv
        }
        */
       // enregistrement de la demande du client 

        data_user[data.nom] = data ; 
        console.log(data);

        // selection des livreurs appartenant a la meme ville que le client et qui ne sont en pleine livraison 

        for (let name in delivery){

            if (delivery[name].data.ville === data.ville && delivery[name].work == false ? true : false){

                // envoie d'une notification aux livreurs etant dans la meme ville que l'utilisateur et disponible
                try { 

                delivery[name].socket.emit('notifications' , { 

                    "nom" : data.nom ,

                    "quartier" : data.quartier,

                    "ville" : data.ville ,

                    "nom_medicament" : data.nom_medicament,

                    "nom_pharmacie" : data.nom_pharmacie ,

                    "quantite_medicament" : data.quantite,

                    "lieu_rdv" : data.lieu_rdv,

                    "lieu_ordonnance" : data.lieu_ordonnance

                });
            }catch (e) { console.log(`Erreur d'envoie des données de livraison du client ${data.nom_utilisateur} au livreur ${data.nom_livreur}`); }

            
            }// end if

        }// end for 
    });


    // reception des demandes de livraison des differents livreurs  

    socket.on('delivery_accept' ,  (data) =>{ // emit cote livreur
        
        /* envoie JSON
        data = {
            nom_utilisateur,
            nom_livreur,
            quartier,
            photo,
            
        }
        */

        // recuperation de l'id (socket) du client correspondant
        
        console.log(`Le livreur ${data.nom_livreur} a accepté la demande de livraison du client ${data.nom_utilisateur} ... `);
        console.log(data);
        // envoie de la demande de livraison au client : évènement coté client
        if (users[data.nom_utilisateur] === undefined ? true : false) socket.emit('user_deconnect' , `Désolé le client ${data.nom_utilisateur} a annulé la demande de livraison`); 

        else { 
                try {
                    users[data.nom_utilisateur].emit('delivery_apply' , // on cote client 

                    {
                        "nom" : data.nom_livreur,
    
                        "longitude" : data.longitude, 

                        "latitude" : data.latitude 

                        
                    }
                );

                }catch (e) {console.log(`Erreur d'envoie des données de demande de livraison du livreur ${data.nom_livreur} au client ${data.nom_utilisateur}`);}

                finally{

                    console.log(`La demande de livraison du livreur ${data.nom_livreur} a été envoyé au client ${data.nom_utilisateur} ...`);
                    // affichage du socket du client 
                    //console.log(users[data.nom_utilisateur]);
                }
            }// end else 
            
    });

    // confirmation d'un livreur par un client : le client choisi un livreur 

    socket.on('accept_delivery' , (data) => { // emit cote client 

        /*envoi JSON
        data = {
            nom_livreur ,
            nom_utilisateur,
            photo,
            
        }
         */
        console.log(data);
        // envoie d'un message au livreur choisi : verification de la disponibilite du livreur 

        
            if (delivery[data.nom_livreur] !== undefined ? true : false)

            {

                // si le livreur choisi n'est toujours pas en pleine livraison

                if (delivery[data.nom_livreur].work === false ? true : false) 
                { 
               
                    // envoi de la notification au livreur choisi : 'on' cote livreur (photo du client également)

                    try 
                    { 
                        // photo du client egalement 
                        delivery[data.nom_livreur].socket.emit('valid_apply' , {
                            /* Des modifications ici: ajout de destLat et destLong déjà pour afficher
                               la destination chez le livreur choisi
                               Egalement ajouté les coordonnées GPS de la pharmacie lorsque unique,
                               son nom et sa ville,
                               J'ai egalement ajouté nom_livreur
                               NB: ceci fonctionne pour le cas d'une livraison concernant une et une
                               seule pharmacie.
                               */
                            "nom" : data.nom_utilisateur,
                            "nom_livreur": data.nom_livreur,
                            "destLat": data.destLat,
                            "destLong": data.destLong,
                            "nom_pharmacie": data.nom_pharmacie,
                            "ville": data.ville,
                            "pharmLat": data.pharmLat,
                            "pharmLong": data.pharmLong,
                            "message" : `Le client ${data.nom_utilisateur} accepte votre demande de livraison `
                        });

                    }catch (e) { console.log(`Erreur d'envoie des données de confirmation du livreur ${data.nom_livreur} `);}

                    // le livreur est desormais en pleine livraison 

                    delivery[data.nom_livreur].work = true ;

                    //  deconnexion de la pharmacie : envoie du message de validation de la livraison par un livreur 

                    if(pharm[data_user[data.nom_utilisateur].nom_pharmacie] === undefined ? true : false ) 
                    {
                        
                        console.log(`La pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie} n'est plus est en ligne ou n'est pas disponible ... `);
                        
                        // envoie d'une notification au client et au livreur  : deconnexion de la pharmacie

                            // verification : disponibilité du client et du livreur

                            if (users[data.nom_utilisateur] === undefined ? true : false ) {
                                
                                console.log(`Le client ${data.nom_utilisateur} n'est plus en ligne ...`);
                                
                                // envoie d'une notification au livreur lorsque le client est déconnecté 

                                if (delivery[data.nom_livreur] === undefined ? true : false) console.log(`Le livreur ${data.nom_livreur} n'est plus en ligne egalement ...`);

                                else {
                                    try { 
                                        delivery[data.nom_livreur].socket.emit('user_deconnect' , `Désolé le client ${data.nom_utilisateur} a annulé votre demande de livraison `); // on coté livreur 
                                    }catch(e) {console.log(`Erreur d'envoie du message de deconnexion du client ${data.nom_utilisateur} au livreur ${data.nom_livreur}`);}
                                }// end else 

                            }// end if

                            else {
                                
                                try 
                                {
                                    users[data.nom_utilisateur].emit('pharm_unavailable' , `La pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie} n'est plus en ligne , veuillez choisir une autre pharmacie `);

                                    // envoie du message au livreur : verification de la disponibilité du livreur 

                                    if (delivery[data.nom_livreur] === undefined ? true : false) 
                                    {

                                        console.log(`Le livreur ${data.nom_livreur} n'est plus en ligne ...`);
                                        
                                        // notification au client : deconnexion du livreur

                                        users[data.nom_utilisateur].emit('out_delivery' , `Le livreur ${data.nom_livreur} n'est plus disponible , veuillez choisir a nouveau un livreur `);
                                    
                                    } // end if

                                    else 
                                    {

                                        try 
                                        {
                                            delivery[data.nom_livreur].socket.emit('pharm_unavailable' , `La pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie} n'est plus en ligne , veuillez attendre une nouvelle destination pour la livraison `);
                                        }catch (e) {console.log(`Erreur d'envoie du message de deconnexion de la pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie} au livreur ${data.nom_livreur}`);}

                                    }// end else 

                                }catch(e) {console.log(`Erreur d'envoie du message de deconnexion de la pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie} au client ${data.nom_utilisateur}`);}
                            }
                        
                    } // end if
        
                    // envoie du message a la pharmacie : photo du livreur et du client egalement (qd ca sera possible )

                    else 
                    {
                        try { 
                            pharm[data_user[data.nom_utilisateur].nom_pharmacie].socket.emit('notif_pharm' , {
                            
                            "nom_livreur" : data_nom_livreur ,

                            "nom_utilisateur" : data.nom_utilisateur,

                            "nom_medicament" : data_user[data.nom_utilisateur].nom_medicament,

                            "quantite" : data_user[data.nom_utilisateur].quantite
                
                            });
                        }catch(err){console.log(`Erreur d'envoie des données concernant le livreur ${data.nom_livreur} a la pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie}`);}
                        
                        // envoie du message d'echec de la demande de livraison a tous les livreurs qui n'ont pas été choisi

                        for (let name in delivery ){


                            if (data.nom_livreur === delivery[name].data.nom ? true : false) continue ;

                            try 
                            { 
                                delivery[data.nom_livreur].socket.emit("refuse_delivery", {

                                    "message" : `Votre demande de livraison au client ${data.nom_utilisateur} a été réfusé `
                                });

                            }catch(e){ console.log(`Erreur d'envoie du message de rejet de la demande de livraison du livreur ${name}`);}

                        }// end for

                    }// else 
 

                } // end if
                

                // si le livreur est maintenant en pleine livraison 

                else 
                {

                    console.log(`Le livreur ${data.nom_livreur} effectue une autre livraison ou est n'est plus en ligne ...`);

                    // envoie du message au client : indisponibilte du livreur 

                    users[data.nom_utilisateur].emit('out_delivery' , `Le livreur ${data.nom_livreur} n'est plus disponible , veuillez choisir un autre livreur ` );

                    // envoie du message au pharmacie : annulation de la livraison du livreur 
                    try { 
                    pharm[data_user[data.nom_utilisateur].nom_pharmacie].socket.emit('out_delivery' ,{

                        "message" : `Le livreur ${data.nom_livreur} n'effectuera plus la livraison du client ${data_nom_utilisateur}` ,

                        photo_utilisateur : null,

                        photo_livreur : null 

                    });}catch(err){console.log(`Erreur d'envoie du message d'annulation de la demande de livraison du livreur ${data.nom_livreur} a la pharmacie ${data_user[data.nom_utilisateur].nom_pharmacie}`);}
   
                }// end else
            
            } // end if

            // si le le livreur n'est plus en ligne 

            else {
                try { 
                users[data.nom_utilisateur].emit('out_delivery' , `Désolé le livreur a annulé sa demande de livraison , veuillez choisir un autre livreur`)
            }catch(err) {console.log(`Erreur d'envoie du message d'annulation de la livraison du livreur ${data.nom_livreur} au client ${data.nom_utilisateur}`);}
        }
        
    });

    // evenement lié a la nouvelle destination pour la livraison : dans le cas ou la pharmacie s'est déconnecté 

    socket.on('new_delivery' , (data) =>{ // emit coté client 
        /*
            data = {
                nom_livreur ,

                nom_pharmacie 
            }
        */
       try{

        delivery[data.nom_livreur].socket.emit('new_delivery' , data.nom_pharmacie);
       }catch(err){console.log(`Erreur d'envoie du nouveau lieu de livraison au livreur ${data.nom_livreur}`);}
    });

    // evenement lié a l'envoi de la position du livreur en temps réel

    socket.on('newPos' , (data) =>{
        
        /*data_pos = {
            nom_utilisateur , 

            nom_livreur,

            longitude_livreur,

            latitude_livreur,

        }      
        */

        // envoie de la position du livreur choisi au client en temps réel

        if (users[data.nom_utilisateur] === undefined ? true : false ) delivery[data.nom_livreur].socket.emit('user_deconnect' , `Le client ${data.nom_utilisateur} a annulé votre demande de livraison`);

        else {
            try { 
            users[data.nom_utilisateur].emit('pos_livreur' , {

            "longitude": data.longitude_livreur ,
            
            "latitude" : data.latitude_livreur,

        });}catch(err){console.log(`Erreur d'envoie de la position du livreur ${data.nom_livreur} au client ${data.nom_utilisateur}`);}
    }
    });


    
    // reception de la fin de livraison du livreur : validation par le livreur 

    socket.on('end_delivery_rdv' , (data) => {
        /*
            data = {
                nom_livreur,

                nom_utilisateur ,

                heure_a,

                heure_d,

                date 
            }
        */
       // evenement se produisant lorsque la position du livreur est proche de celui du client : le livreur est au lieu du rdv

       console.log(`La position du livreur ${data.nom_livreur} coincide avec celui du lieu de rdv du client ${data.nom_utilisateur} ...`);

       delivery_success =  true ; // le livreur a confirmé la fin de sa livraison 

       // le livreur n'est plus en pleine livraison : fin de sa course 

       delivery[data.nom_livreur].work = false ;

       console.log(`Le livreur ${data.nom_livreur} est desormais disponible ....`);
    
       // envoie d'une demande de confirmation au client : booleen 
        try { 
            users[data.nom_utilisateur].emit('confirm_delivery' , delivery_success); // cote utilisateur aba verifiera que le delivery_success est true puis notifiera le client
        }catch(err) {console.log(`Erreur d'envoie de la confirmation de fin de livraison du livreur ${data.nom_livreur} au client ${data.nom_utilisateur}`);}

       // historique du livreur : stockage dans la base de donnée contenant l'historique de chaque livreur 

       require('./dbConfig/connectLocal').query('insert into history_delivery set ? ' , {

        "nom_livreur" : data.nom_livreur ,

        "nom_utilisateur" : data.nom_utilisateur ,

        "heure_a" : data.heure_a ,

        "heure_d" : data.heure_d,

        "date" : data.date ,
        
        "nom_medicament" : data_user[data.nom_utilisateur].nom_medicament,

        "nom_pharmacie" : data_user[data.nom_utilisateur].nom_pharmacie,

        "qte_medicament" : data_user[data.nom_utilisateur].qte_medicament 


       } , 

       (err , result ) =>{

        if (err) throw err ;

        else if (result.affectedRows != 0) console.log(`Insertion dans la base de donnée reussie !! `);

       });

    });

    // evenement lie a l'arrivée du livreur au lieu de rdv pour la recuperation de l'ordonnance du client 
    
    socket.on('take_delivery' , (data) =>{

        /*
            data = {
                nom_utilisateur ,

                nom_livreur 
            }
        */

            console.log(`Le livreur ${data.nom_livreur} est au lieu de rdv pour la recuperation de l'ordonnace du client ${data.nom_utilisateur}`);

            // envoie au client que le livreur est deja au lieu de rdv pour la recuperation de l'ordonnance

            if (users[data_nom_utilisateur] === undefined ? true : false ) socket.emit('user_deconnect' , `Désolé le client ${data.nom_utilisateur} a annulé votre demande de livraison`); // on coté livreur 

            else users[data.nom_utilisateur].emit('take_user' , true ); // on cote client : notification au client pour specifer que le livreur est au lieu de rdv pour la recuperation de l'ordonnance

    });


    
    // succes de la livraison , validation par le client  

    socket.on('delivery_success' , (data)=>{

        /*
            data = {
                nom_utilisateur,

                notation_livreur,
                
                nom_livreur ,

                heure_a , 

                date ,

            }
        */
        // envoi du message au client : si le client valide la fin de livraison de maniere précoce 

         
            console.log(`Le client ${data.nom_utilisateur} confirme la fin de livraison du livreur ${data.nom_livreur}`);
            
            // association du nombre de chaque utilisateur par livraison

            require('./dbConfig/connectLocal').query('insert into history_user set ?' , {
                
                "nom_livreur" : data.nom_livreur ,

                "nom_utilisateur" : data.nom_utilisateur,

                "heure_a" : data.heure_a,

                "heure_d" : data.heure_d,

                "date" : data.date ,

                "nom_medicament" : data_user[data.nom_utilisateur].nom_medicament,

                "nom_pharmacie" : data_user[data.nom_utilisateur].nom_pharmacie,

                "qte_medicament" : data_user[data.nom_utilisateur].qte_medicament ,

                "notation_livreur" : data.notation_livreur
            },

            (err , result) =>{

                if (err) throw err ;

                else if (result.affectedRows != 0){
                    
                    console.log(`Insertion dans la base de donnee reussie `);

                    // suppression de la demande du client : apres l'enregistrement de son historique

                    delete data_user[data.nom_utilisateur] ;
                }
            });

    });
    
    // Envoie des videos de chaque pharmacie a toutes les applications clientes : devdocs.io/node/stream#stream_class_stream_readable

    // reception des videos et creation d'un fichier pour le stockage (recuperation de la date d'envoie de la video )

    socket.on('video_week' , (data) =>{

        /*
            data = {
                nom_pharmacie,
                nom_video,
                date,
                video
            }
        */
        // reception de la video
        let video = data.video ;
        
        settings_video[data.nom_pharmacie] = {

            nom_video : data.nom_video,

            date_reception : ` ${new Date().getDay}/${new Date().getMonth()}/${new Date().getFullYear()}` 
        };
        // creation d'un fichier de stockage des vidéos envoyées par chaque pharmacie (module fs)
        
        
    });

    app.get('/video' , (requete , reponse) =>{

        //reponse.writeHead(200 , {"Content-Type" :"video/mp4"});

        reponse.render('video.html.twig');// streamer une video sur une application mobile (possibilite de telecharger un moteur de template pour le front mobile)
    });

    app.get('/stream_video' , (requete , reponse) =>{

        const range = requete.headers.range ;
        
        //console.log(requete);
        console.log(range);

        if (!range){
            reponse.status(400).send('Requete de entete');
        }

    const videoPath = settings_video; //chemin d'acces de la video
    const videoSize = fs.statSync("video.mp4").size; // taille de la video 

    console.log(`Taille de la video ${videoPath} : ${videoSize}Ko`);

    const CHUNK_SIZE = 10 ** 6;

    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

    const contentLength = end - start + 1 ;
    console.log(contentLength);

    const headers = {

        "Content-Range": `bytes ${start}-${end}/${videoSize}`,

        "Accept-Ranges" : "bytes",

        "Content-Length" : contentLength ,

        "Content-Type" : "video/mp4",
    };

    reponse.writeHead(206 , headers);

    const videoStream = fs.createReadStream(videoPath , {start , end});


    videoStream.pipe(reponse);
    });


    // evenement de recherche du medicament dans les differentes pharmacies partenaires 

    socket.on('search' ,  (data) =>{

        /*
            data = {

                nom_utilisateur ,

                ville ,

                qte_medicament,

                photo_utilisateur, 

                ordonnance_img 

            }
        */

        // envoie des donnees a toutes les pharmacies connectées

        for (let name in pharm){
            
            // envoie aux pharmacies de la meme ville que le client 

            if (pharm[name].data.ville === data.ville ? true : false ){ 
                
                try { 
                    pharm[name].socket.emit('pharm_receive' , {

                        "nom_utilisateur" : data.nom_utilisateur,

                        "nom_medicament" : data.nom_medicament,

                        "ville" : data.ville ,

                        "qte_medicament" : data.qte_medicament,

                        
                    });
                }catch(err) {console.log(`Erreur d'envoie des données a la pharmacie ${name}`);}

            }// end if 
        }
    });



    // evenement lie a la reponse des demandes de medicaments aux clients 

    socket.on('response_pharm' , (data) =>{

        /*
            data = {

                nom_utilisateur

                prix_medicament ,

                nom_pharmacie ,

                position ,

                quartier ,
                
                image_medicament 
            }
        */

            // verification de la disponibilité du client

            if (users[data.nom_utilisateur] === undefined ? true : false) console.log(`Le client ${data.nom_utilisateur} s'est deconnecté , sa recherche est annulée ...`);

            else {  
                
                try { 
                    users[data.nom_utilisateur].emit('reponse_to_user', {
                
                    "prix_medicament" : data.prix_medicament,

                    "nom_pharmacie" : data.nom_pharmacie,

                    "position" : data.position,

                    "quartier" : data.quartier,

                    });
                }catch(err) {console.log(`Erreur d'envoie des données au client ${data.nom_utilisateur}`);}
        }
    });

    // evenement lié au tchat entre client-pharmacie 
    
    socket.on('msg_user' , (data) =>{

        /*
        data = {

            nom_utilisateur ,

            nom_pharmacie ,

            msg_client : message chiffré avec protocole ssh (module crypto),

            photo_utilisateur
        }
        */
        // envoie du message a la pharmacie en question
        try { 
            pharm[data.nom_pharmacie].socket.emit('msg_user' , {

                "nom" : data.nom_utilisateur,

                "msg_client" : data.msg_client,
  
            })
        }catch(err) {console.log(`Erreur d'envoie du message du client ${data.nom_utilisateur} a la pharmacie ${data.nom_pharmacie}`);}

    });

    // envoie de la reponse de la pharmacie au client 

    socket.on('msg_pharm' , (data) =>{

        /*
            data = {

                msg_pharm : message chiffré avec ssh,

                nom_utilisateur

            }
        */
       try {
           users[data.nom_utilisateur].emit('msg_pharm' , {

            "msg_pharm" : data.msg_pharm
           })
       }catch(err){console.log(`Erreur d'envoie du message de la pharmacie ${data.nom_pharmacie} au client ${data.nom_utilisateur}`);}
    })
    
    // evenement lie a la fin de l'abonnement de l'application et envoi d'un email au client concerné

    socket.on('fin_abonnement' , (data) =>{

        /*
            data = {
                nom_utilisateur , 
                email,
                type_abonnement 
            }
        */
            // envoi mail avec nodemailer ou utilisation de firebase (installation du module firebase-tools)
    });

    // requete de reception de l'image de l'ordonnance 

    app.get('/img/ordonnance' , async ( requete , reponse ) =>{

        let img = await requete.body.img , name_pharm = await requete.body.name_pharm ;
        
        // envoie du medicament a la pharmacie choisi par le client 

        try {
            pharm[name_pharm].socket.emit('img_ordonnance', {
                image : img
            });
        }catch(err) {console.log(`Erreur d'envoi de l'image de l'ordonnance a la pharmacie ${name_pharm}`);}

    });// end app.get 

});


// mis en ecoute du serveur web 

http.listen(server.port , () =>{

    console.log("Lancement du serveur sur le port: " + server.port);
});