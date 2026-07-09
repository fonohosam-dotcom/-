# هيكلية مشروع تكافل (Architecture Documentation)

## 📌 نظرة عامة
تم تصميم مشروع "تكافل" (Takaful Platform) ليكون منصة مرنة، قابلة للتطوير (Scalable)، وآمنة، تعتمد على بنية الخادم والعميل (Client-Server Architecture) بأسلوب حديث لتلبية متطلبات المشاريع الخيرية عالية الحساسية للبيانات.

---

## 🏗️ البنية التقنية (Tech Stack)

### الواجهة الأمامية (Frontend)
- **الإطار**: React 19 + TypeScript
- **أداة البناء**: Vite
- **التصميم وتجربة المستخدم**: Tailwind CSS, Shadcn UI
- **إدارة الحالة**: Zustand (للحالة العامة)، React Query (لبيانات الخادم).
- **أدوات إضافية**: Leaflet (للخرائط)، Recharts (للرسوم البيانية).

### الواجهة الخلفية (Backend)
- **البيئة**: Node.js + Express.js
- **لغة البرمجة**: TypeScript
- **الأمان**: Helmet, Express Rate Limit, تشفير مخصص (AES-256-GCM) للبيانات الحساسة.
- **التكامل مع الذكاء الاصطناعي**: Google Gemini API لتحليل الحالات والتوصيات.

### قواعد البيانات (Database & ORM)
- **قاعدة البيانات الأساسية**: PostgreSQL (Relational Database مناسبة للمعاملات المالية وسجلات الأستاذ).
- **ORM**: Drizzle ORM (مكتوب بـ TypeScript ويوفر استعلامات آمنة وأنواع بيانات دقيقة).

### المصادقة (Authentication)
- **نظام المصادقة**: Firebase Authentication
- **التحقق (Server-side)**: Firebase Admin SDK يتم استخدامه للتحقق من رموز (JWT) لطلبات الـ API.

---

## 🗄️ مخطط قاعدة البيانات (Database Schema - ERD Concept)

يعتمد المخطط على جداول مترابطة لإدارة العمليات بشكل متكامل:

1. **المستخدمين (`users`)**
   - يدير حسابات المواطنين، المتبرعين، الباحثين الاجتماعيين، الأطباء، ومسؤولي النظام.
   - يعتمد على `uid` من Firebase للمصادقة.
   - يتضمن صلاحيات `permissions` وحالة التلعيب `gamificationPoints`.

2. **الحالات (`cases`)**
   - لتسجيل طلبات المساعدة.
   - يرتبط بـ `users` عبر `user_id`.
   - يتضمن مستوى الأولوية، المبلغ المطلوب، الموقع الجغرافي (`latitude`, `longitude`)، وحالة الطلب.

3. **المشاريع الكبرى (`major_projects`)**
   - لجمع التبرعات لمشاريع البنية التحتية، المستشفيات، أو المشاريع المجتمعية.

4. **الصناديق (`funds`)**
   - يحتوي على أرصدة الصناديق المختلفة (زكاة، صدقة جارية، كفارة).

5. **سجل الأستاذ (`ledger_entries`)**
   - حجر الأساس للشفافية المالية في المنصة.
   - يسجل كل معاملة مالية بمبدأ القيد المزدوج (Debit / Credit).

6. **التقارير المجتمعية (`community_reports`)**
   - يسمح للمواطنين بالإبلاغ عن حالات محتاجة أو عن حالات تلاعب.

7. **سجلات التدقيق (`audit_trails`)**
   - يسجل جميع الأفعال الحساسة في النظام لأغراض التتبع الأمني والمراجعة.

---

## 🔒 استراتيجية الأمان (Security Strategy)

- **حماية البيانات الحساسة**: يتم تشفير بيانات المواطنين الحساسة (مثل الرقم الوطني) قبل حفظها في قاعدة البيانات باستخدام مفتاح تشفير مخصص (`AES_SECRET_KEY`).
- **حماية واجهات API**: جميع الواجهات محمية بخطوات تحقق من `JWT` لضمان هوية المرسل وصلاحياته (RBAC).
- **حماية الشبكة**: استخدام `cors` لتحديد النطاقات المسموح لها بالتواصل مع الـ API، واستخدام `express-rate-limit` للحماية من هجمات DDoS.
- **التدقيق**: يتم تسجيل كل إجراء جوهري في جدول `audit_trails`.

---

## 🚀 خطة النشر (Deployment Strategy)

- **الواجهة والخادم**: يتم بناء الخادم مع ملفات الواجهة الأمامية ليُخدَّم من خلال خادم Node.js واحد باستخدام ملف `Dockerfile`.
- **الاستضافة**: المنصة مهيأة للعمل على أي خدمة حاويات مثل **Google Cloud Run**، **AWS Fargate**، أو **Docker Swarm**.
- **البيئة المحلية**: يمكن للمطورين تشغيل قاعدة بيانات PostgreSQL محلياً باستخدام `docker-compose.yml` المرفق مع المشروع.

## ERD (Entity Relationship Diagram)
- **Users**: (id, role, email, password_hash, status)
- **Cases**: (id, title, description, targetAmount, currentAmount, category, status, lat, lng, createdBy)
- **MajorProjects**: (id, title, description, budget, currentFunding, status, expectedCompletion, category, votes)
- **LedgerEntries**: (id, caseId, amount, type, relatedDonationId, createdAt)
- **CommunityReports**: (id, reporterId, caseId, description, evidenceUrl, status)
- **Funds**: (id, type, balance, totalIn, totalOut)

## API Endpoints (Swagger/OpenAPI style summary)
### Auth
- \`POST /api/auth/register\`: Register a new user
- \`POST /api/auth/login\`: Authenticate and get JWT

### Cases
- \`GET /api/cases\`: List all cases
- \`POST /api/cases\`: Create a new case
- \`PUT /api/cases/:id/status\`: Update case status
- \`POST /api/cases/:id/disburse\`: Close a funded case and disburse funds

### AI & Integrations
- \`POST /api/ai/fatwa\`: Get AI consultation on Zakat
- \`POST /api/ai/describe-image\`: AI analysis of case images
- \`POST /api/ai/scan-document\`: AI OCR for medical/national ID documents
- \`POST /api/ai/reconstruction-search\`: AI Google Grounded Search for rebuilding efforts

## Migration Strategy
- Development: `SQLite` via `better-sqlite3`.
- Production: Migration plan to `PostgreSQL` using Drizzle ORM when scaling up, with Redis for session caching.
