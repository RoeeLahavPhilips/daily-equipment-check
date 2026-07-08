# הגדרת דו"ח יומי במייל

## שלב 1: צור Google Sheet חדש
1. לך ל-https://sheets.google.com ותצור גיליון חדש
2. שנה את השם ל: "בדיקת ציוד יומית"
3. בשורה 1 כתוב את הכותרות: `תאריך | שעה | שם | פריטים ברשותו | פריטים חסרים`

## שלב 2: הוסף Apps Script
1. בגיליון לחץ על Extensions > Apps Script
2. מחק את כל הקוד שיש שם
3. הדבק את הקוד מהקובץ `google-apps-script.js` שבתיקייה הזו
4. שנה את כתובת המייל בשורה הראשונה אם צריך

## שלב 3: Deploy
1. לחץ Deploy > New Deployment
2. בחר Type: Web App
3. Execute as: Me
4. Who has access: Anyone
5. לחץ Deploy ואשר הרשאות
6. **העתק את ה-URL שמקבלים**

## שלב 4: עדכן את האפליקציה
1. פתח את `index.html`
2. מצא את השורה: `var SCRIPT_URL = '';`
3. הדבק את ה-URL שהעתקת

## זהו! מעכשיו:
- כל דיווח נשמר בגיליון
- כל יום ב-20:00 נשלח מייל סיכום ל-roee.lahav@philips.com
