#!/usr/bin/env node
/**
 * @file mySQLStore.ts
 * @version 1
 * @date 24 Aug 2021
 * @author Chris Cullen
 * @copyright Skylark Creative Ltd, 2021
 * --------------------------------------------------------------------------
 * Utility functions to manage data in the restAPI store via MySQL
 * --------------------------------------------------------------------------
 */
import * as mysql from 'mysql2/promise';
import {getConfig, ConfigData} from './getConfig';
import {getMySQLClient} from './helpers';
import * as _ from 'lodash';
import {objectLike} from '@aws-cdk/assert';
// --------------------------------------------------------------------------
// ╔═╗┌┬┐┌─┐┬─┐┌─┐  ╔╦╗┬ ┬┌─┐┌─┐┌─┐
// ╚═╗ │ │ │├┬┘├┤    ║ └┬┘├─┘├┤ └─┐
// ╚═╝ ┴ └─┘┴└─└─┘   ╩  ┴ ┴  └─┘└─┘
// --------------------------------------------------------------------------

export type StoreStatus = {
  mysql: mysql.Connection;
  config: ConfigData;
  store: boolean;
  storeTable: string;
};

export enum UserProfileType {
  under16 = 'under16',
  over16 = 'over16',
  professional = 'professional',
  charity = 'charity',
  celebrity = 'celebrity',
}
export type UserRecord = {
  id: number;
  username: string;
  email: string;
  provider: string;
  password: string;
  resetPasswordToken: string;
  confirmationToken: string;
  confirmed: boolean;
  blocked: boolean;
  role: number;
  created_by?: Date;
  updated_by?: number;
  created_at?: Date;
  updated_at?: Date;
  testuser?: boolean;
  firstName?: string;
  lastName?: string;
  dob?: Date;
  strapline?: string;
  joinedOn?: Date;
  follow?: string;
  professional_profile?: string;
  validated?: boolean;
  profileType?: UserProfileType;
};

export type UserConnectionRecord = {
  id?: number;
  userid?: number;
  connectionid: string;
  authenticated: boolean;
};

export type PostcodeRecord = {
  id: number;
  postcode: string;
  street: string;
  district: string;
  country: string;
  latitude: string;
  longitude: string;
  ward: string;
  location: any;
};

export async function mySQLTableExists(table: string): Promise<boolean> {
  const mysql = await getMySQLClient();
  const [db, tab] = table.replace(/`/g, '').split('.');
  if (!db || !tab) throw new Error('mySQLTableExists --> Error must supply table as database.table');
  if (!mysql) throw new Error('storeHasStore: -> Cannot get mysql connection');
  const query = 'SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?;';
  try {
    let res: any = await mysql.execute(query, [db, tab]);
    res = res[0][0];
    return res.count > 0;
  } catch (error) {
    return false;
  }
}
/**
 * Gets the name of the store table from the config data.
 * @returns The store name as database.table
 */
export async function storeTableName(justSchema: boolean = false): Promise<string> {
  try {
    const config = await getConfig();
    if (!config || !config.mysqlStore) throw new Error('storeConnect: -> Missing mysqlStore in config');
    const storeTable = justSchema
      ? `\`${config.mysqlStore!.database}\``
      : `\`${config.mysqlStore!.database}\`.\`${config.mysqlStore!.table}\``;
    return storeTable;
  } catch (error) {
    console.error('storeTableName -> Error ', error);
    return '';
  }
}

/**
 * Gets and returns a mysql client, the name of the store and whether the store exists and the config
 * @returns -  {mysql, config, store, storeTable}
 */
export async function storeConnect(): Promise<StoreStatus> {
  const mysql = await getMySQLClient();
  if (!mysql) throw new Error('storeConnect: -> Cannot get mysql connection');
  const storeTable = await storeTableName();
  if (!storeTable) throw new Error('Cannot fetch store table name');
  const store = await mySQLTableExists(storeTable);
  const config = await getConfig();
  if (!config) throw new Error('Cannot fetch config data');
  return {mysql, config, store, storeTable};
}

