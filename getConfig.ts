/* eslint-disable @typescript-eslint/require-await */
import * as AWS from 'aws-sdk';
import * as _ from 'lodash';
import * as pk from '../package.json';
const s3 = new AWS.S3();
const S3_BUCKET = pk.config.s3bucket;
const S3_PREFIX = pk.config.s3key;
let CONFIG: any = null;
export type StrapiToken = {
  jwt: string;
  createdOn: Date;
}
export type MySQLConnectInfo = {
  host: string;
  user: string;
  password: string;
  database: string;
};
export type MySQLStore = {
  database: string;
  table: string;
};
export type APIApp = {
  ClientID: string;
  Secret: string;
};
export type ConfigData = {
  mongoURI?: string;
  mongoDB?: string;
  strapiURL: string;
  strapiUser: string;
  strapiPassword: string;
  strapiJWT: string;
  strapiWebUser?: string;
  strapiWebPwd?: string;
  strapiWebToken?: StrapiToken;
  sparkpostAPI: string;
  defaultEmailTemplate: string;
  tokenFieldname: string;
  emailFrom: string;
  emailFromName: string;
  emailReplyTo: string;
  mysql?: MySQLConnectInfo;
  mysqlStore?: MySQLStore;
  MoneyHubAPI?: APIApp;
  companiesHouseApiKey?: string;
};

export async function getConfig(): Promise<ConfigData | null> {
  if (CONFIG) return CONFIG;
  console.log('Loading Config');
  try {
    // load config from S3 and scan the templates folder if present and list
    // available template files
    let params: AWS.S3.GetObjectRequest = {
      Bucket: S3_BUCKET,
      Key: S3_PREFIX + `/${pk.config.s3configFile}`,
    };
    let config: any = await s3.getObject(params).promise();
    config = JSON.parse(config.Body.toString());
    CONFIG = config;
    return CONFIG;
  } catch (e) {
    return null;
  }
}


export async function putConfig(newConfig: ConfigData): Promise<boolean> {
  console.log('Putting Config');
  try {
    let params: AWS.S3.PutObjectRequest = {
      Bucket: S3_BUCKET,
      Key: S3_PREFIX + `/${pk.config.s3configFile}`,
      Body: JSON.stringify(newConfig)
    };
    let config: any = await s3.putObject(params).promise();
    CONFIG = _.cloneDeep(config);
    return true;
  } catch (e) {
    return false;
  }
}

