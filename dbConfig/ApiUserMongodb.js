var mongoose = require('mongoose');

const configDBApi = {

    host : '', 

    database :''
   
};

try {
    mongoose.connect(

        `mongodb://${configDBApi.host}:27017/${configDBApi.database}` ,
        {useNewUrlParser : true , useUnifiedTopology : true} , 
    
        (err) =>{
            if (!err) console.log(`Connexion avec la base de donnée mongodb sur le serveur http://${configDBAppi.host}:${configDBApi.database} reussie`);
    
            else console.log(`Echec de connexion ${err}`);
        }
    );
}
catch(e) {
    console.log(`Error : ${e}`);
}

module.exports = configDBApi ; 