const mysql = require('mysql');


connection = mysql.createConnection(
    {
        host : '127.0.0.1',
        user : 'root',
        password : '',
        database : 'jdbd'
    }
);

exports.disconnect =  () => {

    try {
        connection.end();
        console.log('Fermeture de la connexion avec la base donnée MYSQL reussie ');
    }
    
    catch(e){
        console.log('Error : '+e);
    }
};

