from flask import Flask, render_template 
from citation_manager import Citation_Manager 
from cred import user
from cred import password
from entry import Entry 
import couchdb

app = Flask(__name__)
# cloudant_api = "chanduckedstessessedderv"
# cloudant_pass = "e57dc298e956444f9bda1e13668b338c0a4916f9"
cm = Citation_Manager(couch_cred={'user':user,
							'password':password,
							'db':"citation_manager"})

@app.route("/")
def main():
    return render_template("index.html",cm=cm,json=cm.create_json())

@app.route("/showAbout")
def showAbout():
    return render_template("about.html") 

if __name__ == "__main__":

    app.run(debug=True)
