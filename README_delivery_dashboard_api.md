# README — Delivery Dashboard API Integration Guide

هذا الملف يشرح **كل شاشة في واجهة التوصيل** وما هو الـ **endpoint** المناسب لها، وما هي البيانات المطلوبة من الـ API، وكيف يتم تنفيذ الـ actions الموجودة داخل كل كارت.

الهدف من هذا المستند هو أن يكون **مرجع تنفيذ واضح** لأي شخص سيقوم بربط واجهة التوصيل مع الباك إند.

---

## 1) الـ Canonical API المعتمد

هذه هي الـ endpoints الرسمية التي يجب الاعتماد عليها في شاشة التوصيل:

### قراءة البيانات
- `GET /api/dashboard/ops/list`
- `GET /api/dashboard/ops/search`

### تنفيذ الأفعال
- `POST /api/dashboard/ops/actions/:action`

> مهم: لا تعتمد الواجهة الجديدة على الـ endpoints القديمة مثل `/api/courier/*` أو `/api/kitchen/*` إلا لو كان هناك سبب داخلي واضح. العقد الرسمي الجديد هو فقط `/api/dashboard/ops/*`.

---

## 2) شكل البيانات المتوقع من الباك إند

كل عنصر في قائمة التوصيل يجب أن يعود في شكل موحد من نوع:

```ts
interface UnifiedOperationalDTO {
  id: string;
  type: 'subscription' | 'order';
  mode: 'delivery' | 'pickup';
  reference: string;
  status: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };
  customer: {
    name: string;
    phone: string;
  };
  context: {
    date: string;
    window?: string;
    addressSummary?: string;
    pickupCode?: string;
    notes?: string;
  };
  allowedActions: string[];
  timestamps: {
    createdAt: string;
    updatedAt: string;
  };
}
```

---

## 3) الشاشة الرئيسية: صفحة التوصيل

من الصور المرسلة، شاشة التوصيل تحتوي على العناصر التالية:

1. عنوان الصفحة: **التوصيل**
2. بطاقات ملخص أعلى الصفحة:
   - إجمالي طلبات اليوم
   - جاري التوصيل
   - تم التسليم
   - ملغي
3. شريط بحث
4. Tabs / Filters:
   - الكل
   - جاري التوصيل
   - تم التسليم
   - ملغي
5. قائمة الكروت الخاصة بالطلبات
6. داخل كل كارت:
   - اسم العميل
   - رقم الهاتف
   - المرجع مثل `DEL-003`
   - نوع الطلب (اشتراك / طلب مرة واحدة)
   - Timeline أو progress
   - العنوان
   - ملاحظات التوصيل
   - تفاصيل الطلب
   - أزرار تنفيذ مثل:
     - تم التسليم
     - إلغاء
   - زر عرض / إخفاء التفاصيل

---

## 4) أي endpoint تستخدمه الشاشة عند أول تحميل؟

عند فتح شاشة التوصيل أول مرة، يجب استدعاء:

```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD
```

### الغرض
تحميل **كل عناصر التوصيل الخاصة باليوم** بنفس الـ DTO الموحد.

### مثال
```http
GET /api/dashboard/ops/list?date=2026-04-13
```

### ما الذي تستخدمه الواجهة من النتيجة؟
- `data[]` لعرض الكروت
- عدد العناصر الكلي لبطاقة **إجمالي طلبات اليوم**
- حالات العناصر لحساب:
  - جاري التوصيل
  - تم التسليم
  - ملغي

---

## 5) بطاقات الملخص العلوية (Summary Cards)

### العناصر الظاهرة في UI
- إجمالي طلبات اليوم
- جاري التوصيل
- تم التسليم
- ملغي

### الـ endpoint المستخدم
```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD
```

### كيف يتم الحساب؟
من نفس قائمة `data`:

- **إجمالي طلبات اليوم** = عدد العناصر كلها
- **جاري التوصيل** = عدد العناصر التي حالتها `out_for_delivery` أو ما يقابلها في الـ UI
- **تم التسليم** = عدد العناصر التي حالتها `delivered` أو `fulfilled`
- **ملغي** = عدد العناصر التي حالتها `canceled` أو `delivery_canceled`

> لو تم لاحقًا إضافة endpoint منفصل للـ summary مثل `GET /api/dashboard/ops/summary` يمكن للواجهة استخدامه، لكن من الصور الحالية يمكن تشغيل الشاشة بالكامل اعتمادًا على `ops/list`.

---

## 6) شريط التبويبات / الفلاتر

### التبويبات الظاهرة
- الكل
- جاري التوصيل
- تم التسليم
- ملغي

### الـ endpoint المستخدم
نفس endpoint القائمة مع فلتر حالة:

```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=...
```

### Mapping الفلاتر

