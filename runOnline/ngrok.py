#coding:utf-8
from os import *
import pyttsx3
from urllib.request import urlopen
from tkinter.messagebox import *
import urllib
from tkinter import *

vocal = pyttsx3.init()

def RunNgrok():
    try : urlopen('http://www.google.com',timeout=10)

    except urllib.error.URLError :
        showerror("Erreur", "Verifiez votre connexion") 
        vocal.say("Verifiez votre connexion")
        vocal.runAndWait()
    
    else : 
        try :
            system(f'ngrok http http://localhost:{entry.get()}')

            assert type(i.entry.get()) !="string" or entry.get() < 0  

        except AssertionError : showerror("Erreur","Valeur invalide reéssayez")

        else :
            pass
# IHM
fen = Tk()
bg = "pink"
fen.title('Run Online')
fen.geometry("700x500")
fen.resizable(width = False, height = False)
fen.config(bg=bg)
        # widgets
label_title = Label(fen , text = "P a r s e @Online" , font = ("Verdana" , 33 , "bold italic"), fg = "black" , bg = bg)
label_title.place(x = 155 , y = 30)
image = PhotoImage(file = "images_2.png")
label_image = Label(fen , image = image , width = 150 , height = 140)
label_image.place(x = 0, y = 5)
label = Label(fen , text = "Port " , font = ("Verdana" , 15 , "bold italic"), fg = "black" , bg = bg)
label.place(x = 60 , y = 200)
entry = Entry(fen , fg = "black" , font = ("Arial" , 12 ," bold italic"))
entry.place(x = 150 , y = 200 , width = 320 , height = 30)
button = Button(fen , text = "Run Online" , font = ("Verdana", 11 , "bold italic") , bg = "yellow" , fg = "black" , command = RunNgrok)
button.place(x = 500 , y = 200)
button_quit = Button(fen , text = "Quitter l'app" , font = ("Verdana", 11 , "bold italic") , bg="yellow" , fg = "black" , command = fen.quit)
button_quit.place(x = 280 , y = 320 )
fen.mainloop()

