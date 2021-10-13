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
exports.makeResponse = void 0;
const _ = __importStar(require("lodash"));
const headers = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,DELETE,PATCH',
};
const makeResponse = (statusCode, data, error, hint) => {
    let body = { success: statusCode < 299 };
    if (statusCode < 299) {
        body.data = data;
    }
    else {
        body.error = true;
        body.message = _.isError(error) ? error.message : error;
        if (hint)
            body.hint = hint;
    }
    let response = {
        statusCode,
        headers,
        body: JSON.stringify(body),
    };
    return response;
};
exports.makeResponse = makeResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFrZVJlc3BvbnNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWFrZVJlc3BvbnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwwQ0FBMkI7QUFDM0IsTUFBTSxPQUFPLEdBQUc7SUFDZCw4QkFBOEIsRUFBRSxjQUFjO0lBQzlDLDZCQUE2QixFQUFFLEdBQUc7SUFDbEMsOEJBQThCLEVBQUUsK0JBQStCO0NBQ2hFLENBQUM7QUFTSyxNQUFNLFlBQVksR0FBRyxDQUFDLFVBQWtCLEVBQUUsSUFBUyxFQUFFLEtBQXNCLEVBQUUsSUFBYyxFQUFZLEVBQUU7SUFDOUcsSUFBSSxJQUFJLEdBQVEsRUFBRSxPQUFPLEVBQUUsVUFBVSxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQzlDLElBQUcsVUFBVSxHQUFHLEdBQUcsRUFBRTtRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtLQUNqQjtTQUFNO1FBRUwsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7UUFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUE7UUFDdkQsSUFBRyxJQUFJO1lBQUUsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUE7S0FDMUI7SUFDRCxJQUFJLFFBQVEsR0FBYTtRQUN2QixVQUFVO1FBQ1YsT0FBTztRQUNQLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztLQUMzQixDQUFDO0lBQ0YsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQyxDQUFDO0FBaEJXLFFBQUEsWUFBWSxnQkFnQnZCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgXyBmcm9tIFwibG9kYXNoXCJcbmNvbnN0IGhlYWRlcnMgPSB7XG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZScsXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ09QVElPTlMsUE9TVCxHRVQsREVMRVRFLFBBVENIJyxcbn07XG5leHBvcnQgdHlwZSByZXNwb25zZSA9IHtcbiAgc3RhdHVzQ29kZTogbnVtYmVyO1xuICBtZXNzYWdlPzogc3RyaW5nO1xuICBoaW50Pzogc3RyaW5nO1xuICBoZWFkZXJzOiBhbnk7XG4gIGJvZHk6IHN0cmluZztcbn07XG5cbmV4cG9ydCBjb25zdCBtYWtlUmVzcG9uc2UgPSAoc3RhdHVzQ29kZTogbnVtYmVyLCBkYXRhOiBhbnksIGVycm9yPzogRXJyb3IgfCBzdHJpbmcsIGhpbnQ/OiAgc3RyaW5nKTogcmVzcG9uc2UgPT4ge1xuICBsZXQgYm9keTogYW55ID0geyBzdWNjZXNzOiBzdGF0dXNDb2RlIDwgMjk5IH07XG4gIGlmKHN0YXR1c0NvZGUgPCAyOTkpIHtcbiAgICBib2R5LmRhdGEgPSBkYXRhXG4gIH0gZWxzZSB7XG4gICAgLy8gZ2VuZXJhdGUgYW4gZXJyb3IgYm9keVxuICAgIGJvZHkuZXJyb3IgPSB0cnVlXG4gICAgYm9keS5tZXNzYWdlID0gXy5pc0Vycm9yKGVycm9yKSA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvclxuICAgIGlmKGhpbnQpIGJvZHkuaGludCA9IGhpbnRcbiAgfVxuICBsZXQgcmVzcG9uc2U6IHJlc3BvbnNlID0ge1xuICAgIHN0YXR1c0NvZGUsXG4gICAgaGVhZGVycyxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgfTtcbiAgcmV0dXJuIHJlc3BvbnNlO1xufTtcbiJdfQ==