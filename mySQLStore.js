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
    const mysql = await (0, helpers_1.getMySQLClient)();
    const [db, tab] = table.replace(/`/g, '').split('.');
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
    let exists = mySQLTableExists('wunder.email_store');
    if (!exists) {
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
        let query = 'INSERT INTO wunder.email_store SET ?';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibXlTUUxTdG9yZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm15U1FMU3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZQSwyQ0FBa0Q7QUFDbEQsdUNBQXlDO0FBQ3pDLDBDQUE0QjtBQWU1QixJQUFZLGVBTVg7QUFORCxXQUFZLGVBQWU7SUFDekIsc0NBQW1CLENBQUE7SUFDbkIsb0NBQWlCLENBQUE7SUFDakIsZ0RBQTZCLENBQUE7SUFDN0Isc0NBQW1CLENBQUE7SUFDbkIsMENBQXVCLENBQUE7QUFDekIsQ0FBQyxFQU5XLGVBQWUsR0FBZix1QkFBZSxLQUFmLHVCQUFlLFFBTTFCO0FBK0NNLEtBQUssVUFBVSxnQkFBZ0IsQ0FBQyxLQUFhO0lBQ2xELE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBQSx3QkFBYyxHQUFFLENBQUM7SUFDckMsTUFBTSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckQsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLGdFQUFnRSxDQUFDLENBQUM7SUFDbkcsSUFBSSxDQUFDLEtBQUs7UUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLCtDQUErQyxDQUFDLENBQUM7SUFDN0UsTUFBTSxLQUFLLEdBQUcsb0dBQW9HLENBQUM7SUFDbkgsSUFBSTtRQUNGLElBQUksR0FBRyxHQUFRLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyRCxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hCLE9BQU8sR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7S0FD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LENBQUMsTUFBYztJQUNoRCxNQUFNLEtBQUssR0FBRzs7OzZCQUdhLE1BQU0sR0FBRyxDQUFDO0lBQ3JDLElBQUksU0FBUyxHQUFHLE1BQU0sTUFBTSxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztJQUNyRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBUEQsc0NBT0M7QUFPTSxLQUFLLFVBQVUsVUFBVSxDQUFDLE1BQWM7SUFDN0MsTUFBTSxLQUFLLEdBQUc7OzswQkFHVSxNQUFNLEdBQUcsQ0FBQztJQUNsQyxJQUFJLE1BQU0sR0FBRyxNQUFNLE1BQU0sQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDL0MsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQVBELGdDQU9DIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLyoqXG4gKiBAZmlsZSBteVNRTFN0b3JlLnRzXG4gKiBAdmVyc2lvbiAxXG4gKiBAZGF0ZSAyNCBBdWcgMjAyMVxuICogQGF1dGhvciBDaHJpcyBDdWxsZW5cbiAqIEBjb3B5cmlnaHQgU2t5bGFyayBDcmVhdGl2ZSBMdGQsIDIwMjFcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiBVdGlsaXR5IGZ1bmN0aW9ucyB0byBtYW5hZ2UgZGF0YSBpbiB0aGUgcmVzdEFQSSBzdG9yZSB2aWEgTXlTUUxcbiAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cbmltcG9ydCAqIGFzIG15c3FsIGZyb20gJ215c3FsMi9wcm9taXNlJztcbmltcG9ydCB7Z2V0Q29uZmlnLCBDb25maWdEYXRhfSBmcm9tICcuL2dldENvbmZpZyc7XG5pbXBvcnQge2dldE15U1FMQ2xpZW50fSBmcm9tICcuL2hlbHBlcnMnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHtvYmplY3RMaWtlfSBmcm9tICdAYXdzLWNkay9hc3NlcnQnO1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIOKVlOKVkOKVl+KUjOKUrOKUkOKUjOKUgOKUkOKUrOKUgOKUkOKUjOKUgOKUkCAg4pWU4pWm4pWX4pSsIOKUrOKUjOKUgOKUkOKUjOKUgOKUkOKUjOKUgOKUkFxuLy8g4pWa4pWQ4pWXIOKUgiDilIIg4pSC4pSc4pSs4pSY4pSc4pSkICAgIOKVkSDilJTilKzilJjilJzilIDilJjilJzilKQg4pSU4pSA4pSQXG4vLyDilZrilZDilZ0g4pS0IOKUlOKUgOKUmOKUtOKUlOKUgOKUlOKUgOKUmCAgIOKVqSAg4pS0IOKUtCAg4pSU4pSA4pSY4pSU4pSA4pSYXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgdHlwZSBTdG9yZVN0YXR1cyA9IHtcbiAgbXlzcWw6IG15c3FsLkNvbm5lY3Rpb247XG4gIGNvbmZpZzogQ29uZmlnRGF0YTtcbiAgc3RvcmU6IGJvb2xlYW47XG4gIHN0b3JlVGFibGU6IHN0cmluZztcbn07XG5cbmV4cG9ydCBlbnVtIFVzZXJQcm9maWxlVHlwZSB7XG4gIHVuZGVyMTYgPSAndW5kZXIxNicsXG4gIG92ZXIxNiA9ICdvdmVyMTYnLFxuICBwcm9mZXNzaW9uYWwgPSAncHJvZmVzc2lvbmFsJyxcbiAgY2hhcml0eSA9ICdjaGFyaXR5JyxcbiAgY2VsZWJyaXR5ID0gJ2NlbGVicml0eScsXG59XG5leHBvcnQgdHlwZSBVc2VyUmVjb3JkID0ge1xuICBpZDogbnVtYmVyO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBlbWFpbDogc3RyaW5nO1xuICBwcm92aWRlcjogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICByZXNldFBhc3N3b3JkVG9rZW46IHN0cmluZztcbiAgY29uZmlybWF0aW9uVG9rZW46IHN0cmluZztcbiAgY29uZmlybWVkOiBib29sZWFuO1xuICBibG9ja2VkOiBib29sZWFuO1xuICByb2xlOiBudW1iZXI7XG4gIGNyZWF0ZWRfYnk/OiBEYXRlO1xuICB1cGRhdGVkX2J5PzogbnVtYmVyO1xuICBjcmVhdGVkX2F0PzogRGF0ZTtcbiAgdXBkYXRlZF9hdD86IERhdGU7XG4gIHRlc3R1c2VyPzogYm9vbGVhbjtcbiAgZmlyc3ROYW1lPzogc3RyaW5nO1xuICBsYXN0TmFtZT86IHN0cmluZztcbiAgZG9iPzogRGF0ZTtcbiAgc3RyYXBsaW5lPzogc3RyaW5nO1xuICBqb2luZWRPbj86IERhdGU7XG4gIGZvbGxvdz86IHN0cmluZztcbiAgcHJvZmVzc2lvbmFsX3Byb2ZpbGU/OiBzdHJpbmc7XG4gIHZhbGlkYXRlZD86IGJvb2xlYW47XG4gIHByb2ZpbGVUeXBlPzogVXNlclByb2ZpbGVUeXBlO1xufTtcblxuZXhwb3J0IHR5cGUgVXNlckNvbm5lY3Rpb25SZWNvcmQgPSB7XG4gIGlkPzogbnVtYmVyO1xuICB1c2VyaWQ/OiBudW1iZXI7XG4gIGNvbm5lY3Rpb25pZDogc3RyaW5nO1xuICBhdXRoZW50aWNhdGVkOiBib29sZWFuO1xufTtcblxuZXhwb3J0IHR5cGUgUG9zdGNvZGVSZWNvcmQgPSB7XG4gIGlkOiBudW1iZXI7XG4gIHBvc3Rjb2RlOiBzdHJpbmc7XG4gIHN0cmVldDogc3RyaW5nO1xuICBkaXN0cmljdDogc3RyaW5nO1xuICBjb3VudHJ5OiBzdHJpbmc7XG4gIGxhdGl0dWRlOiBzdHJpbmc7XG4gIGxvbmdpdHVkZTogc3RyaW5nO1xuICB3YXJkOiBzdHJpbmc7XG4gIGxvY2F0aW9uOiBhbnk7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbXlTUUxUYWJsZUV4aXN0cyh0YWJsZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnN0IG15c3FsID0gYXdhaXQgZ2V0TXlTUUxDbGllbnQoKTtcbiAgY29uc3QgW2RiLCB0YWJdID0gdGFibGUucmVwbGFjZSgvYC9nLCAnJykuc3BsaXQoJy4nKTtcbiAgaWYgKCFkYiB8fCAhdGFiKSB0aHJvdyBuZXcgRXJyb3IoJ215U1FMVGFibGVFeGlzdHMgLS0+IEVycm9yIG11c3Qgc3VwcGx5IHRhYmxlIGFzIGRhdGFiYXNlLnRhYmxlJyk7XG4gIGlmICghbXlzcWwpIHRocm93IG5ldyBFcnJvcignc3RvcmVIYXNTdG9yZTogLT4gQ2Fubm90IGdldCBteXNxbCBjb25uZWN0aW9uJyk7XG4gIGNvbnN0IHF1ZXJ5ID0gJ1NFTEVDVCBDT1VOVCgqKSBBUyBjb3VudCBGUk9NIGluZm9ybWF0aW9uX3NjaGVtYS50YWJsZXMgV0hFUkUgdGFibGVfc2NoZW1hID0gPyBBTkQgdGFibGVfbmFtZSA9ID87JztcbiAgdHJ5IHtcbiAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBteXNxbC5leGVjdXRlKHF1ZXJ5LCBbZGIsIHRhYl0pO1xuICAgIHJlcyA9IHJlc1swXVswXTtcbiAgICByZXR1cm4gcmVzLmNvdW50ID4gMDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbi8qKlxuICogR2V0cyB0aGUgbmFtZSBvZiB0aGUgc3RvcmUgdGFibGUgZnJvbSB0aGUgY29uZmlnIGRhdGEuXG4gKiBAcmV0dXJucyBUaGUgc3RvcmUgbmFtZSBhcyBkYXRhYmFzZS50YWJsZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVUYWJsZU5hbWUoanVzdFNjaGVtYTogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBnZXRDb25maWcoKTtcbiAgICBpZiAoIWNvbmZpZyB8fCAhY29uZmlnLm15c3FsU3RvcmUpIHRocm93IG5ldyBFcnJvcignc3RvcmVDb25uZWN0OiAtPiBNaXNzaW5nIG15c3FsU3RvcmUgaW4gY29uZmlnJyk7XG4gICAgY29uc3Qgc3RvcmVUYWJsZSA9IGp1c3RTY2hlbWFcbiAgICAgID8gYFxcYCR7Y29uZmlnLm15c3FsU3RvcmUhLmRhdGFiYXNlfVxcYGBcbiAgICAgIDogYFxcYCR7Y29uZmlnLm15c3FsU3RvcmUhLmRhdGFiYXNlfVxcYC5cXGAke2NvbmZpZy5teXNxbFN0b3JlIS50YWJsZX1cXGBgO1xuICAgIHJldHVybiBzdG9yZVRhYmxlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ3N0b3JlVGFibGVOYW1lIC0+IEVycm9yICcsIGVycm9yKTtcbiAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIGFuZCByZXR1cm5zIGEgbXlzcWwgY2xpZW50LCB0aGUgbmFtZSBvZiB0aGUgc3RvcmUgYW5kIHdoZXRoZXIgdGhlIHN0b3JlIGV4aXN0cyBhbmQgdGhlIGNvbmZpZ1xuICogQHJldHVybnMgLSAge215c3FsLCBjb25maWcsIHN0b3JlLCBzdG9yZVRhYmxlfVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVDb25uZWN0KCk6IFByb21pc2U8U3RvcmVTdGF0dXM+IHtcbiAgY29uc3QgbXlzcWwgPSBhd2FpdCBnZXRNeVNRTENsaWVudCgpO1xuICBpZiAoIW15c3FsKSB0aHJvdyBuZXcgRXJyb3IoJ3N0b3JlQ29ubmVjdDogLT4gQ2Fubm90IGdldCBteXNxbCBjb25uZWN0aW9uJyk7XG4gIGNvbnN0IHN0b3JlVGFibGUgPSBhd2FpdCBzdG9yZVRhYmxlTmFtZSgpO1xuICBpZiAoIXN0b3JlVGFibGUpIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGZldGNoIHN0b3JlIHRhYmxlIG5hbWUnKTtcbiAgY29uc3Qgc3RvcmUgPSBhd2FpdCBteVNRTFRhYmxlRXhpc3RzKHN0b3JlVGFibGUpO1xuICBjb25zdCBjb25maWcgPSBhd2FpdCBnZXRDb25maWcoKTtcbiAgaWYgKCFjb25maWcpIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGZldGNoIGNvbmZpZyBkYXRhJyk7XG4gIHJldHVybiB7bXlzcWwsIGNvbmZpZywgc3RvcmUsIHN0b3JlVGFibGV9O1xufVxuXG4vKipcbiAqIFJldHVybnMgdHJ1ZSBvciBmYWxzZSBkZXBlbmRpbmcgdXBvbiBpZiB0aGUgc3RvcmUgdGFibGUgaXMgcHJlc2VudC5cbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZUhhc1N0b3JlKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICB0cnkge1xuICAgIGNvbnN0IHtzdG9yZX0gPSBhd2FpdCBzdG9yZUNvbm5lY3QoKTtcbiAgICByZXR1cm4gc3RvcmU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignc3RvcmVIYXNTdG9yZSAtPiBlcnJvciAnLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyB0aGUgc3RvcmUgdGFibGVcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZU1ha2VTdG9yZSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCB7bXlzcWwsIGNvbmZpZywgc3RvcmUsIHN0b3JlVGFibGV9ID0gYXdhaXQgc3RvcmVDb25uZWN0KCk7XG4gICAgaWYgKHN0b3JlKSByZXR1cm4gdHJ1ZTtcbiAgICAvLyBDcmVhdGUgdGhlIHN0b3JlIHRhYmxlIGFuZCBpdCdzIGluZGV4ZXNcbiAgICBjb25zdCBxdWVyeSA9IGBDUkVBVEUgVEFCTEUgJHtzdG9yZVRhYmxlfSAoXG4gICAgICBcXGBpZFxcYCBpbnQgdW5zaWduZWQgTk9UIE5VTEwgQVVUT19JTkNSRU1FTlQsXG4gICAgICBcXGBjb25uZWN0aW9uaWRcXGAgdmFyY2hhcigyNTUpIE5PVCBOVUxMIERFRkFVTFQgJ3VuZGVmaW5lZCcsXG4gICAgICBcXGB1c2VyaWRcXGAgSU5UIERFRkFVTFQgTlVMTCxcbiAgICAgIFxcYGF1dGhlbnRpY2F0ZWRcXGAgVElOWUlOVCBERUZBVUxUIDAsXG4gICAgICBQUklNQVJZIEtFWSAoXFxgaWRcXGApLFxuICAgICAgVU5JUVVFIEtFWSBcXGBzb2NrZXRTdG9yZV9jb25uZWN0aW9uaWRcXGAgKFxcYGNvbm5lY3Rpb25JZFxcYCksXG4gICAgICBLRVkgXFxgc29ja2V0U3RvcmVfdXNlcmlkXFxgIChcXGB1c2VyaWRcXGApXG4gICAgKTtgO1xuICAgIGNvbnNvbGUubG9nKHF1ZXJ5KTtcbiAgICBsZXQgcmVzID0gYXdhaXQgbXlzcWwucXVlcnkocXVlcnkpO1xuICAgIGNvbnNvbGUubG9nKHJlc1swXSk7XG4gICAgcmV0dXJuIGF3YWl0IHN0b3JlSGFzU3RvcmUoKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdzdG9yZUhhc1N0b3JlIC0+IGVycm9yICcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cbi8qKlxuICogQ3JlYXRlcyBvciB1cGRhdGVzIGEgY29ubmVjdGlvbiByZWNvcmQgaW4gdGhlIHN0b3JlXG4gKiBAcGFyYW0gVUNSXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVQdXRDb25uZWN0aW9uKFVDUjogVXNlckNvbm5lY3Rpb25SZWNvcmQpOiBQcm9taXNlPFVzZXJDb25uZWN0aW9uUmVjb3JkIHwgbnVsbD4ge1xuICBjb25zdCB7bXlzcWwsIGNvbmZpZywgc3RvcmUsIHN0b3JlVGFibGV9ID0gYXdhaXQgc3RvcmVDb25uZWN0KCk7XG5cbiAgaWYgKCFzdG9yZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ3N0b3JlUHV0Q29ubmVjdGlvbiAtPiBTdG9yZSBkb2VzIG5vdCBleGlzdCEnKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICAvLyBpZiB3ZSBoYXZlIGFuIGlkLCB0aGVuIHdlIGFyZSBkb2luZyBhbiB1cGRhdGUgdG8gYW4gZXhpc3RpbmcgcmVjb3JkLCBvdGhlcndpc2Ugd2UgYXJlIGNyZWF0aW5nIGEgbmV3IHJlY29yZC5cbiAgLy8gaWYgd2UgY3JlYXRlIGEgbmV3IHJlY29yZCwgd2UgbmVlZCB0byBlbnN1cmUgdGhhdCBvbmUgZG9lcyBub3QgZXhpc3QgZm9yIHRoZSBjb25uZWN0aW9uIGlkIGFscmVhZHkgLSBpZiBpdCBkb2VzXG4gIC8vIHdlIG5lZWQgdG8gZGVsZXRlIGl0IGFuZCBjcmVhdGUgYSBuZXcgb25lIC0gb3IgYXBwZW5kIHRoZSBpZCBhbmQgZG8gYW4gdXBkYXRlIVxuICB0cnkge1xuICAgIGxldCBleGlzdGluZzogYW55ID0gYXdhaXQgc3RvcmVHZXRDb25uZWN0aW9uSWQoVUNSLmNvbm5lY3Rpb25pZCk7XG4gICAgaWYgKGV4aXN0aW5nKSBVQ1IuaWQgPSBleGlzdGluZy5pZDtcbiAgICBsZXQgZGlmZjogc3RyaW5nW10gPSBbXTtcbiAgICBpZiAoVUNSLmlkICYmIGV4aXN0aW5nICE9PSBudWxsKSB7XG4gICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgLy8g8J+TjCBTVEVQOiBGaW5kIGNoYW5nZXMgYmV0d2VlbiB0aGUgbmV3IGRhdGEgYW5kIHRoZSBleGlzdGluZyByZWNvcmRcbiAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIE9iamVjdC5rZXlzKFVDUikuZm9yRWFjaCgoa2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgaWYgKGtleSBpbiBVQ1IpIHtcbiAgICAgICAgICBpZiAoZXhpc3Rpbmdba2V5IGFzIGtleW9mIFVzZXJDb25uZWN0aW9uUmVjb3JkXSAhPT0gVUNSW2tleSBhcyBrZXlvZiBVc2VyQ29ubmVjdGlvblJlY29yZF0pIHtcbiAgICAgICAgICAgIGRpZmYucHVzaChrZXkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGRpZmYucHVzaChrZXkpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAvLyDwn5OMIFNURVA6IElmIHdlIGhhdmUgYW55IGNoYW5nZXMgdGhlbiB3cml0ZSB0aGVtLlxuICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGlmIChkaWZmLmxlbmd0aCkge1xuICAgICAgICAvLyBpZiAoVUNSLmluZm8pIFVDUi5pbmZvID0gSlNPTi5zdHJpbmdpZnkoVUNSLmluZm8pO1xuICAgICAgICBjb25zdCBxdWVyeSA9IGBVUERBVEUgJHtzdG9yZVRhYmxlfSBTRVQgPyBXSEVSRSBpZCA9ICR7VUNSLmlkfSA7YDtcbiAgICAgICAgbGV0IHJlczogYW55ID0gYXdhaXQgbXlzcWwucXVlcnkocXVlcnksIF8ucGljayhVQ1IsIGRpZmYpKTtcbiAgICAgICAgaWYgKHJlc1swXS5hZmZlY3RlZFJvd3MgPiAwKSB7XG4gICAgICAgICAgcmVzID0gYXdhaXQgc3RvcmVHZXRJZChVQ1IuaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gZXhpc3Rpbmc7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAvLyDwn5OMIFNURVA6IFdlIGFyZSBjcmVhdGluZyBhIG5ldyByZWNvcmRcbiAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAvLyBpZiAoVUNSLmluZm8pIFVDUi5pbmZvID0gSlNPTi5zdHJpbmdpZnkoVUNSLmluZm8pO1xuICAgICAgY29uc3QgcXVlcnkgPSBgSU5TRVJUIElOVE8gICR7c3RvcmVUYWJsZX0gU0VUID8gO2A7XG4gICAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBteXNxbC5xdWVyeShxdWVyeSwgVUNSKTtcbiAgICAgIGlmIChyZXNbMF0uYWZmZWN0ZWRSb3dzID4gMCAmJiByZXNbMF0uaW5zZXJ0SWQpIHtcbiAgICAgICAgcmVzID0gYXdhaXQgc3RvcmVHZXRJZChyZXNbMF0uaW5zZXJ0SWQpO1xuICAgICAgfVxuICAgICAgLy9cbiAgICAgIHJldHVybiByZXMgYXMgVXNlckNvbm5lY3Rpb25SZWNvcmQ7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ3N0b3JlUHV0Q29ubmVjdGlvbiAtPiBFcnJvciB3cml0aW5nIHJlY29yZCAnLCBlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmVtb3ZlcyB0aGUgY29ubmVjdGlvbiByZWNvcmQgbWF0Y2hpbmcgdGhlIFVDUlxuICogQHBhcmFtIFVDUlxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlUmVtb3ZlQ29ubmVjdGlvbihVQ1I6IFVzZXJDb25uZWN0aW9uUmVjb3JkKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIHRyeSB7XG4gICAgbGV0IGV4aXN0aW5nOiBhbnkgPSBhd2FpdCBzdG9yZUdldENvbm5lY3Rpb25JZChVQ1IuY29ubmVjdGlvbmlkKTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGxldCBxdWVyeSA9ICdERUxFVEUgRlJPTSAhIXN0b3JlISEgV0hFUkUgaWQgPSAke2V4aXN0aW5nLmlkfSAnO1xuICAgICAgbGV0IHJlcyA9IGF3YWl0IHJ1blNRTChxdWVyeSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ3N0b3JlUmVtb3ZlQ29ubmVjdGlvbiAtPiBFcnJvciAnLCBlcnJvcik7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogUGVyZm9ybXMgc3RhbmRhcmRpc2F0aW9uIHByb2Nlc3NlcyBvbiB0aGUgcmV0dXJuZWQgY29ubmVjdGlvbiByZWNvcmRcbiAqIEBwYXJhbSBVQ1JcbiAqIEByZXR1cm5zXG4gKi9cbmZ1bmN0aW9uIGZvcm1hdFVzZXJDb25uZWN0aW9uUmVjb3JkKFVDUjogVXNlckNvbm5lY3Rpb25SZWNvcmQpOiBVc2VyQ29ubmVjdGlvblJlY29yZCB8IG51bGwge1xuICBpZiAoIVVDUiB8fCBfLmlzRW1wdHkoVUNSKSkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgbGV0IFVDUm5ldyA9IHsuLi5VQ1J9O1xuICAgIGlmICgnYXV0aGVudGljYXRlZCcgaW4gVUNSbmV3KSBVQ1JuZXcuYXV0aGVudGljYXRlZCA9IFVDUm5ldy5hdXRoZW50aWNhdGVkID8gdHJ1ZSA6IGZhbHNlO1xuICAgIC8vIGlmICgnaW5mbycgaW4gVUNSbmV3KSBVQ1JuZXcuaW5mbyA9IEpTT04ucGFyc2UoPHN0cmluZz5VQ1JuZXcuaW5mbyk7XG4gICAgcmV0dXJuIFVDUm5ldztcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdmb3JtYXRVc2VyQ29ubmVjdGlvblJlY29yZCAtPiBFcnJvciBmb3JtYXR0aW5nIG9iamVjdCAnLCBlcnJvcik7XG4gICAgcmV0dXJuIFVDUjtcbiAgfVxufVxuLyoqXG4gKiBTZWFyY2ggYW5kIHJldHVybiBjdXJyZW50IGNvbm5lY3Rpb24gcmVjb3JkIGJ5IGNvbm5lY3Rpb25JZCAtIG5vdGUgYSBjb25uZWN0aW9uSWQgY2FuIGhhdmUgb25seSAxIGNvbm5lY3Rpb25cbiAqIEBwYXJhbSBjb25uZWN0aW9uSWQgLSBUaGUgY29ubmVjdGlvbklkIHRvIGZpbmRcbiAqIEByZXR1cm5zIFVzZXJDb25uZWN0aW9uUmVjb3JkIG9yIG51bGxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0b3JlR2V0SWQoaWQ6IG51bWJlcik6IFByb21pc2U8VXNlckNvbm5lY3Rpb25SZWNvcmQgfCBudWxsPiB7XG4gIGNvbnN0IHtteXNxbCwgY29uZmlnLCBzdG9yZX0gPSBhd2FpdCBzdG9yZUNvbm5lY3QoKTtcbiAgaWYgKCFzdG9yZSkgcmV0dXJuIG51bGw7XG4gIHRyeSB7XG4gICAgY29uc3QgcXVlcnkgPSBgU0VMRUNUICogRlJPTSAgXFxgJHtjb25maWcubXlzcWxTdG9yZSEuZGF0YWJhc2V9XFxgLlxcYCR7Y29uZmlnLm15c3FsU3RvcmUhLnRhYmxlfVxcYCBcbiAgICBXSEVSRSBpZCA9ICR7aWR9IGA7XG4gICAgbGV0IHJlczogYW55ID0gYXdhaXQgbXlzcWwucXVlcnkocXVlcnkpO1xuICAgIHJlcyA9IHJlc1swXVswXTtcbiAgICByZXR1cm4gZm9ybWF0VXNlckNvbm5lY3Rpb25SZWNvcmQocmVzKSBhcyBVc2VyQ29ubmVjdGlvblJlY29yZDtcbiAgfSBjYXRjaCAoXykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoIGFuZCByZXR1cm4gY3VycmVudCBjb25uZWN0aW9uIHJlY29yZCBieSBjb25uZWN0aW9uSWQgLSBub3RlIGEgY29ubmVjdGlvbklkIGNhbiBoYXZlIG9ubHkgMSBjb25uZWN0aW9uXG4gKiBAcGFyYW0gY29ubmVjdGlvbklkIC0gVGhlIGNvbm5lY3Rpb25JZCB0byBmaW5kXG4gKiBAcmV0dXJucyBVc2VyQ29ubmVjdGlvblJlY29yZCBvciBudWxsXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZUdldENvbm5lY3Rpb25JZChjb25uZWN0aW9uaWQ6IHN0cmluZywgd2l0aFVzZXI6IGJvb2xlYW4gPSBmYWxzZSk6IFByb21pc2U8YW55PiB7XG4gIHRyeSB7XG4gICAgbGV0IHF1ZXJ5O1xuICAgIGxldCBxdWVyeU5hbWU7XG4gICAgaWYgKHdpdGhVc2VyKSB7XG4gICAgICBxdWVyeSA9IGBTRUxFQ1Qgc2MuY29ubmVjdGlvbmlkLCBzYy5hdXRoZW50aWNhdGVkLCBzYy51c2VyaWQsXG4gICAgICB1dS5lbWFpbCwgdXUudXNlcm5hbWUsIHV1LmZpcnN0TmFtZSwgdXUubGFzdE5hbWUsdXUucHJvZmlsZVR5cGVcbiAgICAgIEZST00gISFzdG9yZSEhIHNjIExFRlQgSk9JTiBcXGB1c2Vycy1wZXJtaXNzaW9uc191c2VyXFxgIHV1IFxuICAgICAgT04gc2MudXNlcklkID0gdXUuaWQgV0hFUkUgY29ubmVjdGlvbmlkID0gJyR7Y29ubmVjdGlvbmlkfSc7YDtcbiAgICAgIHF1ZXJ5TmFtZSA9ICdGdWxsIENvbm5lY3Rpb24nO1xuICAgIH0gZWxzZSB7XG4gICAgICBxdWVyeSA9IGBTRUxFQ1QgKiBGUk9NICAhIXN0b3JlISEgV0hFUkUgY29ubmVjdGlvbmlkID0gJyR7Y29ubmVjdGlvbmlkfScgO2A7XG4gICAgICBxdWVyeU5hbWUgPSAnQmFzaWMgQ29ubmVjdGlvbic7XG4gICAgfVxuICAgIGxldCByZXM6IGFueSA9IGF3YWl0IHJ1blNRTChxdWVyeSwgcXVlcnlOYW1lKTtcbiAgICByZXR1cm4gZm9ybWF0VXNlckNvbm5lY3Rpb25SZWNvcmQocmVzKTtcbiAgfSBjYXRjaCAoXykge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoIGFuZCByZXR1cm4gY3VycmVudCBjb25uZWN0aW9ucyBieSB1c2VySWQgLSBub3RlIGEgdXNlcklkIGNhbiBoYXZlIG1vcmUgdGhhbiAxIGNvbmN1cnJlbnQgY29ubmVjdGlvblxuICogQHBhcmFtIHVzZXJJZCAtIFRoZSB1c2VySWQgdG8gZmluZFxuICogQHJldHVybnMgQXJyYXkgb2YgemVybyBvciBtb3JlIFVzZXJDb25uZWN0aW9uUmVjb3Jkc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVHZXRVc2VySWQodXNlcklkOiBudW1iZXIpOiBQcm9taXNlPFVzZXJDb25uZWN0aW9uUmVjb3JkW10gfCBudWxsPiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcXVlcnkgPSBgU0VMRUNUICogRlJPTSAgISFzdG9yZSEhIFdIRVJFIHVzZXJpZCA9ICR7dXNlcklkfTsgYDtcbiAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBydW5TUUwocXVlcnksICdDb25uZWN0aW9uIGJ5IFVzZXJJZCcpO1xuICAgIHJlcyA9IEFycmF5LmlzQXJyYXkocmVzKSA/IHJlcy5tYXAoZm9ybWF0VXNlckNvbm5lY3Rpb25SZWNvcmQpIDogZm9ybWF0VXNlckNvbm5lY3Rpb25SZWNvcmQocmVzKTtcbiAgICByZXR1cm4gcmVzO1xuICB9IGNhdGNoIChfKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYWxsIGNvbm5lY3Rpb24gcmVjb3JkcyBhbG9uZyB3aXRoIHRoZWlyIGJhc2ljIHVzZXIgaW5mb3JtYXRpb24gb3B0aW9uYWxseSBhcyBhbiBhcnJheSBvciBhIGV2ZW50IG9iamVjdFxuICogQHBhcmFtIGFzRXZlbnQgLSByZXR1cm4gYW4gb2JqZWN0IHdoZXJlIGRhdGEgaXMgc3VwcGxpZWQgdXNpbmcgYW4gZXZlbnQgZW1pdHRlci4gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9teXNxbGpzL215c3FsI3N0cmVhbWluZy1xdWVyeS1yb3dzXG4gKiBAcmV0dXJuc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc3RvcmVHZXRBbGwoKTogUHJvbWlzZTxGb2xsb3dlcltdPiB7XG4gIGNvbnN0IHF1ZXJ5ID0gYFNFTEVDVCBzYy5jb25uZWN0aW9uaWQsIHNjLnVzZXJpZCwgdXUudXNlcm5hbWUsIHV1LmVtYWlsLCB1dS5maXJzdE5hbWUsIHV1Lmxhc3RuYW1lLCBzYy5jb25uZWN0aW9uSWRcbiAgRlJPTSAhIXN0b3JlISEgc2MgSk9JTiAgXFxgdXNlcnMtcGVybWlzc2lvbnNfdXNlclxcYCB1dSBPTiBzYy51c2VyaWQgPSB1dS5pZGA7XG4gIGxldCBjb25uZWN0aW9ucyA9IGF3YWl0IHJ1blNRTChxdWVyeSwgJ0dldCBBbGwgQ29ubmVjdGlvbnMnKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb25zO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhbGwgY29ubmVjdGlvbiByZWNvcmRzIGFsb25nIHdpdGggdGhlaXIgYmFzaWMgdXNlciBpbmZvcm1hdGlvbiBvcHRpb25hbGx5IGFzIGFuIGFycmF5IG9yIGEgZXZlbnQgb2JqZWN0XG4gKiBAcGFyYW0gYXNFdmVudCAtIHJldHVybiBhbiBvYmplY3Qgd2hlcmUgZGF0YSBpcyBzdXBwbGllZCB1c2luZyBhbiBldmVudCBlbWl0dGVyLiBzZWUgaHR0cHM6Ly9naXRodWIuY29tL215c3FsanMvbXlzcWwjc3RyZWFtaW5nLXF1ZXJ5LXJvd3NcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdG9yZUdldEFsbFdpdGhFdmVudHMoKTogUHJvbWlzZTxcbiAgW1xuICAgIG15c3FsLlJvd0RhdGFQYWNrZXRbXSB8IG15c3FsLlJvd0RhdGFQYWNrZXRbXVtdIHwgbXlzcWwuT2tQYWNrZXQgfCBteXNxbC5Pa1BhY2tldFtdIHwgbXlzcWwuUmVzdWx0U2V0SGVhZGVyLFxuICAgIG15c3FsLkZpZWxkUGFja2V0W10sXG4gIF1cbj4ge1xuICBjb25zdCB7bXlzcWwsIHN0b3JlVGFibGV9ID0gYXdhaXQgc3RvcmVDb25uZWN0KCk7XG4gIGNvbnN0IHF1ZXJ5ID0gYFNFTEVDVCBzYy5jb25uZWN0aW9uaWQsIHNjLnVzZXJpZCwgdXUudXNlcm5hbWUsIHV1LmVtYWlsLCB1dS5maXJzdE5hbWUsIHV1Lmxhc3RuYW1lLCBzYy5jb25uZWN0aW9uSWRcbiAgRlJPTSAke3N0b3JlVGFibGV9IHNjIEpPSU4gIFxcYHVzZXJzLXBlcm1pc3Npb25zX3VzZXJcXGAgdXUgT04gc2MudXNlcmlkID0gdXUuaWRgO1xuICBsZXQgY29ubmVjdGlvbnMgPSBteXNxbC5xdWVyeShxdWVyeSk7XG4gIHJldHVybiBjb25uZWN0aW9ucztcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIOKVlOKVkOKVl+KUjOKUrOKUkOKUjOKUgOKUkOKUrOKUrCAgICDilZTilZDilZfilIzilKzilJDilIzilIDilJDilKzilIDilJDilIzilIDilJBcbi8vIOKVkeKVoyDilILilILilILilJzilIDilKTilILilIIgICAg4pWa4pWQ4pWXIOKUgiDilIIg4pSC4pSc4pSs4pSY4pSc4pSkXG4vLyDilZrilZDilZ3ilLQg4pS04pS0IOKUtOKUtOKUtOKUgOKUmCAg4pWa4pWQ4pWdIOKUtCDilJTilIDilJjilLTilJTilIDilJTilIDilJhcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbWFpbHN0b3JlRW5zdXJlVGFibGUoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGxldCBleGlzdHMgPSBteVNRTFRhYmxlRXhpc3RzKCd3dW5kZXIuZW1haWxfc3RvcmUnKTtcbiAgaWYgKCFleGlzdHMpIHtcbiAgICAvLyBjcmVhdGUgdGhlIGVtYWlsIHN0b3JlXG4gICAgY29uc3QgcXVlcnkgPSBgQ1JFQVRFIFRBQkxFIHd1bmRlci5lbWFpbF9zdG9yZSAoXG4gICAgICBpZCBpbnQgdW5zaWduZWQgTk9UIE5VTEwgQVVUT19JTkNSRU1FTlQsXG4gICAgICBzZW50IERBVEVUSU1FLCBcbiAgICAgIGVtYWlsIHZhcmNoYXIoMjU1KSxcbiAgICAgIHN1YmplY3QgVkFSQ0hBUigyNTUpLFxuICAgICAgZW1haWxUZW1wbGF0ZU5hbWUgVkFSQ0hBUigyNTUpLFxuICAgICAgbGFuZ3VhZ2UgVkFSQ0hBUigyNTUpLFxuICAgICAgY291bnRyeSBWQVJDSEFSKDI1NSksXG4gICAgICBzZW50T2sgVElOWUlOVCBERUZBVUxUIDAsXG4gICAgICBzZW5kRXJyb3IgVkFSQ0hBUigyNTUpLFxuICAgICAgUFJJTUFSWSBLRVkgKGlkKSxcbiAgICAgIEtFWSBlbWFpbHN0b3JlX2VtYWlsIChlbWFpbCwgc2VudCksXG4gICAgICBLRVkgZW1haWxzdG9yZV90ZW1wIChlbWFpbFRlbXBsYXRlTmFtZSwgc2VudClcbiAgICApO2A7XG4gICAgY29uc29sZS5sb2cocXVlcnkpO1xuICAgIGxldCByZXMgPSBhd2FpdCBydW5TUUwocXVlcnkpO1xuICB9XG4gIHJldHVybiBteVNRTFRhYmxlRXhpc3RzKCd3dW5kZXIuZW1haWxfc3RvcmUnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGVtYWlsc3RvcmVQdXQoZW1haWxMb2c6IGFueSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCB7bXlzcWx9ID0gYXdhaXQgc3RvcmVDb25uZWN0KCk7XG4gIGxldCBleGlzdHMgPSBhd2FpdCBlbWFpbHN0b3JlRW5zdXJlVGFibGUoKTtcbiAgaWYgKCFleGlzdHMpIHRocm93IG5ldyBFcnJvcignRW1haWwgTG9nIGRvZXMgbm90IGV4aXN0Jyk7XG4gIGxldCBlbWFpbFJlY29yZCA9IHtcbiAgICBzZW50OiBuZXcgRGF0ZSgpLFxuICAgIGVtYWlsOiAnJyxcbiAgICBzdWJqZWN0OiAnJyxcbiAgICBlbWFpbFRlbXBsYXRlTmFtZTogJycsXG4gICAgbGFuZ3VhZ2U6ICcnLFxuICAgIGNvdW50cnk6ICcnLFxuICAgIHNlbnRPazogZmFsc2UsXG4gICAgc2VuZEVycm9yOiAnJyxcbiAgfTtcbiAgdHJ5IHtcbiAgICBsZXQgZGF0YSA9IHsuLi5lbWFpbFJlY29yZCwgLi4uXy5waWNrKGVtYWlsTG9nLCBPYmplY3Qua2V5cyhlbWFpbFJlY29yZCkpfTtcbiAgICBsZXQgcXVlcnkgPSAnSU5TRVJUIElOVE8gd3VuZGVyLmVtYWlsX3N0b3JlIFNFVCA/JztcbiAgICBsZXQgcmVzID0gbXlzcWwucXVlcnkocXVlcnksIGRhdGEpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2VtYWlsc3RvcmVQdXQgLT4gZXJyb3IgJywgZXJyb3IpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuLyoqXG4gKiBGaW5kcyBhIHVzZXIgcmVjb3JkIGJ5IGlkLCB1c2VybmFtZSBvciBlbWFpbCBhZGRyZXNzXG4gKiBAcGFyYW0gaWQgLSBudW1lcmljIGlkLCB1c2VybmFtZSBvciBlbWFpbCB0byBmaW5kXG4gKiBAcGFyYW0gcHJvamVjdGlvbiAtIGxpc3Qgb2YgZmllbGRzIHRvIHJldHVybiBpbiB0aGUgZmluYWwgcmVjb3JkIG9iamVjdFxuICogQHJldHVybnMgT2JqZWN0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmaW5kVXNlcihpZDogc3RyaW5nIHwgbnVtYmVyLCBwcm9qZWN0aW9uOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XG4gIGNvbnN0IG15c3FsID0gYXdhaXQgZ2V0TXlTUUxDbGllbnQoKTtcbiAgaWYgKCFteXNxbCkgdGhyb3cgbmV3IEVycm9yKCdmaW5kVXNlcjogLT4gQ2Fubm90IGdldCBteXNxbCBjb25uZWN0aW9uJyk7XG4gIHRyeSB7XG4gICAgbGV0IHF1ZXJ5ID0gJ1NFTEVDVCAqIEZST00gYHVzZXJzLXBlcm1pc3Npb25zX3VzZXJgIFdIRVJFIGlkID0gPyBPUiAgdXNlcm5hbWUgPSA/IE9SIGVtYWlsID0gPyBMSU1JVCAxOyc7XG4gICAgbGV0IGRhdGE6IGFueSA9IFtpZCwgaWQsIGlkXTtcbiAgICBsZXQgcmVzOiBhbnkgPSBhd2FpdCBteXNxbC5leGVjdXRlKHF1ZXJ5LCBkYXRhKTtcbiAgICBsZXQgcmVjb3JkOiBhbnkgPSByZXNbMF1bMF07XG4gICAgaWYgKHByb2plY3Rpb24ubGVuZ3RoID4gMCkgcmVjb3JkID0gXy5waWNrKHJlY29yZCwgcHJvamVjdGlvbik7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdmaW5kVXNlcjogLT4gRXJyb3IgcnVubmluZyBxdWVyeSAnLCBlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbi8qKlxuICogRmluZHMgYSB1c2VyIHJlY29yZCBieSBpZCBvbmx5XG4gKiBAcGFyYW0gaWQgLSBudW1lcmljIGlkIHRvIGZpbmRcbiAqIEBwYXJhbSBwcm9qZWN0aW9uIC0gbGlzdCBvZiBmaWVsZHMgdG8gcmV0dXJuIGluIHRoZSBmaW5hbCByZWNvcmQgb2JqZWN0XG4gKiBAcmV0dXJucyBPYmplY3RcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZpbmRVc2VyQnlJZChpZDogbnVtYmVyLCBwcm9qZWN0aW9uOiBzdHJpbmdbXSA9IFtdKTogUHJvbWlzZTxhbnkgfCBudWxsPiB7XG4gIGNvbnN0IG15c3FsID0gYXdhaXQgZ2V0TXlTUUxDbGllbnQoKTtcbiAgaWYgKCFteXNxbCkgdGhyb3cgbmV3IEVycm9yKCdmaW5kVXNlcjogLT4gQ2Fubm90IGdldCBteXNxbCBjb25uZWN0aW9uJyk7XG4gIHRyeSB7XG4gICAgbGV0IHF1ZXJ5ID0gJ1NFTEVDVCAqIEZST00gYHVzZXJzLXBlcm1pc3Npb25zX3VzZXJgIFdIRVJFIGlkID0gPzsnO1xuICAgIGxldCBkYXRhOiBhbnkgPSBbaWRdO1xuICAgIGxldCByZXM6IGFueSA9IGF3YWl0IG15c3FsLmV4ZWN1dGUocXVlcnksIGRhdGEpO1xuICAgIGxldCByZWNvcmQ6IGFueSA9IHJlc1swXVswXTtcbiAgICBpZiAocHJvamVjdGlvbi5sZW5ndGggPiAwKSByZWNvcmQgPSBfLnBpY2socmVjb3JkLCBwcm9qZWN0aW9uKTtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2ZpbmRVc2VyOiAtPiBFcnJvciBydW5uaW5nIHF1ZXJ5ICcsIGVycm9yKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG4vKipcbiAqIFBlcmZvcm1zIGEgcXVlcnkgb24gdGhlIGN1cnJlbnQgTXlTUUwgY29ubmVjdGlvbiwgIFRoZSBxdWVyeSBpcyBwYXJzZWQgYW5kIGFueSBvY2N1cnJlbmNlIG9mICEhc3RvcmUhISBpcyByZXBsYWNlZCB3aXRoIHRoZSBzdG9yZSB0YWJsZSBhbmQgISFzY2hlbWEhISBpcyByZXBsYWNlZCB3aXRoIHRoZSBzY2hlbWEgbmFtZS5cbiAqIEBwYXJhbSBxdWVyeSAtIEEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgU1FMIHRvIGV4ZWN1dGVcbiAqIEBwYXJhbSBxdWVyeU5hbWUgLSBBbiBvcHRpb25hbCBzdHJpbmcgdG8gc2hvdyBpbiB0aGUgdGltaW5nIG91dHB1dCBpbiBjbG91ZHdhdGNoXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBydW5TUUwocXVlcnk6IHN0cmluZywgbmFtZTogc3RyaW5nID0gJycsIHNpbGVudDogYm9vbGVhbiA9IGZhbHNlKTogUHJvbWlzZTxhbnk+IHtcbiAgY29uc3QgbXlzcWwgPSBhd2FpdCBnZXRNeVNRTENsaWVudCgpO1xuICBpZiAoIW15c3FsKSB0aHJvdyBuZXcgRXJyb3IoJ3J1blNRTDogLT4gQ2Fubm90IGdldCBteXNxbCBjb25uZWN0aW9uJyk7XG4gIHRyeSB7XG4gICAgcXVlcnkgPSBxdWVyeS5yZXBsYWNlKC8hIXN0b3JlISEvZywgYXdhaXQgc3RvcmVUYWJsZU5hbWUoKSk7XG4gICAgcXVlcnkgPSBxdWVyeS5yZXBsYWNlKC8hIXNjaGVtYSEhL2csIGF3YWl0IHN0b3JlVGFibGVOYW1lKHRydWUpKTtcbiAgICAvLyBjb25zb2xlLnRpbWUoYFJ1blNRTCBRdWVyeSAke25hbWV9YCk7XG4gICAgbGV0IHJlczogYW55ID0gYXdhaXQgbXlzcWwuZXhlY3V0ZShxdWVyeSk7XG4gICAgLy8gY29uc29sZS50aW1lRW5kKGBSdW5TUUwgUXVlcnkgJHtuYW1lfWApO1xuICAgIGxldCByZWNvcmQ6IGFueSA9IHJlc1swXTtcbiAgICByZWNvcmQgPSBBcnJheS5pc0FycmF5KHJlY29yZCkgJiYgcmVjb3JkLmxlbmd0aCA8IDEgPyBudWxsIDogcmVjb3JkO1xuICAgIHJlY29yZCA9IEFycmF5LmlzQXJyYXkocmVjb3JkKSAmJiByZWNvcmQubGVuZ3RoID09PSAxID8gcmVjb3JkWzBdIDogcmVjb3JkO1xuICAgIHJldHVybiByZWNvcmQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKCFzaWxlbnQpIGNvbnNvbGUuZXJyb3IoJ3J1blNRTDogLT4gRXJyb3IgcnVubmluZyBxdWVyeSAnLCBlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuLy8g4p+qIFRPRE86IDE4IEF1ZyDin6sg4qaXIEZpbmlzaCB0aGUgdXBkYXRlIHBhcnQg4qaYXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlVXNlckJ5SWQoaWQ6IG51bWJlciwgbmV3RGF0YTogb2JqZWN0ID0ge30pOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgY29uc3QgbXlzcWwgPSBhd2FpdCBnZXRNeVNRTENsaWVudCgpO1xuICBpZiAoIW15c3FsKSB0aHJvdyBuZXcgRXJyb3IoJ3VwZGF0ZVVzZXJCeUlkOiAtPiBDYW5ub3QgZ2V0IG15c3FsIGNvbm5lY3Rpb24nKTtcbiAgdHJ5IHtcbiAgICBsZXQgdXNlciA9IGF3YWl0IGZpbmRVc2VyQnlJZChpZCk7XG4gICAgaWYgKCF1c2VyKSB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBmaW5kIHVzZXJJZCAnICsgaWQpO1xuICAgIGlmIChfLmlzRW1wdHkobmV3RGF0YSkpIHRocm93IG5ldyBFcnJvcigndXBkYXRlVXNlckJ5SWQgLT4gTm8gZGF0YSBzdXBwbGllZCB0byB1cGRhdGUnKTtcblxuICAgIGxldCBxdWVyeSA9ICdVUERBVEUgYHVzZXJzLXBlcm1pc3Npb25zX3VzZXJgIFNFVCA/IFdIRVJFIGlkID0gPyA7JztcbiAgICBsZXQgZGF0YTogYW55ID0gW25ld0RhdGEsIGlkXTtcbiAgICBsZXQgcmVzOiBteXNxbC5Sb3dEYXRhUGFja2V0W11bXSA9IDxteXNxbC5Sb3dEYXRhUGFja2V0W11bXT5hd2FpdCBteXNxbC5xdWVyeShxdWVyeSwgZGF0YSk7XG4gICAgbGV0IHJlY29yZDogYW55ID0gcmVzWzBdWzBdO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ2ZpbmRVc2VyOiAtPiBFcnJvciBydW5uaW5nIHF1ZXJ5ICcsIGVycm9yKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxudHlwZSBGb2xsb3dlciA9IHtcbiAgZm9sbG93aW5nVXNlcjogbnVtYmVyO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBlbWFpbDogc3RyaW5nO1xuICBmaXJzdG5hbWU6IHN0cmluZztcbiAgbGFzdG5hbWU6IHN0cmluZztcbiAgY29ubmVjdGlvbmlkOiBzdHJpbmc7XG59O1xuLyoqXG4gKiBSZXR1cm5zIGFsbCB0aGUgdXNlciByZWNvcmRzIHdobyBmb2xsb3cgdGhlIHVzZXJpZFxuICogQHBhcmFtIHVzZXJJZFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVzZXJGb2xsb3dlcnModXNlcklkOiBudW1iZXIpOiBQcm9taXNlPEZvbGxvd2VyW10+IHtcbiAgY29uc3QgcXVlcnkgPSBgU0VMRUNUIGZmLmZvbGxvd2luZ1VzZXIsIHV1LnVzZXJuYW1lLCB1dS5lbWFpbCwgdXUuZmlyc3ROYW1lLCB1dS5sYXN0bmFtZSwgc2MuY29ubmVjdGlvbklkXG4gIEZST00gZm9sbG93ZXJzIGZmIExFRlQgSk9JTiBzdG9yZV9jb25uZWN0aW9ucyBzYyBvbiBmZi5mb2xsb3dpbmdVc2VyID0gc2MudXNlcmlkIFxuICBKT0lOIFxcYHVzZXJzLXBlcm1pc3Npb25zX3VzZXJcXGAgdXUgT04gZmYuZm9sbG93aW5nVXNlciA9IHV1LmlkXG4gIFdIRVJFIGZmLnVzZXIgPSAke3VzZXJJZH07IGA7XG4gIGxldCBmb2xsb3dlcnMgPSBhd2FpdCBydW5TUUwocXVlcnksICdHZXQgRm9sbG93ZXJzJyk7XG4gIHJldHVybiBmb2xsb3dlcnM7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbGwgdGhlIHVzZXIgcmVjb3JkcyB3aG8gYXJlIGZvbGxvd2VkIGJ5IHRoZSB1c2VyaWRcbiAqIEBwYXJhbSB1c2VySWRcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1c2VyRm9sbG93aW5nKHVzZXJJZDogbnVtYmVyKTogUHJvbWlzZTxGb2xsb3dlcltdPiB7XG4gIGNvbnN0IHF1ZXJ5ID0gYFNFTEVDVCBmZi51c2VyLCB1dS51c2VybmFtZSwgdXUuZW1haWwsIHV1LmZpcnN0TmFtZSwgdXUubGFzdG5hbWUsIHNjLmNvbm5lY3Rpb25JZFxuICBGUk9NIGZvbGxvd2VycyBmZiBMRUZUIEpPSU4gc3RvcmVfY29ubmVjdGlvbnMgc2Mgb24gZmYudXNlciA9IHNjLnVzZXJpZCBcbiAgSk9JTiBcXGB1c2Vycy1wZXJtaXNzaW9uc191c2VyXFxgIHV1IE9OIGZmLnVzZXIgPSB1dS5pZFxuICBXSEVSRSBmZi5mb2xsb3dpbmdVc2VyID0gJHt1c2VySWR9O2A7XG4gIGxldCBmb2xsb3dpbmcgPSBhd2FpdCBydW5TUUwocXVlcnksICdHZXQgRm9sbG93aW5nJyk7XG4gIHJldHVybiBmb2xsb3dpbmc7XG59XG5cbi8qKlxuICogUmV0dXJucyBhbGwgdGhlIHVzZXIgcmVjb3JkcyB3aG8gYXJlIHRhZ2dlZCBvbiB0aGUgZ2l2ZW4gcG9zdFxuICogQHBhcmFtIHVzZXJJZFxuICogQHJldHVybnNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHBvc3RUYWdnZWQocG9zdElkOiBudW1iZXIpOiBQcm9taXNlPEZvbGxvd2VyW10+IHtcbiAgY29uc3QgcXVlcnkgPSBgU0VMRUNUIHB0dS51c2VyX2lkLCB1dS51c2VybmFtZSwgdXUuZW1haWwsIHV1LmZpcnN0TmFtZSwgdXUubGFzdG5hbWUsIHNjLmNvbm5lY3Rpb25JZFxuICBGUk9NIFxcYHBvc3RzX190YWdnZWRfdXNlcnNcXGAgcHR1IExFRlQgSk9JTiBzdG9yZV9jb25uZWN0aW9ucyBzYyBvbiBwdHUudXNlcl9pZCA9IHNjLnVzZXJpZCBcbiAgSk9JTiBcXGB1c2Vycy1wZXJtaXNzaW9uc191c2VyXFxgIHV1IE9OIHB0dS51c2VyX2lkID0gdXUuaWRcbiAgV0hFUkUgcHR1LnBvc3RfaWQgPSAxMCR7cG9zdElkfTtgO1xuICBsZXQgdGFnZ2VkID0gYXdhaXQgcnVuU1FMKHF1ZXJ5LCAnR2V0IFRhZ2dlZCcpO1xuICByZXR1cm4gdGFnZ2VkO1xufVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiJdfQ==