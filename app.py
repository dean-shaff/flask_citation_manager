from flask import Flask, render_template, jsonify, request
import json
from citation_manager import Citation_Manager 
from cred import user
from cred import password
from entry import Entry 
import couchdb

app = Flask(__name__)
# cloudant_api = "chanduckedstessessedderv"
# cloudant_pass = "e57dc298e956444f9bda1e13668b338c0a4916f9"
couch_cred={'user':user,
			'password':password,
			'db':"citation_manager"}
cm = Citation_Manager(couch_cred=couch_cred)

def load_db(couch_cred):
    """
    Load data from a couchdb database using credentials
    args:
        - couch_cred: A python dict with the following keys:
            - db: the name of the database 
            - username: the username
            - password: the password
    """
    couch = couchdb.Server("https://{}.cloudant.com/".format(couch_cred['user']))
    couch.resource.credentials = (couch_cred['user'], couch_cred['password'])
    db = couch[couch_cred['db']]
    docs = [dict(db[doc]) for doc in db]
    return docs

@app.route("/get_citations")
def get_citations():
	docs = load_db(couch_cred)
	return jsonify(result=json.dumps(docs))

@app.route("/")
def main():
    return render_template("index.html",cm=cm,json=cm.create_json())

# @app.route('/update_data', methods=['POST'])
# def update_data():

@app.route("/showAbout")
def showAbout():
    return render_template("about.html") 

if __name__ == "__main__":

    app.run(debug=True)
