# A Typescript API_Library

### A colleciton of utility functions used primarily in the back end of APIs 

This collection assumes it is in a lib folder inside the main code folder of it's project, as such it relies on the package.json and node_modules of the containing folder to operate.  Inside the ../package.json file this library expects to find a config object similar to the following:

```json
"config": {
    "s3bucket": "skylarkdevelopment",
    "s3key": "gatewayAPI/wunder",
    "s3configFile": "config.json",
    "s3echoFile": "echo_%y%m%d%h%n%s.json",
    "s3SquooshFile": "squoosh.json",
    "s3SquooshImage": "squoosh.jpg",
    "stackName": "cdk-wunderRestAPIv2",
    "apiName": "http-api-socket-wunder",
    "apiDesc": "restAPI service for Wunder",
    "snsAppArn": "arn:aws:sns:eu-west-1:072444354828:app/APNS_SANDBOX/Wunder",
    "webAPISeed": 9091
  },

  ```
  The main items it requires is the s3bucket and s3configFile which is where the getCongig function goes to fetch configuration information for connecting to MySQL etc.
  # API_Library
