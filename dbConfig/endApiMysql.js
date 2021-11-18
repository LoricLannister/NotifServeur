const mysql = require('mysql') ; 

const configDBApi = {

    connectApi : 
{
    host : '', // adresse du serveur API 

    user : 'root', 

    password : '',

    database :''
} , 

port : '3000'
    
};

disconnection = mysql.createConnection(

    configDBApi.connectApi
);

exports.disconnectApiUser = () =>{

    try {
        disconnection.end();
        console.log(`Fermeture de la connexion avec la base de donnée http://${configDBApi.connectApi.host}:${configDBApi.port}/`);
    }
    catch(err){
        console.log(` Erreur : ${err}`);
    }
};


