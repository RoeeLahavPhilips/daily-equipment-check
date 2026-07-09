// ==== DAILY EQUIPMENT CHECK - EMAIL ONLY (NO SHEETS) ====
// Deploy as Web App: Execute as Me, Anyone can access
// After deploy: run createDailyTrigger() once, then run sendTestEmail() to test

var EMAIL = 'roee.lahav@philips.com';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var today = data.date;
  var stored = PropertiesService.getScriptProperties().getProperty(today);
  var entries = stored ? JSON.parse(stored) : [];
  entries.push({
    name: data.name,
    time: data.time,
    checkedItems: data.checkedItems,
    uncheckedItems: data.uncheckedItems
  });
  PropertiesService.getScriptProperties().setProperty(today, JSON.stringify(entries));
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendDailyReport() {
  var now = new Date();
  var today = now.getFullYear() + '-' +
    String(now.getMonth()+1).padStart(2,'0') + '-' +
    String(now.getDate()).padStart(2,'0');

  var stored = PropertiesService.getScriptProperties().getProperty(today);
  var entries = stored ? JSON.parse(stored) : [];

  var html = buildEmailHtml(today, entries);
  var subject = entries.length > 0
    ? 'דו"ח ציוד יומי - ' + today + ' (' + entries.length + ' לוחמים)'
    : 'דו"ח ציוד יומי - ' + today + ' - אין דיווחים';

  MailApp.sendEmail({
    to: EMAIL,
    subject: subject,
    htmlBody: html
  });
}

function sendTestEmail() {
  var today = new Date();
  var todayStr = today.getFullYear() + '-' +
    String(today.getMonth()+1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');

  var testEntries = [
    { name: 'רועי להב', time: '11:40', checkedItems: ['נשק אישי', 'כוונת השלכה', 'אמרל', 'רימון רסס x2', 'קשר 710'], uncheckedItems: [] }
  ];

  var html = buildEmailHtml(todayStr, testEntries);
  MailApp.sendEmail({
    to: EMAIL,
    subject: '[בדיקה] דו"ח ציוד יומי - ' + todayStr + ' (1 לוחמים)',
    htmlBody: html
  });
}

function buildEmailHtml(dateStr, entries) {
  var html = '';
  html += '<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">';
  html += '<div style="background:#111;padding:24px;border-radius:12px;">';
  html += '<div style="text-align:center;border-bottom:2px solid #c0392b;padding-bottom:16px;margin-bottom:20px;">';
  html += '<h1 style="color:#fff;margin:0 0 8px 0;font-size:1.4rem;">דו"ח ציוד יומי</h1>';
  html += '<p style="color:#e74c3c;margin:0;font-size:1.1rem;font-weight:600;">' + dateStr + '</p>';
  html += '</div>';

  if (entries.length === 0) {
    html += '<div style="background:#2d1a1a;border:1px solid #c0392b;border-radius:10px;padding:20px;text-align:center;">';
    html += '<p style="color:#e74c3c;font-size:1.1rem;font-weight:600;margin:0;">לא התקבלו דיווחים היום</p>';
    html += '</div>';
  } else {
    html += '<div style="background:#1a2e1a;border:1px solid #3a7a3a;border-radius:10px;padding:12px;text-align:center;margin-bottom:16px;">';
    html += '<p style="color:#6fcf6f;font-size:1rem;font-weight:600;margin:0;">סה"כ דיווחו: ' + entries.length + ' לוחמים</p>';
    html += '</div>';

    html += '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">';
    html += '<tr style="background:#c0392b;">';
    html += '<th style="padding:10px;color:#fff;text-align:right;">שם</th>';
    html += '<th style="padding:10px;color:#fff;text-align:right;">שעה</th>';
    html += '<th style="padding:10px;color:#fff;text-align:right;">ברשותו</th>';
    html += '<th style="padding:10px;color:#fff;text-align:right;">חסר</th>';
    html += '</tr>';

    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var bg = i % 2 === 0 ? '#1a1a1a' : '#222';
      html += '<tr style="background:' + bg + ';">';
      html += '<td style="padding:10px;color:#fff;font-weight:600;">' + e.name + '</td>';
      html += '<td style="padding:10px;color:#aaa;">' + e.time + '</td>';
      html += '<td style="padding:10px;color:#6fcf6f;">' + (e.checkedItems.length > 0 ? e.checkedItems.join(', ') : '-') + '</td>';
      html += '<td style="padding:10px;color:#e74c3c;">' + (e.uncheckedItems.length > 0 ? e.uncheckedItems.join(', ') : '-') + '</td>';
      html += '</tr>';
    }
    html += '</table>';
  }

  html += '<div style="margin-top:20px;padding-top:12px;border-top:1px solid #333;text-align:center;">';
  html += '<p style="color:#666;font-size:0.8rem;margin:0;">נשלח אוטומטית ב-17:00 | בדיקת ציוד יומית - מילואים</p>';
  html += '</div>';
  html += '</div></div>';
  return html;
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
    .atHour(17)
    .create();
}
