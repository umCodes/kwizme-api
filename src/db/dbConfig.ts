import {MongoClient} from 'mongodb';
import { mongoDBName, mongoURI } from '../env';


const client = new MongoClient(mongoURI);

export async function connectToDB(){
    try {
        const mongodb = await client.connect();
        if (!mongodb) return console.log('Error connecting to DB.');        
        console.log('Connected to DB.');
        return mongodb.db(mongoDBName);
    } catch (error) {
        console.log(error);
        return;
    }
}