#### الكل
```http
GET /api/dashboard/ops/list?date=2026-04-13
```

#### جاري التوصيل
```http
GET /api/dashboard/ops/list?date=2026-04-13&status=out_for_delivery
```

#### تم التسليم
```http
GET /api/dashboard/ops/list?date=2026-04-13&status=delivered
```

#### ملغي
```http
GET /api/dashboard/ops/list?date=2026-04-13&status=canceled
```

> لو كان الباك إند يستخدم أسماء داخلية مختلفة مثل `fulfilled` بدل `delivered` لبعض الكيانات، فالواجهة لا تستنتج ذلك بنفسها، بل تعتمد على `ui.label` و `allowedActions`.

---

## 7) شريط البحث

### النص الظاهر في الـ UI
بحث بالاسم، رقم الهاتف، أو العنوان.

### الـ endpoint المستخدم
```http
GET /api/dashboard/ops/search?q=...
```

### أمثلة
```http
GET /api/dashboard/ops/search?q=0501234567
GET /api/dashboard/ops/search?q=أحمد
GET /api/dashboard/ops/search?q=DEL-003
```

### متى يستخدم البحث؟
- عند كتابة المستخدم في مربع البحث
- يفضل تنفيذ البحث بعد debounce بسيط
- الحد الأدنى الموصى به: 3 حروف

### ماذا يعيد؟
نفس نوع الكروت بالضبط، لأن الـ response يجب أن يكون من نفس شكل `UnifiedOperationalDTO`.

---

## 8) الكارت الواحد داخل قائمة التوصيل

كل كارت في الشاشة يعتمد على عنصر واحد من `UnifiedOperationalDTO`.

### 8.1 اسم العميل
- المصدر: `customer.name`

### 8.2 رقم الهاتف
- المصدر: `customer.phone`

### 8.3 المرجع مثل `DEL-003`
- المصدر: `reference`

### 8.4 حالة الكارت كبادج ملونة
مثل:
- جاري التوصيل
- تم التسليم
- ملغي
- قيد التحضير

المصادر:
- `ui.label`
- `ui.color`
- `ui.icon`
- `ui.badgeText` لو كانت مستخدمة

### 8.5 نوع الطلب
مثل:
- اشتراك
- طلب مرة واحدة

المصدر:
- `type`

### 8.6 العنوان
المصدر:
- `context.addressSummary`

### 8.7 ملاحظات التوصيل
المصدر:
- `context.notes` إذا كانت متوفرة

### 8.8 تفاصيل الطلب
يمكن بناؤها من أي تفاصيل إضافية يضيفها الباك إند داخل الـ DTO أو nested details آمنة ومقصودة للعرض.

---

## 9) الـ Timeline / Progress داخل الكارت

الصور توضح Timeline بمراحل مثل:
- قيد التحضير
- خرج للتوصيل / جاري التوصيل
- تم التسليم

### كيف يتم بناؤه؟
من قيمة `status` + `mode` + `ui.label`.

### Mapping مقترح للواجهة

| الحالة الداخلية | المرحلة الظاهرة |
|---|---|
| `preparing` | قيد التحضير |
| `out_for_delivery` | خرج للتوصيل / جاري التوصيل |
| `delivered` | تم التسليم |
| `canceled` | ملغي |

> لا تجعل الواجهة تختلق الـ transitions. الواجهة تعرض فقط المرحلة الحالية القادمة من الباك إند.

---

## 10) زر عرض التفاصيل / إخفاء التفاصيل

هذا ليس له endpoint مستقل.

### السلوك
- عند تحميل القائمة، يكون لدى الواجهة كل البيانات اللازمة داخل نفس العنصر
- زر عرض التفاصيل فقط يفتح أو يغلق التفاصيل محليًا داخل الـ UI
- لا حاجة لطلب API جديد لكل expand/collapse

### الاستثناء
لو لاحقًا تقرر أن التفاصيل ثقيلة جدًا، يمكن إنشاء endpoint تفاصيل منفصل، لكن من التصميم الحالي الأفضل أن يكون كل شيء موجودًا في `ops/list` لتقليل عدد الطلبات.

---

## 11) شاشة / حالة “جاري التوصيل”

من الصورة الثانية، الكارت في حالة **جاري التوصيل** ويظهر فيه زرين:
- تم التسليم
- إلغاء

### endpoint تحميل الحالة
```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=out_for_delivery
```

### ما الذي يحدد ظهور الأزرار؟
ليس الـ UI.
بل:
```json
"allowedActions": ["delivered", "cancel"]
```

### عند الضغط على “تم التسليم”
```http
POST /api/dashboard/ops/actions/delivered
Content-Type: application/json

{
  "entityId": "<id>",
  "type": "subscription"
}
```

أو:
```json
{
  "entityId": "<id>",
  "type": "order"
}
```

