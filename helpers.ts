import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as crypto from 'crypto';
// import * as secrets from './.secrets.json';
import {ConfigData, getConfig} from './getConfig';
// import {ObjectId, connectMongo, StoreType} from './getMongoClient';
// import {Db} from 'mongodb';
import * as mysql from 'mysql2/promise';
let apigwManagementApi: AWS.ApiGatewayManagementApi | null = null;
// --------------------------------------------------------------------------
// 📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛
// REMOVE dynamoConfig before going live
// --------------------------------------------------------------------------
// export const lambda = new AWS.Lambda(secrets);
// --------------------------------------------------------------------------
// 📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛📛
// --------------------------------------------------------------------------
export const lambda = new AWS.Lambda();
// --------------------------------------------------------------------------
let MYSQL: mysql.Connection | null = null;
// --------------------------------------------------------------------------
// ╦ ╦╔═╗╦  ╔═╗╔═╗╦═╗╔═╗
// ╠═╣║╣ ║  ╠═╝║╣ ╠╦╝╚═╗
// ╩ ╩╚═╝╩═╝╩  ╚═╝╩╚═╚═╝
// --------------------------------------------------------------------------

/**
 * Sets up the apigwManagementApi service
 * @param {*} event
 * @returns - apigwManagementApi service
 */

// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// ╔╦╗┌─┐┌┐┌┌─┐┌─┐╔╦╗╔╗
// ║║║│ │││││ ┬│ │ ║║╠╩╗
// ╩ ╩└─┘┘└┘└─┘└─┘═╩╝╚═╝
// --------------------------------------------------------------------------
/*
export async function getMongoClient() {
  const config = await getConfig();
  if (!config) throw new Error('Config could not be retrieved');
  const client = await connectMongo(<string>config.mongoURI);
  return client;
}

export async function getMongoDB(): Promise<Db | undefined> {
  const config = await getConfig();
  const client = await getMongoClient();
  const DB = client?.db(config?.mongoDB);
  return DB;
}
*/
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// ╔╦╗┬ ┬╔═╗╔═╗ ╦
// ║║║└┬┘╚═╗║═╬╗║
// ╩ ╩ ┴ ╚═╝╚═╝╚╩═╝
// --------------------------------------------------------------------------
export async function getMySQLClient(): Promise<mysql.Connection | null> {
  if (MYSQL) return MYSQL;
  const config = await getConfig();
  if (!config || !config.mysql) throw new Error('Config/MySQL Config could not be retrieved');
  try {
    MYSQL = await mysql.createConnection(config.mysql);
    await MYSQL.connect();
    return MYSQL;
  } catch (error) {
    console.error('Cannot connect to MySQL server ', error);
  }
  return null;
}
export async function disconnectMySQL(): Promise<boolean> {
  if (MYSQL && MYSQL) await MYSQL.end();
  MYSQL = null;
  return true;
}

// --------------------------------------------------------------------------

export function randomDate(start: Date, end?: Date): Date {
  end = end || new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

export function randomInt(min: number, max: number): number {
  return crypto.randomInt(min, max);
}

export function tryParse(json: string): object {
  try {
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
}

export function minutesFromDuration(duration: string): number {
  let stages: any;
  if (duration.includes(':')) {
    stages = duration.split(':');
    if (stages.length == 0) {
      stages = '1:00:00'.split(':');
    } else if (stages.length > 2) {
      stages = 60 * stages[0] + stages[1] * 1;
    } else if ((stages.length = 2)) {
      stages = 1 * stages[0];
    }

    if (isNaN(stages) || stages < 10) stages = 60;
  } else {
    stages = Number.parseInt(duration);
    if (_.isNaN(stages)) stages = 60;
  }

  return stages;
}
export function daysBetween(firstDate: Date, secondDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / oneDay));
  return diffDays;
}
export function zeroPad(num: number, places: number): string {
  return String(num).padStart(places, '0');
}

export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function hasAllKeys(obj: object, keys: string[]): boolean {
  let has = true;
  keys.forEach((k: string) => {
    has = has && Object.prototype.hasOwnProperty.call(obj, k);
  });
  return has;
}

export function spliceString(string: string, index: number, count: number = 0, insert: string = ''): string {
  const array = _.toArray(string);
  array.splice(index, count, insert);
  return array.join('');
}

// https://stackoverflow.com/questions/8152426/how-can-i-calculate-the-number-of-years-between-two-dates
export function calculateAge(birthday: Date): number {
  // birthday is a date
  var ageDifMs = Date.now() - birthday.getTime();
  var ageDate = new Date(ageDifMs); // miliseconds from epoch
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

export async function currentConfig(): Promise<ConfigData | null> {
  let config = await getConfig();
  return config;
}

/**
 * Get the aws socket manager used to send messages over a given websocket gateway
 * @param event
 * @returns
 */
export function getMgmt(event: any): AWS.ApiGatewayManagementApi {
  if (apigwManagementApi) return apigwManagementApi;
  apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
  });
  return apigwManagementApi;
}

/**
 * Send a message to a given connection
 * @param {string} to
 * @param {string} action
 * @param {object} data
 * @returns boolean
 */
export async function sendMessage(to: string, action: string, data: any): Promise<boolean> {
  data.action = action;
  try {
    if (apigwManagementApi) {
      await apigwManagementApi
        .postToConnection({
          ConnectionId: to,
          Data: JSON.stringify(data),
        })
        .promise();
      return true;
    }
    return false;
  } catch (e) {
    console.log('Error sending message ', e);
    return false;
  }
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function decodeBody(event: any): string {
  let bodyRaw = event.body;
  let body: string = event.body;
  let bodyJSON: any;
  if (event.isBase64Encoded) {
    body = Buffer.from(bodyRaw, 'base64').toString('utf8');
  }
  try {
    bodyJSON = JSON.parse(body);
    return bodyJSON;
  } catch {
    return body;
  }
}
export function monthName(month: number): string {
  let months =  ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"]
  if(month < 0 || month > 11) throw new Error("Invalid month number")
  return months[month]
}

export function shortMonthName(month: number): string {
  return monthName(month).substring(0,3).toUpperCase();
}

export function injectDate(text: string): string {
  function pad(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }
  let timeNow = new Date();
  text = text.replace(/%sm/g, shortMonthName(timeNow.getMonth()));
  text = text.replace(/%lm/g, monthName(timeNow.getMonth()));
  text = text.replace(/%d/g, pad(timeNow.getDate()));
  text = text.replace(/%m/g, pad(timeNow.getMonth()+1));
  text = text.replace(/%y/g, pad(timeNow.getFullYear()));
  text = text.replace(/%h/g, pad(timeNow.getHours()));
  text = text.replace(/%n/g, pad(timeNow.getMinutes()));
  text = text.replace(/%s/g, pad(timeNow.getSeconds()));
  text = text.replace(/%l/g, pad(timeNow.getMilliseconds()));

  return text;
}

export {getConfig};
