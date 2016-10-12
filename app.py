from flask import Flask, render_template, jsonify, request
import json
from cred import cloudant_api_key as api_key
from cred import cloudant_pass as api_pass
import requests
import time 
from bs4 import BeautifulSoup
import json

app = Flask(__name__)

def gen_soup(url):
    """
    Given some url, generate a soup object from the html file from that url.
    """
    t0 = time.time()
    data = requests.get(url)
    soup = BeautifulSoup(data.text, 'html.parser')
    print("Took {:4f} seconds to retrieve html for url: {}".format(time.time() - t0, url))
    return soup 

def author_list(names):
    """
    create a string that contains the authors names. 
    """
    def reorder_name(name):
        if "," in name:
            name = " ".join(name.split(", ")[::-1]) 
            return name 
        else:
            return name 
    
    authors = [reorder_name(name) for name in names]
    return authors
    # if (len(authors) == 1):
    #     return authors[0] 
    # elif (len(authors) == 2):
    #     return "{} and {}".format(authors[0], authors[1])
    # elif (len(authors) > 2):
    #     auth_str = ", ".join(authors[:-1])
    #     auth_str += ", and {}".format(authors[-1])
    #     return auth_str

def process_arxiv_url(url, get_bibtex=False):
    """
    Given the url of an arxiv article, get the information about the article. 
    """
    soup = gen_soup(url)
    entry_info = {'author':[], 'year':[], 'title':[], 'arxiv_id':[]}
    for item in soup.find_all('meta'):
        if (item['name'] == 'citation_title'):
            entry_info['title'].append(item['content'])
        elif (item['name'] == 'citation_author'):
            entry_info['author'].append(item['content'])
        elif (item['name'] == 'citation_date'):
            entry_info['year'].append(item['content'])
        elif (item['name'] == 'citation_arxiv_id'):
            entry_info['arxiv_id'].append(item['content'])
    
    if get_bibtex:
        for item in soup.find_all('a'):
            if (item.text == "NASA ADS"):
                ads_url = item.attrs['href'] 
                break 
        soup_ads = gen_soup(ads_url)
        for item in soup_ads.find_all('a'):
            if ("Bibtex" in item.text):
                bibtex_url = item.attrs['href']
                break
        html_bibtex = urllib.urlopen(bibtex_url).read()
        index_at = html_bibtex.index('@')
        bibtex = html_bibtex[index_at:]
        print("Successfully scraped the bibtex entry")
        return entry_info, bibtex
    else:
        return entry_info

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
        self.db_name = cred['db']

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

    def update_db(self,data):
        """
        Update an item or items in the database
        args:
            - data: a python dictionary containing the id of the entry to update.
                if it doesn't contain id, will create new entry (not implemented yet)
        """
        if isinstance(data, list):
            pass
        elif not isinstance(data, list):
            data = [data]
        resps = []
        for item in data:
            try:
                _id = item['_id']
                resp = self.client.request("PUT",self.uri_db.format(item['_id']),data=json.dumps(item))
            except KeyError:
                print("Creating new entry")
                resp = self.client.request("POST",self.uri.format(self.db_name),data=json.dumps(item))
            resps.append(resp.json())
        return resps

cred = {'api_key':api_key,
        'api_pass':api_pass,
        'db':'citation_manager'}

dh = DatabaseHandler(cred)

@app.route("/get_citations")
def get_citations():
    docs = dh.get_db()
    return jsonify(result=json.dumps(docs))

@app.route("/")
def main():
    return render_template("index.html")

@app.route('/get_update', methods=['POST'])
def get_update():
    json_data = request.get_json(force=True)
    dh.update_db(json_data)
    return "updated"

@app.route("/get_arxiv", methods=['POST'])
def get_arxiv():
    json_data = request.get_json(force = True)
    entry_info = process_arxiv_url(json_data)
    entry_info['author'] = author_list(entry_info['author'])
    return jsonify(result=json.dumps(entry_info))

@app.route("/showAbout")
def showAbout():
    return render_template("about.html") 

if __name__ == "__main__":
    app.run(debug=True)
