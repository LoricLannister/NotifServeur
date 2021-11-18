const mysql = require('mysql');

connection = mysql.createConnection(

    {
        host :  '127.0.0.1' , //'192.168.43.103'
        
        user : 'root',
        
        password: '',
        
        database : 'history'
    }
);

try {
    connection.connect();
   
}

catch(e){
    console.log('Error : '+e);
}

module.exports = connection ;