/**
 * Returns true or false depending upon if the store table is present.
 * @returns
 */
export async function storeHasStore(): Promise<boolean> {
  try {
    const {store} = await storeConnect();
    return store;
  } catch (error) {
    console.error('storeHasStore -> error ', error);
    return false;
  }
}

/**
 * Constructs the store table
 * @returns
 */
export async function storeMakeStore(): Promise<boolean> {
  try {
    const {mysql, config, store, storeTable} = await storeConnect();
    if (store) return true;
    // Create the store table and it's indexes
    const query = `CREATE TABLE ${storeTable} (
      \`id\` int unsigned NOT NULL AUTO_INCREMENT,
      \`connectionid\` varchar(255) NOT NULL DEFAULT 'undefined',
      \`userid\` INT DEFAULT NULL,
      \`authenticated\` TINYINT DEFAULT 0,
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`socketStore_connectionid\` (\`connectionId\`),
      KEY \`socketStore_userid\` (\`userid\`)
    );`;
    console.log(query);
    let res = await mysql.query(query);
    console.log(res[0]);
    return await storeHasStore();
  } catch (error) {
    console.error('storeHasStore -> error ', error);
    return false;
  }
}
/**
 * Creates or updates a connection record in the store
 * @param UCR
 * @returns
 */
export async function storePutConnection(UCR: UserConnectionRecord): Promise<UserConnectionRecord | null> {
  const {mysql, config, store, storeTable} = await storeConnect();

  if (!store) {
    console.error('storePutConnection -> Store does not exist!');
    return null;
  }
  // if we have an id, then we are doing an update to an existing record, otherwise we are creating a new record.
  // if we create a new record, we need to ensure that one does not exist for the connection id already - if it does
  // we need to delete it and create a new one - or append the id and do an update!
  try {
    let existing: any = await storeGetConnectionId(UCR.connectionid);
    if (existing) UCR.id = existing.id;
    let diff: string[] = [];
    if (UCR.id && existing !== null) {
      // --------------------------------------------------------------------------
      // 📌 STEP: Find changes between the new data and the existing record
      // --------------------------------------------------------------------------

      Object.keys(UCR).forEach((key: string) => {
        if (key in UCR) {
          if (existing[key as keyof UserConnectionRecord] !== UCR[key as keyof UserConnectionRecord]) {
            diff.push(key);
          }
        } else diff.push(key);
      });

      // --------------------------------------------------------------------------
      // 📌 STEP: If we have any changes then write them.
      // --------------------------------------------------------------------------
      if (diff.length) {
        // if (UCR.info) UCR.info = JSON.stringify(UCR.info);
        const query = `UPDATE ${storeTable} SET ? WHERE id = ${UCR.id} ;`;
        let res: any = await mysql.query(query, _.pick(UCR, diff));
        if (res[0].affectedRows > 0) {
          res = await storeGetId(UCR.id);
        }
        return res;
      }
      return existing;
    } else {
      // --------------------------------------------------------------------------
      // 📌 STEP: We are creating a new record
      // --------------------------------------------------------------------------
      // if (UCR.info) UCR.info = JSON.stringify(UCR.info);
      const query = `INSERT INTO  ${storeTable} SET ? ;`;
      let res: any = await mysql.query(query, UCR);
      if (res[0].affectedRows > 0 && res[0].insertId) {
        res = await storeGetId(res[0].insertId);
      }
      //
      return res as UserConnectionRecord;
    }
  } catch (error) {
    console.error('storePutConnection -> Error writing record ', error);
    return null;
  }
  return null;
}

/**
 * Removes the connection record matching the UCR
 * @param UCR
 * @returns
 */