### المتوقع في الرد
يرجع الـ API نفس العنصر بشكل `UnifiedOperationalDTO` لكن محدث، مثل:
- `status` أصبح `delivered`
- `ui.label` أصبح “تم التسليم”
- `allowedActions` أصبحت فارغة أو مختلفة حسب الحالة النهائية

### عند الضغط على “إلغاء”
```http
POST /api/dashboard/ops/actions/cancel
Content-Type: application/json

{
  "entityId": "<id>",
  "type": "order",
  "reason": "customer_not_available"
}
```

إذا كان هناك `note` أو سبب إضافي يمكن إرساله أيضًا حسب العقد النهائي.

---

## 12) شاشة / حالة “تم التسليم”

من الصورة الثالثة، العناصر في حالة **تم التسليم**.

### endpoint التحميل
```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=delivered
```

### سلوك الواجهة
- تعرض الحالة كبادج خضراء مثل “تم التسليم”
- لا تعرض أزرار تنفيذ جديدة عادة
- `allowedActions` غالبًا تكون فارغة لأن العنصر في terminal state

### داخل الـ timeline
يكون المسار مكتملًا حتى آخر مرحلة.

---

## 13) شاشة / حالة “ملغي”

من الصورة الرابعة، العنصر في حالة **ملغي** مع صندوق يوضح معلومات الإلغاء.

### endpoint التحميل
```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=canceled
```

### ما الذي يعرض داخل الكارت؟
- الحالة: ملغي
- سبب الإلغاء
- ملاحظة الإلغاء
- لا توجد أزرار عمليات جديدة

### من أين تأتي هذه البيانات؟
يفضل أن تكون موجودة في الـ DTO في جزء مخصص مثل:

```ts
context.cancelInfo?: {
  reason: string;
  note?: string;
}
```

أو أي naming مشابه معتمد من الباك إند.

> المهم أن الواجهة لا تبني نصوص الإلغاء من عندها، بل تأخذها من الباك إند بصيغة جاهزة وآمنة للعرض.

---

## 14) شاشة / حالة “قيد التحضير” أو ما قبل التسليم

في الصور هناك عنصر يبدو في مرحلة تجهيز أو قبل الخروج للتوصيل.

### endpoint التحميل
يمكن أن يكون ضمن القائمة العامة أو عبر فلتر مناسب:

```http
GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=preparing
```

### الأكشن المتوقع
لو هذا العنصر خاص بالتوصيل وليس pickup، وسمحت الـ policy بذلك، قد يظهر:
```json
"allowedActions": ["dispatch"]
```

### عند الضغط
```http
POST /api/dashboard/ops/actions/dispatch
Content-Type: application/json

{
  "entityId": "<id>",
  "type": "subscription"
}
```

### النتيجة
ينتقل العنصر إلى حالة `out_for_delivery` ويصبح جاهزًا للظهور ضمن شاشة “جاري التوصيل”.

---

## 15) قاعدة مهمة جدًا في التنفيذ

### الواجهة لا تحدد ما يلي بنفسها:
- ما هو الزر الذي يجب أن يظهر
- هل هذا العنصر قابل للتسليم أم لا
- هل هذا العنصر يمكن إلغاؤه أم لا
- هل الحالة التالية هي delivered أو canceled أو dispatch

### الواجهة تعتمد فقط على:
- `status`
- `ui.*`
- `allowedActions`

بمعنى:
- لو `allowedActions` تحتوي `delivered` ➜ اعرض زر “تم التسليم”
- لو تحتوي `cancel` ➜ اعرض زر “إلغاء”
- لو لا تحتوي أي شيء ➜ لا تعرض أزرار

---

## 16) الـ Actions المستخدمة في شاشة التوصيل

هذه هي الأفعال المرتبطة فعليًا بالتوصيل:

### 16.1 `dispatch`
لتحويل العنصر من التحضير إلى الخروج للتوصيل.

```http
POST /api/dashboard/ops/actions/dispatch
```

### 16.2 `arriving_soon`
لو كانت الواجهة ستعرض إجراء “المندوب اقترب” أو “وصل قريب”.

```http
POST /api/dashboard/ops/actions/arriving_soon
```

### 16.3 `delivered`
لتأكيد التسليم النهائي.

```http
POST /api/dashboard/ops/actions/delivered
```

### 16.4 `cancel`
لإلغاء الطلب / التوصيل.

```http
POST /api/dashboard/ops/actions/cancel
```

---

## 17) الشكل المقترح لطلب الـ Action

### الطلب
```json
{
  "entityId": "65f0...",
  "type": "order"
}
```

### في حالة الإلغاء
```json
{
  "entityId": "65f0...",
  "type": "order",
  "reason": "customer_not_available",
  "note": "العميل لم يرد بعد 3 محاولات"
}
```

