export interface SheetRow {
  theme: string;
  code: string;
  name: string;
  description: string;
  weight: number;
  parameters: string;
}

export async function createMatrixSpreadsheet(folderId: string, accessToken: string): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const metadata = {
    name: 'STV Brain DB Matrix Sync',
    mimeType: 'application/vnd.google-apps.spreadsheet',
    parents: [folderId]
  };

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers,
      body: JSON.stringify(metadata)
    });
    if (!res.ok) {
      throw new Error(`Failed to create spreadsheet: ${res.statusText}`);
    }
    const data = await res.json();
    return data.id;
  } catch (error) {
    console.error('Error creating spreadsheet file:', error);
    throw error;
  }
}

export async function listSpreadsheetsInFolder(folderId: string, accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const query = encodeURIComponent(`'${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,webViewLink)`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list spreadsheets: ${res.statusText}`);
    }
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing spreadsheets:', error);
    return [];
  }
}

export async function readSpreadsheetValues(spreadsheetId: string, accessToken: string): Promise<SheetRow[]> {
  const headers = { Authorization: `Bearer ${accessToken}` };
  
  try {
    // We first check the sheet metadata to find the name of the first tab
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, { headers });
    if (!metaRes.ok) {
      throw new Error(`Failed to read spreadsheet metadata: ${metaRes.statusText}`);
    }
    const meta = await metaRes.json();
    const sheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

    // Fetch the cells from the entire active sheet range
    const range = `${sheetName}!A1:F100`;
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to fetch sheet values: ${res.statusText}`);
    }
    const data = await res.json();
    const rows: string[][] = data.values || [];
    
    if (rows.length <= 1) {
      return []; // empty or only contains headers
    }

    // Index columns by header name (just in case they order columns differently)
    const headersRow = rows[0].map(h => h.toLowerCase().trim());
    const themeIdx = headersRow.indexOf('theme');
    const codeIdx = headersRow.indexOf('code id') !== -1 ? headersRow.indexOf('code id') : headersRow.indexOf('code');
    const nameIdx = headersRow.indexOf('rule/node title') !== -1 ? headersRow.indexOf('rule/node title') : headersRow.indexOf('name');
    const descIdx = headersRow.indexOf('description') !== -1 ? headersRow.indexOf('description') : headersRow.indexOf('functional description');
    const weightIdx = headersRow.indexOf('gravity mass') !== -1 ? headersRow.indexOf('gravity mass') : headersRow.indexOf('weight');
    const paramsIdx = headersRow.indexOf('operational parameters') !== -1 ? headersRow.indexOf('operational parameters') : headersRow.indexOf('parameters');

    const result: SheetRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const theme = row[themeIdx !== -1 ? themeIdx : 0] || 'Structural Core';
      const code = row[codeIdx !== -1 ? codeIdx : 1] || `SYNC-${i}`;
      const name = row[nameIdx !== -1 ? nameIdx : 2] || 'Unnamed Node';
      const description = row[descIdx !== -1 ? descIdx : 3] || '';
      const weightRaw = row[weightIdx !== -1 ? weightIdx : 4] || '0.5';
      const weight = isNaN(Number(weightRaw)) ? 0.5 : Number(weightRaw);
      const parameters = row[paramsIdx !== -1 ? paramsIdx : 5] || '';

      if (code && name) {
        result.push({ theme, code, name, description, weight, parameters });
      }
    }

    return result;
  } catch (error) {
    console.error('Error reading spreadsheet values:', error);
    throw error;
  }
}

export async function writeSpreadsheetValues(spreadsheetId: string, sheetRows: SheetRow[], accessToken: string): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Fetch spreadsheet metadata to get the active sheet name
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`, { headers });
    if (!metaRes.ok) {
      throw new Error(`Failed to read spreadsheet metadata: ${metaRes.statusText}`);
    }
    const meta = await metaRes.json();
    const sheetName = meta.sheets?.[0]?.properties?.title || 'Sheet1';

    // 2. Prepare grid table headers and values
    const gridData = [
      ['Theme', 'Code ID', 'Rule/Node Title', 'Functional Description', 'Gravity Mass', 'Operational Parameters']
    ];

    sheetRows.forEach(row => {
      gridData.push([
        row.theme,
        row.code,
        row.name,
        row.description,
        row.weight.toString(),
        row.parameters
      ]);
    });

    // 3. Clear existing sheet content
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:F150:clear`, {
      method: 'POST',
      headers
    });

    // 4. Write new sheet values
    const range = `${sheetName}!A1:F${gridData.length}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
    const writeRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        values: gridData
      })
    });

    if (!writeRes.ok) {
      throw new Error(`Failed to write sheet values: ${writeRes.statusText}`);
    }
  } catch (error) {
    console.error('Error writing spreadsheet values:', error);
    throw error;
  }
}
