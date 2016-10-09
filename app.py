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

class CloudantHandler(object):

    def __init__(self, couch_cred):
        """
        Log into the cloudant server and grab the db.
        args:
            - couch_cred: A python dict with the following keys:
                - db: the name of the database 
                - username: the username
                - password: the password
        """
        self.couch = couchdb.Server("https://{}.cloudant.com/".format(couch_cred['user']))
        self.couch.resource.credentials = (couch_cred['user'], couch_cred['password'])
        self.db = self.couch[couch_cred['db']]

    def grab_db(self):
        """
        grab the data from the db
        """
        return [dict(self.db[doc]) for doc in self.db]

    def update_db(self,entries):
        """
        Update the cloudant database.
        """
        for entry in entries:
            self.db.save(entry)


ch = CloudantHandler(couch_cred)

@app.route("/get_citations")
def get_citations():
    docs = ch.grab_db()
    return jsonify(result=json.dumps(docs))

@app.route("/")
def main():
    return render_template("index.html",cm=cm,json=cm.create_json())

@app.route('/get_update', methods=['POST'])
def get_update():
    json_data = request.get_json(force=True)
    if isinstance(json_data, list):
        ch.update_db(json_data)
    else:
        ch.update_db([json_data])
    return "updated"


@app.route("/showAbout")
def showAbout():
    return render_template("about.html") 

if __name__ == "__main__":

    app.run(debug=True)
