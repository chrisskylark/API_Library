"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTemplate = exports.hasTemplate = exports.getTemplates = void 0;
const mySQLStore_1 = require("./mySQLStore");
const node_fetch_1 = __importDefault(require("node-fetch"));
async function getTemplates() {
    const query = "SELECT * FROM wunder.upload_file  WHERE ext = '.html' AND alternativeText = 'email_template';";
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
    const query = `SELECT * FROM wunder.upload_file  WHERE name = '${templateName}' AND ext = '.html' AND alternativeText = 'email_template';`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0VGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0VGVtcGxhdGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDZDQUFvQztBQUNwQyw0REFBK0I7QUFFeEIsS0FBSyxVQUFVLFlBQVk7SUFDaEMsTUFBTSxLQUFLLEdBQUcsK0ZBQStGLENBQUM7SUFDOUcsSUFBSTtRQUNGLElBQUksU0FBUyxHQUFHLE1BQU0sSUFBQSxtQkFBTSxFQUFDLEtBQUssQ0FBQyxDQUFBO1FBQ25DLFNBQVMsR0FBRyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUE7UUFDNUUsT0FBTyxTQUFTLENBQUM7S0FDbEI7SUFBQyxPQUFPLENBQUMsRUFBRTtRQUNWLE9BQU8sRUFBRSxDQUFDO0tBQ1g7QUFDSCxDQUFDO0FBVEQsb0NBU0M7QUFFTSxLQUFLLFVBQVUsV0FBVyxDQUFDLFlBQW9CO0lBQ3BELE1BQU0sS0FBSyxHQUFHLG1EQUFtRCxZQUFZLDZEQUE2RCxDQUFDO0lBRTNJLElBQUk7UUFDRixJQUFJLFFBQVEsR0FBRyxNQUFNLElBQUEsbUJBQU0sRUFBQyxLQUFLLENBQUMsQ0FBQTtRQUNsQyxPQUFPLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0tBQzFDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRSxPQUFPLENBQUMsQ0FBQyxDQUFBO0tBQ1Y7QUFDSCxDQUFDO0FBVkQsa0NBVUM7QUFFTSxLQUFLLFVBQVUsV0FBVyxDQUFDLEVBQVU7SUFDMUMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFNLFlBQVksRUFBRSxDQUFDO1NBQ3ZDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUEsQ0FBQyxDQUFDLEVBQUUsSUFBRSxFQUFFLENBQUMsQ0FBQTtJQUN0QixJQUFHLFNBQVMsQ0FBQyxNQUFNLElBQUksQ0FBQztRQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ3BDLElBQUk7UUFDSixJQUFJLEdBQUcsR0FBa0IsSUFBSSxDQUFDO1FBQzlCLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtZQUNwQixHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sSUFBQSxvQkFBSyxFQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3BEO1FBQ0QsT0FBTyxHQUFHLENBQUM7S0FDWjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2RCxPQUFPLElBQUksQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQWRELGtDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtydW5TUUx9IGZyb20gJy4vbXlTUUxTdG9yZSc7XG5pbXBvcnQgZmV0Y2ggZnJvbSAnbm9kZS1mZXRjaCc7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUZW1wbGF0ZXMoKTogUHJvbWlzZTxhbnlbXT4ge1xuICBjb25zdCBxdWVyeSA9IFwiU0VMRUNUICogRlJPTSB3dW5kZXIudXBsb2FkX2ZpbGUgIFdIRVJFIGV4dCA9ICcuaHRtbCcgQU5EIGFsdGVybmF0aXZlVGV4dCA9ICdlbWFpbF90ZW1wbGF0ZSc7XCI7XG4gIHRyeSB7XG4gICAgbGV0IHRlbXBsYXRlcyA9IGF3YWl0IHJ1blNRTChxdWVyeSlcbiAgICB0ZW1wbGF0ZXMgPSB0ZW1wbGF0ZXMgJiYgIUFycmF5LmlzQXJyYXkodGVtcGxhdGVzKSA/IFt0ZW1wbGF0ZXNdIDogdGVtcGxhdGVzXG4gICAgcmV0dXJuIHRlbXBsYXRlcztcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBbXTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFzVGVtcGxhdGUodGVtcGxhdGVOYW1lOiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICBjb25zdCBxdWVyeSA9IGBTRUxFQ1QgKiBGUk9NIHd1bmRlci51cGxvYWRfZmlsZSAgV0hFUkUgbmFtZSA9ICcke3RlbXBsYXRlTmFtZX0nIEFORCBleHQgPSAnLmh0bWwnIEFORCBhbHRlcm5hdGl2ZVRleHQgPSAnZW1haWxfdGVtcGxhdGUnO2A7XG5cbiAgdHJ5IHtcbiAgICBsZXQgdGVtcGxhdGUgPSBhd2FpdCBydW5TUUwocXVlcnkpXG4gICAgcmV0dXJuIHRlbXBsYXRlID8gdGVtcGxhdGUuaWQgOiB0ZW1wbGF0ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3Igc2VhcmNoaW5nIGZvciB0ZW1wbGF0ZSBjYWxsZWQgJyVzJ1wiLCB0ZW1wbGF0ZU5hbWUsIGVycm9yKTtcbiAgICByZXR1cm4gLTFcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VGVtcGxhdGUoaWQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICBjb25zdCB0ZW1wbGF0ZXMgPSAoYXdhaXQgZ2V0VGVtcGxhdGVzKCkpXG4gIC5maWx0ZXIoKHQpPT50LmlkPT1pZClcbiAgaWYodGVtcGxhdGVzLmxlbmd0aCA9PSAwKSByZXR1cm4gbnVsbDtcbiAgICB0cnkge1xuICAgIGxldCBkb2M6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgIGlmICh0ZW1wbGF0ZXNbMF0udXJsKSB7XG4gICAgICBkb2MgPSBhd2FpdCAoYXdhaXQgZmV0Y2godGVtcGxhdGVzWzBdLnVybCkpLnRleHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvYztcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZmV0Y2ggdGVtcGxhdGUgdGV4dCAnLCBlcnJvcik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cbiJdfQ==