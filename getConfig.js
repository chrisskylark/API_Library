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
exports.putConfig = exports.getConfig = void 0;
const AWS = __importStar(require("aws-sdk"));
const _ = __importStar(require("lodash"));
const pk = __importStar(require("../package.json"));
const s3 = new AWS.S3();
const S3_BUCKET = pk.config.s3bucket;
const S3_PREFIX = pk.config.s3key;
let CONFIG = null;
async function getConfig() {
    if (CONFIG)
        return CONFIG;
    console.log('Loading Config');
    try {
        let params = {
            Bucket: S3_BUCKET,
            Key: S3_PREFIX + `/${pk.config.s3configFile}`,
        };
        let config = await s3.getObject(params).promise();
        config = JSON.parse(config.Body.toString());
        CONFIG = config;
        return CONFIG;
    }
    catch (e) {
        return null;
    }
}
exports.getConfig = getConfig;
async function putConfig(newConfig) {
    console.log('Putting Config');
    try {
        let params = {
            Bucket: S3_BUCKET,
            Key: S3_PREFIX + `/${pk.config.s3configFile}`,
            Body: JSON.stringify(newConfig)
        };
        let config = await s3.putObject(params).promise();
        CONFIG = _.cloneDeep(config);
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.putConfig = putConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0Q29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLG9EQUFzQztBQUN0QyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUN4QixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUNyQyxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNsQyxJQUFJLE1BQU0sR0FBUSxJQUFJLENBQUM7QUF5Q2hCLEtBQUssVUFBVSxTQUFTO0lBQzdCLElBQUksTUFBTTtRQUFFLE9BQU8sTUFBTSxDQUFDO0lBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM5QixJQUFJO1FBR0YsSUFBSSxNQUFNLEdBQTRCO1lBQ3BDLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLEdBQUcsRUFBRSxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRTtTQUM5QyxDQUFDO1FBQ0YsSUFBSSxNQUFNLEdBQVEsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZELE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM1QyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ2hCLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBakJELDhCQWlCQztBQUdNLEtBQUssVUFBVSxTQUFTLENBQUMsU0FBcUI7SUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzlCLElBQUk7UUFDRixJQUFJLE1BQU0sR0FBNEI7WUFDcEMsTUFBTSxFQUFFLFNBQVM7WUFDakIsR0FBRyxFQUFFLFNBQVMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFO1lBQzdDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxDQUFDO1FBQ0YsSUFBSSxNQUFNLEdBQVEsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZELE1BQU0sR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBZEQsOEJBY0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvcmVxdWlyZS1hd2FpdCAqL1xuaW1wb3J0ICogYXMgQVdTIGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcGsgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmNvbnN0IHMzID0gbmV3IEFXUy5TMygpO1xuY29uc3QgUzNfQlVDS0VUID0gcGsuY29uZmlnLnMzYnVja2V0O1xuY29uc3QgUzNfUFJFRklYID0gcGsuY29uZmlnLnMza2V5O1xubGV0IENPTkZJRzogYW55ID0gbnVsbDtcbmV4cG9ydCB0eXBlIFN0cmFwaVRva2VuID0ge1xuICBqd3Q6IHN0cmluZztcbiAgY3JlYXRlZE9uOiBEYXRlO1xufVxuZXhwb3J0IHR5cGUgTXlTUUxDb25uZWN0SW5mbyA9IHtcbiAgaG9zdDogc3RyaW5nO1xuICB1c2VyOiBzdHJpbmc7XG4gIHBhc3N3b3JkOiBzdHJpbmc7XG4gIGRhdGFiYXNlOiBzdHJpbmc7XG59O1xuZXhwb3J0IHR5cGUgTXlTUUxTdG9yZSA9IHtcbiAgZGF0YWJhc2U6IHN0cmluZztcbiAgdGFibGU6IHN0cmluZztcbn07XG5leHBvcnQgdHlwZSBBUElBcHAgPSB7XG4gIENsaWVudElEOiBzdHJpbmc7XG4gIFNlY3JldDogc3RyaW5nO1xufTtcbmV4cG9ydCB0eXBlIENvbmZpZ0RhdGEgPSB7XG4gIG1vbmdvVVJJPzogc3RyaW5nO1xuICBtb25nb0RCPzogc3RyaW5nO1xuICBzdHJhcGlVUkw6IHN0cmluZztcbiAgc3RyYXBpVXNlcjogc3RyaW5nO1xuICBzdHJhcGlQYXNzd29yZDogc3RyaW5nO1xuICBzdHJhcGlKV1Q6IHN0cmluZztcbiAgc3RyYXBpV2ViVXNlcj86IHN0cmluZztcbiAgc3RyYXBpV2ViUHdkPzogc3RyaW5nO1xuICBzdHJhcGlXZWJUb2tlbj86IFN0cmFwaVRva2VuO1xuICBzcGFya3Bvc3RBUEk6IHN0cmluZztcbiAgZGVmYXVsdEVtYWlsVGVtcGxhdGU6IHN0cmluZztcbiAgdG9rZW5GaWVsZG5hbWU6IHN0cmluZztcbiAgZW1haWxGcm9tOiBzdHJpbmc7XG4gIGVtYWlsRnJvbU5hbWU6IHN0cmluZztcbiAgZW1haWxSZXBseVRvOiBzdHJpbmc7XG4gIG15c3FsPzogTXlTUUxDb25uZWN0SW5mbztcbiAgbXlzcWxTdG9yZT86IE15U1FMU3RvcmU7XG4gIE1vbmV5SHViQVBJPzogQVBJQXBwO1xuICBjb21wYW5pZXNIb3VzZUFwaUtleT86IHN0cmluZztcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb25maWcoKTogUHJvbWlzZTxDb25maWdEYXRhIHwgbnVsbD4ge1xuICBpZiAoQ09ORklHKSByZXR1cm4gQ09ORklHO1xuICBjb25zb2xlLmxvZygnTG9hZGluZyBDb25maWcnKTtcbiAgdHJ5IHtcbiAgICAvLyBsb2FkIGNvbmZpZyBmcm9tIFMzIGFuZCBzY2FuIHRoZSB0ZW1wbGF0ZXMgZm9sZGVyIGlmIHByZXNlbnQgYW5kIGxpc3RcbiAgICAvLyBhdmFpbGFibGUgdGVtcGxhdGUgZmlsZXNcbiAgICBsZXQgcGFyYW1zOiBBV1MuUzMuR2V0T2JqZWN0UmVxdWVzdCA9IHtcbiAgICAgIEJ1Y2tldDogUzNfQlVDS0VULFxuICAgICAgS2V5OiBTM19QUkVGSVggKyBgLyR7cGsuY29uZmlnLnMzY29uZmlnRmlsZX1gLFxuICAgIH07XG4gICAgbGV0IGNvbmZpZzogYW55ID0gYXdhaXQgczMuZ2V0T2JqZWN0KHBhcmFtcykucHJvbWlzZSgpO1xuICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnLkJvZHkudG9TdHJpbmcoKSk7XG4gICAgQ09ORklHID0gY29uZmlnO1xuICAgIHJldHVybiBDT05GSUc7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwdXRDb25maWcobmV3Q29uZmlnOiBDb25maWdEYXRhKTogUHJvbWlzZTxib29sZWFuPiB7XG4gIGNvbnNvbGUubG9nKCdQdXR0aW5nIENvbmZpZycpO1xuICB0cnkge1xuICAgIGxldCBwYXJhbXM6IEFXUy5TMy5QdXRPYmplY3RSZXF1ZXN0ID0ge1xuICAgICAgQnVja2V0OiBTM19CVUNLRVQsXG4gICAgICBLZXk6IFMzX1BSRUZJWCArIGAvJHtway5jb25maWcuczNjb25maWdGaWxlfWAsXG4gICAgICBCb2R5OiBKU09OLnN0cmluZ2lmeShuZXdDb25maWcpXG4gICAgfTtcbiAgICBsZXQgY29uZmlnOiBhbnkgPSBhd2FpdCBzMy5wdXRPYmplY3QocGFyYW1zKS5wcm9taXNlKCk7XG4gICAgQ09ORklHID0gXy5jbG9uZURlZXAoY29uZmlnKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4iXX0=