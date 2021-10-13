import {runSQL} from './mySQLStore';
import fetch from 'node-fetch';

export async function getTemplates(): Promise<any[]> {
  const query = "SELECT * FROM wunder.upload_file  WHERE ext = '.html' AND alternativeText = 'email_template';";
  try {
    let templates = await runSQL(query)
    templates = templates && !Array.isArray(templates) ? [templates] : templates
    return templates;
  } catch (e) {
    return [];
  }
}

export async function hasTemplate(templateName: string): Promise<number> {
  const query = `SELECT * FROM wunder.upload_file  WHERE name = '${templateName}' AND ext = '.html' AND alternativeText = 'email_template';`;

  try {
    let template = await runSQL(query)
    return template ? template.id : template;
  } catch (error) {
    console.error("Error searching for template called '%s'", templateName, error);
    return -1
  }
}

export async function getTemplate(id: number): Promise<string | null> {
  const templates = (await getTemplates())
  .filter((t)=>t.id==id)
  if(templates.length == 0) return null;
    try {
    let doc: string | null = null;
    if (templates[0].url) {
      doc = await (await fetch(templates[0].url)).text();
    }
    return doc;
  } catch (error) {
    console.error('Could not fetch template text ', error);
    return null;
  }
}
