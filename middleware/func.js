

// interception des requetes URL 

let get_url = async (requete , reponse , next) => {

    let url = await requete.url ;

    console.log(`URL : ${url}`);

    next();
};




let who_deconnected = (tab,socket,type) =>{

    // si il s'agit d'un livreur 

    if (type === 'Livreur'  || type === 'Pharmacie' ? true : false ){

        for (let name in tab){

            if(socket === tab[name].socket ? true : false ){
                
                console.log(`${type} ${name} s'est déconnecté ...`);
              
                // suppression de la pharmacie || livreur déconnecté  
                delete tab[name];
                
                break;
            }// end if

        }// end for
        
        
    }// end if 

    // si c'est un client 
    else {

        for (let name in tab){

            if (socket === tab[name] ? true : false ){

                console.log(`${type} ${name} s'est déconnecté ...`);


                // suppression du client deconnecté 
                delete tab[name];

                break;
            }// end if

        }// end for
        
        
    }// end else 

    
     
};


module.exports = {

    get_url ,

    who_deconnected
};