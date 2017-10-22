# app.py

__author__ = "Jose Herrerias"
__version__ = "0.1.0"
__email__ = "herreriasjose@gmail.com"
__status__ = "Test"

import datetime
import json
import logging
import pickle
import re
import sqlite3
import spacy
import time
from geopy.geocoders import Nominatim


logging.basicConfig(level=logging.INFO)
logger = logger = logging.getLogger(__name__)

def geolocate(geolocator, entity):

    time.sleep(.25)
    try:
        location = geolocator.geocode(entity,timeout=None)
        if location:
            return (location.latitude, location.longitude)
        return None, None
    except:
        time.sleep(2)
        logger.info("Exception getting location.")
        return None, None
    


def remove_urls(entity): 
    try:
        pattern = re.compile(r'(http|https)://[\w\-]+(\.[\w\-]+)+\S*',re.IGNORECASE)
        result = re.subn(pattern, r'',entity)
        return result[0]
    except Exception as e:
        logger.info("Exception cleaning text")
        return "None"


def remove_punctuation(entity):
    return re.sub(r'[^\w\s]','',entity)
    
    
    
def read_db(db):    
    
    db = sqlite3.connect(db)
    cursor = db.cursor()
    cursor.execute("SELECT created_at, text FROM tweets")
    data_in_tuples = cursor.fetchall()

    data_in_a_dict = {}

    for i in range(len(data_in_tuples)):
        data_in_a_dict[data_in_tuples[i][0]] = data_in_tuples[i][1]

    nlp = spacy.load('en')    

    dates_and_entities = []
    
    # Only the last 2000 Tweets.
    for key in sorted(data_in_a_dict)[-2000:]:
        doc = nlp(data_in_a_dict[key])
        ents = []
        for ent in doc.ents:
            ents.append([ent.label_, ent.text])
        dates_and_entities.append({key:ents})

    logger.info("All the entities extracted...")
    # Since it takes a while, here we make a backup of the entities extracted.
    with open('dates_and_entities.pkl','wb') as f:
        pickle.dump(dates_and_entities,f)
        logger.info("Entities saved...")


def clean_db():
       
    with open("dates_and_entities.pkl","rb") as f:
        dates_and_entities = pickle.load(f)
        
    geolocator = Nominatim()
    list_of_jsons = []
    for elem in dates_and_entities:
        for k,v in elem.items():
            entities = [(e[1]) for e in v if e[0] == 'GPE']
            entities = [(remove_urls(e)) for e in entities]
            entities = [(remove_punctuation(e)) for e in entities]
            for entity in entities:
                lat, lon = geolocate(geolocator,entity)
                # Dismiss all the entities without latitude or longitud.
                if (lat and lon):
                    list_of_jsons.append(json.dumps({'created_at':int(k),'entity':entity,'lat':lat,'lon':lon}))       

    file_name = 'entities_dataset.json'

    all_the_entities = ",".join(list_of_jsons)

    with open(file_name,'w') as f:
        f.write('[')
        f.write(all_the_entities)
        f.write(']')
    logger.info("Done!")

if __name__ == '__main__':
    # Notice the scrape code to create the DB is not included in this package.
    read_db('realDonaldTrump.db')
    clean_db()
