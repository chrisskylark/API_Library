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
            Body: JSON.stringify(newConfig),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0Q29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLG9EQUFzQztBQUN0QyxNQUFNLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztBQUN4QixNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQztBQUNyQyxNQUFNLFNBQVMsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztBQUNsQyxJQUFJLE1BQU0sR0FBUSxJQUFJLENBQUM7QUEyQ2hCLEtBQUssVUFBVSxTQUFTO0lBQzdCLElBQUksTUFBTTtRQUFFLE9BQU8sTUFBTSxDQUFDO0lBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUM5QixJQUFJO1FBR0YsSUFBSSxNQUFNLEdBQTRCO1lBQ3BDLE1BQU0sRUFBRSxTQUFTO1lBQ2pCLEdBQUcsRUFBRSxTQUFTLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRTtTQUM5QyxDQUFDO1FBQ0YsSUFBSSxNQUFNLEdBQVEsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZELE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUM1QyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ2hCLE9BQU8sTUFBTSxDQUFDO0tBQ2Y7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sSUFBSSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBakJELDhCQWlCQztBQUVNLEtBQUssVUFBVSxTQUFTLENBQUMsU0FBcUI7SUFDbkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzlCLElBQUk7UUFDRixJQUFJLE1BQU0sR0FBNEI7WUFDcEMsTUFBTSxFQUFFLFNBQVM7WUFDakIsR0FBRyxFQUFFLFNBQVMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFO1lBQzdDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxDQUFDO1FBQ0YsSUFBSSxNQUFNLEdBQVEsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3ZELE1BQU0sR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE9BQU8sSUFBSSxDQUFDO0tBQ2I7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDSCxDQUFDO0FBZEQsOEJBY0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSBAdHlwZXNjcmlwdC1lc2xpbnQvcmVxdWlyZS1hd2FpdCAqL1xuaW1wb3J0ICogYXMgQVdTIGZyb20gJ2F3cy1zZGsnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0ICogYXMgcGsgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcbmNvbnN0IHMzID0gbmV3IEFXUy5TMygpO1xuY29uc3QgUzNfQlVDS0VUID0gcGsuY29uZmlnLnMzYnVja2V0O1xuY29uc3QgUzNfUFJFRklYID0gcGsuY29uZmlnLnMza2V5O1xubGV0IENPTkZJRzogYW55ID0gbnVsbDtcbmV4cG9ydCB0eXBlIFN0cmFwaVRva2VuID0ge1xuICBqd3Q6IHN0cmluZztcbiAgY3JlYXRlZE9uOiBEYXRlO1xufTtcbmV4cG9ydCB0eXBlIE15U1FMQ29ubmVjdEluZm8gPSB7XG4gIGhvc3Q6IHN0cmluZztcbiAgdXNlcjogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICBkYXRhYmFzZTogc3RyaW5nO1xufTtcbmV4cG9ydCB0eXBlIE15U1FMU3RvcmUgPSB7XG4gIGRhdGFiYXNlOiBzdHJpbmc7XG4gIHRhYmxlOiBzdHJpbmc7XG59O1xuZXhwb3J0IHR5cGUgQVBJQXBwID0ge1xuICBDbGllbnRJRDogc3RyaW5nO1xuICBTZWNyZXQ6IHN0cmluZztcbn07XG5leHBvcnQgdHlwZSBDb25maWdEYXRhID0ge1xuICBtb25nb1VSST86IHN0cmluZztcbiAgbW9uZ29EQj86IHN0cmluZztcbiAgc3RyYXBpVVJMOiBzdHJpbmc7XG4gIHN0cmFwaVVzZXI6IHN0cmluZztcbiAgc3RyYXBpUGFzc3dvcmQ6IHN0cmluZztcbiAgc3RyYXBpSldUOiBzdHJpbmc7XG4gIHN0cmFwaVdlYlVzZXI/OiBzdHJpbmc7XG4gIHN0cmFwaVdlYlB3ZD86IHN0cmluZztcbiAgc3RyYXBpV2ViVG9rZW4/OiBTdHJhcGlUb2tlbjtcbiAgc3Bhcmtwb3N0QVBJOiBzdHJpbmc7XG4gIGRlZmF1bHRFbWFpbFRlbXBsYXRlOiBzdHJpbmc7XG4gIHRva2VuRmllbGRuYW1lOiBzdHJpbmc7XG4gIGVtYWlsRnJvbTogc3RyaW5nO1xuICBlbWFpbEZyb21OYW1lOiBzdHJpbmc7XG4gIGVtYWlsUmVwbHlUbzogc3RyaW5nO1xuICBteXNxbD86IE15U1FMQ29ubmVjdEluZm87XG4gIG15c3FsU3RvcmU/OiBNeVNRTFN0b3JlO1xuICBNb25leUh1YkFQST86IEFQSUFwcDtcbiAgY29tcGFuaWVzSG91c2VBcGlLZXk/OiBzdHJpbmc7XG4gIGNoYXJpdHliYXNlQXBpS2V5OiBzdHJpbmc7XG4gIGNoYXJpdHliYXNlRW5kcG9pbnQ6IHN0cmluZztcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDb25maWcoKTogUHJvbWlzZTxDb25maWdEYXRhIHwgbnVsbD4ge1xuICBpZiAoQ09ORklHKSByZXR1cm4gQ09ORklHO1xuICBjb25zb2xlLmxvZygnTG9hZGluZyBDb25maWcnKTtcbiAgdHJ5IHtcbiAgICAvLyBsb2FkIGNvbmZpZyBmcm9tIFMzIGFuZCBzY2FuIHRoZSB0ZW1wbGF0ZXMgZm9sZGVyIGlmIHByZXNlbnQgYW5kIGxpc3RcbiAgICAvLyBhdmFpbGFibGUgdGVtcGxhdGUgZmlsZXNcbiAgICBsZXQgcGFyYW1zOiBBV1MuUzMuR2V0T2JqZWN0UmVxdWVzdCA9IHtcbiAgICAgIEJ1Y2tldDogUzNfQlVDS0VULFxuICAgICAgS2V5OiBTM19QUkVGSVggKyBgLyR7cGsuY29uZmlnLnMzY29uZmlnRmlsZX1gLFxuICAgIH07XG4gICAgbGV0IGNvbmZpZzogYW55ID0gYXdhaXQgczMuZ2V0T2JqZWN0KHBhcmFtcykucHJvbWlzZSgpO1xuICAgIGNvbmZpZyA9IEpTT04ucGFyc2UoY29uZmlnLkJvZHkudG9TdHJpbmcoKSk7XG4gICAgQ09ORklHID0gY29uZmlnO1xuICAgIHJldHVybiBDT05GSUc7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHV0Q29uZmlnKG5ld0NvbmZpZzogQ29uZmlnRGF0YSk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zb2xlLmxvZygnUHV0dGluZyBDb25maWcnKTtcbiAgdHJ5IHtcbiAgICBsZXQgcGFyYW1zOiBBV1MuUzMuUHV0T2JqZWN0UmVxdWVzdCA9IHtcbiAgICAgIEJ1Y2tldDogUzNfQlVDS0VULFxuICAgICAgS2V5OiBTM19QUkVGSVggKyBgLyR7cGsuY29uZmlnLnMzY29uZmlnRmlsZX1gLFxuICAgICAgQm9keTogSlNPTi5zdHJpbmdpZnkobmV3Q29uZmlnKSxcbiAgICB9O1xuICAgIGxldCBjb25maWc6IGFueSA9IGF3YWl0IHMzLnB1dE9iamVjdChwYXJhbXMpLnByb21pc2UoKTtcbiAgICBDT05GSUcgPSBfLmNsb25lRGVlcChjb25maWcpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXX0=