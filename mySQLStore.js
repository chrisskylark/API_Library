#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postTagged = exports.userFollowing = exports.userFollowers = exports.updateUserById = exports.runSQL = exports.findUserById = exports.findUser = exports.emailstorePut = exports.emailstoreEnsureTable = exports.storeGetAllWithEvents = exports.storeGetAll = exports.storeGetUserId = exports.storeGetConnectionId = exports.storeGetId = exports.storeRemoveConnection = exports.storePutConnection = exports.storeMakeStore = exports.storeHasStore = exports.storeConnect = exports.storeTableName = exports.mySQLTableExists = exports.UserProfileType = void 0;
const getConfig_1 = require("./getConfig");
const helpers_1 = require("./helpers");
const _ = __importStar(require("lodash"));
var UserProfileType;
(function (UserProfileType) {
    UserProfileType["under16"] = "under16";
    UserProfileType["over16"] = "over16";
    UserProfileType["professional"] = "professional";
    UserProfileType["charity"] = "charity";
    UserProfileType["celebrity"] = "celebrity";
})(UserProfileType = exports.UserProfileType || (exports.UserProfileType = {}));
async function mySQLTableExists(table) {
    const config = await (0, getConfig_1.getConfig)();
    const mysql = await (0, helpers_1.getMySQLClient)();
    let [db, tab] = table.replace(/`/g, '').split('.');
    if (db && !tab && config && config.mysql && config.mysql.database) {
        tab = db;
        db = config.mysql.database;
    }
    if (!db || !tab)
        throw new Error('mySQLTableExists --> Error must supply table as database.table');
    if (!mysql)
        throw new Error('storeHasStore: -> Cannot get mysql connection');
    const query = 'SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?;';
    try {
        let res = await mysql.execute(query, [db, tab]);
        res = res[0][0];
        return res.count > 0;
    }
    catch (error) {
        return false;
    }
}
exports.mySQLTableExists = mySQLTableExists;
async function storeTableName(justSchema = false) {
    try {
        const config = await (0, getConfig_1.getConfig)();
        if (!config || !config.mysqlStore)
            throw new Error('storeConnect: -> Missing mysqlStore in config');
        const storeTable = justSchema
            ? `\`${config.mysqlStore.database}\``
            : `\`${config.mysqlStore.database}\`.\`${config.mysqlStore.table}\``;
        return storeTable;
    }
    catch (error) {
        console.error('storeTableName -> Error ', error);
        return '';
    }
}
exports.storeTableName = storeTableName;
async function storeConnect() {
    const mysql = await (0, helpers_1.getMySQLClient)();
    if (!mysql)
        throw new Error('storeConnect: -> Cannot get mysql connection');
    const storeTable = await storeTableName();
    if (!storeTable)
        throw new Error('Cannot fetch store table name');
    const store = await mySQLTableExists(storeTable);
    const config = await (0, getConfig_1.getConfig)();
    if (!config)
        throw new Error('Cannot fetch config data');
    return { mysql, config, store, storeTable };
}
exports.storeConnect = storeConnect;
async function storeHasStore() {
    try {
        const { store } = await storeConnect();
        return store;
    }
    catch (error) {
        console.error('storeHasStore -> error ', error);
        return false;
    }
}
exports.storeHasStore = storeHasStore;
async function storeMakeStore() {
    try {
        const { mysql, config, store, storeTable } = await storeConnect();
        if (store)
            return true;
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
    }
    catch (error) {
        console.error('storeHasStore -> error ', error);
        return false;
    }
}
exports.storeMakeStore = storeMakeStore;
async function storePutConnection(UCR) {
    const { mysql, config, store, storeTable } = await storeConnect();
    if (!store) {
        console.error('storePutConnection -> Store does not exist!');
        return null;
    }
    try {
        let existing = await storeGetConnectionId(UCR.connectionid);
        if (existing)
            UCR.id = existing.id;
        let diff = [];
        if (UCR.id && existing !== null) {
            Object.keys(UCR).forEach((key) => {
                if (key in UCR) {
                    if (existing[key] !== UCR[key]) {
                        diff.push(key);
                    }
                }
                else
                    diff.push(key);
            });
            if (diff.length) {
                const query = `UPDATE ${storeTable} SET ? WHERE id = ${UCR.id} ;`;
                let res = await mysql.query(query, _.pick(UCR, diff));
                if (res[0].affectedRows > 0) {
                    res = await storeGetId(UCR.id);
                }
                return res;
            }
            return existing;
        }
        else {
            const query = `INSERT INTO  ${storeTable} SET ? ;`;
            let res = await mysql.query(query, UCR);
            if (res[0].affectedRows > 0 && res[0].insertId) {
                res = await storeGetId(res[0].insertId);
            }
            return res;
        }
    }
    catch (error) {
        console.error('storePutConnection -> Error writing record ', error);
        return null;
    }
    return null;
}
exports.storePutConnection = storePutConnection;
async function storeRemoveConnection(UCR) {
    try {
        let existing = await storeGetConnectionId(UCR.connectionid);
        if (existing) {
            let query = 'DELETE FROM !!store!! WHERE id = ${existing.id} ';
            let res = await runSQL(query);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error('storeRemoveConnection -> Error ', error);
        return false;
    }
}
exports.storeRemoveConnection = storeRemoveConnection;
function formatUserConnectionRecord(UCR) {
    if (!UCR || _.isEmpty(UCR))
        return null;
    try {
        let UCRnew = { ...UCR };
        if ('authenticated' in UCRnew)
            UCRnew.authenticated = UCRnew.authenticated ? true : false;
        return UCRnew;
    }
    catch (error) {
        console.error('formatUserConnectionRecord -> Error formatting object ', error);
        return UCR;
    }
}
async function storeGetId(id) {
    const { mysql, config, store } = await storeConnect();
    if (!store)
        return null;
    try {
        const query = `SELECT * FROM  \`${config.mysqlStore.database}\`.\`${config.mysqlStore.table}\` 
    WHERE id = ${id} `;
        let res = await mysql.query(query);
        res = res[0][0];
        return formatUserConnectionRecord(res);
    }
    catch (_) {
        return null;
    }
}
exports.storeGetId = storeGetId;
async function storeGetConnectionId(connectionid, withUser = false) {
    try {
        let query;
        let queryName;
        if (withUser) {
            query = `SELECT sc.connectionid, sc.authenticated, sc.userid,
      uu.email, uu.username, uu.firstName, uu.lastName,uu.profileType
      FROM !!store!! sc LEFT JOIN \`users-permissions_user\` uu 
      ON sc.userId = uu.id WHERE connectionid = '${connectionid}';`;
            queryName = 'Full Connection';
        }
        else {
            query = `SELECT * FROM  !!store!! WHERE connectionid = '${connectionid}' ;`;
            queryName = 'Basic Connection';
        }
        let res = await runSQL(query, queryName);
        return formatUserConnectionRecord(res);
    }
    catch (_) {
        return null;
    }
}
exports.storeGetConnectionId = storeGetConnectionId;
async function storeGetUserId(userId) {
    try {
        const query = `SELECT * FROM  !!store!! WHERE userid = ${userId}; `;
        let res = await runSQL(query, 'Connection by UserId');
        res = Array.isArray(res) ? res.map(formatUserConnectionRecord) : formatUserConnectionRecord(res);
        return res;
    }
    catch (_) {
        return null;
    }
}
exports.storeGetUserId = storeGetUserId;
async function storeGetAll() {
    const query = `SELECT sc.connectionid, sc.userid, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM !!store!! sc JOIN  \`users-permissions_user\` uu ON sc.userid = uu.id`;
    let connections = await runSQL(query, 'Get All Connections');
    return connections;
}
exports.storeGetAll = storeGetAll;
async function storeGetAllWithEvents() {
    const { mysql, storeTable } = await storeConnect();
    const query = `SELECT sc.connectionid, sc.userid, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM ${storeTable} sc JOIN  \`users-permissions_user\` uu ON sc.userid = uu.id`;
    let connections = mysql.query(query);
    return connections;
}
exports.storeGetAllWithEvents = storeGetAllWithEvents;
async function emailstoreEnsureTable() {
    let exists = await mySQLTableExists('email_store');
    if (!exists) {
        const query = `CREATE TABLE email_store (
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
    return mySQLTableExists('email_store');
}
exports.emailstoreEnsureTable = emailstoreEnsureTable;
async function emailstorePut(emailLog) {
    const { mysql } = await storeConnect();
    let exists = await emailstoreEnsureTable();
    if (!exists)
        throw new Error('Email Log does not exist');
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
        let data = { ...emailRecord, ..._.pick(emailLog, Object.keys(emailRecord)) };
        let query = 'INSERT INTO email_store SET ?';
        let res = mysql.query(query, data);
        return true;
    }
    catch (error) {
        console.error('emailstorePut -> error ', error);
        return false;
    }
}
exports.emailstorePut = emailstorePut;
async function findUser(id, projection = []) {
    const mysql = await (0, helpers_1.getMySQLClient)();
    if (!mysql)
        throw new Error('findUser: -> Cannot get mysql connection');
    try {
        let query = 'SELECT * FROM `users-permissions_user` WHERE id = ? OR  username = ? OR email = ? LIMIT 1;';
        let data = [id, id, id];
        let res = await mysql.execute(query, data);
        let record = res[0][0];
        if (projection.length > 0)
            record = _.pick(record, projection);
        return record;
    }
    catch (error) {
        console.error('findUser: -> Error running query ', error);
        return null;
    }
}
exports.findUser = findUser;
async function findUserById(id, projection = []) {
    const mysql = await (0, helpers_1.getMySQLClient)();
    if (!mysql)
        throw new Error('findUser: -> Cannot get mysql connection');
    try {
        let query = 'SELECT * FROM `users-permissions_user` WHERE id = ?;';
        let data = [id];
        let res = await mysql.execute(query, data);
        let record = res[0][0];
        if (projection.length > 0)
            record = _.pick(record, projection);
        return record;
    }
    catch (error) {
        console.error('findUser: -> Error running query ', error);
        return null;
    }
}
exports.findUserById = findUserById;
async function runSQL(query, name = '', silent = false) {
    const mysql = await (0, helpers_1.getMySQLClient)();
    if (!mysql)
        throw new Error('runSQL: -> Cannot get mysql connection');
    try {
        query = query.replace(/!!store!!/g, await storeTableName());
        query = query.replace(/!!schema!!/g, await storeTableName(true));
        let res = await mysql.execute(query);
        let record = res[0];
        record = Array.isArray(record) && record.length < 1 ? null : record;
        record = Array.isArray(record) && record.length === 1 ? record[0] : record;
        return record;
    }
    catch (error) {
        if (!silent)
            console.error('runSQL: -> Error running query ', error);
        return null;
    }
}
exports.runSQL = runSQL;
async function updateUserById(id, newData = {}) {
    const mysql = await (0, helpers_1.getMySQLClient)();
    if (!mysql)
        throw new Error('updateUserById: -> Cannot get mysql connection');
    try {
        let user = await findUserById(id);
        if (!user)
            throw new Error('Cannot find userId ' + id);
        if (_.isEmpty(newData))
            throw new Error('updateUserById -> No data supplied to update');
        let query = 'UPDATE `users-permissions_user` SET ? WHERE id = ? ;';
        let data = [newData, id];
        let res = await mysql.query(query, data);
        let record = res[0][0];
        return true;
    }
    catch (error) {
        console.error('findUser: -> Error running query ', error);
        return false;
    }
}
exports.updateUserById = updateUserById;
async function userFollowers(userId) {
    const query = `SELECT ff.followingUser, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM followers ff LEFT JOIN store_connections sc on ff.followingUser = sc.userid 
  JOIN \`users-permissions_user\` uu ON ff.followingUser = uu.id
  WHERE ff.user = ${userId}; `;
    let followers = await runSQL(query, 'Get Followers');
    return followers;
}
exports.userFollowers = userFollowers;
async function userFollowing(userId) {
    const query = `SELECT ff.user, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM followers ff LEFT JOIN store_connections sc on ff.user = sc.userid 
  JOIN \`users-permissions_user\` uu ON ff.user = uu.id
  WHERE ff.followingUser = ${userId};`;
    let following = await runSQL(query, 'Get Following');
    return following;
}
exports.userFollowing = userFollowing;
async function postTagged(postId) {
    const query = `SELECT ptu.user_id, uu.username, uu.email, uu.firstName, uu.lastname, sc.connectionId
  FROM \`posts__tagged_users\` ptu LEFT JOIN store_connections sc on ptu.user_id = sc.userid 
  JOIN \`users-permissions_user\` uu ON ptu.user_id = uu.id
  WHERE ptu.post_id = 10${postId};`;
    let tagged = await runSQL(query, 'Get Tagged');
    return tagged;
}
exports.postTagged = postTagged;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlTUUxTdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm15U1FMU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZQSwyQ0FBa0Q7QUFDbEQsdUNBQXlDO0FBQ3pDLDBDQUE0QjtBQWU1QixJQUFZLGVBTVg7QUFORCxXQUFZLGVBQWU7SUFDekIsc0NBQW1CLENBQUE7SUFDbkIsb0NBQWlCLENBQUE7SUFDakIsZ0RBQTZCLENBQUE7SUFDN0Isc0NBQW1CLENBQUE7SUFDbkIsMENBQXVCLENBQUE7QUFDekIsQ0FBQyxFQU5XLGVBQWUsR0FBZix1QkFBZSxLQUFmLHVCQUFlLFFBTTFCO0FBK0NNLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxLQUFhO0lBQ2xELE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxxQkFBUyxHQUFFLENBQUM7SUFDakMsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLHdCQUFjLEdBQUUsQ0FBQztJQUNyQyxJQUFJLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuRCxJQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTtRQUNoRSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ1QsRUFBRSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFBO0tBQzNCO0lBQ0QsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7SUFDbkcsSUFBSSxDQUFDLEtBQUs7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFDN0UsTUFBTSxLQUFL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ZDtBQUNILENBQUM7QUFqQkQsd0NBaUJDO0FBZU0sS0FBSyxVQUFVLGFBQWEsQ0FBQyxNQUFjO0lBQ2hELE1BQU0sS0FBSyxHQUFHOzs7b0JBR0ksTUFBTSxJQUFJLENBQUM7SUFDN0IsSUFBSSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUM7QUFQRCxzQ0FPQztBQU9NLEtBQUssVUFBVSxhQUFhLENBQUMsTUFBYztJQUNoRCxNQUFNLEtBQUssR0FBRzs7OzZCQUdhLE1BQU0sR0FBRyxDQUFDO0lBQ3JDLElBQUksU0FBUyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztJQUNyRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBUEQsc0NBT0M7QUFPTSxLQUFLLFVBQVUsVUFBVSxDQUFDLE1BQWM7SUFDN0MsTUFBTSxLQUFLLEdBQUc7OzswQkFHVSxNQUFNLEdBQUcsQ0FBQztJQUNsQyxJQUFJLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDL0MsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQVBELGdDQU9DIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLyoqXG4gKiBAZmlsZSBteVNRTFN0b3JlLnRzXG4gKiBAdmVyc2lvbiAxXG4gKiBAZGF0ZSAyNCBBdWcgMjAyMVxuICogQGF1dGhvciBDaHJpcyBDdWxsZW5cbiAqIEBjb3B5cmlnaHQgU2t5bGFyayBDcmVhdGl2ZSBMdGQsIDIwMjFcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyB0byBtYW5hZ2UgZGF0YSBpbiB0aGUgcmVzdEFQSSBzdG9yZSB2aWEgTXlTUUxcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cbmltcG9ydCAqIGFzIG15c3FsIGZyb20gJ215c3FsMi9wcm9taXNlJztcbmltcG9ydCB7Z2V0Q29uZmlnLCBDb25maWdEYXRhfSBmcm9tICcuL2dldENvbmZpZyc7XG5pbXBvcnQge2dldE15U1FMQ2xpZW50fSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHtvYmplY3RMaWtlfSBmcm9tICdAYXdzLWNkay9hc3NlcnQnO1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIOKVlOKVkOKVl+KUjOKUrOKUkOKUjOKUgOKUkOKUrOKUgOKUkOKUjOKUgOKUkCAg4pWU4pWm4pWX4pSsIOKUrOKUjOKUgOKUkOKUjOKUgOKUkOKUjOKUgOKUkFxuLy8g4pWa4pWQ4pWXIOKUgiDilIIg4pSC4pSc4pSs4pSY4pSc4pSkICAgIOKVkSDilJTilKzilJjilJzilIDilJjilJzilKQg4pSU4pSA4pSQXG4vLyDilZrilZDilZ0g4pS0IOKUlOKUgOKUmOKUtOKUlOKUgOKUlOKUgOKUmCAgIOKVqSAg4pS0IOKUtCAg4pSU4pSA4pSY4pSU4pSA4pSYXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBTdG9yZVN0YXR1cyA9IHtcbiAgbXlzcWw6IG15c3FsLkNvbm5lY3Rpb247XG4gIGNvbmZpZzogQ29uZmlnRGF0YTtcbiAgc3RvcmU6IGJvb2xlYW47XG4gIHN0b3JlVGFibGU6IHN0cmluZztcbn07XG5cbmV4cG9ydCBlbnVtIFVzZXJQcm9maWxlVHlwZSB7XG4gIHVuZGVyMTYgPSAndW5kZXIxNicsXG4gIG92ZXIxNiA9ICdvdmVyMTYnLFxuICBwcm9mZXNzaW9uYWwgPSAncHJvZmVzc2lvbmFsJyxcbiAgY2hhcml0eSA9ICdjaGFyaXR5JyxcbiAgY2VsZWJyaXR5ID0gJ2NlbGVicml0eScsXG59XG5leHBvcnQgdHlwZSBVc2VyUmVjb3JkID0ge1xuICBpZDogbnVtYmVyO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBlbWFpbDogc3RyaW5nO1xuICBwcm92aWRlcjogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICByZXNldFBhc3N3b3JkVG9rZW46IHN0cmluZztcbiAgY29uZmlybWF0aW9uVG9rZW46IHN0cmluZztcbiAgY29uZmlybWVkOiBib29sZWFuO1xuICBibG9ja2VkOiBib29sZWFuO1xuICByb2xlOiBudW1iZXI7XG4gIGNyZWF0ZWRfYnk/OiBEYXRlO1xuICB1cGRhdGVkX2J5PzogbnVtYmVyO1xuICBjcmVhdGVkX2F0PzogRGF0ZTtcbiAgdXBkYXRlZF9hdD86IERhdGU7XG4gIHRlc3R1c2VyPzogYm9vbGVhbjtcbiAgZmlyc3ROYW1lPzogc3RyaW5nO1xuICBsYXN0TmFtZT86IHN0cmluZztcbiAgZG9iPzogRGF0ZTtcbiAgc3RyYXBsaW5lPzogc3RyaW5nO1xuICBqb2luZWRPbj86IERhdGU7XG4gIGZvbGxvdz86IHN0cmluZztcbiAgcHJvZmVzc2lvbmFsX3Byb2ZpbGU/OiBzdHJpbmc7XG4gIHZhbGlkYXRlZD86IGJvb2xlYW47XG4gIHByb2ZpbGVUeXBlPzogVXNlclByb2ZpbGVUeXBlO1xufTtcblxuZXhwb3J0IHR5cGUgVXNlckNvbm5lY3Rpb25SZWNvcmQgPSB7XG4gIGlkPzogbnVtYmVyO1xuICB1c2VyaWQ/OiBudW1iZXI7XG4gIGNvbm5lY3Rpb25pZDogc3RyaW5nO1xuICBhdXRoZW50aWNhdGVkOiBib29sZWFuO1xufTtcblxuZXhwb3J0IHR5cGUgUG9zdGNvZGVSZWNvcmQgPSB7XG4gIGlkOiBudW1iZXI7XG4gIHBvc3Rjb2RlOiBzdHJpbmc7XG4gIHN0cmVldDogc3RyaW5nO1xuICBkaXN0cmljdDogc3RyaW5nO1xuICBjb3VudHJ5OiBzdHJpbmc7XG4gIGxhdGl0dWRlOiBzdHJpbmc7XG4gIGxvbmdpdHVkZTogc3RyaW5nO1xuICB3YXJkOiBzdHJpbmc7XG4gIGxvY2F0aW9uOiBhbnk7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbXlTUUxUYWJsZUV4aXN0cyh0YWJsZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGdldENvbmZpZygpO1xuICBjb25zdCBteXNxbCA9IGF3YWl0IGdldE15U1FMQ2xpZW50KCk7XG4gIGxldCBbZGIsIHRhYl0gPSB0YWJsZS5yZXBsYWNlKC9gL2csICcnKS5zcGxpdCgnLicpO1xuICBpZihkYiAmJiAhdGFiICYmIGNvbmZpZyAmJiBjb25maWcubXlzcWwgJiYgY29uZmlnLm15c3FsLmRhdGFiYXNlKSB7XG4gICAgdGFiID0gZGI7XG4gICAgZGIgPSBjb25maWcubXlzcWwuZGF0YWJhc2VcbiAgfVxuICBpZiAoIWRiIHx8ICF0YWIpIHRocm93IG5ldyBFcnJvcignbXlTUUxUYWJsZUV4aXN0cyAtLT4gRXJyb3IgbXVzdCBzdXBwbHkgdGFibGUgYXMgZGF0YWJhc2UudGFibGUnKTtcbiAgaWYgKCFteXNxbCkgdGhyb3cgbmV3IEVycm9yKCdzdG9yZUhhc1N0b3JlOiAtPiBDYW5ub3QgZ2V0IG15c3FsIGNvbm5lY3Rpb24nKTtcbiAgY29uc3QgcXVlcnkgPSAnU0VMRUNUIENPVU5UKCopIEFTIGNvdW50IEZST00gaW5mb3JtYXRpb25fc2NoZW1hLnRhYmxlcyBXSEVSRSB0YWJsZV9zY2hlbWEgPSA/IEFORCB0YWJsZV9uYW1lID0gPzsnO1xuICB0cnkge1xuICAgIGxldCByZXM6IGFueSA9IGF3YWl0IG15c3FsLmV4ZWN1dGUocXVlcnksIFtkYiwgdGFiXSk7XG4gICAgcmVzID0gcmVzWzBdWzBdO1xuICAgIHJldHVybiByZXMuY291bnQgPiAwO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuLyoqXG4gKiBHZXRzIHRoZSBuYW1lIG9mIHRoZSBzdG9yZSB0YWJsZSBmcm9tIHRoZSBjb25maWcgZGF0YS5cbiAqIEByZXR1cm5zIFRoZSBzdG9yZSBuYW1lIGFzIGRhdGFiYXNlLnRhYmxlXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZVRhYmxlTmFtZShqdXN0U2NoZW1hOiBib29sZWFuID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICB0cnkge1xuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGdldENvbmZpZygpO1xuICAgIGlmICghY29uZmlnIHx8ICFjb25maWcubXlzcWxTdG9yZSkgdGhyb3cgbmV3IEVycm9yKCdzdG9yZUNvbm5lY3Q6IC0+IE1pc3NpbmcgbXlzcWxTdG9yZSBpbiBjb25maWcnKTtcbiAgICBjb25zdCBzdG9yZVRhYmxlID0ganVzdFNjaGVtYVxuICAgICAgPyBgXFxgJHtjb25maWcubXlzcWxTdG9yZSEuZGF0YWJhc2V9XFxgYFxuICAgICAgOiBgXFxgJHtjb25maWcubXlzcWxTdG9yZSEuZGF0YWJhc2V9XFxgLlxcYCR7Y29uZmlnLm15c3FsU3RvcmUhLnRhYmxlfVxcYGA7XG4gICAgcmV0dXJuIHN0b3JlVGFibGU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignc3RvcmVUYWJsZU5hbWUgLT4gRXJyb3IgJywgZXJyb3IpO1xuICAgIHJldHVybiAnJztcbiAgfVxufVxuXG4vKipcbiAqIEdldHMgYW5kIHJldHVybnMgYSBteXNxbCBjbGllbnQsIHRoZSBuYW1lIG9mIHRoZSBzdG9yZSBhbmQgd2hldGhlciB0aGUgc3RvcmUgZXhpc3RzIGFuZCB0aGUgY29uZmlnXG4gKiBAcmV0dXJucyAtICB7bXlzcWwsIGNvbmZpZywgc3RvcmUsIHN0b3JlVGFibGV9XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZUNvbm5lY3QoKTogUHJvbWlzZTxTdG9yZVN0YXR1cz4ge1xuICBjb25zdCBteXNxbCA9IGF3YWl0IGdldE15U1FMQ2xpZW50KCk7XG4gIGlmICghbXlzcWwpIHRocm93IG5ldyBFcnJvcignc3RvcmVDb25uZWN0OiAtPiBDYW5ub3QgZ2V0IG15c3FsIGNvbm5lY3Rpb24nKTtcbiAgY29uc3Qgc3RvcmVUYWJsZSA9IGF3YWl0IHN0b3JlVGFibGVOYW1lKCk7XG4gIGlmICghc3RvcmVUYWJsZSkgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmV0Y2ggc3RvcmUgdGFibGUgbmFtZScpO1xuICBjb25zdCBzdG9yZSA9IGF3YWl0IG15U1FMVGFibGVFeGlzdHMoc3RvcmVUYWJsZSk7XG4gIGNvbnN0IGNvbmZpZyA9IGF3YWl0IGdldENvbmZpZygpO1xuICBpZiAoIWNvbmZpZykgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmV0Y2ggY29uZmlnIGRhdGEnKTtcbiAgcmV0dXJuIHtteXNxbCwgY29uZmlnLCBzdG9yZSwgc3RvcmVUYWJsZX07XG59XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIG9yIGZhbHNlIGRlcGVuZGluZyB1cG9uIGlmIHRoZSBzdG9yZSB0YWJsZSBpcyBwcmVzZW50LlxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlSGFzU3RvcmUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHRyeSB7XG4gICAgY29uc3Qge3N0b3JlfSA9IGF3YWl0IHN0b3JlQ29ubmVjdCgpO1xuICAgIHJldHVybiBzdG9yZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdzdG9yZUhhc1N0b3JlIC0+IGVycm9yICcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIHRoZSBzdG9yZSB0YWJsZVxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlTWFrZVN0b3JlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGNvbnN0IHtteXNxbCwgY29uZmlnLCBzdG9yZSwgc3RvcmVUYWJsZX0gPSBhd2FpdCBzdG9yZUNvbm5lY3QoKTtcbiAgICBpZiAoc3RvcmUpIHJldHVybiB0cnVlO1xuICAgIC8vIENyZWF0ZSB0aGUgc3RvcmUgdGFibGUgYW5kIGl0J3MgaW5kZXhlc1xuICAgIGNvbnN0IHF1ZXJ5ID0gYENSRUFURSBUQUJMRSAke3N0b3JlVGFibGV9IChcbiAgICAgIFxcYGlkXFxgIGludCB1bnNpZ25lZCBOT1QgTlVMTCBBVVRPX0lOQ1JFTUVOVCxcbiAgICAgIFxcYGNvbm5lY3Rpb25pZFxcYCB2YXJjaGFyKDI1NSkgTk9UIE5VTEwgREVGQVVMVCAndW5kZWZpbmVkJyxcbiAgICAgIFxcYHVzZXJpZFxcYCBJTlQgREVGQVVMVCBOVUxMLFxuICAgICAgXFxgYXV0aGVudGljYXRlZFxcYCBUSU5ZSU5UIERFRkFVTFQgMCxcbiAgICAgIFBSSU1BUlkgS0VZIChcXGBpZFxcYCksXG4gICAgICBVTklRVUUgS0VZIFxcYHNvY2tldFN0b3JlX2Nvbm5lY3Rpb25pZFxcYCAoXFxgY29ubmVjdGlvbklkXFxgKSxcbiAgICAgIEtFWSBcXGBzb2NrZXRTdG9yZV91c2VyaWRcXGAgKFxcYHVzZXJpZFxcYClcbiAgICApO2A7XG4gICAgY29uc29sZS5sb2cocXVlcnkpO1xuICAgIGxldCByZXMgPSBhd2FpdCBteXNxbC5xdWVyeShxdWVyeSk7XG4gICAgY29uc29sZS5sb2cocmVzWzBdKTtcbiAgICByZXR1cm4gYXdhaXQgc3RvcmVIYXNTdG9yZSgpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ3N0b3JlSGFzU3RvcmUgLT4gZXJyb3IgJywgZXJyb3IpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuLyoqXG4gKiBDcmVhdGVzIG9yIHVwZGF0ZXMgYSBjb25uZWN0aW9uIHJlY29yZCBpbiB0aGUgc3RvcmVcbiAqIEBwYXJhbSBVQ1JcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZVB1dENvbm5lY3Rpb24oVUNSOiBVc2VyQ29ubmVjdGlvblJlY29yZCk6IFByb21pc2U8VXNlckNvbm5lY3Rpb25SZWNvcmQgfCBudWxsPiB7XG4gIGNvbnN0IHtteXNxbCwgY29uZmlnLCBzdG9yZSwgc3RvcmVUYWJsZX0gPSBhd2FpdCBzdG9yZUNvbm5lY3QoKTtcblxuICBpZiAoIXN0b3JlKSB7XG4gICAgY29uc29sZS5lcnJvcignc3RvcmVQdXRDb25uZWN0aW9uIC0+IFN0b3JlIGRvZXMgbm90IGV4aXN0IScpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8vIGlmIHdlIGhhdmUgYW4gaWQsIHRoZW4gd2UgYXJlIGRvaW5nIGFuIHVwZGF0ZSB0byBhbiBleGlzdGluZyByZWNvcmQsIG90aGVyd2lzZSB3ZSBhcmUgY3JlYXRpbmcgYSBuZXcgcmVjb3JkLlxuICAvLyBpZiB3ZSBjcmVhdGUgYSBuZXcgcmVjb3JkLCB3ZSBuZWVkIHRvIGVuc3VyZSB0aGF0IG9uZSBkb2VzIG5vdCBleGlzdCBmb3IgdGhlIGNvbm5lY3Rpb24gaWQgYWxyZWFkeSAtIGlmIGl0IGRvZXNcbiAgLy8gd2UgbmVlZCB0byBkZWxldGUgaXQgYW5kIGNyZWF0ZSBhIG5ldyBvbmUgLSBvciBhcHBlbmQgdGhlIGlkIGFuZCBkbyBhbiB1cGRhdGUhXG4gIHRyeSB7XG4gICAgbGV0IGV4aXN0aW5nOiBhbnkgPSBhd2FpdCBzdG9yZUdldENvbm5lY3Rpb25JZChVQ1IuY29ubmVjdGlvbmlkKTtcbiAgICBpZiAoZXhpc3RpbmcpIFVDUi5pZCA9IGV4aXN0aW5nLmlkO1xuICAgIGxldCBkaWZmOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChVQ1IuaWQgJiYgZXhpc3RpbmcgIT09IG51bGwpIHtcbiAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAvLyDwn5OMIFNURVA6IEZpbmQgY2hhbmdlcyBiZXR3ZWVuIHRoZSBuZXcgZGF0YSBhbmQgdGhlIGV4aXN0aW5nIHJlY29yZFxuICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAgICAgT2JqZWN0LmtleXMoVUNSKS5mb3JFYWNoKChrZXk6IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAoa2V5IGluIFVDUikge1xuICAgICAgICAgIGlmIChleGlzdGluZ1trZXkgYXMga2V5b2YgVXNlckNvbm5lY3Rpb25SZWNvcmRdICE9PSBVQ1Jba2V5IGFzIGtleW9mIFVzZXJDb25uZWN0aW9uUmVjb3JkXSkge1xuICAgICAgICAgICAgZGlmZi5wdXNoKGtleSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgZGlmZi5wdXNoKGtleSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIC8vIPCfk4wgU1RFUDogSWYgd2UgaGF2ZSBhbnkgY2hhbmdlcyB0aGVuIHdyaXRlIHRoZW0uXG4gICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgaWYgKGRpZmYubGVuZ3RoKSB7XG4gICAgICAgIC8vIGlmIChVQ1IuaW5mbykgVUNSLmluZm8gPSBKU09OLnN0cmluZ2lmeShVQ1IuaW5mbyk7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gYFVQREFURSAke3N0b3JlVGFibGV9IFNFVCA/IFdIRVJFIGlkID0gJHtVQ1IuaWR9IDtgO1xuICAgICAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBteXNxbC5xdWVyeShxdWVyeSwgXy5waWNrKFVDUiwgZGlmZikpO1xuICAgICAgICBpZiAocmVzWzBdLmFmZmVjdGVkUm93cyA+IDApIHtcbiAgICAgICAgICByZXMgPSBhd2FpdCBzdG9yZUdldElkKFVDUi5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBleGlzdGluZztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIC8vIPCfk4wgU1RFUDogV2UgYXJlIGNyZWF0aW5nIGEgbmV3IHJlY29yZFxuICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIC8vIGlmIChVQ1IuaW5mbykgVUNSLmluZm8gPSBKU09OLnN0cmluZ2lmeShVQ1IuaW5mbyk7XG4gICAgICBjb25zdCBxdWVyeSA9IGBJTlNFUlQgSU5UTyAgJHtzdG9yZVRhYmxlfSBTRVQgPyA7YDtcbiAgICAgIGxldCByZXM6IGFueSA9IGF3YWl0IG15c3FsLnF1ZXJ5KHF1ZXJ5LCBVQ1IpO1xuICAgICAgaWYgKHJlc1swXS5hZmZlY3RlZFJvd3MgPiAwICYmIHJlc1swXS5pbnNlcnRJZCkge1xuICAgICAgICByZXMgPSBhd2FpdCBzdG9yZUdldElkKHJlc1swXS5pbnNlcnRJZCk7XG4gICAgICB9XG4gICAgICAvL1xuICAgICAgcmV0dXJuIHJlcyBhcyBVc2VyQ29ubmVjdGlvblJlY29yZDtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignc3RvcmVQdXRDb25uZWN0aW9uIC0+IEVycm9yIHdyaXRpbmcgcmVjb3JkICcsIGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIHRoZSBjb25uZWN0aW9uIHJlY29yZCBtYXRjaGluZyB0aGUgVUNSXG4gKiBAcGFyYW0gVUNSXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVSZW1vdmVDb25uZWN0aW9uKFVDUjogVXNlckNvbm5lY3Rpb25SZWNvcmQpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBsZXQgZXhpc3Rpbmc6IGFueSA9IGF3YWl0IHN0b3JlR2V0Q29ubmVjdGlvbklkKFVDUi5jb25uZWN0aW9uaWQpO1xuICAgIGlmIChleGlzdGluZykge1xuICAgICAgbGV0IHF1ZXJ5ID0gJ0RFTEVURSBGUk9NICEhc3RvcmUhISBXSEVSRSBpZCA9ICR7ZXhpc3RpbmcuaWR9ICc7XG4gICAgICBsZXQgcmVzID0gYXdhaXQgcnVuU1FMKHF1ZXJ5KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignc3RvcmVSZW1vdmVDb25uZWN0aW9uIC0+IEVycm9yICcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBzdGFuZGFyZGlzYXRpb24gcHJvY2Vzc2VzIG9uIHRoZSByZXR1cm5lZCBjb25uZWN0aW9uIHJlY29yZFxuICogQHBhcmFtIFVDUlxuICogQHJldHVybnNcbiAqL1xuZnVuY3Rpb24gZm9ybWF0VXNlckNvbm5lY3Rpb25SZWNvcmQoVUNSOiBVc2VyQ29ubmVjdGlvblJlY29yZCk6IFVzZXJDb25uZWN0aW9uUmVjb3JkIHwgbnVsbCB7XG4gIGlmICghVUNSIHx8IF8uaXNFbXB0eShVQ1IpKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBsZXQgVUNSbmV3ID0gey4uLlVDUn07XG4gICAgaWYgKCdhdXRoZW50aWNhdGVkJyBpbiBVQ1JuZXcpIFVDUm5ldy5hdXRoZW50aWNhdGVkID0gVUNSbmV3LmF1dGhlbnRpY2F0ZWQgPyB0cnVlIDogZmFsc2U7XG4gICAgLy8gaWYgKCdpbmZvJyBpbiBVQ1JuZXcpIFVDUm5ldy5pbmZvID0gSlNPTi5wYXJzZSg8c3RyaW5nPlVDUm5ldy5pbmZvKTtcbiAgICByZXR1cm4gVUNSbmV3O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2Zvcm1hdFVzZXJDb25uZWN0aW9uUmVjb3JkIC0+IEVycm9yIGZvcm1hdHRpbmcgb2JqZWN0ICcsIGVycm9yKTtcbiAgICByZXR1cm4gVUNSO1xuICB9XG59XG4vKipcbiAqIFNlYXJjaCBhbmQgcmV0dXJuIGN1cnJlbnQgY29ubmVjdGlvbiByZWNvcmQgYnkgY29ubmVjdGlvbklkIC0gbm90ZSBhIGNvbm5lY3Rpb25JZCBjYW4gaGF2ZSBvbmx5IDEgY29ubmVjdGlvblxuICogQHBhcmFtIGNvbm5lY3Rpb25JZCAtIFRoZSBjb25uZWN0aW9uSWQgdG8gZmluZFxuICogQHJldHVybnMgVXNlckNvbm5lY3Rpb25SZWNvcmQgb3IgbnVsbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVHZXRJZChpZDogbnVtYmVyKTogUHJvbWlzZTxVc2VyQ29ubmVjdGlvblJlY29yZCB8IG51bGw+IHtcbiAgY29uc3Qge215c3FsLCBjb25maWcsIHN0b3JlfSA9IGF3YWl0IHN0b3JlQ29ubmVjdCgpO1xuICBpZiAoIXN0b3JlKSByZXR1cm4gbnVsbDtcbiAgdHJ5IHtcbiAgICBjb25zdCBxdWVyeSA9IGBTRUxFQ1QgKiBGUk9NICBcXGAke2NvbmZpZy5teXNxbFN0b3JlIS5kYXRhYmFzZX1cXGAuXFxgJHtjb25maWcubXlzcWxTdG9yZSEudGFibGV9XFxgIFxuICAgIFdIRVJFIGlkID0gJHtpZH0gYDtcbiAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBteXNxbC5xdWVyeShxdWVyeSk7XG4gICAgcmVzID0gcmVzWzBdWzBdO1xuICAgIHJldHVybiBmb3JtYXRVc2VyQ29ubmVjdGlvblJlY29yZChyZXMpIGFzIFVzZXJDb25uZWN0aW9uUmVjb3JkO1xuICB9IGNhdGNoIChfKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2ggYW5kIHJldHVybiBjdXJyZW50IGNvbm5lY3Rpb24gcmVjb3JkIGJ5IGNvbm5lY3Rpb25JZCAtIG5vdGUgYSBjb25uZWN0aW9uSWQgY2FuIGhhdmUgb25seSAxIGNvbm5lY3Rpb25cbiAqIEBwYXJhbSBjb25uZWN0aW9uSWQgLSBUaGUgY29ubmVjdGlvbklkIHRvIGZpbmRcbiAqIEByZXR1cm5zIFVzZXJDb25uZWN0aW9uUmVjb3JkIG9yIG51bGxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlR2V0Q29ubmVjdGlvbklkKGNvbm5lY3Rpb25pZDogc3RyaW5nLCB3aXRoVXNlcjogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxhbnk+IHtcbiAgdHJ5IHtcbiAgICBsZXQgcXVlcnk7XG4gICAgbGV0IHF1ZXJ5TmFtZTtcbiAgICBpZiAod2l0aFVzZXIpIHtcbiAgICAgIHF1ZXJ5ID0gYFNFTEVDVCBzYy5jb25uZWN0aW9uaWQsIHNjLmF1dGhlbnRpY2F0ZWQsIHNjLnVzZXJpZCxcbiAgICAgIHV1LmVtYWlsLCB1dS51c2VybmFtZSwgdXUuZmlyc3ROYW1lLCB1dS5sYXN0TmFtZSx1dS5wcm9maWxlVHlwZVxuICAgICAgRlJPTSAhIXN0b3JlISEgc2MgTEVGVCBKT0lOIFxcYHVzZXJzLXBlcm1pc3Npb25zX3VzZXJcXGAgdXUgXG4gICAgICBPTiBzYy51c2VySWQgPSB1dS5pZCBXSEVSRSBjb25uZWN0aW9uaWQgPSAnJHtjb25uZWN0aW9uaWR9JztgO1xuICAgICAgcXVlcnlOYW1lID0gJ0Z1bGwgQ29ubmVjdGlvbic7XG4gICAgfSBlbHNlIHtcbiAgICAgIHF1ZXJ5ID0gYFNFTEVDVCAqIEZST00gICEhc3RvcmUhISBXSEVSRSBjb25uZWN0aW9uaWQgPSAnJHtjb25uZWN0aW9uaWR9JyA7YDtcbiAgICAgIHF1ZXJ5TmFtZSA9ICdCYXNpYyBDb25uZWN0aW9uJztcbiAgICB9XG4gICAgbGV0IHJlczogYW55ID0gYXdhaXQgcnVuU1FMKHF1ZXJ5LCBxdWVyeU5hbWUpO1xuICAgIHJldHVybiBmb3JtYXRVc2VyQ29ubmVjdGlvblJlY29yZChyZXMpO1xuICB9IGNhdGNoIChfKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2ggYW5kIHJldHVybiBjdXJyZW50IGNvbm5lY3Rpb25zIGJ5IHVzZXJJZCAtIG5vdGUgYSB1c2VySWQgY2FuIGhhdmUgbW9yZSB0aGFuIDEgY29uY3VycmVudCBjb25uZWN0aW9uXG4gKiBAcGFyYW0gdXNlcklkIC0gVGhlIHVzZXJJZCB0byBmaW5kXG4gKiBAcmV0dXJucyBBcnJheSBvZiB6ZXJvIG9yIG1vcmUgVXNlckNvbm5lY3Rpb25SZWNvcmRzXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZUdldFVzZXJJZCh1c2VySWQ6IG51bWJlcik6IFByb21pc2U8VXNlckNvbm5lY3Rpb25SZWNvcmRbXSB8IG51bGw+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBxdWVyeSA9IGBTRUxFQ1QgKiBGUk9NICAhIXN0b3JlISEgV0hFUkUgdXNlcmlkID0gJHt1c2VySWR9OyBgO1xuICAgIGxldCByZXM6IGFueSA9IGF3YWl0IHJ1blNRTChxdWVyeSwgJ0Nvbm5lY3Rpb24gYnkgVXNlcklkJyk7XG4gICAgcmVzID0gQXJyYXkuaXNBcnJheShyZXMpID8gcmVzLm1hcChmb3JtYXRVc2VyQ29ubmVjdGlvblJlY29yZCkgOiBmb3JtYXRVc2VyQ29ubmVjdGlvblJlY29yZChyZXMpO1xuICAgIHJldHVybiByZXM7XG4gIH0gY2F0Y2ggKF8pIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbGwgY29ubmVjdGlvbiByZWNvcmRzIGFsb25nIHdpdGggdGhlaXIgYmFzaWMgdXNlciBpbmZvcm1hdGlvbiBvcHRpb25hbGx5IGFzIGFuIGFycmF5IG9yIGEgZXZlbnQgb2JqZWN0XG4gKiBAcGFyYW0gYXNFdmVudCAtIHJldHVybiBhbiBvYmplY3Qgd2hlcmUgZGF0YSBpcyBzdXBwbGllZCB1c2luZyBhbiBldmVudCBlbWl0dGVyLiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL215c3FsanMvbXlzcWwjc3RyZWFtaW5nLXF1ZXJ5LXJvd3NcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZUdldEFsbCgpOiBQcm9taXNlPEZvbGxvd2VyW10+IHtcbiAgY29uc3QgcXVlcnkgPSBgU0VMRUNUIHNjLmNvbm5lY3Rpb25pZCwgc2MudXNlcmlkLCB1dS51c2VybmFtZSwgdXUuZW1haWwsIHV1LmZpcnN0TmFtZSwgdXUubGFzdG5hbWUsIHNjLmNvbm5lY3Rpb25JZFxuICBGUk9NICEhc3RvcmUhISBzYyBKT0lOICBcXGB1c2Vycy1wZXJtaXNzaW9uc191c2VyXFxgIHV1IE9OIHNjLnVzZXJpZCA9IHV1LmlkYDtcbiAgbGV0IGNvbm5lY3Rpb25zID0gYXdhaXQgcnVuU1FMKHF1ZXJ5LCAnR2V0IEFsbCBDb25uZWN0aW9ucycpO1xuICByZXR1cm4gY29ubmVjdGlvbnM7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGFsbCBjb25uZWN0aW9uIHJlY29yZHMgYWxvbmcgd2l0aCB0aGVpciBiYXNpYyB1c2VyIGluZm9ybWF0aW9uIG9wdGlvbmFsbHkgYXMgYW4gYXJyYXkgb3IgYSBldmVudCBvYmplY3RcbiAqIEBwYXJhbSBhc0V2ZW50IC0gcmV0dXJuIGFuIG9iamVjdCB3aGVyZSBkYXRhIGlzIHN1cHBsaWVkIHVzaW5nIGFuIGV2ZW50IGVtaXR0ZXIuIHNlZSBodHRwczovL2dpdGh1Yi5jb20vbXlzcWxqcy9teXNxbCNzdHJlYW1pbmctcXVlcnktcm93c1xuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlR2V0QWxsV2l0aEV2ZW50cygpOiBQcm9taXNlPFxuICBbXG4gICAgbXlzcWwuUm93RGF0YVBhY2tldFtdIHwgbXlzcWwuUm93RGF0YVBhY2tldFtdW10gfCBteXNxbC5Pa1BhY2tldCB8IG15c3FsLk9rUGFja2V0W10gfCBteXNxbC5SZXN1bHRTZXRIZWFkZXIsXG4gICAgbXlzcWwuRmllbGRQYWNrZXRbXSxcbiAgXVxuPiB7XG4gIGNvbnN0IHtteXNxbCwgc3RvcmVUYWJsZX0gPSBhd2FpdCBzdG9yZUNvbm5lY3QoKTtcbiAgY29uc3QgcXVlcnkgPSBgU0VMRUNUIHNjLmNvbm5lY3Rpb25pZCwgc2MudXNlcmlkLCB1dS51c2VybmFtZSwgdXUuZW1haWwsIHV1LmZpcnN0TmFtZSwgdXUubGFzdG5hbWUsIHNjLmNvbm5lY3Rpb25JZFxuICBGUk9NICR7c3RvcmVUYWJsZX0gc2MgSk9JTiAgXFxgdXNlcnMtcGVybWlzc2lvbnNfdXNlclxcYCB1dSBPTiBzYy51c2VyaWQgPSB1dS5pZGA7XG4gIGxldCBjb25uZWN0aW9ucyA9IG15c3FsLnF1ZXJ5KHF1ZXJ5KTtcbiAgcmV0dXJuIGNvbm5lY3Rpb25zO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8g4pWU4pWQ4pWX4pSM4pSs4pSQ4pSM4pSA4pSQ4pSs4pSsICAgIOKVlOKVkOKVl+KUjOKUrOKUkOKUjOKUgOKUkOKUrOKUgOKUkOKUjOKUgOKUkFxuLy8g4pWR4pWjIOKUguKUguKUguKUnOKUgOKUpOKUguKUgiAgICDilZrilZDilZcg4pSCIOKUgiDilILilJzilKzilJjilJzilKRcbi8vIOKVmuKVkOKVneKUtCDilLTilLQg4pS04pS04pS04pSA4pSYICDilZrilZDilZ0g4pS0IOKUlOKUgOKUmOKUtOKUlOKUgOKUlOKUgOKUmFxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVtYWlsc3RvcmVFbnN1cmVUYWJsZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgbGV0IGV4aXN0cyA9IGF3YWl0IG15U1FMVGFibGVFeGlzdHMoJ2VtYWlsX3N0b3JlJyk7XG4gIGlmICghZXhpc3RzKSB7XG4gICAgLy8gY3JlYXRlIHRoZSBlbWFpbCBzdG9yZVxuICAgIGNvbnN0IHF1ZXJ5ID0gYENSRUFURSBUQUJMRSBlbWFpbF9zdG9yZSAoXG4gICAgICBpZCBpbnQgdW5zaWduZWQgTk9UIE5VTEwgQVVUT19JTkNSRU1FTlQsXG4gICAgICBzZW50IERBVEVUSU1FLCBcbiAgICAgIGVtYWlsIHZhcmNoYXIoMjU1KSxcbiAgICAgIHN1YmplY3QgVkFSQ0hBUigyNTUpLFxuICAgICAgZW1haWxUZW1wbGF0ZU5hbWUgVkFSQ0hBUigyNTUpLFxuICAgICAgbGFuZ3VhZ2UgVkFSQ0hBUigyNTUpLFxuICAgICAgY291bnRyeSBWQVJDSEFSKDI1NSksXG4gICAgICBzZW50T2sgVElOWUlOVCBERUZBVUxUIDAsXG4gICAgICBzZW5kRXJyb3IgVkFSQ0hBUigyNTUpLFxuICAgICAgUFJJTUFSWSBLRVkgKGlkKSxcbiAgICAgIEtFWSBlbWFpbHN0b3JlX2VtYWlsIChlbWFpbCwgc2VudCksXG4gICAgICBLRVkgZW1haWxzdG9yZV90ZW1wIChlbWFpbFRlbXBsYXRlTmFtZSwgc2VudClcbiAgICApO2A7XG4gICAgY29uc29sZS5sb2cocXVlcnkpO1xuICAgIGxldCByZXMgPSBhd2FpdCBydW5TUUwocXVlcnkpO1xuICB9XG4gIHJldHVybiBteVNRTFRhYmxlRXhpc3RzKCdlbWFpbF9zdG9yZScpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZW1haWxzdG9yZVB1dChlbWFpbExvZzogYW55KTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IHtteXNxbH0gPSBhd2FpdCBzdG9yZUNvbm5lY3QoKTtcbiAgbGV0IGV4aXN0cyA9IGF3YWl0IGVtYWlsc3RvcmVFbnN1cmVUYWJsZSgpO1xuICBpZiAoIWV4aXN0cykgdGhyb3cgbmV3IEVycm9yKCdFbWFpbCBMb2cgZG9lcyBub3QgZXhpc3QnKTtcbiAgbGV0IGVtYWlsUmVjb3JkID0ge1xuICAgIHNlbnQ6IG5ldyBEYXRlKCksXG4gICAgZW1haWw6ICcnLFxuICAgIHN1YmplY3Q6ICcnLFxuICAgIGVtYWlsVGVtcGxhdGVOYW1lOiAnJyxcbiAgICBsYW5ndWFnZTogJycsXG4gICAgY291bnRyeTogJycsXG4gICAgc2VudE9rOiBmYWxzZSxcbiAgICBzZW5kRXJyb3I6ICcnLFxuICB9O1xuICB0cnkge1xuICAgIGxldCBkYXRhID0gey4uLmVtYWlsUmVjb3JkLCAuLi5fLnBpY2soZW1haWxMb2csIE9iamVjdC5rZXlzKGVtYWlsUmVjb3JkKSl9O1xuICAgIGxldCBxdWVyeSA9ICdJTlNFUlQgSU5UTyBlbWFpbF9zdG9yZSBTRVQgPyc7XG4gICAgbGV0IHJlcyA9IG15c3FsLnF1ZXJ5KHF1ZXJ5LCBkYXRhKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdlbWFpbHN0b3JlUHV0IC0+IGVycm9yICcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbi8qKlxuICogRmluZHMgYSB1c2VyIHJlY29yZCBieSBpZCwgdXNlcm5hbWUgb3IgZW1haWwgYWRkcmVzc1xuICogQHBhcmFtIGlkIC0gbnVtZXJpYyBpZCwgdXNlcm5hbWUgb3IgZW1haWwgdG8gZmluZFxuICogQHBhcmFtIHByb2plY3Rpb24gLSBsaXN0IG9mIGZpZWxkcyB0byByZXR1cm4gaW4gdGhlIGZpbmFsIHJlY29yZCBvYmplY3RcbiAqIEByZXR1cm5zIE9iamVjdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmluZFVzZXIoaWQ6IHN0cmluZyB8IG51bWJlciwgcHJvamVjdGlvbjogc3RyaW5nW10gPSBbXSk6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICBjb25zdCBteXNxbCA9IGF3YWl0IGdldE15U1FMQ2xpZW50KCk7XG4gIGlmICghbXlzcWwpIHRocm93IG5ldyBFcnJvcignZmluZFVzZXI6IC0+IENhbm5vdCBnZXQgbXlzcWwgY29ubmVjdGlvbicpO1xuICB0cnkge1xuICAgIGxldCBxdWVyeSA9ICdTRUxFQ1QgKiBGUk9NIGB1c2Vycy1wZXJtaXNzaW9uc191c2VyYCBXSEVSRSBpZCA9ID8gT1IgIHVzZXJuYW1lID0gPyBPUiBlbWFpbCA9ID8gTElNSVQgMTsnO1xuICAgIGxldCBkYXRhOiBhbnkgPSBbaWQsIGlkLCBpZF07XG4gICAgbGV0IHJlczogYW55ID0gYXdhaXQgbXlzcWwuZXhlY3V0ZShxdWVyeSwgZGF0YSk7XG4gICAgbGV0IHJlY29yZDogYW55ID0gcmVzWzBdWzBdO1xuICAgIGlmIChwcm9qZWN0aW9uLmxlbmd0aCA+IDApIHJlY29yZCA9IF8ucGljayhyZWNvcmQsIHByb2plY3Rpb24pO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignZmluZFVzZXI6IC0+IEVycm9yIHJ1bm5pbmcgcXVlcnkgJywgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4vKipcbiAqIEZpbmRzIGEgdXNlciByZWNvcmQgYnkgaWQgb25seVxuICogQHBhcmFtIGlkIC0gbnVtZXJpYyBpZCB0byBmaW5kXG4gKiBAcGFyYW0gcHJvamVjdGlvbiAtIGxpc3Qgb2YgZmllbGRzIHRvIHJldHVybiBpbiB0aGUgZmluYWwgcmVjb3JkIG9iamVjdFxuICogQHJldHVybnMgT2JqZWN0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5kVXNlckJ5SWQoaWQ6IG51bWJlciwgcHJvamVjdGlvbjogc3RyaW5nW10gPSBbXSk6IFByb21pc2U8YW55IHwgbnVsbD4ge1xuICBjb25zdCBteXNxbCA9IGF3YWl0IGdldE15U1FMQ2xpZW50KCk7XG4gIGlmICghbXlzcWwpIHRocm93IG5ldyBFcnJvcignZmluZFVzZXI6IC0+IENhbm5vdCBnZXQgbXlzcWwgY29ubmVjdGlvbicpO1xuICB0cnkge1xuICAgIGxldCBxdWVyeSA9ICdTRUxFQ1QgKiBGUk9NIGB1c2Vycy1wZXJtaXNzaW9uc191c2VyYCBXSEVSRSBpZCA9ID87JztcbiAgICBsZXQgZGF0YTogYW55ID0gW2lkXTtcbiAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBteXNxbC5leGVjdXRlKHF1ZXJ5LCBkYXRhKTtcbiAgICBsZXQgcmVjb3JkOiBhbnkgPSByZXNbMF1bMF07XG4gICAgaWYgKHByb2plY3Rpb24ubGVuZ3RoID4gMCkgcmVjb3JkID0gXy5waWNrKHJlY29yZCwgcHJvamVjdGlvbik7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdmaW5kVXNlcjogLT4gRXJyb3IgcnVubmluZyBxdWVyeSAnLCBlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBQZXJmb3JtcyBhIHF1ZXJ5IG9uIHRoZSBjdXJyZW50IE15U1FMIGNvbm5lY3Rpb24sICBUaGUgcXVlcnkgaXMgcGFyc2VkIGFuZCBhbnkgb2NjdXJyZW5jZSBvZiAhIXN0b3JlISEgaXMgcmVwbGFjZWQgd2l0aCB0aGUgc3RvcmUgdGFibGUgYW5kICEhc2NoZW1hISEgaXMgcmVwbGFjZWQgd2l0aCB0aGUgc2NoZW1hIG5hbWUuXG4gKiBAcGFyYW0gcXVlcnkgLSBBIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFNRTCB0byBleGVjdXRlXG4gKiBAcGFyYW0gcXVlcnlOYW1lIC0gQW4gb3B0aW9uYWwgc3RyaW5nIHRvIHNob3cgaW4gdGhlIHRpbWluZyBvdXRwdXQgaW4gY2xvdWR3YXRjaFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcnVuU1FMKHF1ZXJ5OiBzdHJpbmcsIG5hbWU6IHN0cmluZyA9ICcnLCBzaWxlbnQ6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IG15c3FsID0gYXdhaXQgZ2V0TXlTUUxDbGllbnQoKTtcbiAgaWYgKCFteXNxbCkgdGhyb3cgbmV3IEVycm9yKCdydW5TUUw6IC0+IENhbm5vdCBnZXQgbXlzcWwgY29ubmVjdGlvbicpO1xuICB0cnkge1xuICAgIHF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgvISFzdG9yZSEhL2csIGF3YWl0IHN0b3JlVGFibGVOYW1lKCkpO1xuICAgIHF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgvISFzY2hlbWEhIS9nLCBhd2FpdCBzdG9yZVRhYmxlTmFtZSh0cnVlKSk7XG4gICAgLy8gY29uc29sZS50aW1lKGBSdW5TUUwgUXVlcnkgJHtuYW1lfWApO1xuICAgIGxldCByZXM6IGFueSA9IGF3YWl0IG15c3FsLmV4ZWN1dGUocXVlcnkpO1xuICAgIC8vIGNvbnNvbGUudGltZUVuZChgUnVuU1FMIFF1ZXJ5ICR7bmFtZX1gKTtcbiAgICBsZXQgcmVjb3JkOiBhbnkgPSByZXNbMF07XG4gICAgcmVjb3JkID0gQXJyYXkuaXNBcnJheShyZWNvcmQpICYmIHJlY29yZC5sZW5ndGggPCAxID8gbnVsbCA6IHJlY29yZDtcbiAgICByZWNvcmQgPSBBcnJheS5pc0FycmF5KHJlY29yZCkgJiYgcmVjb3JkLmxlbmd0aCA9PT0gMSA/IHJlY29yZFswXSA6IHJlY29yZDtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmICghc2lsZW50KSBjb25zb2xlLmVycm9yKCdydW5TUUw6IC0+IEVycm9yIHJ1bm5pbmcgcXVlcnkgJywgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8vIOKfqiBUT0RPOiAxOCBBdWcg4p+rIOKmlyBGaW5pc2ggdGhlIHVwZGF0ZSBwYXJ0IOKmmFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVVzZXJCeUlkKGlkOiBudW1iZXIsIG5ld0RhdGE6IG9iamVjdCA9IHt9KTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IG15c3FsID0gYXdhaXQgZ2V0TXlTUUxDbGllbnQoKTtcbiAgaWYgKCFteXNxbCkgdGhyb3cgbmV3IEVycm9yKCd1cGRhdGVVc2VyQnlJZDogLT4gQ2Fubm90IGdldCBteXNxbCBjb25uZWN0aW9uJyk7XG4gIHRyeSB7XG4gICAgbGV0IHVzZXIgPSBhd2FpdCBmaW5kVXNlckJ5SWQoaWQpO1xuICAgIGlmICghdXNlcikgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZmluZCB1c2VySWQgJyArIGlkKTtcbiAgICBpZiAoXy5pc0VtcHR5KG5ld0RhdGEpKSB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZVVzZXJCeUlkIC0+IE5vIGRhdGEgc3VwcGxpZWQgdG8gdXBkYXRlJyk7XG5cbiAgICBsZXQgcXVlcnkgPSAnVVBEQVRFIGB1c2Vycy1wZXJtaXNzaW9uc191c2VyYCBTRVQgPyBXSEVSRSBpZCA9ID8gOyc7XG4gICAgbGV0IGRhdGE6IGFueSA9IFtuZXdEYXRhLCBpZF07XG4gICAgbGV0IHJlczogbXlzcWwuUm93RGF0YVBhY2tldFtdW10gPSA8bXlzcWwuUm93RGF0YVBhY2tldFtdW10+YXdhaXQgbXlzcWwucXVlcnkocXVlcnksIGRhdGEpO1xuICAgIGxldCByZWNvcmQ6IGFueSA9IHJlc1swXVswXTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdmaW5kVXNlcjogLT4gRXJyb3IgcnVubmluZyBxdWVyeSAnLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbnR5cGUgRm9sbG93ZXIgPSB7XG4gIGZvbGxvd2luZ1VzZXI6IG51bWJlcjtcbiAgdXNlcm5hbWU6IHN0cmluZztcbiAgZW1haWw6IHN0cmluZztcbiAgZmlyc3RuYW1lOiBzdHJpbmc7XG4gIGxhc3RuYW1lOiBzdHJpbmc7XG4gIGNvbm5lY3Rpb25pZDogc3RyaW5nO1xufTtcbi8qKlxuICogUmV0dXJucyBhbGwgdGhlIHVzZXIgcmVjb3JkcyB3aG8gZm9sbG93IHRoZSB1c2VyaWRcbiAqIEBwYXJhbSB1c2VySWRcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VyRm9sbG93ZXJzKHVzZXJJZDogbnVtYmVyKTogUHJvbWlzZTxGb2xsb3dlcltdPiB7XG4gIGNvbnN0IHF1ZXJ5ID0gYFNFTEVDVCBmZi5mb2xsb3dpbmdVc2VyLCB1dS51c2VybmFtZSwgdXUuZW1haWwsIHV1LmZpcnN0TmFtZSwgdXUubGFzdG5hbWUsIHNjLmNvbm5lY3Rpb25JZFxuICBGUk9NIGZvbGxvd2VycyBmZiBMRUZUIEpPSU4gc3RvcmVfY29ubmVjdGlvbnMgc2Mgb24gZmYuZm9sbG93aW5nVXNlciA9IHNjLnVzZXJpZCBcbiAgSk9JTiBcXGB1c2Vycy1wZXJtaXNzaW9uc191c2VyXFxgIHV1IE9OIGZmLmZvbGxvd2luZ1VzZXIgPSB1dS5pZFxuICBXSEVSRSBmZi51c2VyID0gJHt1c2VySWR9OyBgO1xuICBsZXQgZm9sbG93ZXJzID0gYXdhaXQgcnVuU1FMKHF1ZXJ5LCAnR2V0IEZvbGxvd2VycycpO1xuICByZXR1cm4gZm9sbG93ZXJzO1xufVxuXG4vKipcbiAqIFJldHVybnMgYWxsIHRoZSB1c2VyIHJlY29yZHMgd2hvIGFyZSBmb2xsb3dlZCBieSB0aGUgdXNlcmlkXG4gKiBAcGFyYW0gdXNlcklkXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXNlckZvbGxvd2luZyh1c2VySWQ6IG51bWJlcik6IFByb21pc2U8Rm9sbG93ZXJbXT4ge1xuICBjb25zdCBxdWVyeSA9IGBTRUxFQ1QgZmYudXNlciwgdXUudXNlcm5hbWUsIHV1LmVtYWlsLCB1dS5maXJzdE5hbWUsIHV1Lmxhc3RuYW1lLCBzYy5jb25uZWN0aW9uSWRcbiAgRlJPTSBmb2xsb3dlcnMgZmYgTEVGVCBKT0lOIHN0b3JlX2Nvbm5lY3Rpb25zIHNjIG9uIGZmLnVzZXIgPSBzYy51c2VyaWQgXG4gIEpPSU4gXFxgdXNlcnMtcGVybWlzc2lvbnNfdXNlclxcYCB1dSBPTiBmZi51c2VyID0gdXUuaWRcbiAgV0hFUkUgZmYuZm9sbG93aW5nVXNlciA9ICR7dXNlcklkfTtgO1xuICBsZXQgZm9sbG93aW5nID0gYXdhaXQgcnVuU1FMKHF1ZXJ5LCAnR2V0IEZvbGxvd2luZycpO1xuICByZXR1cm4gZm9sbG93aW5nO1xufVxuXG4vKipcbiAqIFJldHVybnMgYWxsIHRoZSB1c2VyIHJlY29yZHMgd2hvIGFyZSB0YWdnZWQgb24gdGhlIGdpdmVuIHBvc3RcbiAqIEBwYXJhbSB1c2VySWRcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwb3N0VGFnZ2VkKHBvc3RJZDogbnVtYmVyKTogUHJvbWlzZTxGb2xsb3dlcltdPiB7XG4gIGNvbnN0IHF1ZXJ5ID0gYFNFTEVDVCBwdHUudXNlcl9pZCwgdXUudXNlcm5hbWUsIHV1LmVtYWlsLCB1dS5maXJzdE5hbWUsIHV1Lmxhc3RuYW1lLCBzYy5jb25uZWN0aW9uSWRcbiAgRlJPTSBcXGBwb3N0c19fdGFnZ2VkX3VzZXJzXFxgIHB0dSBMRUZUIEpPSU4gc3RvcmVfY29ubmVjdGlvbnMgc2Mgb24gcHR1LnVzZXJfaWQgPSBzYy51c2VyaWQgXG4gIEpPSU4gXFxgdXNlcnMtcGVybWlzc2lvbnNfdXNlclxcYCB1dSBPTiBwdHUudXNlcl9pZCA9IHV1LmlkXG4gIFdIRVJFIHB0dS5wb3N0X2lkID0gMTAke3Bvc3RJZH07YDtcbiAgbGV0IHRhZ2dlZCA9IGF3YWl0IHJ1blNRTChxdWVyeSwgJ0dldCBUYWdnZWQnKTtcbiAgcmV0dXJuIHRhZ2dlZDtcbn1cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4iXX0=