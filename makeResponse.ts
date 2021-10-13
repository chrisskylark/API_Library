import * as _ from "lodash"
const headers = {
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PATCH',
};
export type response = {
  statusCode: number;
  message?: string;
  hint?: string;
  headers: any;
  body: string;
};

export const makeResponse = (statusCode: number, data: any, error?: Error | string, hint?:  string): response => {
  let body: any = { success: statusCode < 299 };
  if(statusCode < 299) {
    body.data = data
  } else {
    // generate an error body
    body.error = true
    body.message = _.isError(error) ? error.message : error
    if(hint) body.hint = hint
  }
  let response: response = {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
  return response;
};
