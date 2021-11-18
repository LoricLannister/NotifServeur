const mongoose = require('mongoose') ;
let conn = require('./ApiUserMongodb');

exports.disconnectApi = () => {
    
    try {
        mongoose.disconnect();
        console.log(`Fermeture de la connexion avec la base de donnée mongodb sur le serveur http://${configDBAppi.host}:${configDBApi.database}`);
    }

    catch (err){
        console.log(`Erreur : ${err}`);
    }
}

