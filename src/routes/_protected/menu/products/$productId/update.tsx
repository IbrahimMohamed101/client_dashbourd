/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Loader2,
  Package,
  Save,
} from "lucide-react";

import menuProductSchema, {
  type MenuProductSchemaInput,
  type MenuProductSchemaType,
} from "@/lib/validations/menuProductSchema";
import {
  useMenuProductComposerQuery,
  useUpdateMenuProductMutation,
} from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/global/loader";
import { MenuProductFormFields } from "@/components/pages/menu/products/MenuProductFormFields";
import { toUpdateMenuProductPayload } from "@/utils/menuPayloadMappers";
import {
  fetchUploadImage,
  resolveUploadedImageUrl,
} from "@/utils/fetchUploadImage";
import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuProductFormValues } from "@/utils/menuFormValues";
import type { MenuProductComposer } from "@/types/menuTypes";

export const Route = createFileRoute(
  "/_protected/menu/products/$productId/update"
)({
  component: UpdateMenuProductPage,
  pendingComponent: () => (
    <Loader variant="full-screen" label="جار تحميل المنتج..." />
  ),
});

function UpdateMenuProductPage() {
  const { productId } = Route.useParams();
  const {
    data: composerData,
    isLoading,
    isError,
    error,
  } = useMenuProductComposerQuery(productId);

  if (isLoading) {
    return <Loader variant="full-screen" label="جار تحميل المنتج..." />;
  }

  if (isError || !composerData?.data?.product) {
    ToastMessage(
      (error as any)?.response?.data?.message || "تعذر تحميل بيانات المنتج",
      "error"
    );
    return null;
  }

  return (
    <UpdateMenuProductForm composer={composerData.data} productId={productId} />
  );
}

function UpdateMenuProductForm({
  composer,
  productId,
}: {
  composer: MenuProductComposer;
  productId: string;
}) {
  const router = useRouter();
  const mutation = useUpdateMenuProductMutation();
  const product = composer.product;

  const form = useForm<MenuProductSchemaInput, unknown, MenuProductSchemaType>({
    resolver: zodResolver(menuProductSchema),
    defaultValues: getMenuProductFormValues(product),
  });

  const onSubmit = useCallback(
    async (data: MenuProductSchemaType) => {
      try {
        let imageUrl = data.imageUrl;
        if (data.imageFile instanceof File) {
          const uploadRes = await fetchUploadImage(data.imageFile);
          imageUrl = resolveUploadedImageUrl(uploadRes);
        }
        await mutation.mutateAsync({
          id: productId,
          data: toUpdateMenuProductPayload({ ...data, imageUrl }),
        });
        ToastMessage("تم تحديث المنتج بنجاح", "success");
        router.navigate({
          to: "/menu",
          search: { tab: "products" },
        });
      } catch (submitError: unknown) {
        ToastMessage(
          (submitError as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || "حدث خطأ أثناء الحفظ",
          "error"
        );
      }
    },
    [mutation, router, productId]
  );

  const showValidationSummary =
    form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0;

  return (
    <div className="w-full px-4 py-8 lg:px-8" dir="rtl">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">تعديل المنتج</h1>
            <p className="text-sm text-muted-foreground">
              تعديل بيانات "{product.name.ar || product.name.en || product.key}"
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <ProductComposerSummary composer={composer} />
        <MenuProductFormFields form={form} isEdit />

        <div className="sticky bottom-6 z-10 pt-2">
          <Card className="border-primary/30 bg-card/95 shadow-2xl ring-1 shadow-primary/10 ring-primary/10 backdrop-blur-md">
            <CardContent className="space-y-3 p-4 sm:px-6">
              {showValidationSummary ? (
                <Alert variant="destructive" className="text-right">
                  <AlertCircle className="size-4" />
                  <AlertTitle>بيانات مطلوبة ناقصة أو غير صحيحة</AlertTitle>
                  <AlertDescription>
                    يرجى مراجعة الحقول المحددة وتعبئة البيانات المطلوبة بشكل
                    صحيح ثم إعادة الحفظ.
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <p className="hidden text-sm font-medium text-muted-foreground sm:block">
                  تأكد من مراجعة التعديلات قبل الحفظ.
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={mutation.isPending || form.formState.isSubmitting}
                  className="w-full gap-2 px-10 text-base font-semibold shadow-md sm:w-auto"
                >
                  {mutation.isPending || form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      جار الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      حفظ التعديلات
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function formatSar(halala?: number, currency = "SAR") {
  return `${(Number(halala || 0) / 100).toFixed(2)} ${currency}`;
}

function ProductComposerSummary({
  composer,
}: {
  composer: MenuProductComposer;
}) {
  const linkedGroups = composer.linkedOptionGroups || [];
  const warningCount = composer.validation?.warnings?.length || 0;
  const errorCount = composer.validation?.errors?.length || 0;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">قراءة المنتج من العقد الجديد</p>
          <Badge variant="outline">{composer.contractVersion}</Badge>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">الحالة</p>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={composer.publishState?.isPublished ? "default" : "outline"}
            >
              {composer.publishState?.isPublished ? "منشور" : "غير منشور"}
            </Badge>
            <Badge
              variant={composer.availability?.isAvailable ? "secondary" : "outline"}
            >
              {composer.availability?.isAvailable ? "متاح" : "غير متاح"}
            </Badge>
            <Badge
              variant={composer.availability?.isVisible ? "secondary" : "outline"}
            >
              {composer.availability?.isVisible ? "ظاهر" : "مخفي"}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">السعر والربط</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {formatSar(composer.pricing?.priceHalala, composer.pricing?.currency)}
            </Badge>
            <Badge variant="outline">
              <Link2 data-icon="inline-start" />
              {linkedGroups.length} مجموعات
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">التحقق</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={errorCount ? "destructive" : "secondary"}>
              <CheckCircle2 data-icon="inline-start" />
              {errorCount ? `${errorCount} أخطاء` : "بدون أخطاء"}
            </Badge>
            {warningCount ? (
              <Badge variant="outline">{warningCount} تنبيهات</Badge>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
