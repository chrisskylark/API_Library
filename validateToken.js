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
exports.validateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const mySQLStore_1 = require("./mySQLStore");
async function validateToken(token, config) {
    let decode;
    try {
        decode = jwt.verify(token, config.strapiJWT);
        decode.expiresOn = new Date(decode.exp * 1000);
        decode.issuedOn = new Date(decode.iat * 1000);
        let user = await (0, mySQLStore_1.findUserById)(decode.id, ["id", "email", "username", "createdAt", "confirmed", "blocked", "profileType"]);
        decode.user = user;
        console.log("🔐🔐 Validate Token: Token validated OK with result of %o", decode);
    }
    catch (e) {
        decode = null;
    }
    console.log("🔐🔐 Validate Token: Token supplied could not be validated");
    return decode;
}
exports.validateToken = validateToken;
;
module.exports = { validateToken };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGVUb2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZhbGlkYXRlVG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsa0RBQW9DO0FBRXBDLDZDQUF5QztBQUVsQyxLQUFLLFVBQVUsYUFBYSxDQUFFLEtBQWEsRUFBRSxNQUFrQjtJQUNwRSxJQUFJLE1BQTRCLENBQUM7SUFDakMsSUFBSTtRQUNGLE1BQU0sR0FBbUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdELE1BQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxJQUFJLEdBQXlCLE1BQU8sSUFBQSx5QkFBWSxFQUFDLE1BQU0sQ0FBQyxFQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUMsT0FBTyxFQUFDLFVBQVUsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBRSxDQUFBO1FBQy9JLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkRBQTJELEVBQUUsTUFBTSxDQUFDLENBQUE7S0FDakY7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE1BQU0sR0FBRyxJQUFJLENBQUM7S0FDZjtJQUNDLE9BQU8sQ0FBQyxHQUFHLENBQUMsNERBQTRELENBQUMsQ0FBQTtJQUN6RSxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDO0FBZEQsc0NBY0M7QUFBQSxDQUFDO0FBQ0YsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFDLGFBQWEsRUFBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLyoqXG4gKiBAZmlsZSBtb2R1bGU6IHRva2VuIGRlY29kZSBwcm9jZXNzZXNcbiAqIEB2ZXJzaW9uIDFcbiAqIEBhdXRob3IgY2hyaXMgY3VsbGVuXG4gKiBAY29weXJpZ2h0IFNreWxhcmsgQ3JlYXRpdmUgTHRkLCAyMDIxXG4gKi9cbiB0eXBlIFZhbGlkYXRlZFRva2VuVXNlciA9IHtcbiAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICBlbWFpbDogc3RyaW5nO1xuICAgYmxvY2tlZDogYm9vbGVhbjtcbiAgIGNvbmZpcm1lZDogYm9vbGVhbjtcbiAgIGlkOiBudW1iZXI7XG4gICBwcm9maWxlVHlwZTogc3RyaW5nO1xuIH1cbiB0eXBlIFZhbGlkYXRlZFRva2VuID0ge1xuICAgZXhwOiBudW1iZXI7XG4gICBleHBpcmVzT24/OiBEYXRlO1xuICAgaWF0OiBudW1iZXI7XG4gICBpc3N1ZWRPbj86RGF0ZTtcbiAgIGlkPzpudW1iZXI7XG4gICB1c2VyPzogVmFsaWRhdGVkVG9rZW5Vc2VyO1xuIH1cblxuaW1wb3J0ICogYXMgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgdHlwZSB7Q29uZmlnRGF0YSB9IGZyb20gJy4vZ2V0Q29uZmlnJ1xuaW1wb3J0IHtmaW5kVXNlckJ5SWR9IGZyb20gXCIuL215U1FMU3RvcmVcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVUb2tlbiAodG9rZW46IHN0cmluZywgY29uZmlnOiBDb25maWdEYXRhKTogUHJvbWlzZTxWYWxpZGF0ZWRUb2tlbnxudWxsPiAge1xuICBsZXQgZGVjb2RlOiBWYWxpZGF0ZWRUb2tlbiB8bnVsbDtcbiAgdHJ5IHtcbiAgICBkZWNvZGUgPSA8VmFsaWRhdGVkVG9rZW4+and0LnZlcmlmeSh0b2tlbiwgY29uZmlnLnN0cmFwaUpXVCk7XG4gICAgZGVjb2RlLmV4cGlyZXNPbiA9IG5ldyBEYXRlKGRlY29kZS5leHAgKiAxMDAwKTtcbiAgICBkZWNvZGUuaXNzdWVkT24gPSBuZXcgRGF0ZShkZWNvZGUuaWF0ICogMTAwMCk7XG4gICAgbGV0IHVzZXIgPSAgPFZhbGlkYXRlZFRva2VuVXNlcj4gYXdhaXQgIGZpbmRVc2VyQnlJZChkZWNvZGUuaWQhLCBbXCJpZFwiLFwiZW1haWxcIixcInVzZXJuYW1lXCIsXCJjcmVhdGVkQXRcIiwgXCJjb25maXJtZWRcIiwgXCJibG9ja2VkXCIsIFwicHJvZmlsZVR5cGVcIl0gKVxuICAgIGRlY29kZS51c2VyID0gdXNlcjtcbiAgICBjb25zb2xlLmxvZyhcIvCflJDwn5SQIFZhbGlkYXRlIFRva2VuOiBUb2tlbiB2YWxpZGF0ZWQgT0sgd2l0aCByZXN1bHQgb2YgJW9cIiwgZGVjb2RlKVxuICB9IGNhdGNoIChlKSB7XG4gICAgZGVjb2RlID0gbnVsbDtcbiAgfVxuICAgIGNvbnNvbGUubG9nKFwi8J+UkPCflJAgVmFsaWRhdGUgVG9rZW46IFRva2VuIHN1cHBsaWVkIGNvdWxkIG5vdCBiZSB2YWxpZGF0ZWRcIilcbiAgICByZXR1cm4gZGVjb2RlO1xufTtcbm1vZHVsZS5leHBvcnRzID0ge3ZhbGlkYXRlVG9rZW59O1xuIl19