import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangleIcon, Loader2 } from "lucide-react";

import { ToastMessage } from "@/components/global/ToastMessage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import useCreateUserForm from "@/hooks/useCreateUserForm";
import { useCreateAdminCustomerMutation } from "@/hooks/useUsersQuery";
import type { CreateUserSchemaType } from "@/lib/validations/createUserSchema";
import { getAdminCustomerErrorMessage } from "@/utils/fetchUsersData";
import type { CredentialsDialogData } from "./temporary-credentials-dialog";
import { TemporaryCredentialsDialog } from "./temporary-credentials-dialog";

const malformedCreateCredentialsMessage =
  "تم إنشاء الحساب، ولكن تعذر عرض بيانات الدخول المؤقتة. تحقق من حالة المستخدم قبل محاولة إنشاء الحساب مرة أخرى.";

export function CreateUserForm() {
  const [credentials, setCredentials] = useState<CredentialsDialogData | null>(
    null
  );
  const [malformedSuccessOpen, setMalformedSuccessOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useCreateUserForm();

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const createCustomer = useCreateAdminCustomerMutation();
  const resetCreateCustomerMutation = createCustomer.reset;
  const isActive = watch("isActive");

  function closeCredentials() {
    setCredentials(null);
    resetCreateCustomerMutation();
    queryClient.invalidateQueries({ queryKey: ["users"] });
    navigate({ to: "/users" });
  }

  function closeMalformedSuccess() {
    setMalformedSuccessOpen(false);
    resetCreateCustomerMutation();
    queryClient.invalidateQueries({ queryKey: ["users"] });
    navigate({ to: "/users" });
  }

  useEffect(() => {
    return () => {
      setCredentials(null);
      setMalformedSuccessOpen(false);
      resetCreateCustomerMutation();
    };
  }, [resetCreateCustomerMutation]);

  function onSubmit(data: CreateUserSchemaType) {
    createCustomer.mutate(
      {
        fullName: data.fullName.trim(),
        phoneE164: data.phoneE164,
        email: data.email?.trim() || undefined,
        isActive: data.isActive,
      },
      {
        onSuccess: (result) => {
          const temp = result.temporaryCredentials;
          const phoneE164 = result.user.phoneE164 || result.user.phone;
          if (!temp.temporaryPassword || !temp.expiresAt || !phoneE164) {
            resetCreateCustomerMutation();
            setMalformedSuccessOpen(true);
            return;
          }
          setCredentials({
            title: "تم إنشاء المستخدم",
            customerName: result.user.fullName,
            phoneE164,
            temporaryPassword: temp.temporaryPassword,
            expiresAt: temp.expiresAt,
          });
          resetCreateCustomerMutation();
        },
        onError: (error) => {
          ToastMessage(getAdminCustomerErrorMessage(error), "error");
        },
      }
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle>إضافة مستخدم جديد</CardTitle>
          <CardDescription>
            أدخل بيانات العميل. سيُنشئ الخادم كلمة مرور مؤقتة آمنة تظهر مرة
            واحدة بعد الحفظ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fullName">الاسم الكامل</FieldLabel>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="أدخل الاسم الكامل"
                  {...register("fullName")}
                  aria-invalid={errors.fullName ? "true" : "false"}
                />
                {errors.fullName ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                ) : null}
              </Field>

              <Field>
                <FieldLabel htmlFor="phoneE164">رقم الجوال</FieldLabel>
                <Input
                  id="phoneE164"
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  placeholder="+9665XXXXXXXX"
                  {...register("phoneE164")}
                  aria-invalid={errors.phoneE164 ? "true" : "false"}
                  className="text-left"
                />
                {errors.phoneE164 ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.phoneE164.message}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    استخدم الصيغة الدولية مثل +9665XXXXXXXX.
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="email">البريد الإلكتروني (اختياري)</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="user@example.com"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  className="text-left"
                />
                {errors.email ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="isActive">حالة الحساب</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {isActive ? "نشط" : "غير نشط"}
                    </span>
                    <Switch
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(checked) =>
                        setValue("isActive", checked, { shouldDirty: true })
                      }
                    />
                  </div>
                </div>
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={createCustomer.isPending}
                  className="w-full"
                >
                  {createCustomer.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري إنشاء المستخدم...
                    </>
                  ) : (
                    "إنشاء المستخدم"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <TemporaryCredentialsDialog
        credentials={credentials}
        onClose={closeCredentials}
      />

      <Dialog open={malformedSuccessOpen}>
        <DialogContent
          dir="rtl"
          showCloseButton={false}
          className="max-w-md"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader className="text-right">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-amber-600" />
              تعذر عرض بيانات الدخول المؤقتة
            </DialogTitle>
            <DialogDescription>{malformedCreateCredentialsMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start">
            <Button type="button" onClick={closeMalformedSuccess}>
              تم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
