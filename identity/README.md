# قوالب هوية الرفادة (بديل Canva)

مولَّدة من الشعار العمودي المعتمد (`assets/logo.png`) بمقاسات فعلية بالمليمتر وقصّ 3 مم، والنصوص حيّة (IBM Plex).

| الملف | المحتوى |
|---|---|
| `out/letterhead_print.pdf` / `letterhead_office_print.pdf` | A4: نسخة المطبعة بقوس، ونسخة المكتب بلا قوس |
| `out/business_card_print.pdf` | 90×50 مم، وجهان |
| `out/envelope_dl_print.pdf` | DL 220×110 مم، وجه + جناح |
| `out/social_*_preview.png` | منشور 1080×1350 ومربع 1080×1080 وقصة 1080×1920 |
| `out/email_signature_preview.png` + `src/email_signature.html` | التوقيع (الشعار `assets/signature_logo.png`) |
| `out/pilgrim_cards_print.pdf` | بطاقة الحاج 54×85.6 مم، وجهان لكل حاج |
| `out/staff_card_print.pdf` | بطاقة الموظف 85.6×54 مم، وجهان |

الملفات `*_preview.png` فيها خطوط إرشاد زرقاء متقطعة (فتحة التعليق ومنطقة العنوان)، ولا تظهر في ملفات الطباعة.

## بطاقات الحجاج بالجملة
```
pip install pillow segno
python3 build.py data/pilgrims.csv
```
أعمدة الجدول: `pilgrim_id,name_ar,name_en,group_no,group_color,photo,hotel_makkah_ar,hotel_makkah_en,camp_mina_ar,camp_mina_en,emergency_no,qr_url`
(انظر `data/pilgrims_sample.csv`). لون الشريط يُحسب من رقم المجموعة (8 ألوان تتكرر)، و`photo` مسار ملف أو رابط، و`qr_url` رابط الصفحة المحمية. يطبع السكربت تحذيراً إن تجاوز اسمٌ حدّ الطول (26 حرفاً عربياً / 34 لاتينياً).

## ملاحظات
- النسخة الأفقية من الشعار لم تصلني، فاستُخدم العمودي في كل القوالب. أبعاد الخانات محسوبة على العمودي.
- القوس هو الحلقتان المقصوصتان من الشعار نفسه، ومركزهما زاوية الصفحة، دون تدوير أو تلوين.
- `logo_black.png` و`logo_white.png` مشتقتان أحاديتا اللون وتحتاجان اعتماد صاحب العلامة.
- الأسماء والأرقام والروابط في القوالب بيانات تجريبية (`example.com`).