export async function storeRemoveConnection(UCR: UserConnectionRecord): Promise<boolean> {
  try {
    let existing: any = await storeGetConnectionId(UCR.connectionid);
    if (existing) {
      let query = 'DELETE FROM !!store!! WHERE id = ${existing.id} ';
      let res = await runSQL(query);
      return true;
    }
    return false;
  } catch (error) {
    console.error('storeRemoveConnection -> Error ', error);
    return false;
  }
}

/**
 * Performs standardisation processes on the returned connection record
 * @param UCR
 * @returns
 */
function formatUserConnectionRecord(UCR: UserConnectionRecord): UserConnectionRecord | null {
  if (!UCR || _.isEmpty(UCR)) return null;
  try {
    let UCRnew = {...UCR};
    if ('authenticated' in UCRnew) UCRnew.authenticated = UCRnew.authenticated ? true : false;
    // if ('info' in UCRnew) UCRnew.info = JSON.parse(<string>UCRnew.info);
    return UCRnew;
  } catch (error) {
    console.error('formatUserConnectionRecord -> Error formatting object ', error);
    return UCR;
  }
}
/**
 * Search and return current connection record by connectionId - note a connectionId can have only 1 connection
 * @param connectionId - The connectionId to find
 * @returns UserConnectionRecord or null
 */
export async function storeGetId(id: number): Promise<UserConnectionRecord | null> {
  const {mysql, config, store} = await storeConnect();
  if (!store) return null;
  try {
    const query = `SELECT * FROM  \`${config.mysqlStore!.database}\`.\`${config.mysqlStore!.table}\` 
    WHERE id = ${id} `;
    let res: any = await mysql.query(query);
    res = res[0][0];
    return formatUserConnectionRecord(res) as UserConnectionRecord;
  } catch (_) {
    return null;
  }
}

/**
 * Search and return current connection record by connectionId - note a connectionId can have only 1 connection
 * @param connectionId - The connectionId to find
 * @returns UserConnectionRecord or null
 */
export async function storeGetConnectionId(connectionid: string, withUser: boolean = false): Promise<any> {
  try {
    let query;
    let queryName;
    if (withUser) {
      query = `SELECT sc.connectionid, sc.authenticated, sc.userid,
      uu.email, uu.username, uu.firstName, uu.lastName,uu.profileType
      FROM !!store!! sc LEFT JOIN \`users-permissions_user\` uu 
      ON sc.userId = uu.id WHERE connectionid = '${connectionid}';`;
      queryName = 'Full Connection';
    } else {
      query = `SELECT * FROM  !!store!! WHERE connectionid = '${connectionid}' ;`;
      queryName = 'Basic Connection';
    }
    let res: any = await runSQL(query, queryName);
    return formatUserConnectionRecord(res);
  } catch (_) {
    return null;
  }
}

/**
 * Search and return current connections by userId - note a userId can have more than 1 concurrent connection
 * @param userId - The userId to find
 * @returns Array of zero or more UserConnectionRecords
 */
export async function storeGetUserId(userId: number): Promise<UserConnectionRecord[] | null> {
  try {
    const query = `SELECT * FROM  !!store!! WHERE userid = ${userId}; `;
    let res: any = await runSQL(query, 'Connection by UserId');
    res = Array.isArray(res) ? res.map(formatUserConnectionRecord) : formatUserConnectionRecord(res);
    return res;
  } catch (_) {
    return null;
  }
}

/**
 * Retrieves all connection records along with their basic user information optionally as an array or a event object
 * @param asEvent - return an object where data is supplied using an event emitter. see https://github.com/mysqljs/mysql#streaming-query-rows
 * @returns
 */
export async function storeGetAll(): Promise<Follower[]> {
  const query = `SELECT sc.connectionid, sc.userid, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM !!store!! sc JOIN  \`users-permissions_user\` uu ON sc.userid = uu.id`;
  let connections = await runSQL(query, 'Get All Connections');
  return connections;
}

