"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = exports.hasTemplate = exports.getTemplates = void 0;
const mySQLStore_1 = require("./mySQLStore");
const node_fetch_1 = __importDefault(require("node-fetch"));
async function getTemplates() {
    const query = "SELECT * FROM upload_file  WHERE ext = '.html' AND alternativeText = 'email_template';";
    try {
        let templates = await (0, mySQLStore_1.runSQL)(query);
        templates = templates && !Array.isArray(templates) ? [templates] : templates;
        return templates;
    }
    catch (e) {
        return [];
    }
}
exports.getTemplates = getTemplates;
async function hasTemplate(templateName) {
    const query = `SELECT * FROM upload_file  WHERE name = '${templateName}' AND ext = '.html' AND alternativeText = 'email_template';`;
    try {
        let template = await (0, mySQLStore_1.runSQL)(query);
        return template ? template.id : template;
    }
    catch (error) {
        console.error("Error searching for template called '%s'", templateName, error);
        return -1;
    }
}
exports.hasTemplate = hasTemplate;
async function getTemplate(id) {
    const templates = (await getTemplates())
        .filter((t) => t.id == id);
    if (templates.length == 0)
        return null;
    try {
        let doc = null;
        if (templates[0].url) {
            doc = await (await (0, node_fetch_1.default)(templates[0].url)).text();
        }
        return doc;
    }
    catch (error) {
        console.error('Could not fetch template text ', error);
        return null;
    }
}
exports.getTemplate = getTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0VGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0VGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDZDQUFvQztBQUNwQyw0REFBK0I7QUFFeEIsS0FBSyxVQUFVLFlBQVk7SUFDaEMsTUFBTSxLQUFLLEdBQUcsd0ZBQXdGLENBQUM7SUFDdkcsSUFBSTtRQUNGLElBQUksU0FBUyxHQUFHLE1BQU0sSUFBQSxtQkFBTSxFQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ25DLFNBQVMsR0FBRyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7UUFDNUUsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sRUFBRSxDQUFDO0tBQ1g7QUFDSCxDQUFDO0FBVEQsb0NBU0M7QUFFTSxLQUFLLFVBQVUsV0FBVyxDQUFDLFlBQW9CO0lBQ3BELE1BQU0sS0FBSyxHQUFHLDRDQUE0QyxZQUFZLDZEQUE2RCxDQUFDO0lBRXBJLElBQUk7UUFDRixJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUEsbUJBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQTtRQUNsQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0tBQzFDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRSxPQUFPLENBQUMsQ0FBQyxDQUFBO0tBQ1Y7QUFDSCxDQUFDO0FBVkQsa0NBVUM7QUFFTSxLQUFLLFVBQVUsV0FBVyxDQUFDLEVBQVU7SUFDMUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFNLFlBQVksRUFBRSxDQUFDO1NBQ3ZDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBRSxFQUFFLENBQUMsQ0FBQTtJQUN0QixJQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztRQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ3BDLElBQUk7UUFDSixJQUFJLEdBQUcsR0FBa0IsSUFBSSxDQUFDO1FBQzlCLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtZQUNwQixHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBQSxvQkFBSyxFQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3BEO1FBQ0QsT0FBTyxHQUFHLENBQUM7S0FDWjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2RCxPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQWRELGtDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtydW5TUUx9IGZyb20gJy4vbXlTUUxTdG9yZSc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUZW1wbGF0ZXMoKTogUHJvbWlzZTxhbnlbXT4ge1xuICBjb25zdCBxdWVyeSA9IFwiU0VMRUNUICogRlJPTSB1cGxvYWRfZmlsZSAgV0hFUkUgZXh0ID0gJy5odG1sJyBBTkQgYWx0ZXJuYXRpdmVUZXh0ID0gJ2VtYWlsX3RlbXBsYXRlJztcIjtcbiAgdHJ5IHtcbiAgICBsZXQgdGVtcGxhdGVzID0gYXdhaXQgcnVuU1FMKHF1ZXJ5KVxuICAgIHRlbXBsYXRlcyA9IHRlbXBsYXRlcyAmJiAhQXJyYXkuaXNBcnJheSh0ZW1wbGF0ZXMpID8gW3RlbXBsYXRlc10gOiB0ZW1wbGF0ZXNcbiAgICByZXR1cm4gdGVtcGxhdGVzO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYXNUZW1wbGF0ZSh0ZW1wbGF0ZU5hbWU6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gIGNvbnN0IHF1ZXJ5ID0gYFNFTEVDVCAqIEZST00gdXBsb2FkX2ZpbGUgIFdIRVJFIG5hbWUgPSAnJHt0ZW1wbGF0ZU5hbWV9JyBBTkQgZXh0ID0gJy5odG1sJyBBTkQgYWx0ZXJuYXRpdmVUZXh0ID0gJ2VtYWlsX3RlbXBsYXRlJztgO1xuXG4gIHRyeSB7XG4gICAgbGV0IHRlbXBsYXRlID0gYXdhaXQgcnVuU1FMKHF1ZXJ5KVxuICAgIHJldHVybiB0ZW1wbGF0ZSA/IHRlbXBsYXRlLmlkIDogdGVtcGxhdGU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIHNlYXJjaGluZyBmb3IgdGVtcGxhdGUgY2FsbGVkICclcydcIiwgdGVtcGxhdGVOYW1lLCBlcnJvcik7XG4gICAgcmV0dXJuIC0xXG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRlbXBsYXRlKGlkOiBudW1iZXIpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgY29uc3QgdGVtcGxhdGVzID0gKGF3YWl0IGdldFRlbXBsYXRlcygpKVxuICAuZmlsdGVyKCh0KT0+dC5pZD09aWQpXG4gIGlmKHRlbXBsYXRlcy5sZW5ndGggPT0gMCkgcmV0dXJuIG51bGw7XG4gICAgdHJ5IHtcbiAgICBsZXQgZG9jOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgICBpZiAodGVtcGxhdGVzWzBdLnVybCkge1xuICAgICAgZG9jID0gYXdhaXQgKGF3YWl0IGZldGNoKHRlbXBsYXRlc1swXS51cmwpKS50ZXh0KCk7XG4gICAgfVxuICAgIHJldHVybiBkb2M7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IGZldGNoIHRlbXBsYXRlIHRleHQgJywgZXJyb3IpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG4iXX0=