import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ContactRound,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { ToastMessage } from "@/components/global/ToastMessage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAllUsersQuery } from "@/hooks/useUsersQuery";
import type { User } from "@/types/userTypes";
import { cn } from "@/lib/utils";
import {
  buildCustomerManagementUpdate,
  draftFromManagedCustomer,
  fetchManagedCustomer,
  getCustomerManagementErrorMessage,
  updateManagedCustomer,
  type CustomerManagementDraft,
} from "./customerManagementApi";

const EMPTY_DRAFT: CustomerManagementDraft = {
  fullName: "",
  phone: "",
  email: "",
  isActive: true,
  deliveryAddress: {
    line1: "",
    line2: "",
    city: "",
    district: "",
    street: "",
    building: "",
    apartment: "",
    notes: "",
  },
};

export function CustomerManagementPage({ initialUserId }: { initialUserId?: string }) {
  const queryClient = useQueryClient();
  const usersQuery = useAllUsersQuery();
  const [search, setSearch] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState(initialUserId ?? "");
  const [draft, setDraft] = React.useState<CustomerManagementDraft>(EMPTY_DRAFT);
  const [reason, setReason] = React.useState("");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialUserId) setSelectedUserId(initialUserId);
  }, [initialUserId]);

  const profileQuery = useQuery({
    queryKey: ["customer-management", selectedUserId],
    queryFn: () => fetchManagedCustomer(selectedUserId),
    enabled: Boolean(selectedUserId),
  });

  React.useEffect(() => {
    if (!profileQuery.data) return;
    setDraft(draftFromManagedCustomer(profileQuery.data));
    setReason("");
  }, [profileQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateManagedCustomer,
    onSuccess: async (response) => {
      queryClient.setQueryData(
        ["customer-management", response.data.id],
        response.data
      );
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setReason("");
      setConfirmOpen(false);
      ToastMessage(
        response.meta.sessionsRevoked
          ? "تم تحديث البيانات وإلغاء جلسات العميل القديمة"
          : "تم تحديث بيانات العميل بنجاح",
        "success"
      );
    },
    onError: (error) => {
      setConfirmOpen(false);
      ToastMessage(getCustomerManagementErrorMessage(error), "error");
    },
  });

  const users = React.useMemo(
    () => filterUsers(usersQuery.data?.data ?? [], search).slice(0, 50),
    [search, usersQuery.data?.data]
  );
  const profile = profileQuery.data;
  const pendingPayload = profile
    ? buildCustomerManagementUpdate(profile, draft, reason)
    : null;

  const requestSave = () => {
    if (!pendingPayload) {
      ToastMessage("لم يتم إجراء أي تغيير على البيانات", "error");
      return;
    }
    if (reason.trim().length < 3) {
      ToastMessage("اكتب سبب التعديل قبل الحفظ", "error");
      return;
    }
    setConfirmOpen(true);
  };

  const confirmSave = () => {
    if (!profile || !pendingPayload) return;
    updateMutation.mutate({ customerId: profile.id, payload: pendingPayload });
  };

  return (
    <div className="flex-1 space-y-6 px-4 pt-4 lg:px-6" dir="rtl">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <ContactRound className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">إدارة بيانات العملاء</h1>
            <p className="text-sm text-muted-foreground">
              تعديل بيانات الحساب والعنوان للسوبر أدمين فقط مع تسجيل كل تغيير.
            </p>
          </div>
        </div>
      </div>

      <Alert>
        <ShieldCheck className="size-4" />
        <AlertTitle>تعديل محمي ومسجل</AlertTitle>
        <AlertDescription>
          تغيير الجوال أو البريد يلغي جلسات العميل القديمة. لا يمكن من هذه الصفحة تعديل
          الاشتراكات أو الوجبات أو الأرصدة أو المدفوعات.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="size-4" />
              اختر العميل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="الاسم أو رقم الجوال أو البريد"
                className="pr-9"
              />
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pl-1">
              {usersQuery.isLoading ? (
                <LoadingLine label="جاري تحميل العملاء..." />
              ) : usersQuery.isError ? (
                <p className="py-6 text-center text-sm text-destructive">
                  تعذر تحميل قائمة العملاء.
                </p>
              ) : users.length ? (
                users.map((user) => (
                  <CustomerChoice
                    key={user.id}
                    user={user}
                    selected={selectedUserId === user.id}
                    onClick={() => setSelectedUserId(user.id)}
                  />
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  لا يوجد عميل مطابق للبحث.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0">
          {!selectedUserId ? (
            <EmptySelection />
          ) : profileQuery.isLoading ? (
            <Card>
              <CardContent className="py-20">
                <LoadingLine label="جاري تحميل بيانات العميل..." />
              </CardContent>
            </Card>
          ) : profileQuery.isError || !profile ? (
            <Card>
              <CardContent className="space-y-4 py-16 text-center">
                <AlertTriangle className="mx-auto size-9 text-destructive" />
                <p>تعذر تحميل بيانات العميل.</p>
                <Button variant="outline" onClick={() => profileQuery.refetch()}>
                  إعادة المحاولة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle>{profile.fullName || "عميل بدون اسم"}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                      {profile.phoneE164}
                    </p>
                  </div>
                  <Badge variant={profile.isActive ? "default" : "secondary"}>
                    {profile.isActive ? "نشط" : "غير نشط"}
                  </Badge>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserRound className="size-4" />
                    بيانات الحساب
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <Field label="الاسم الكامل" icon={<UserRound className="size-4" />}>
                    <Input
                      value={draft.fullName}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, fullName: event.target.value }))
                      }
                      maxLength={120}
                    />
                  </Field>
                  <Field label="رقم الجوال السعودي" icon={<Phone className="size-4" />}>
                    <Input
                      value={draft.phone}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, phone: event.target.value }))
                      }
                      dir="ltr"
                      inputMode="tel"
                      placeholder="+9665XXXXXXXX"
                    />
                  </Field>
                  <Field label="البريد الإلكتروني" icon={<Mail className="size-4" />}>
                    <Input
                      value={draft.email}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, email: event.target.value }))
                      }
                      dir="ltr"
                      type="email"
                      placeholder="customer@example.com"
                    />
                  </Field>
                  <div className="flex items-center justify-between rounded-xl border p-4">
                    <div>
                      <Label htmlFor="customer-active">حالة الحساب</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        الحساب غير النشط لا يستطيع تسجيل الدخول.
                      </p>
                    </div>
                    <Switch
                      id="customer-active"
                      checked={draft.isActive}
                      onCheckedChange={(checked) =>
                        setDraft((current) => ({ ...current, isActive: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                    <MapPin className="size-4" />
                    عنوان الاشتراك النشط
                    {profile.activeSubscription ? (
                      <Badge variant="outline" dir="ltr">
                        {profile.activeSubscription.displayId}
                      </Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!profile.activeSubscription ? (
                    <AddressNotice text="لا يوجد اشتراك نشط؛ بيانات الحساب متاحة للتعديل بدون عنوان." />
                  ) : profile.activeSubscription.deliveryMode !== "delivery" ? (
                    <AddressNotice text="الاشتراك النشط استلام من الفرع، لذلك لا يوجد عنوان توصيل لتعديله." />
                  ) : (
                    <div className="grid gap-5 md:grid-cols-2">
                      <AddressField label="العنوان الأساسي" field="line1" draft={draft} setDraft={setDraft} />
                      <AddressField label="العنوان الإضافي" field="line2" draft={draft} setDraft={setDraft} />
                      <AddressField label="المدينة" field="city" draft={draft} setDraft={setDraft} />
                      <AddressField label="الحي" field="district" draft={draft} setDraft={setDraft} />
                      <AddressField label="الشارع" field="street" draft={draft} setDraft={setDraft} />
                      <AddressField label="المبنى" field="building" draft={draft} setDraft={setDraft} />
                      <AddressField label="الشقة" field="apartment" draft={draft} setDraft={setDraft} />
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address-notes">ملاحظات العنوان</Label>
                        <Textarea
                          id="address-notes"
                          value={draft.deliveryAddress.notes}
                          onChange={(event) =>
                            setAddressField(setDraft, "notes", event.target.value)
                          }
                          maxLength={500}
                          rows={3}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground md:col-span-2">
                        يتم تحديث العنوان الافتراضي للاشتراك النشط فقط. الأيام التي لها عنوان خاص تبقى كما هي.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 pt-6">
                  <Field label="سبب التعديل — مطلوب لسجل التدقيق">
                    <Textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="مثال: طلب العميل تصحيح رقم الجوال والعنوان"
                      maxLength={500}
                      rows={3}
                    />
                  </Field>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setDraft(draftFromManagedCustomer(profile));
                        setReason("");
                      }}
                      disabled={updateMutation.isPending}
                    >
                      إلغاء التغييرات
                    </Button>
                    <Button
                      type="button"
                      onClick={requestSave}
                      disabled={!pendingPayload || updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Save className="size-4" />
                      )}
                      حفظ التعديلات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تعديل بيانات العميل</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              سيتم حفظ التغييرات وتسجيل السبب وهوية السوبر أدمين. إذا تغير الجوال أو البريد،
              ستُلغى جلسات العميل الحالية ويلزمه تسجيل الدخول من جديد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={confirmSave} disabled={updateMutation.isPending}>
              تأكيد وحفظ
            </AlertDialogAction>
            <AlertDialogCancel disabled={updateMutation.isPending}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function filterUsers(users: User[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return users;
  return users.filter((user) =>
    [user.fullName, user.phoneE164, user.phone, user.email]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query)
  );
}

function CustomerChoice({
  user,
  selected,
  onClick,
}: {
  user: User;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-right transition-colors hover:bg-muted/60",
        selected && "border-primary bg-primary/5 ring-1 ring-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{user.fullName || "عميل بدون اسم"}</p>
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            {user.phoneE164 || user.phone}
          </p>
          {user.email ? (
            <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          ) : null}
        </div>
        {selected ? <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" /> : null}
      </div>
    </button>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function AddressField({
  label,
  field,
  draft,
  setDraft,
}: {
  label: string;
  field: keyof CustomerManagementDraft["deliveryAddress"];
  draft: CustomerManagementDraft;
  setDraft: React.Dispatch<React.SetStateAction<CustomerManagementDraft>>;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`address-${field}`}>{label}</Label>
      <Input
        id={`address-${field}`}
        value={draft.deliveryAddress[field]}
        onChange={(event) => setAddressField(setDraft, field, event.target.value)}
      />
    </div>
  );
}

function setAddressField(
  setDraft: React.Dispatch<React.SetStateAction<CustomerManagementDraft>>,
  field: keyof CustomerManagementDraft["deliveryAddress"],
  value: string
) {
  setDraft((current) => ({
    ...current,
    deliveryAddress: { ...current.deliveryAddress, [field]: value },
  }));
}

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptySelection() {
  return (
    <Card>
      <CardContent className="py-20 text-center">
        <ContactRound className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 font-semibold">اختر عميلًا للبدء</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ابحث بالاسم أو رقم الجوال أو البريد ثم اختر العميل من القائمة.
        </p>
      </CardContent>
    </Card>
  );
}

function AddressNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      <MapPin className="mx-auto mb-3 size-6" />
      {text}
    </div>
  );
}
