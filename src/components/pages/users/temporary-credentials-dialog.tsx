import { CopyIcon, PrinterIcon } from "lucide-react";

import { ToastMessage } from "@/components/global/ToastMessage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCustomerDateTime } from "./user-auth-utils";

export type CredentialsDialogData = {
  title: string;
  customerName?: string | null;
  phoneE164: string;
  temporaryPassword: string;
  expiresAt: string;
  sessionsRevoked?: boolean;
};

const mandatoryNotice =
  "كلمة المرور مؤقتة وتُستخدم مرة واحدة لتسجيل الدخول. سيُطلب من العميل إنشاء كلمة مرور جديدة فور تسجيل الدخول.";

export function TemporaryCredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: CredentialsDialogData | null;
  onClose: () => void;
}) {
  const open = Boolean(credentials);
  const expiry = formatCustomerDateTime(credentials?.expiresAt);
  const copyText = credentials
    ? [
        `اسم العميل: ${credentials.customerName || "—"}`,
        `رقم الجوال: ${credentials.phoneE164}`,
        `كلمة المرور المؤقتة: ${credentials.temporaryPassword}`,
        `تنتهي في: ${expiry}`,
        "يجب تغيير كلمة المرور عند أول تسجيل دخول.",
      ].join("\n")
    : "";

  async function copyValue(value: string, successMessage: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    ToastMessage(successMessage, "success");
  }

  function printCredentials() {
    if (!credentials) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>Basic Diet - بيانات الدخول المؤقتة</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
    .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 24px; max-width: 520px; }
    h1 { margin: 0 0 16px; font-size: 22px; }
    p { margin: 10px 0; font-size: 15px; }
    .password { direction: ltr; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
    .notice { margin-top: 20px; color: #92400e; }
  </style>
</head>
<body>
  <section class="card">
    <h1>Basic Diet</h1>
    <p><strong>اسم العميل:</strong> ${escapeHtml(credentials.customerName || "—")}</p>
    <p><strong>رقم الجوال:</strong> <span dir="ltr">${escapeHtml(credentials.phoneE164)}</span></p>
    <p><strong>كلمة المرور المؤقتة:</strong></p>
    <p class="password">${escapeHtml(credentials.temporaryPassword)}</p>
    <p><strong>تنتهي في:</strong> ${escapeHtml(expiry)}</p>
    <p class="notice">${mandatoryNotice}</p>
  </section>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <Dialog open={open}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="max-h-[90dvh] max-w-lg overflow-y-auto"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{credentials?.title}</DialogTitle>
          <DialogDescription>{mandatoryNotice}</DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <dl className="grid gap-3 text-sm">
                <CredentialRow label="اسم العميل" value={credentials.customerName || "—"} />
                <CredentialRow label="رقم الجوال" value={credentials.phoneE164} ltr />
                <CredentialRow
                  label="كلمة المرور المؤقتة"
                  value={credentials.temporaryPassword}
                  ltr
                  strong
                />
                <CredentialRow label="تنتهي في" value={expiry} />
              </dl>
            </div>
            {credentials.sessionsRevoked ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                تم تسجيل خروج العميل من جميع الأجهزة وإلغاء الجلسات السابقة.
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            variant="outline"
            onClick={() => copyValue(credentials?.phoneE164 ?? "", "تم نسخ رقم الجوال")}
          >
            <CopyIcon data-icon="inline-start" />
            نسخ رقم الجوال
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              copyValue(credentials?.temporaryPassword ?? "", "تم نسخ كلمة المرور")
            }
          >
            <CopyIcon data-icon="inline-start" />
            نسخ كلمة المرور
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copyValue(copyText, "تم نسخ بيانات الدخول")}
          >
            <CopyIcon data-icon="inline-start" />
            نسخ بيانات الدخول
          </Button>
          <Button type="button" variant="outline" onClick={printCredentials}>
            <PrinterIcon data-icon="inline-start" />
            طباعة
          </Button>
          <Button type="button" onClick={onClose}>
            تم
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({
  label,
  value,
  ltr = false,
  strong = false,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        dir={ltr ? "ltr" : "rtl"}
        className={strong ? "font-mono text-base font-bold" : "font-medium"}
      >
        {value}
      </dd>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
