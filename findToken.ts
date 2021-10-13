export const findToken = (req: any): string => {
  let jwtAuthCode:string = req.headers['x-access-token'];
  jwtAuthCode = jwtAuthCode || req.headers['authorization'];
  jwtAuthCode = jwtAuthCode || req.headers['Authorization'];
  jwtAuthCode = jwtAuthCode || (req.queryStringParameters || {})['token'];
  jwtAuthCode = jwtAuthCode || (req.queryStringParameters || {})['auth'];
  if (jwtAuthCode && (jwtAuthCode.split(' ')[0] === 'Bearer' || jwtAuthCode.split(' ')[0] === 'bearer'))
    jwtAuthCode = jwtAuthCode.substring(7);
  return jwtAuthCode;
};
