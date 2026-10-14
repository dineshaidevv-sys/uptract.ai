const SPREADSHEET_ID = '1X6n5p1pAXf5Lgh9Hx8tKPUwwi8KuUdWXNA5gPcp7REE';

const DOMAIN_LABELS = {
  'software-engineering': 'Software Engineering',
  'ui-ux-product-design': 'UI/UX & Product Design',
  'data-science-ai': 'Data Science & AI',
  'product-management': 'Product Management',
  'career-transition': 'Career Transition',
};

function doPost(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const requestId = String(parameters.requestId || '');

  try {
    const name = String(parameters.name || '').trim();
    const email = String(parameters.email || '').trim();
    const mobile = String(parameters.mobile || '').trim();
    const graduationYear = String(parameters.graduationYear || '').trim();
    const organization = String(parameters.organization || '').trim();
    const domain = String(parameters.domain || '');

    if (!requestId || !name || name.length > 200
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || !/^\+?[0-9() .-]{7,25}$/.test(mobile)
      || !/^\d{4}$/.test(graduationYear) || Number(graduationYear) < 1950 || Number(graduationYear) > 2100
      || !organization || organization.length > 200
      || !Object.prototype.hasOwnProperty.call(DOMAIN_LABELS, domain)) {
      return responsePage(requestId, false);
    }

    if (SPREADSHEET_ID === 'PASTE_GOOGLE_SHEET_ID_HERE') {
      throw new Error('Set SPREADSHEET_ID to the ID of the destination spreadsheet.');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheets()[0];
    if (!sheet) throw new Error('The spreadsheet has no sheet tab.');

    const headers = ['Submitted At', 'Name', 'Email', 'Domain', 'Mobile Number', 'Year of Graduation', 'College or Company'];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    } else {
      const existingHeaders = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
      if (existingHeaders[0] === 'Submitted At' && existingHeaders[1] === 'Name'
        && existingHeaders[2] === 'Email' && existingHeaders[3] === 'Domain') {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }

    sheet.appendRow([
      new Date(),
      safeCell(name),
      safeCell(email),
      DOMAIN_LABELS[domain],
      safeCell(mobile),
      Number(graduationYear),
      safeCell(organization),
    ]);

    return responsePage(requestId, true);
  } catch (error) {
    console.error('Could not save website enquiry: ' + error.message);
    return responsePage(requestId, false);
  }
}

function safeCell(value) {
  return /^\s*[=+\-@]/.test(value) ? "'" + value : value;
}

function responsePage(requestId, ok) {
  const payload = JSON.stringify({
    type: 'uptract-sheet-response',
    requestId: requestId,
    ok: ok,
  }).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><html><body><script>window.top.postMessage('
      + payload
      + ', "*");</script></body></html>',
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
