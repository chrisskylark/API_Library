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
    }
    catch (e) {
        decode = null;
    }
    return decode;
}
exports.validateToken = validateToken;
;
module.exports = { validateToken };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGVUb2tlbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZhbGlkYXRlVG9rZW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3QkEsa0RBQW9DO0FBRXBDLDZDQUF5QztBQUVsQyxLQUFLLFVBQVUsYUFBYSxDQUFFLEtBQWEsRUFBRSxNQUFrQjtJQUNwRSxJQUFJLE1BQTRCLENBQUM7SUFDakMsSUFBSTtRQUdGLE1BQU0sR0FBbUIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzdELE1BQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUMvQyxNQUFNLENBQUMsUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDOUMsSUFBSSxJQUFJLEdBQXlCLE1BQU8sSUFBQSx5QkFBWSxFQUFDLE1BQU0sQ0FBQyxFQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUMsT0FBTyxFQUFDLFVBQVUsRUFBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBRSxDQUFBO1FBQy9JLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0tBQ3BCO0lBQUMsT0FBTyxDQUFDLEVBQUU7UUFDVixNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ2Y7SUFDRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBZEQsc0NBY0M7QUFBQSxDQUFDO0FBQ0YsTUFBTSxDQUFDLE9BQU8sR0FBRyxFQUFDLGFBQWEsRUFBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLyoqXG4gKiBAZmlsZSBtb2R1bGU6IHRva2VuIGRlY29kZSBwcm9jZXNzZXNcbiAqIEB2ZXJzaW9uIDFcbiAqIEBhdXRob3IgY2hyaXMgY3VsbGVuXG4gKiBAY29weXJpZ2h0IFNreWxhcmsgQ3JlYXRpdmUgTHRkLCAyMDIxXG4gKi9cbiB0eXBlIFZhbGlkYXRlZFRva2VuVXNlciA9IHtcbiAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICBlbWFpbDogc3RyaW5nO1xuICAgYmxvY2tlZDogYm9vbGVhbjtcbiAgIGNvbmZpcm1lZDogYm9vbGVhbjtcbiAgIGlkOiBudW1iZXI7XG4gICBwcm9maWxlVHlwZTogc3RyaW5nO1xuIH1cbiB0eXBlIFZhbGlkYXRlZFRva2VuID0ge1xuICAgZXhwOiBudW1iZXI7XG4gICBleHBpcmVzT24/OiBEYXRlO1xuICAgaWF0OiBudW1iZXI7XG4gICBpc3N1ZWRPbj86RGF0ZTtcbiAgIGlkPzpudW1iZXI7XG4gICB1c2VyPzogVmFsaWRhdGVkVG9rZW5Vc2VyO1xuIH1cblxuaW1wb3J0ICogYXMgand0IGZyb20gJ2pzb253ZWJ0b2tlbic7XG5pbXBvcnQgdHlwZSB7Q29uZmlnRGF0YSB9IGZyb20gJy4vZ2V0Q29uZmlnJ1xuaW1wb3J0IHtmaW5kVXNlckJ5SWR9IGZyb20gXCIuL215U1FMU3RvcmVcIlxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmFsaWRhdGVUb2tlbiAodG9rZW46IHN0cmluZywgY29uZmlnOiBDb25maWdEYXRhKTogUHJvbWlzZTxWYWxpZGF0ZWRUb2tlbnxudWxsPiAge1xuICBsZXQgZGVjb2RlOiBWYWxpZGF0ZWRUb2tlbiB8bnVsbDtcbiAgdHJ5IHtcbiAgICAvLyBsZXQgY2xpZW50ID0gYXdhaXQgY29ubmVjdE1vbmdvKGNvbmZpZy5tb25nb1VSSSk7XG4gICAgLy8gbGV0IHVzZXJzID0gY2xpZW50LmRiKGNvbmZpZy5tb25nb0RCKS5jb2xsZWN0aW9uKCd1c2Vycy1wZXJtaXNzaW9uc191c2VyJyk7XG4gICAgZGVjb2RlID0gPFZhbGlkYXRlZFRva2VuPmp3dC52ZXJpZnkodG9rZW4sIGNvbmZpZy5zdHJhcGlKV1QpO1xuICAgIGRlY29kZS5leHBpcmVzT24gPSBuZXcgRGF0ZShkZWNvZGUuZXhwICogMTAwMCk7XG4gICAgZGVjb2RlLmlzc3VlZE9uID0gbmV3IERhdGUoZGVjb2RlLmlhdCAqIDEwMDApO1xuICAgIGxldCB1c2VyID0gIDxWYWxpZGF0ZWRUb2tlblVzZXI+IGF3YWl0ICBmaW5kVXNlckJ5SWQoZGVjb2RlLmlkISwgW1wiaWRcIixcImVtYWlsXCIsXCJ1c2VybmFtZVwiLFwiY3JlYXRlZEF0XCIsIFwiY29uZmlybWVkXCIsIFwiYmxvY2tlZFwiLCBcInByb2ZpbGVUeXBlXCJdIClcbiAgICBkZWNvZGUudXNlciA9IHVzZXI7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBkZWNvZGUgPSBudWxsO1xuICB9XG4gIHJldHVybiBkZWNvZGU7XG59O1xubW9kdWxlLmV4cG9ydHMgPSB7dmFsaWRhdGVUb2tlbn07XG4iXX0=