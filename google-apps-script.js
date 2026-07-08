var EMAIL = 'roee.lahav@philips.com';
var SHEET_NAME = 'דיווחים';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['תאריך', 'שעה', 'שם', 'פריטים ברשותו', 'פריטים חסרים']);
  }

  sheet.appendRow([
    data.date,
    data.time,
    data.name,
    data.checkedItems.join(', '),
    data.uncheckedItems.join(', ')
  ]);

  return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendDailyReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return;

  var today = new Date();
  var todayStr = today.getFullYear() + '-' +
    String(today.getMonth()+1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');

  var data = sheet.getDataRange().getValues();
  var todayRows = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === todayStr) {
      todayRows.push(data[i]);
    }
  }

  if (todayRows.length === 0) {
    MailApp.sendEmail({
      to: EMAIL,
      subject: 'דו"ח ציוד יומי - ' + todayStr + ' - אין דיווחים',
      htmlBody: '<div dir="rtl" style="font-family:Arial,sans-serif;">' +
        '<h2>דו"ח ציוד יומי - ' + todayStr + '</h2>' +
        '<p style="color:red;font-weight:bold;">לא התקבלו דיווחים היום.</p>' +
        '</div>'
    });
    return;
  }

  var html = '<div dir="rtl" style="font-family:Arial,sans-serif;">';
  html += '<h2>דו"ח ציוד יומי - ' + todayStr + '</h2>';
  html += '<p>סה"כ דיווחים: <strong>' + todayRows.length + '</strong></p>';
  html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;text-align:right;">';
  html += '<tr style="background:#c0392b;color:white;">';
  html += '<th>שעה</th><th>שם</th><th>ברשותו</th><th>חסר</th>';
  html += '</tr>';

  for (var j = 0; j < todayRows.length; j++) {
    var row = todayRows[j];
    var bgColor = j % 2 === 0 ? '#f9f9f9' : '#ffffff';
    html += '<tr style="background:' + bgColor + ';">';
    html += '<td>' + row[1] + '</td>';
    html += '<td><strong>' + row[2] + '</strong></td>';
    html += '<td>' + row[3] + '</td>';
    html += '<td style="color:red;">' + (row[4] || '-') + '</td>';
    html += '</tr>';
  }

  html += '</table></div>';

  MailApp.sendEmail({
    to: EMAIL,
    subject: 'דו"ח ציוד יומי - ' + todayStr + ' (' + todayRows.length + ' דיווחים)',
    htmlBody: html
  });
}

function createDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'sendDailyReport') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(20)
    .create();
}
