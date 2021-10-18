#!/usr/bin/env node
/**
 * @file module: token decode processes
 * @version 1
 * @author chris cullen
 * @copyright Skylark Creative Ltd, 2021
 */
 type ValidatedTokenUser = {
   username: string;
   email: string;
   blocked: boolean;
   confirmed: boolean;
   id: number;
   profileType: string;
 }
 type ValidatedToken = {
   exp: number;
   expiresOn?: Date;
   iat: number;
   issuedOn?:Date;
   id?:number;
   user?: ValidatedTokenUser;
 }

import * as jwt from 'jsonwebtoken';
import type {ConfigData } from './getConfig'
import {findUserById} from "./mySQLStore"

export async function validateToken (token: string, config: ConfigData): Promise<ValidatedToken|null>  {
  let decode: ValidatedToken |null;
  try {
    decode = <ValidatedToken>jwt.verify(token, config.strapiJWT);
    decode.expiresOn = new Date(decode.exp * 1000);
    decode.issuedOn = new Date(decode.iat * 1000);
    let user =  <ValidatedTokenUser> await  findUserById(decode.id!, ["id","email","username","createdAt", "confirmed", "blocked", "profileType"] )
    decode.user = user;
    console.log("🔐🔐 Validate Token: Token validated OK with result of %o", decode)
  } catch (e) {
    decode = null;
  }
    console.log("🔐🔐 Validate Token: Token supplied could not be validated")
    return decode;
};
module.exports = {validateToken};
