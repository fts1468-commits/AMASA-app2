# AMASA | منصة إدارة وحجوزات الشاليهات والاستراحات

منصة متكاملة لإدارة وحجوزات الشاليهات والاستراحات الفاخرة، إدارة الموظفين والمسوقين (نظام العمولات 5%)، وعمليات الدخول والخروج للحارس.

---

## تشغيل نسخة الإنتاج الجاهزة (بدون أي اعتمادات أو npm install):

إذا كنت في بيئة مغلقة (Offline / لا يوجد اتصال بـ npmjs.org):
1. قم بفك ضغط ملف `amasa-dist.zip`.
2. شغّل مباشرة عبر Node.js:
   ```bash
   node serve.cjs
   ```
   أو عبر Python:
   ```bash
   python3 serve.py
   ```
   أو:
   ```bash
   python3 -m http.server 3000
   ```
3. افتح المتصفح على: `http://localhost:3000`

---

## تشغيل الكود المصدري في وضع التطوير (Development):

إذا كان لديك اتصال بالإنترنت لتثبيت الحزم:
```bash
npm install
npm run dev
```

لإعادة بناء نسخة الإنتاج:
```bash
npm run build
```

---

## التقنيات المستخدمة:
- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Lucide React Icons