---

## 18) الشكل المتوقع لرد الـ Action

كل action يجب أن يعيد نفس الـ contract النهائي:

```json
{
  "ok": true,
  "data": {
    "id": "65f0...",
    "type": "order",
    "mode": "delivery",
    "reference": "DEL-003",
    "status": "delivered",
    "ui": {
      "label": "تم التسليم",
      "color": "green",
      "icon": "check-circle"
    },
    "customer": {
      "name": "خالد عبدالله",
      "phone": "0531112233"
    },
    "context": {
      "date": "2026-04-13",
      "window": "12-1 ظهراً",
      "addressSummary": "حي السليمانية شارع النخيل..."
    },
    "allowedActions": [],
    "timestamps": {
      "createdAt": "2026-04-13T08:00:00.000Z",
      "updatedAt": "2026-04-13T10:30:00.000Z"
    }
  }
}
```

---

## 19) الشكل المتوقع لرد الخطأ

عند حدوث خطأ أو محاولة transition غير صحيح:

```json
{
  "ok": false,
  "code": "INVALID_TRANSITION",
  "message": "Cannot mark this item as delivered from its current state",
  "details": null
}
```

### أمثلة لحالات الخطأ
- kitchen يحاول تنفيذ delivered
- courier يحاول تنفيذ action غير مسموح له
- محاولة cancel على عنصر terminal
- query أقل من 3 حروف في البحث

---

## 20) الـ Legacy endpoints القديمة الخاصة بالتوصيل

هذه المسارات قديمة وتم عزلها، ومذكورة هنا فقط كمرجع تاريخي:

### Courier deliveries القديمة
- `GET /api/courier/deliveries/today`
- `PUT /api/courier/deliveries/{id}/arriving-soon`
- `PUT /api/courier/deliveries/{id}/delivered`
- `PUT /api/courier/deliveries/{id}/cancel`

### Courier orders القديمة
- `GET /api/courier/orders/today`
- `PUT /api/courier/orders/{id}/arriving-soon`
- `PUT /api/courier/orders/{id}/delivered`
- `PUT /api/courier/orders/{id}/cancel`

### Kitchen handoff القديمة
- `POST /api/kitchen/subscriptions/{id}/days/{date}/out-for-delivery`
- `POST /api/kitchen/orders/{id}/out-for-delivery`

> لا تستخدم هذه المسارات في تنفيذ شاشة التوصيل الجديدة طالما أن العقد الجديد جاهز.

---

## 21) ملخص سريع لكل Screen وما هو الـ endpoint المستخدم

### الشاشة: التوصيل - أول تحميل
- `GET /api/dashboard/ops/list?date=YYYY-MM-DD`

### الشاشة: التوصيل - الكل
- `GET /api/dashboard/ops/list?date=YYYY-MM-DD`

### الشاشة: التوصيل - جاري التوصيل
- `GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=out_for_delivery`

### الشاشة: التوصيل - تم التسليم
- `GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=delivered`

### الشاشة: التوصيل - ملغي
- `GET /api/dashboard/ops/list?date=YYYY-MM-DD&status=canceled`

### الشاشة: البحث داخل التوصيل
- `GET /api/dashboard/ops/search?q=...`

### action: خرج للتوصيل
- `POST /api/dashboard/ops/actions/dispatch`

### action: المندوب اقترب
- `POST /api/dashboard/ops/actions/arriving_soon`

### action: تم التسليم
- `POST /api/dashboard/ops/actions/delivered`

### action: إلغاء
- `POST /api/dashboard/ops/actions/cancel`

---

## 22) توصيات تنفيذ مهمة

1. اجعل شاشة التوصيل تعتمد فقط على `/api/dashboard/ops/*`
2. لا تجعل الـ UI يبني business logic من تلقاء نفسه
3. اعرض الأزرار فقط بناءً على `allowedActions`
4. بعد كل action، حدّث الكارت من response نفسه بدل إعادة بناء البيانات يدويًا
5. استخدم `ui.label` و `ui.color` و `ui.icon` كما هي من الباك إند
6. حافظ على أن يكون `ops/list` و `ops/search` بنفس شكل البيانات تمامًا

---

## 23) الخلاصة

واجهة التوصيل الجديدة يمكن تشغيلها بالكامل بالاعتماد على ثلاثة endpoints فقط:

- `GET /api/dashboard/ops/list`
- `GET /api/dashboard/ops/search`
- `POST /api/dashboard/ops/actions/:action`

وأي شاشة أو حالة داخل الـ UI تكون مجرد:
- فلترة للقائمة
- أو تنفيذ action
- أو عرض تفاصيل من نفس الـ DTO

هذا هو العقد الرسمي المعتمد للتنفيذ.
