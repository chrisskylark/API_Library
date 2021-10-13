#!/usr/bin/env node
/**
 * @file getMongoClient.js
 * @version 1
 * @date 01 Jul 2021
 * @author Chris Cullen
 * @copyright Skylark Creative Ltd, 2021
 * --------------------------------------------------------------------------
 * Connect to mongo instance and return a MongoClient object
 * --------------------------------------------------------------------------
 */
import {MongoClient, ObjectId} from 'mongodb';
let client: MongoClient | null = null;

// --------------------------------------------------------------------------
// Connection
// --------------------------------------------------------------------------
export const connectMongo = async (
  MONGOURL: string,
): Promise<MongoClient | null> => {
  if (client) return client;
  let options: any = {
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
  console.log('Making a new connection to mongo ');
  client = new MongoClient(MONGOURL, options);
  // Typescript cannot cope with these in the above setting

  try {
    await client.connect();
    return client;
  } catch (error) {
    console.log('Could not connect to mongodb instance ', error);
    client = null;
    return null;
  }
};

export const disconnectMongo = async () => {
  if (client) await client.close(true);
  client = null;
};

// --------------------------------------------------------------------------
// Storage Types
// --------------------------------------------------------------------------

export enum StoreType {
  Connection,
  WorkoutRecord,
  WorkoutStage,
  LeaderBoardCache,
}

export type storeRecord = {
  _id: ObjectId;
  recordType: StoreType;
};

export {ObjectId};
