# coding : utf-8

from socketio import Client 

# chaine youtube : buildwithpython

# affichage de la liste de medicaments 

user_demand = {

    "name_user" : "djob",

    "quartier" : "mimboman",

    "nom_pharm" : "pharmarcie3A",

    "position" : "près du lycée lerclec"
}

# try : 

#     #requests_user = requests.post('http://localhost:4000/sendNotifications' , data = user_demand)
#     #requests_get = requests.get('http://localhost:4000/test')

#     # demande de livraison du client 
#     #requests_user = requests.post('http://localhost:4000/sendNotifications' , data = user_demand)

#     #requests_get = requests.get('http://localhost:4000')


# except requests.exceptions.ConnectionError  : print("Erreur d'envoi de la requete du client ")
     
# else :
#     #print(requests_get.text)

#     #print(requests_user.text) 

#     pass 
sio = Client()

try : 
    sio.connect('http://localhost:4000') 

except : 

    sio.emit('user_join', {

        "nom":"djob",

        "ville":"yaounde"
    })

else :  print("ook")
