from flask import Flask, render_template, jsonify, request
import json
from citation_manager import Citation_Manager 
from cred import cloudant_api_key as api_key
from cred import cloudant_pass as api_pass
import requests
from entry import Entry 
import json

app = Flask(__name__)

# couch_cred={'user':user,
#             'password':password,
#             'db':"citation_manager"}

# cm = Citation_Manager(couch_cred=couch_cred)
# 
class DatabaseHandler(object):

    def __init__(self, cred):
        """
        Log into the cloudant server and grab the db.
        args:
            - cred: A python dict with the following keys:
                - db: the name of the database 
                - api_key: the api key 
                - api_pass: the 'password' for the api key
        """
        self.client = requests.session()
        self.client.auth = (cred['api_key'], cred['api_pass'])
        self.client.headers = {'Content-Type':'application/json'}
        self.uri = "https://dshaff001.cloudant.com/{}"
        self.uri_db = self.uri.format(cred['db']) + "/{}"

    def get_db(self):
        """
        Get the contents of the entire database 
        """
        resp = self.client.request("GET", self.uri_db.format("_all_docs"))
        dat = resp.json()
        ids = [item['id'] for item in dat['rows']]
        db_contents = [self.__getitem__(_id) for _id in ids]
        return db_contents

    def __getitem__(self,_id):
        """
        get an item from the database by id
        args:
            - id: the id of the db item
        """
        resp = self.client.request("GET",self.uri_db.format(_id))
        return resp.json()

    def update_item(self,data):
        """
        Update an item or items in the database
        args:
            - data: a python dictionary containing the id of the entry to update.
                if it doesn't contain id, will create new entry
        """
        if isinstance(data, list):
            pass
        elif not isinstance(data, list):
            data = [data]
        resps = []
        for item in data:        
            resp = self.client.request("PUT",self.uri_db.format(item['_id']),data=json.dumps(item))
            resps.append(resp.json())
        return resps


@app.route("/get_citations")
def get_citations():
    docs = ch.get_db()
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