/**
 * Retrieves all connection records along with their basic user information optionally as an array or a event object
 * @param asEvent - return an object where data is supplied using an event emitter. see https://github.com/mysqljs/mysql#streaming-query-rows
 * @returns
 */
export async function storeGetAllWithEvents(): Promise<
  [
    mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader,
    mysql.FieldPacket[],
  ]
> {
  const {mysql, storeTable} = await storeConnect();
  const query = `SELECT sc.connectionid, sc.userid, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM ${storeTable} sc JOIN  \`users-permissions_user\` uu ON sc.userid = uu.id`;
  let connections = mysql.query(query);
  return connections;
}

// --------------------------------------------------------------------------
// ╔═╗┌┬┐┌─┐┬┬    ╔═╗┌┬┐┌─┐┬─┐┌─┐
// ║╣ │││├─┤││    ╚═╗ │ │ │├┬┘├┤
// ╚═╝┴ ┴┴ ┴┴┴─┘  ╚═╝ ┴ └─┘┴└─└─┘
// --------------------------------------------------------------------------

export async function emailstoreEnsureTable(): Promise<boolean> {
  let exists = mySQLTableExists('wunder.email_store');
  if (!exists) {
    // create the email store
    const query = `CREATE TABLE wunder.email_store (
      id int unsigned NOT NULL AUTO_INCREMENT,
      sent DATETIME, 
      email varchar(255),
      subject VARCHAR(255),
      emailTemplateName VARCHAR(255),
      language VARCHAR(255),
      country VARCHAR(255),
      sentOk TINYINT DEFAULT 0,
      sendError VARCHAR(255),
      PRIMARY KEY (id),
      KEY emailstore_email (email, sent),
      KEY emailstore_temp (emailTemplateName, sent)
    );`;
    console.log(query);
    let res = await runSQL(query);
  }
  return mySQLTableExists('wunder.email_store');
}

export async function emailstorePut(emailLog: any): Promise<boolean> {
  const {mysql} = await storeConnect();
  let exists = await emailstoreEnsureTable();
  if (!exists) throw new Error('Email Log does not exist');
  let emailRecord = {
    sent: new Date(),
    email: '',
    subject: '',
    emailTemplateName: '',
    language: '',
    country: '',
    sentOk: false,
    sendError: '',
  };
  try {
    let data = {...emailRecord, ..._.pick(emailLog, Object.keys(emailRecord))};
    let query = 'INSERT INTO wunder.email_store SET ?';
    let res = mysql.query(query, data);
    return true;
  } catch (error) {
    console.error('emailstorePut -> error ', error);
    return false;
  }
}
/**
 * Finds a user record by id, username or email address
 * @param id - numeric id, username or email to find
 * @param projection - list of fields to return in the final record object
 * @returns Object
 */
export async function findUser(id: string | number, projection: string[] = []): Promise<any | null> {
  const mysql = await getMySQLClient();
  if (!mysql) throw new Error('findUser: -> Cannot get mysql connection');
  try {
    let query = 'SELECT * FROM `users-permissions_user` WHERE id = ? OR  username = ? OR email = ? LIMIT 1;';
    let data: any = [id, id, id];
    let res: any = await mysql.execute(query, data);
    let record: any = res[0][0];
    if (projection.length > 0) record = _.pick(record, projection);
    return record;
  } catch (error) {
    console.error('findUser: -> Error running query ', error);
    return null;
  }
}
/**
 * Finds a user record by id only
 * @param id - numeric id to find
 * @param projection - list of fields to return in the final record object
 * @returns Object
 */
export async function findUserById(id: number, projection: string[] = []): Promise<any | null> {
  const mysql = await getMySQLClient();
  if (!mysql) throw new Error('findUser: -> Cannot get mysql connection');
  try {
    let query = 'SELECT * FROM `users-permissions_user` WHERE id = ?;';
    let data: any = [id];
    let res: any = await mysql.execute(query, data);
    let record: any = res[0][0];
    if (projection.length > 0) record = _.pick(record, projection);
    return record;
  } catch (error) {
    console.error('findUser: -> Error running query ', error);
    return null;
  }
}

