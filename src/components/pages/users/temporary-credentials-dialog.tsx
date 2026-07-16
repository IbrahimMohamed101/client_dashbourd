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
const copyFailureMessage =
  "تعذر النسخ تلقائيًا. حدّد البيانات وانسخها يدويًا.";
const printFailureMessage = "تعذر بدء الطباعة من المتصفح.";

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
    try {
      await navigator.clipboard.writeText(value);
      ToastMessage(successMessage, "success");
    } catch {
      ToastMessage(copyFailureMessage, "error");
    }
  }

  function printCredentials() {
    if (!credentials) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.setAttribute("aria-hidden", "true");

    const removeFrame = () => {
      window.setTimeout(() => iframe.remove(), 250);
    };

    const startPrint = () => {
      try {
        const printWindow = iframe.contentWindow;
        if (!printWindow) {
          throw new Error("Print frame is unavailable");
        }
        printWindow.focus();
        printWindow.print();
        printWindow.addEventListener("afterprint", removeFrame, {
          once: true,
        });
        window.setTimeout(removeFrame, 5000);
      } catch {
        removeFrame();
        ToastMessage(printFailureMessage, "error");
      }
    };

    document.body.appendChild(iframe);
    const doc = iframe.contentDocument;
    if (!doc) {
      removeFrame();
      ToastMessage(printFailureMessage, "error");
      return;
    }

    doc.open();
    doc.write(`<!doctype html>
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
    .revoked { margin-top: 12px; color: #991b1b; }
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
    <p class="notice">${escapeHtml(mandatoryNotice)}</p>
    ${
      credentials.sessionsRevoked
        ? `<p class="revoked">${escapeHtml("تم إلغاء الجلسات السابقة للعميل بعد إعادة التعيين.")}</p>`
        : ""
    }
  </section>
</body>
    </html>`);
    doc.close();
    window.setTimeout(startPrint, 50);
  }

  return (
    <Dialog open={open}>
      <DialogContent
        dir="rtl"
        showCloseButton={false}
        className="grid max-h-[90dvh] max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b px-4 py-4 text-right sm:px-6">
          <DialogTitle>{credentials?.title}</DialogTitle>
          <DialogDescription>{mandatoryNotice}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          {credentials ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <dl className="grid gap-3 text-sm">
                  <CredentialRow
                    label="اسم العميل"
                    value={credentials.customerName || "—"}
                  />
                  <CredentialRow
                    label="رقم الجوال"
                    value={credentials.phoneE164}
                    ltr
                  />
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
        </div>

        <DialogFooter className="gap-2 border-t bg-popover/95 px-4 py-3 backdrop-blur sm:justify-start sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            aria-label="نسخ رقم الجوال"
            onClick={() => copyValue(credentials?.phoneE164 ?? "", "تم نسخ رقم الجوال")}
          >
            <CopyIcon data-icon="inline-start" />
            نسخ رقم الجوال
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            aria-label="نسخ كلمة المرور المؤقتة"
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
            className="w-full sm:w-auto"
            aria-label="نسخ بيانات الدخول المؤقتة"
            onClick={() => copyValue(copyText, "تم نسخ بيانات الدخول")}
          >
            <CopyIcon data-icon="inline-start" />
            نسخ بيانات الدخول
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={printCredentials}
          >
            <PrinterIcon data-icon="inline-start" />
            طباعة
          </Button>
          <Button type="button" className="w-full sm:w-auto" onClick={onClose}>
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
        className={
          strong
            ? "break-all font-mono text-base font-bold"
            : "break-words font-medium"
        }
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
