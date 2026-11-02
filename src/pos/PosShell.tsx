import { useState, type ComponentType } from "react";
import {
  BarChart3, Banknote, ClipboardList, CreditCard, LayoutGrid, LockKeyhole,
  Search, ShieldCheck, ShoppingBasket, Store, Truck, Users, Wallet,
} from "lucide-react";

type Section = "register" | "orders" | "subscriber" | "shift" | "reports";
type SmallIcon = ComponentType<{ size?: number; strokeWidth?: number }>;
const tabs: { id: Section; title: string; icon: SmallIcon }[] = [
  { id: "register", title: "البيع", icon: LayoutGrid },
  { id: "orders", title: "الطلبات", icon: ClipboardList },
  { id: "subscriber", title: "المشتركون", icon: Users },
  { id: "shift", title: "الوردية", icon: Wallet },
  { id: "reports", title: "التقارير", icon: BarChart3 },
];
const labels: Record<Section, string> = {
  register: "شاشة البيع", orders: "سجل الطلبات", subscriber: "استلام وجبات المشترك",
  shift: "الورديات والتقفيلة", reports: "تقارير الكاشير",
};
export default function PosShell() {
  const [section, setSection] = useState<Section>("register");
  return (
    <div className="pos-page">
      <aside className="pos-sidebar">
        <div className="pos-brand">
          <img src="/logo.png" alt="Basic Diet" />
          <div><strong>BASIC DIET</strong><span>نقطة البيع</span></div>
        </div>
        <div className="pos-nav-title">القائمة الرئيسية</div>
        <nav aria-label="أقسام الكاشير" className="pos-nav">
          {tabs.map(({ id, title, icon: Icon }) => (
            <button className={section === id ? "pos-nav-link selected" : "pos-nav-link"}
              type="button" key={id} onClick={() => setSection(id)}>
              <Icon size={19} /><span>{title}</span>
            </button>
          ))}
        </nav>
        <div className="pos-sidebar-bottom">
          <div className="pos-sidebar-note"><ShieldCheck size={18} />
            <span>واجهة مستقلة وآمنة</span></div>
          <small>نسخة تصميم فقط — لا تسجّل مبيعات</small>
        </div>
      </aside>
      <main className="pos-main">
        <header className="pos-header">
          <div><div className="pos-eyebrow">BASIC DIET / POS</div>
            <h1>{labels[section]}</h1></div>
          <div className="pos-header-right">
            <span className="pos-status"><span className="pos-status-dot" /> غير متصل بالبيع</span>
            <div className="pos-terminal"><Store size={17} /> الفرع الرئيسي</div>
          </div>
        </header>
        <div className="pos-warning"><LockKeyhole size={19} />
          <span><strong>وضع المعاينة:</strong> جميع عمليات البيع والدفع والاسترداد مقفولة حتى اعتماد النظام وتجهيز الفوترة.</span>
        </div>
        {section === "register" ? (
          <div className="pos-workspace">
            <section className="pos-products">
              <div className="pos-section-heading"><div><h2>المنيو</h2><p>أصناف المطعم المنشورة هتظهر هنا بعد الربط بالـAPI</p></div>
                <span className="pos-muted-chip">المنيو غير محمّل</span></div>
              <div className="pos-search"><Search size={19} /><input aria-label="بحث في المنيو" placeholder="ابحث عن صنف..." disabled /></div>
              <div className="pos-product-empty">
                <div className="pos-circle"><ShoppingBasket size={31} strokeWidth={1.7} /></div>
                <strong>المنيو جاهز للربط</strong>
                <p>الأصناف والأسعار والصور هتُقرأ من Basic Diet مباشرة، من غير نسخ بيانات أو أسعار تجريبية.</p>
              </div>
            </section>
            <aside className="pos-cart">
              <div className="pos-cart-header"><h2>الطلب الحالي</h2><span>غير مفعل</span></div>
              <div className="pos-cart-channels">
                <button disabled>محلي</button><button disabled>سفري</button><button disabled>توصيل</button>
              </div>
              <div className="pos-cart-empty"><ShoppingBasket size={28} /><span>لم تتم إضافة أصناف</span></div>
              <div className="pos-cart-footer">
                <div className="pos-total-row"><span>الإجمالي</span><strong>—</strong></div>
                <div className="pos-methods"><span><Banknote size={16} /> كاش</span>
                  <span><CreditCard size={16} /> شبكة</span><span><Truck size={16} /> شركات</span></div>
                <button className="pos-pay-btn" type="button" disabled><LockKeyhole size={17} /> الدفع متوقف في المعاينة</button>
              </div>
            </aside>
          </div>
        ) : (
          <section className="pos-placeholder">
            <div className="pos-circle"><LockKeyhole size={29} strokeWidth={1.6} /></div>
            <h2>{labels[section]}</h2>
            <p>الشاشة دي هتتفعّل بعد اكتمال الـBackend والصلاحيات واختبارات المعاملات. مفيش بيانات حقيقية بتُعرض حاليًا.</p>
            <div className="pos-placeholder-hint">التصميم قابل للتصفح فقط — لا توجد عمليات كتابة</div>
          </section>
        )}
        <footer className="pos-footer">Basic Diet POS • Preview only • واجهة مستقلة عن الداشبورد الحالي</footer>
      </main>
    </div>
  );
}
