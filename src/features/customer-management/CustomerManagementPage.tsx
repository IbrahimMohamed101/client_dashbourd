import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ContactRound,
  Gift,
  History,
  LoaderCircle,
  Mail,
  MapPin,
  Merge,
  Phone,
  Save,
  Search,
  ShieldCheck,
  UtensilsCrossed,
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
  grantMealCompensation,
  getCustomerManagementErrorMessage,
  mergeCustomerAccounts,
  previewCustomerAccountMerge,
  updateManagedCustomer,
  type AccountMergePreview,
  type CustomerManagementDraft,
  type ManagedCustomerProfile,
  type MealCompensation,
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
  const [compensationQuantity, setCompensationQuantity] = React.useState("1");
  const [compensationReason, setCompensationReason] = React.useState("");
  const [compensationConfirmOpen, setCompensationConfirmOpen] = React.useState(false);
  const [compensationKey, setCompensationKey] = React.useState("");

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
    setCompensationQuantity("1");
    setCompensationReason("");
    setCompensationKey("");
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

  const compensationMutation = useMutation({
    mutationFn: grantMealCompensation,
    onSuccess: (response) => {
      queryClient.setQueryData(
        ["customer-management", response.data.id],
        response.data
      );
      setCompensationQuantity("1");
      setCompensationReason("");
      setCompensationKey("");
      setCompensationConfirmOpen(false);
      ToastMessage(
        response.meta.replayed
          ? "تم تسجيل هذا التعويض مسبقًا ولم تتكرر الإضافة"
          : `تمت إضافة ${response.meta.compensation.quantity} وجبة تعويضية`,
        "success"
      );
    },
    onError: (error) => {
      setCompensationConfirmOpen(false);
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

  const compensationCount = Number(compensationQuantity);
  const requestCompensation = () => {
    if (!profile?.activeSubscription) {
      ToastMessage("لا يوجد اشتراك نشط لإضافة التعويض", "error");
      return;
    }
    if (!Number.isInteger(compensationCount) || compensationCount < 1 || compensationCount > 100) {
      ToastMessage("عدد الوجبات يجب أن يكون من 1 إلى 100", "error");
      return;
    }
    if (compensationReason.trim().length < 3) {
      ToastMessage("اكتب سبب التعويض قبل المتابعة", "error");
      return;
    }
    setCompensationKey(crypto.randomUUID());
    setCompensationConfirmOpen(true);
  };

  const confirmCompensation = () => {
    if (!profile || !compensationKey) return;
    compensationMutation.mutate({
      customerId: profile.id,
      quantity: compensationCount,
      reason: compensationReason,
      idempotencyKey: compensationKey,
    });
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
          تغيير الجوال أو البريد يلغي جلسات العميل القديمة. تعويض الوجبات يتم كعملية مستقلة
          وآمنة ولا يُحسب كدفع أو استلام وجبات.
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

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                <SubscriptionOverview subscription={profile.activeSubscription} />

                <Card className="border-primary/20 bg-primary/[0.02]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Gift className="size-4 text-primary" />
                      إضافة وجبات تعويضية
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      زيادة مجانية في رصيد الوجبات مع تسجيل السبب والمنفّذ والرصيد قبل وبعد.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!profile.activeSubscription ? (
                      <AddressNotice text="لا يوجد اشتراك نشط يمكن إضافة تعويض له." />
                    ) : (
                      <>
                        <Field label="عدد الوجبات">
                          <Input
                            value={compensationQuantity}
                            onChange={(event) => setCompensationQuantity(event.target.value)}
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={100}
                          />
                        </Field>
                        <Field label="سبب التعويض — مطلوب">
                          <Textarea
                            value={compensationReason}
                            onChange={(event) => setCompensationReason(event.target.value)}
                            placeholder="مثال: تعويض العميل عن يوم لم تصله فيه الوجبات"
                            maxLength={500}
                            rows={3}
                          />
                        </Field>
                        <div className="rounded-xl border bg-background p-3 text-xs text-muted-foreground">
                          الرصيد المتوقع بعد الإضافة: <strong className="text-foreground">
                            {Number.isInteger(compensationCount) && compensationCount > 0
                              ? profile.activeSubscription.balances.remainingMeals + compensationCount
                              : profile.activeSubscription.balances.remainingMeals}
                          </strong> وجبة. لا يتم تمديد تاريخ الاشتراك تلقائيًا.
                        </div>
                        <Button
                          type="button"
                          className="w-full"
                          onClick={requestCompensation}
                          disabled={compensationMutation.isPending}
                        >
                          {compensationMutation.isPending ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <Gift className="size-4" />
                          )}
                          مراجعة وإضافة التعويض
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <CompensationHistoryCard
                rows={profile.activeSubscription?.compensationHistory ?? []}
              />

              <AccountMergeCard
                profile={profile}
                onMerged={async (targetId) => {
                  setSelectedUserId(targetId);
                  await queryClient.invalidateQueries({ queryKey: ["users"] });
                  await queryClient.invalidateQueries({
                    queryKey: ["customer-management", targetId],
                  });
                }}
              />

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

      <AlertDialog
        open={compensationConfirmOpen}
        onOpenChange={(open) => {
          setCompensationConfirmOpen(open);
          if (!open && !compensationMutation.isPending) setCompensationKey("");
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إضافة الوجبات التعويضية</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-right">
              <span className="block">
                سيتم إضافة <strong>{compensationCount}</strong> وجبة إلى اشتراك
                {profile?.activeSubscription ? ` ${profile.activeSubscription.displayId}` : " العميل"}.
              </span>
              {profile?.activeSubscription ? (
                <span className="block rounded-lg border p-3">
                  الرصيد: {profile.activeSubscription.balances.remainingMeals} ← {profile.activeSubscription.balances.remainingMeals + compensationCount}
                </span>
              ) : null}
              <span className="block">السبب: {compensationReason.trim()}</span>
              <span className="block text-destructive">
                هذه عملية رصيد حقيقية ومسجلة، وليست مجرد ملاحظة على الحساب.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={confirmCompensation}
              disabled={compensationMutation.isPending}
            >
              {compensationMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              تأكيد إضافة التعويض
            </AlertDialogAction>
            <AlertDialogCancel disabled={compensationMutation.isPending}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const MERGE_COUNT_LABELS: Record<string, string> = {
  subscriptions: "الاشتراكات",
  orders: "الطلبات",
  payments: "المدفوعات",
  checkoutDrafts: "مسودات الدفع",
  promoUsages: "استخدامات الخصم",
  notifications: "الإشعارات",
  accountDeletionRequests: "طلبات حذف الحساب",
  pickupRequests: "طلبات الاستلام",
  entitlementBatches: "حزم الاستحقاق",
  entitlementDayBlueprints: "خطط أيام الاستحقاق",
  entitlementCompensations: "تعويضات الاستحقاق",
  entitlementAllocations: "حجوزات الوجبات",
  extraEntitlementBuckets: "أرصدة الإضافات",
  extraEntitlementAllocations: "حجوزات الإضافات",
  dayAppendOperations: "عمليات إضافة الأيام",
};

function AccountMergeCard({
  profile,
  onMerged,
}: {
  profile: ManagedCustomerProfile;
  onMerged: (targetId: string) => Promise<void>;
}) {
  const [targetPhone, setTargetPhone] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [preview, setPreview] = React.useState<AccountMergePreview | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [idempotencyKey, setIdempotencyKey] = React.useState("");
  const [activeSubscriptionResolution, setActiveSubscriptionResolution] = React.useState<
    "keep_source" | "keep_target" | ""
  >("");

  React.useEffect(() => {
    setTargetPhone("");
    setReason("");
    setPreview(null);
    setConfirmOpen(false);
    setIdempotencyKey("");
    setActiveSubscriptionResolution("");
  }, [profile.id]);

  const previewMutation = useMutation({
    mutationFn: previewCustomerAccountMerge,
    onSuccess: (data) => setPreview(data),
    onError: (error) => ToastMessage(getCustomerManagementErrorMessage(error), "error"),
  });
  const mergeMutation = useMutation({
    mutationFn: mergeCustomerAccounts,
    onSuccess: async (response) => {
      setConfirmOpen(false);
      ToastMessage(
        response.meta.replayed
          ? "تم دمج الحسابين مسبقًا"
          : "تم نقل كل البيانات إلى الحساب الصحيح وتعطيل الحساب المكرر",
        "success"
      );
      await onMerged(response.data.target.id);
    },
    onError: (error) => {
      setConfirmOpen(false);
      ToastMessage(getCustomerManagementErrorMessage(error), "error");
    },
  });

  const requestPreview = () => {
    if (!targetPhone.trim()) {
      ToastMessage("اكتب رقم الحساب الصحيح أولًا", "error");
      return;
    }
    setPreview(null);
    previewMutation.mutate({ customerId: profile.id, targetPhone });
  };
  const requestMerge = () => {
    if (!canMergeAfterResolution) return;
    if (reason.trim().length < 3) {
      ToastMessage("اكتب سبب الدمج قبل المتابعة", "error");
      return;
    }
    setIdempotencyKey(crypto.randomUUID());
    setConfirmOpen(true);
  };
  const confirmMerge = () => {
    if (!preview || !idempotencyKey) return;
    mergeMutation.mutate({
      customerId: profile.id,
      targetPhone: preview.target.phone,
      reason,
      idempotencyKey,
      ...(activeSubscriptionResolution ? { activeSubscriptionResolution } : {}),
    });
  };

  const countKeys = preview
    ? Object.keys(MERGE_COUNT_LABELS).filter(
        (key) => (preview.sourceCounts[key] || 0) > 0 || (preview.targetCounts[key] || 0) > 0
      )
    : [];
  const activeSubscriptionConflict = preview?.conflicts.find(
    (conflict) => conflict.code === "MULTIPLE_ACTIVE_SUBSCRIPTIONS"
  );
  const blockingConflicts = preview?.conflicts.filter(
    (conflict) => conflict.code !== "MULTIPLE_ACTIVE_SUBSCRIPTIONS"
  ) ?? [];
  const canMergeAfterResolution = Boolean(
    preview && blockingConflicts.length === 0 && (!activeSubscriptionConflict || activeSubscriptionResolution)
  );

  return (
    <>
      <Card className="border-amber-300/70 bg-amber-50/30 dark:bg-amber-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Merge className="size-4 text-amber-700" />
            دمج حساب مكرر
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            ينقل كل الاشتراكات والطلبات والمدفوعات من الحساب المحدد إلى الحساب الصحيح،
            مع الاحتفاظ بتسجيل الدخول وكلمة المرور وبيانات الحساب الصحيح.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <Field label="رقم الجوال للحساب الصحيح">
              <Input
                value={targetPhone}
                onChange={(event) => {
                  setTargetPhone(event.target.value);
                  setPreview(null);
                  setActiveSubscriptionResolution("");
                }}
                dir="ltr"
                inputMode="tel"
                placeholder="+9665XXXXXXXX"
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              onClick={requestPreview}
              disabled={previewMutation.isPending || mergeMutation.isPending}
            >
              {previewMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              معاينة الدمج
            </Button>
          </div>

          {preview ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <MergeAccountSummary title="الحساب المكرر — سيتم تعطيله" account={preview.source} destructive />
                <MergeAccountSummary title="الحساب الصحيح — سيظل تسجيل دخوله" account={preview.target} />
              </div>

              {countKeys.length ? (
                <div className="overflow-hidden rounded-xl border bg-background">
                  <div className="grid grid-cols-[minmax(0,1fr)_90px_90px] bg-muted/50 px-4 py-2 text-xs font-medium">
                    <span>نوع البيانات</span>
                    <span className="text-center">المكرر</span>
                    <span className="text-center">الصحيح</span>
                  </div>
                  {countKeys.map((key) => (
                    <div
                      key={key}
                      className="grid grid-cols-[minmax(0,1fr)_90px_90px] border-t px-4 py-2 text-sm"
                    >
                      <span>{MERGE_COUNT_LABELS[key]}</span>
                      <span className="text-center font-semibold tabular-nums">{preview.sourceCounts[key] || 0}</span>
                      <span className="text-center tabular-nums">{preview.targetCounts[key] || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <AddressNotice text="لا توجد بيانات تشغيلية لنقلها من الحساب المكرر." />
              )}

              {preview.conflicts.length ? (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>يلزم حل تعارض قبل الدمج</AlertTitle>
                  <AlertDescription>
                    {preview.conflicts.map((conflict) => (
                      <p key={conflict.code}>{accountMergeConflictMessage(conflict.code)}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <ShieldCheck className="size-4" />
                  <AlertTitle>المعاينة سليمة</AlertTitle>
                  <AlertDescription>
                    لن يتم استبدال اسم أو بريد أو كلمة مرور الحساب الصحيح. سيُعطّل الحساب
                    المكرر وتُنقل ملكية كل البيانات الظاهرة أعلاه.
                  </AlertDescription>
                </Alert>
              )}

              {activeSubscriptionConflict ? (
                <div className="space-y-3 rounded-xl border border-amber-300 bg-amber-50/70 p-4 dark:bg-amber-950/20">
                  <div>
                    <p className="font-semibold">أي اشتراك سيظل نشطًا؟</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      لن نحذف الاشتراك الآخر؛ سيتحول إلى «مجمّد» وتبقى كل بياناته محفوظة.
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Button
                      type="button"
                      variant={activeSubscriptionResolution === "keep_source" ? "default" : "outline"}
                      onClick={() => setActiveSubscriptionResolution("keep_source")}
                    >
                      إبقاء الاشتراك الجديد على الحساب المكرر
                    </Button>
                    <Button
                      type="button"
                      variant={activeSubscriptionResolution === "keep_target" ? "default" : "outline"}
                      onClick={() => setActiveSubscriptionResolution("keep_target")}
                    >
                      إبقاء اشتراك الحساب الصحيح
                    </Button>
                  </div>
                </div>
              ) : null}

              <Field label="سبب الدمج — مطلوب لسجل التدقيق">
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="مثال: العميل سجّل الاشتراك على رقم خاطئ ولديه حساب سابق بالرقم الصحيح"
                  maxLength={500}
                  rows={3}
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={requestMerge}
                  disabled={!canMergeAfterResolution || mergeMutation.isPending}
                >
                  <Merge className="size-4" />
                  مراجعة وتنفيذ الدمج
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && !mergeMutation.isPending) setIdempotencyKey("");
        }}
      >
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد دمج حسابي العميل</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-right">
              <span className="block">
                سيتم نقل بيانات <strong dir="ltr">{preview?.source.phone}</strong> إلى الحساب
                الصحيح <strong dir="ltr">{preview?.target.phone}</strong>.
              </span>
              <span className="block rounded-lg border p-3">
                الحساب الصحيح يحتفظ بتسجيل الدخول والاسم والبريد وكلمة المرور الحالية.
                الحساب المكرر سيُعطّل نهائيًا مع الاحتفاظ بسجل تدقيق كامل.
              </span>
              {activeSubscriptionResolution ? (
                <span className="block">
                  الاشتراك النشط بعد الدمج: {activeSubscriptionResolution === "keep_source"
                    ? "الاشتراك الجديد الموجود على الحساب المكرر"
                    : "اشتراك الحساب الصحيح الحالي"}.
                </span>
              ) : null}
              <span className="block text-destructive">
                هذه عملية حقيقية على الاشتراكات والطلبات والمدفوعات وليست تعديل رقم فقط.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={confirmMerge} disabled={mergeMutation.isPending}>
              {mergeMutation.isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
              تأكيد الدمج ونقل البيانات
            </AlertDialogAction>
            <AlertDialogCancel disabled={mergeMutation.isPending}>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MergeAccountSummary({
  title,
  account,
  destructive = false,
}: {
  title: string;
  account: AccountMergePreview["source"];
  destructive?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border bg-background p-4", destructive && "border-destructive/40")}>
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 font-semibold">{account.fullName || "عميل بدون اسم"}</p>
      <p className="mt-1 text-sm" dir="ltr">{account.phone}</p>
      {account.email ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{account.email}</p> : null}
    </div>
  );
}

function accountMergeConflictMessage(code: string) {
  if (code === "MULTIPLE_ACTIVE_SUBSCRIPTIONS") {
    return "الحسابان لديهما اشتراك نشط. يجب تحديد الاشتراك الذي سيظل نشطًا قبل الدمج.";
  }
  if (code === "ORDER_KEY_CONFLICT") return "توجد طلبات متعارضة بنفس مفتاح العملية.";
  if (code === "CHECKOUT_KEY_CONFLICT") return "توجد مسودات دفع متعارضة بنفس مفتاح العملية.";
  return "يوجد تعارض بيانات يحتاج مراجعة قبل الدمج.";
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

function SubscriptionOverview({
  subscription,
}: {
  subscription: ManagedCustomerProfile["activeSubscription"];
}) {
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UtensilsCrossed className="size-4" />
            الاشتراك والرصيد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressNotice text="لا يوجد اشتراك نشط لهذا العميل." />
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    ["إجمالي الوجبات", subscription.balances.totalMeals],
    ["المتبقي العادي", subscription.balances.remainingRegularMeals],
    ["المتبقي المميز", subscription.balances.remainingPremiumMeals],
    ["المستهلك", subscription.balances.consumedMeals],
    ["المحجوز", subscription.balances.reservedMeals],
    ["إجمالي التعويض", subscription.balances.compensatedMealsTotal],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UtensilsCrossed className="size-4" />
              الاشتراك والرصيد
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {subscription.planName?.ar || subscription.planName?.en || "الخطة غير مسماة"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" dir="ltr">{subscription.displayId}</Badge>
            <Badge>{subscription.status === "active" ? "نشط" : subscription.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {metrics.map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <SubscriptionDetail label="بداية الاشتراك" value={formatCustomerDate(subscription.startDate)} />
          <SubscriptionDetail label="نهاية الصلاحية" value={formatCustomerDate(subscription.validityEndDate)} />
          <SubscriptionDetail
            label="طريقة الاستلام"
            value={subscription.deliveryMode === "delivery" ? "توصيل" : "استلام من الفرع"}
          />
          <SubscriptionDetail
            label="وجبات يومية"
            value={subscription.selectedMealsPerDay ? String(subscription.selectedMealsPerDay) : "—"}
          />
          <SubscriptionDetail
            label="حجم البروتين"
            value={subscription.selectedGrams ? `${subscription.selectedGrams} جم` : "—"}
          />
          <SubscriptionDetail
            label="المصادَر"
            value={String(subscription.balances.forfeitedMeals)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  );
}

function CompensationHistoryCard({ rows }: { rows: MealCompensation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" />
          سجل التعويضات
          <Badge variant="secondary">{rows.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!rows.length ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            لم تتم إضافة وجبات تعويضية لهذا الاشتراك بعد.
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id || row.idempotencyKey}
                className="grid gap-3 rounded-xl border p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center"
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  +{row.quantity}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{row.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    الرصيد المتبقي: {row.before.remainingMeals} ← {row.after.remainingMeals}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground md:text-left">
                  {formatCustomerDateTime(row.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatCustomerDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium" }).format(date);
}

function formatCustomerDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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
