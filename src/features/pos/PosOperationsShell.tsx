import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Settings2,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { UserRoles } from "@/types/auth";
import { channels as defaultChannels } from "./previewCatalog";
import type { PublishedPosCatalog } from "./catalogApi";
import { PosWorkspace } from "./PosWorkspace";

type View = "sale" | "overview" | "orders" | "subscriptions" | "closing" | "settings";
type SubscriptionMode = "new" | "renew" | "stack" | "deduct";

const navigation: {
  id: View;
  label: string;
  icon: typeof ShoppingBasket;
}[] = [
  { id: "sale", label: "البيع", icon: ShoppingBasket },
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "orders", label: "الطلبات والفواتير", icon: ClipboardList },
  { id: "subscriptions", label: "الاشتراكات", icon: Users },
  { id: "closing", label: "التقفيلة اليومية", icon: CalendarClock },
  { id: "settings", label: "الإعدادات", icon: Settings2 },
];

function PageHeader({ title, description, action }: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}

function PreviewNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/50 px-4 py-3 text-sm leading-6"
    >
      <LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div>{children}</div>
    </div>
  );
}

function Metric({ label, value, hint }: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="my-2 text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function EmptyData({ heading, detail }: { heading: string; detail: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-center">
      <ClipboardList aria-hidden="true" className="size-8 text-muted-foreground" />
      <p className="font-semibold">{heading}</p>
      <p className="max-w-lg text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function OverviewView({ catalog, onSale }: {
  catalog: PublishedPosCatalog;
  onSale: () => void;
}) {
  const active = catalog.products.filter((item) => item.active).length;
  const channels = catalog.channels ?? defaultChannels;
  return (
    <section aria-labelledby="pos-overview-title" className="space-y-5">
      <PageHeader
        title="ملخص نقطة البيع"
        description="الأصناف المنشورة بيانات فعلية من منيو الكاشير المستقل. بيانات المبيعات لا تظهر قبل ربطها بالسيرفر."
        action={<Button onClick={onSale} className="min-h-11">ابدأ طلبًا جديدًا</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="أصناف المنيو" value={String(catalog.products.length)} hint={"النسخة المنشورة " + catalog.revision} />
        <Metric label="الأصناف الظاهرة" value={String(active)} hint="من كتالوج الكاشير فقط" />
        <Metric label="قنوات الأسعار" value={String(channels.length)} hint={channels.map((item) => item.label).join(" · ")} />
        <Metric label="مبيعات اليوم" value="—" hint="يتطلب API مبيعات موثقًا" />
      </div>
      <PreviewNotice>
        لا توجد معاملات مالية معروضة في هذا الإصدار. لا يتم حساب صافي المبيعات أو النقدية أو الضريبة من بيانات افتراضية.
      </PreviewNotice>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 font-bold">القنوات</h3>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0" key={channel.id}>
                <span>{channel.label}</span>
                <span className="text-sm text-muted-foreground">سجل المبيعات غير متصل</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-4 font-bold">آخر النشاطات</h3>
          <EmptyData heading="لم تُحمّل نشاطات الكاشير" detail="سيظهر هنا سجل العمليات الفعلي بعد توفير واجهة القراءة من Staging." />
        </section>
      </div>
    </section>
  );
}

function OrdersView({ onSale, catalog }: { onSale: () => void; catalog: PublishedPosCatalog }) {
  const channels = catalog.channels ?? defaultChannels;
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  return (
    <section className="space-y-5" aria-label="الطلبات والفواتير">
      <PageHeader
        title="الطلبات والفواتير"
        description="بحث الطلبات حسب رقم الفاتورة أو مرجع التطبيق، وإعادة الطباعة والمرتجعات بعد تفعيل الخدمات الرسمية."
        action={<Button onClick={onSale} className="min-h-11">طلب جديد</Button>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="طلبات اليوم" value="—" hint="بانتظار السجل المالي" />
        <Metric label="مبيعات المطعم" value="—" hint="بانتظار السجل المالي" />
        <Metric label="مبيعات التطبيقات" value="—" hint="بانتظار السجل المالي" />
        <Metric label="المرتجعات" value="—" hint="صلاحيات المدير فقط" />
      </div>
      <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="grid gap-1 text-sm">
          رقم الطلب أو مرجع التطبيق
          <Input aria-label="بحث الطلبات" value={search} placeholder="بحث" onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          قناة البيع
          <select aria-label="تصفية قناة الطلبات" className="min-h-11 rounded-md border bg-background px-3" value={channel} onChange={(event) => setChannel(event.target.value)}>
            <option value="all">كل القنوات</option>
            {channels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          حالة الطلب
          <select aria-label="تصفية حالة الطلبات" className="min-h-11 rounded-md border bg-background px-3" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">كل الحالات</option>
            <option value="completed">مكتمل</option>
            <option value="refunded">مرتجع</option>
          </select>
        </label>
      </div>
      <section className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-bold">سجل الطلبات</h3>
          <Button disabled variant="outline" className="min-h-11">تصدير CSV</Button>
        </div>
        <EmptyData heading="سجل الطلبات غير متصل بعد" detail="لن تُنشأ طلبات وهمية، ولن يتم عرض معاملات محلية على أنها فواتير حقيقية. خيارات البحث جاهزة للربط بخدمة الطلبات الرسمية." />
      </section>
    </section>
  );
}

const modes: { id: SubscriptionMode; label: string }[] = [
  { id: "new", label: "اشتراك جديد" },
  { id: "renew", label: "تجديد" },
  { id: "stack", label: "باقة إضافية" },
  { id: "deduct", label: "خصم وجبة" },
];

function SubscriptionView() {
  const [mode, setMode] = useState<SubscriptionMode>("new");
  const [phone, setPhone] = useState("");
  const [days, setDays] = useState("26");
  const [grams, setGrams] = useState("150");
  const [meals, setMeals] = useState("2");

  return (
    <section aria-label="اشتراكات نقطة البيع" className="space-y-5">
      <PageHeader title="اشتراكات العملاء" description="الإجراء النهائي يستخدم خدمات الاشتراكات والرصيد الرسمية، وليس منطق اشتراكات مكررًا في POS." />
      <div className="rounded-xl border bg-card p-4">
        <label className="grid gap-1 text-sm">
          رقم جوال المشترك
          <div className="flex flex-wrap gap-2">
            <Input
              aria-label="رقم جوال المشترك"
              className="max-w-md flex-1"
              dir="ltr"
              type="tel"
              autoComplete="off"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="05xxxxxxxx"
              maxLength={20}
            />
            <Button disabled className="min-h-11">البحث في المشتركين</Button>
          </div>
        </label>
        <p className="mt-2 text-xs text-muted-foreground">البحث معطّل إلى أن يتوفر ربط الموظف المصرّح به بخدمة العملاء الرسمية.</p>
      </div>
      <div role="group" aria-label="عملية الاشتراك" className="flex flex-wrap gap-2">
        {modes.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant={mode === item.id ? "default" : "outline"}
            aria-pressed={mode === item.id}
            className="min-h-11"
            onClick={() => setMode(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {mode === "deduct" ? (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 font-bold">خصم وجبات المشترك</h3>
          <PreviewNotice>خصم الوجبات يحتاج مشتركًا مؤكدًا وحالة اشتراك فعالة، ويستخدم aggregateBalance ومسار الخصم الرسمي دون إنشاء رصيد مستقل.</PreviewNotice>
          <Button disabled className="mt-4 min-h-11">تأكيد خصم وجبة</Button>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 font-bold">{modes.find((item) => item.id === mode)?.label}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">
              مدة الباقة
              <select aria-label="مدة الباقة" className="min-h-11 rounded-md border bg-background px-3" value={days} onChange={(event) => setDays(event.target.value)}>
                <option value="7">7 أيام</option><option value="26">26 يومًا</option><option value="30">30 يومًا</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              وزن البروتين
              <select aria-label="وزن البروتين" className="min-h-11 rounded-md border bg-background px-3" value={grams} onChange={(event) => setGrams(event.target.value)}>
                <option value="100">100 جم</option><option value="150">150 جم</option><option value="200">200 جم</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              الوجبات اليومية
              <select aria-label="عدد الوجبات اليومية" className="min-h-11 rounded-md border bg-background px-3" value={meals} onChange={(event) => setMeals(event.target.value)}>
                {[1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count} وجبة</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <p>الباقة المختارة: {days} يومًا · {grams} جم · {meals} وجبات يوميًا</p>
            <p className="mt-1 text-muted-foreground">السعر النهائي والخصومات لا تُحسب هنا؛ يجب جلبها من التسعير الرسمي عند الربط.</p>
          </div>
          <Button disabled className="mt-4 min-h-11">الاستعلام عن السعر وإكمال الاشتراك</Button>
        </div>
      )}
    </section>
  );
}

function ClosingView() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [countedCash, setCountedCash] = useState("");
  const [countedCard, setCountedCard] = useState("");
  return (
    <section aria-label="التقفيلة اليومية لنقطة البيع" className="space-y-5">
      <PageHeader title="التقفيلة اليومية" description="تقفيلة مالية واحدة غير قابلة للتعديل بعد الإغلاق، تشمل مصادر المطعم والاشتراكات والتطبيقات دون ازدواجية." />
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          تاريخ التقفيلة
          <Input aria-label="تاريخ التقفيلة" className="max-w-52" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
        <span className="rounded-full border px-3 py-2 text-xs text-muted-foreground">حالة اليوم: غير متصلة</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="إجمالي المبيعات" value="—" hint="مطعم + تطبيقات + اشتراكات" />
        <Metric label="المرتجعات" value="—" hint="بتاريخ تنفيذ المرتجع" />
        <Metric label="صافي المبيعات" value="—" hint="بدون تكرار تحصيل الاشتراكات" />
        <Metric label="ضريبة القيمة المضافة" value="—" hint="من مستندات مالية معتمدة" />
      </div>
      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 font-bold">مراجعة النقدية والشبكة</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            النقدية المعدودة (ريال)
            <Input aria-label="النقدية المعدودة" dir="ltr" inputMode="decimal" placeholder="0.00" value={countedCash} onChange={(event) => setCountedCash(event.target.value.replace(/[^\d.]/g, ""))} />
          </label>
          <label className="grid gap-1 text-sm">
            إجمالي الشبكة من جهاز الدفع (ريال)
            <Input aria-label="إجمالي الشبكة" dir="ltr" inputMode="decimal" placeholder="0.00" value={countedCard} onChange={(event) => setCountedCard(event.target.value.replace(/[^\d.]/g, ""))} />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">هذه القيم في الذاكرة المؤقتة للواجهة فقط ولا تُحفظ أو تُحتسب كتقفيلة.</p>
        <PreviewNotice>لا يمكن إغلاق يوم مالي قبل الربط بسجلات البيع والمرتجعات والاشتراكات ومعالجة حالة الإغلاق الموحّدة.</PreviewNotice>
        <Button disabled className="mt-4 min-h-11">مراجعة وإغلاق التقفيلة</Button>
      </section>
    </section>
  );
}

function SettingsView() {
  const [autoPrint, setAutoPrint] = useState(false);
  const [cap, setCap] = useState("15");
  return (
    <section aria-label="إعدادات نقطة البيع" className="space-y-5">
      <PageHeader title="إعدادات الكاشير" description="إعدادات العرض فقط؛ الحفظ وتعديل ضوابط المالية يحتاجان API وصلاحيات المدير." />
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
          <div><h3 className="font-bold">الطباعة التلقائية</h3><p className="text-sm text-muted-foreground">طباعة فاتورة بعد اعتماد الطلب من الخادم</p></div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={autoPrint} onChange={(event) => setAutoPrint(event.target.checked)} aria-label="الطباعة التلقائية" className="size-5 accent-primary" />
            <span className="text-sm">تفعيل المعاينة</span>
          </label>
        </div>
        <div className="mt-4 grid gap-2 sm:max-w-sm">
          <label htmlFor="cashier-cap" className="font-bold">الحد الأعلى لخصم الموظف (%)</label>
          <Input id="cashier-cap" type="number" min="0" max="100" step="0.5" value={cap} onChange={(event) => setCap(event.target.value)} />
          <p className="text-xs text-muted-foreground">الحد هنا تصوّري فقط. أي سقف حقيقي يجب أن يتحقق منه Backend عند التسعير والدفع.</p>
        </div>
        <Button disabled className="mt-4 min-h-11">حفظ الإعدادات</Button>
      </div>
    </section>
  );
}

export function PosOperationsShell({ catalog }: { catalog: PublishedPosCatalog }) {
  const [view, setView] = useState<View>("sale");
  const { user } = useAuth();
  const canEditPosMenu = user?.role === UserRoles.CASHIER
    || user?.role === UserRoles.RESTAURANT
    || user?.role === UserRoles.ADMIN
    || user?.role === UserRoles.SUPERADMIN;

  // One navigation control for every POS view: sales always occupies the
  // whole working area, rather than spending a second row on tab buttons.
  const navigationMenu = (
    <nav aria-label="أقسام نقطة البيع" className="shrink-0">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" aria-label="أقسام نقطة البيع"
            className="min-h-12 gap-2">
            <Menu aria-hidden="true" className="size-5" />
            <span className="hidden sm:inline">الأقسام</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56" dir="rtl">
          {navigation.map(({ id, label, icon: Icon }) => (
            <DropdownMenuItem
              key={id}
              className="min-h-12 gap-3"
              onSelect={() => setView(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </DropdownMenuItem>
          ))}
          {canEditPosMenu && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="min-h-12 gap-3">
                <Link to="/pos/menu">
                  <BookOpen aria-hidden="true" className="size-5" />
                  منيو الكاشير والأسعار
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );

  return (
    <div className={view === "sale" ? "flex h-full min-h-0 flex-col overflow-hidden" : "min-w-0 px-3 pb-6 sm:px-5"} dir="rtl">
      {view !== "sale" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3">
          <h1 className="text-base font-bold">بيسك دايت — نقطة البيع</h1>
          {navigationMenu}
        </div>
      )}
      {view === "sale" && (
        <PosWorkspace
          catalog={catalog}
          operatorName={user?.name || "موظف"}
          navigation={navigationMenu}
        />
      )}
      {view === "overview" && <OverviewView catalog={catalog} onSale={() => setView("sale")} />}
      {view === "orders" && <OrdersView catalog={catalog} onSale={() => setView("sale")} />}
      {view === "subscriptions" && <SubscriptionView />}
      {view === "closing" && <ClosingView />}
      {view === "settings" && <SettingsView />}
    </div>
  );
}