/**
 * Performs a query on the current MySQL connection,  The query is parsed and any occurrence of !!store!! is replaced with the store table and !!schema!! is replaced with the schema name.
 * @param query - A string representing the SQL to execute
 * @param queryName - An optional string to show in the timing output in cloudwatch
 */
export async function runSQL(query: string, name: string = '', silent: boolean = false): Promise<any> {
  const mysql = await getMySQLClient();
  if (!mysql) throw new Error('runSQL: -> Cannot get mysql connection');
  try {
    query = query.replace(/!!store!!/g, await storeTableName());
    query = query.replace(/!!schema!!/g, await storeTableName(true));
    // console.time(`RunSQL Query ${name}`);
    let res: any = await mysql.execute(query);
    // console.timeEnd(`RunSQL Query ${name}`);
    let record: any = res[0];
    record = Array.isArray(record) && record.length < 1 ? null : record;
    record = Array.isArray(record) && record.length === 1 ? record[0] : record;
    return record;
  } catch (error) {
    if (!silent) console.error('runSQL: -> Error running query ', error);
    return null;
  }
}

// ⟪ TODO: 18 Aug ⟫ ⦗ Finish the update part ⦘
export async function updateUserById(id: number, newData: object = {}): Promise<boolean> {
  const mysql = await getMySQLClient();
  if (!mysql) throw new Error('updateUserById: -> Cannot get mysql connection');
  try {
    let user = await findUserById(id);
    if (!user) throw new Error('Cannot find userId ' + id);
    if (_.isEmpty(newData)) throw new Error('updateUserById -> No data supplied to update');

    let query = 'UPDATE `users-permissions_user` SET ? WHERE id = ? ;';
    let data: any = [newData, id];
    let res: mysql.RowDataPacket[][] = <mysql.RowDataPacket[][]>await mysql.query(query, data);
    let record: any = res[0][0];
    return true;
  } catch (error) {
    console.error('findUser: -> Error running query ', error);
    return false;
  }
}

type Follower = {
  followingUser: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  connectionid: string;
};
/**
 * Returns all the user records who follow the userid
 * @param userId
 * @returns
 */
export async function userFollowers(userId: number): Promise<Follower[]> {
  const query = `SELECT ff.followingUser, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM followers ff LEFT JOIN store_connections sc on ff.followingUser = sc.userid 
  JOIN \`users-permissions_user\` uu ON ff.followingUser = uu.id
  WHERE ff.user = ${userId}; `;
  let followers = await runSQL(query, 'Get Followers');
  return followers;
}

/**
 * Returns all the user records who are followed by the userid
 * @param userId
 * @returns
 */
export async function userFollowing(userId: number): Promise<Follower[]> {
  const query = `SELECT ff.user, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM followers ff LEFT JOIN store_connections sc on ff.user = sc.userid 
  JOIN \`users-permissions_user\` uu ON ff.user = uu.id
  WHERE ff.followingUser = ${userId};`;
  let following = await runSQL(query, 'Get Following');
  return following;
}

/**
 * Returns all the user records who are tagged on the given post
 * @param userId
 * @returns
 */
export async function postTagged(postId: number): Promise<Follower[]> {
  const query = `SELECT ptu.user_id, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM \`posts__tagged_users\` ptu LEFT JOIN store_connections sc on ptu.user_id = sc.userid 
  JOIN \`users-permissions_user\` uu ON ptu.user_id = uu.id
  WHERE ptu.post_id = 10${postId};`;
  let tagged = await runSQL(query, 'Get Tagged');
  return tagged;
}
// --------------------------------------------------------------------------
