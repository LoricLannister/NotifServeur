
const mysql = require('mysql');


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

connectApiUser = mysql.createConnection(
   configDBApi.connectApi 
);

try {
    connectApiUser.connect();
    console.log(`Connexion a la base de donnée du serveur http://${configDBApi.connectApi.host}:${configDBApi.port}/`);

}
catch(e){
    console.log(`Error : ${e}`);
}

module.exports = connectApiUser;