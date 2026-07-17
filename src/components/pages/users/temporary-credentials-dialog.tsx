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
  isActive?: boolean;
};

const mandatoryNotice =
  "كلمة المرور مؤقتة وتُستخدم مرة واحدة لتسجيل الدخول. سيُطلب من العميل إنشاء كلمة مرور جديدة فور تسجيل الدخول.";
const inactiveNotice =
  "هذا الحساب غير نشط حالياً. لن يتمكن العميل من تسجيل الدخول أو تغيير كلمة المرور حتى يتم تفعيل الحساب.";
const sessionsRevokedNotice =
  "تم تسجيل خروج العميل من جميع الأجهزة وإلغاء الجلسات السابقة.";
const copyFailureMessage =
  "تعذر النسخ تلقائياً. حدد البيانات وانسخها يدوياً.";
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
        credentials.isActive === false ? inactiveNotice : null,
        credentials.sessionsRevoked ? sessionsRevokedNotice : null,
      ]
        .filter(Boolean)
        .join("\n")
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
    .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 24px; max-width: 640px; }
    h1 { margin: 0 0 16px; font-size: 22px; }
    p { margin: 10px 0; font-size: 15px; }
    .ltr { direction: ltr; unicode-bidi: isolate; text-align: left; word-break: break-all; }
    .password { direction: ltr; unicode-bidi: isolate; font-family: monospace; font-size: 20px; font-weight: 700; word-break: break-all; }
    .notice { margin-top: 20px; color: #92400e; }
    .revoked, .inactive { margin-top: 12px; color: #991b1b; }
  </style>
</head>
<body>
  <section class="card">
    <h1>Basic Diet</h1>
    <p><strong>اسم العميل:</strong> ${escapeHtml(credentials.customerName || "—")}</p>
    <p><strong>رقم الجوال:</strong> <span class="ltr">${escapeHtml(credentials.phoneE164)}</span></p>
    <p><strong>كلمة المرور المؤقتة:</strong></p>
    <p class="password">${escapeHtml(credentials.temporaryPassword)}</p>
    <p><strong>تنتهي في:</strong> ${escapeHtml(expiry)}</p>
    <p class="notice">${escapeHtml(mandatoryNotice)}</p>
    ${
      credentials.isActive === false
        ? `<p class="inactive">${escapeHtml(inactiveNotice)}</p>`
        : ""
    }
    ${
      credentials.sessionsRevoked
        ? `<p class="revoked">${escapeHtml(sessionsRevokedNotice)}</p>`
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
        className="grid max-h-[90dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-2xl"
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
                <dl className="grid gap-4 text-sm">
                  <CredentialRow
                    label="اسم العميل"
                    value={credentials.customerName || "—"}
                    testId="credential-customer-name"
                  />
                  <CredentialRow
                    label="رقم الجوال"
                    value={credentials.phoneE164}
                    ltr
                    testId="credential-phone"
                    copyLabel="نسخ رقم الجوال"
                    onCopy={() =>
                      copyValue(credentials.phoneE164, "تم نسخ رقم الجوال")
                    }
                  />
                  <CredentialRow
                    label="كلمة المرور المؤقتة"
                    value={credentials.temporaryPassword}
                    ltr
                    strong
                    testId="credential-password"
                    copyLabel="نسخ كلمة المرور المؤقتة"
                    onCopy={() =>
                      copyValue(
                        credentials.temporaryPassword,
                        "تم نسخ كلمة المرور"
                      )
                    }
                  />
                  <CredentialRow
                    label="تنتهي في"
                    value={expiry}
                    testId="credential-expiry"
                  />
                </dl>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                {mandatoryNotice}
              </div>

              {credentials.isActive === false ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                  {inactiveNotice}
                </div>
              ) : null}

              {credentials.sessionsRevoked ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                  {sessionsRevokedNotice}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="grid grid-cols-1 gap-2 border-t bg-popover/95 px-4 py-3 backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6">
          <Button
            type="button"
            variant="outline"
            className="min-w-0 justify-center"
            aria-label="نسخ بيانات الدخول المؤقتة"
            onClick={() => copyValue(copyText, "تم نسخ بيانات الدخول")}
          >
            <CopyIcon data-icon="inline-start" />
            نسخ بيانات الدخول
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-0 justify-center"
            aria-label="طباعة بيانات الدخول المؤقتة"
            onClick={printCredentials}
          >
            <PrinterIcon data-icon="inline-start" />
            طباعة
          </Button>
          <Button
            type="button"
            className="min-w-0 justify-center"
            aria-label="تم حفظ بيانات الدخول"
            onClick={onClose}
          >
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
  testId,
  copyLabel,
  onCopy,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  strong?: boolean;
  testId: string;
  copyLabel?: string;
  onCopy?: () => void;
}) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <bdi
          data-testid={testId}
          dir={ltr ? "ltr" : "rtl"}
          className={
            ltr
              ? `min-w-0 select-all break-all text-left text-foreground [unicode-bidi:isolate] ${
                  strong
                    ? "font-mono text-base font-bold"
                    : "font-medium tabular-nums"
                }`
              : "min-w-0 select-all break-words text-right font-medium text-foreground [unicode-bidi:isolate]"
          }
        >
          {value}
        </bdi>
        {copyLabel && onCopy ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full shrink-0 sm:w-auto"
            aria-label={copyLabel}
            onClick={onCopy}
          >
            <CopyIcon data-icon="inline-start" />
            {copyLabel}
          </Button>
        ) : null}
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
