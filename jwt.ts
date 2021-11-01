import {WunderConfig} from "../coins";
import {getConfig, ConfigData} from "./getConfig";
import {JWT, JWKS, JSONWebKeySet} from 'jose';



export async function JWTSign(payload: any, usePrivate: boolean, audience: string, issuer: string): Promise<string |null> {
  try {
    // Get the key from the keys - we will use the private key to sign
    const config = <ConfigData & WunderConfig>await getConfig();
    if (!config || !config?.MoneyHubAPI) return null;
    const jwks: any = usePrivate ? {keys: config!.MoneyHubAPI.Keys} : {keys: config.MoneyHubAPI.PublicKeys};
    const signingKey = JWKS.asKeyStore(jwks).get({use: 'sig'});
    const token = JWT.sign(payload, signingKey, {
      audience,
      issuer,
      iat: true,
      expiresIn: '60s',
      header: {
        typ: 'JWT',
      },
    });
    return token;
  } catch (error) {
    console.log('Error:', error);
    return null;
  }
}

export async function JWTVerify(token: string, usePrivate: boolean, audience: string, issuer: string): Promise<any> {
  try {
    // Get the key from the keys - we will use the private key to sign
    const config = <ConfigData & WunderConfig>await getConfig();
    if (!config || !config?.MoneyHubAPI) return null;
    const jwks: any = usePrivate ? {keys: config.MoneyHubAPI.Keys} : {keys: config.MoneyHubAPI.PublicKeys};
    const signingKey = JWKS.asKeyStore(jwks).get({use: 'sig'});
    const decode = JWT.verify(token, signingKey, {
      audience,
      issuer,
    });
    return decode;
  } catch (error) {
    console.log('Error:', error);
    return null;
  }
}
