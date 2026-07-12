// ==== DAILY EQUIPMENT CHECK - EMAIL REPORTS ====
// Deploy as Web App: Execute as Me, Anyone can access
// After deploy: run createAllTriggers() once

var DAILY_EMAILS = ['roee.lahav@philips.com', 'kpobigitel@gmail.com'];
var WEEKLY_EMAIL = 'roee.lahav@philips.com';

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

// ===== DAILY REPORT (17:00 every day) =====
function sendDailyReport() {
  var now = new Date();
  var today = formatDateKey(now);

  var stored = PropertiesService.getScriptProperties().getProperty(today);
  var entries = stored ? JSON.parse(stored) : [];

  var html = buildDailyEmailHtml(today, entries);
  var subject = entries.length > 0
    ? 'דו"ח ציוד יומי - ' + today + ' (' + entries.length + ' לוחמים)'
    : 'דו"ח ציוד יומי - ' + today + ' - אין דיווחים';

  MailApp.sendEmail({
    to: DAILY_EMAILS.join(','),
    subject: subject,
    htmlBody: html
  });
}

// ===== WEEKLY REPORT (Sunday for past Sun-Sat) =====
function sendWeeklyReport() {
  var now = new Date();
  var endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() - 1); // Saturday
  var startOfWeek = new Date(endOfWeek);
  startOfWeek.setDate(endOfWeek.getDate() - 6); // Previous Sunday

  var allEntries = [];
  var daysSummary = [];

  for (var d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
    var dateKey = formatDateKey(d);
    var stored = PropertiesService.getScriptProperties().getProperty(dateKey);
    var entries = stored ? JSON.parse(stored) : [];
    daysSummary.push({ date: dateKey, entries: entries });
    for (var i = 0; i < entries.length; i++) {
      allEntries.push({ date: dateKey, name: entries[i].name, time: entries[i].time, checkedItems: entries[i].checkedItems, uncheckedItems: entries[i].uncheckedItems });
    }
  }

  var startStr = formatDateKey(startOfWeek);
  var endStr = formatDateKey(endOfWeek);

  var html = buildWeeklyEmailHtml(startStr, endStr, daysSummary, allEntries);
  var subject = 'דו"ח ציוד שבועי - ' + startStr + ' עד ' + endStr + ' (' + allEntries.length + ' דיווחים)';

  MailApp.sendEmail({
    to: WEEKLY_EMAIL,
    subject: subject,
    htmlBody: html
  });
}

// ===== HTML BUILDERS =====
function buildDailyEmailHtml(dateStr, entries) {
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
    html += buildEntriesTable(entries);
  }

  html += '<div style="margin-top:20px;padding-top:12px;border-top:1px solid #333;text-align:center;">';
  html += '<p style="color:#666;font-size:0.8rem;margin:0;">נשלח אוטומטית ב-17:00 | בדיקת ציוד יומית - מילואים</p>';
  html += '</div>';
  html += '</div></div>';
  return html;
}

function buildWeeklyEmailHtml(startStr, endStr, daysSummary, allEntries) {
  var html = '';
  html += '<div dir="rtl" style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;">';
  html += '<div style="background:#111;padding:24px;border-radius:12px;">';
  html += '<div style="text-align:center;border-bottom:2px solid #c0392b;padding-bottom:16px;margin-bottom:20px;">';
  html += '<h1 style="color:#fff;margin:0 0 8px 0;font-size:1.4rem;">דו"ח ציוד שבועי</h1>';
  html += '<p style="color:#e74c3c;margin:0;font-size:1.1rem;font-weight:600;">' + startStr + ' — ' + endStr + '</p>';
  html += '</div>';

  // Summary box
  html += '<div style="background:#1a2e1a;border:1px solid #3a7a3a;border-radius:10px;padding:12px;text-align:center;margin-bottom:16px;">';
  html += '<p style="color:#6fcf6f;font-size:1rem;font-weight:600;margin:0;">סה"כ דיווחים השבוע: ' + allEntries.length + '</p>';
  html += '</div>';

  // Per-day breakdown
  for (var d = 0; d < daysSummary.length; d++) {
    var day = daysSummary[d];
    html += '<div style="margin-bottom:16px;">';
    html += '<h3 style="color:#e74c3c;margin:0 0 8px 0;font-size:1rem;border-bottom:1px solid #333;padding-bottom:6px;">' + day.date + ' (' + day.entries.length + ' לוחמים)</h3>';
    if (day.entries.length === 0) {
      html += '<p style="color:#666;font-size:0.85rem;margin:4px 0;">אין דיווחים</p>';
    } else {
      html += buildEntriesTable(day.entries);
    }
    html += '</div>';
  }

  html += '<div style="margin-top:20px;padding-top:12px;border-top:1px solid #333;text-align:center;">';
  html += '<p style="color:#666;font-size:0.8rem;margin:0;">נשלח אוטומטית כל יום ראשון | בדיקת ציוד יומית - מילואים</p>';
  html += '</div>';
  html += '</div></div>';
  return html;
}

function buildEntriesTable(entries) {
  var html = '';
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
  return html;
}

// ===== UTILITY =====
function formatDateKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ===== TRIGGERS =====
function createAllTriggers() {
  // Remove old triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // Daily at 17:00
  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(17)
    .create();

  // Weekly on Sunday at 08:00
  ScriptApp.newTrigger('sendWeeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(8)
    .create();
}

// ===== TEST =====
function sendTestEmail() {
  var today = new Date();
  var todayStr = formatDateKey(today);

  var testEntries = [
    { name: 'רועי להב', time: '11:40', checkedItems: ['נשק אישי', 'כוונת השלכה', 'אמרל', 'רימון רסס x2', 'קשר 710'], uncheckedItems: [] }
  ];

  var html = buildDailyEmailHtml(todayStr, testEntries);
  MailApp.sendEmail({
    to: DAILY_EMAILS.join(','),
    subject: '[בדיקה] דו"ח ציוד יומי - ' + todayStr,
    htmlBody: html
  });
}

function sendTestWeeklyEmail() {
  var now = new Date();
  var endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() - 1);
  var startOfWeek = new Date(endOfWeek);
  startOfWeek.setDate(endOfWeek.getDate() - 6);

  var daysSummary = [];
  var allEntries = [];
  for (var d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
    var dateKey = formatDateKey(d);
    var stored = PropertiesService.getScriptProperties().getProperty(dateKey);
    var entries = stored ? JSON.parse(stored) : [];
    daysSummary.push({ date: dateKey, entries: entries });
    for (var i = 0; i < entries.length; i++) {
      allEntries.push(entries[i]);
    }
  }

  var html = buildWeeklyEmailHtml(formatDateKey(startOfWeek), formatDateKey(endOfWeek), daysSummary, allEntries);
  MailApp.sendEmail({
    to: WEEKLY_EMAIL,
    subject: '[בדיקה] דו"ח ציוד שבועי - ' + formatDateKey(startOfWeek) + ' עד ' + formatDateKey(endOfWeek),
    htmlBody: html
  });
}
