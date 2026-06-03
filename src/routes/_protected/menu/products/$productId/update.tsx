/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuProductSchema, {
  type MenuProductSchemaInput,
  type MenuProductSchemaType,
} from "@/lib/validations/menuProductSchema";
import {
  useMenuProductDetailQuery,
  useUpdateMenuProductMutation,
} from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Save, Loader2 } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuProductFormFields } from "@/components/pages/menu/products/MenuProductFormFields";
import { toUpdateMenuProductPayload } from "@/utils/menuPayloadMappers";
import { fetchUploadImage, resolveUploadedImageUrl } from "@/utils/fetchUploadImage";
import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuProductFormValues } from "@/utils/menuFormValues";
import type { MenuProduct } from "@/types/menuTypes";

export const Route = createFileRoute(
  "/_protected/menu/products/$productId/update"
)({
  component: UpdateMenuProductPage,
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل المنتج..." />
  ),
});

function UpdateMenuProductPage() {
  const { productId } = Route.useParams();
  const {
    data: prodData,
    isLoading,
    isError,
    error,
  } = useMenuProductDetailQuery(productId);

  if (isLoading) {
    return <Loader variant="full-screen" label="جاري تحميل المنتج..." />;
  }

  if (isError || !prodData?.data) {
    ToastMessage(
      (error as any)?.response?.data?.message || "خطأ في جلب معلومات المنتج",
      "error"
    );
    return null;
  }

  return (
    <UpdateMenuProductForm product={prodData.data} productId={productId} />
  );
}

function UpdateMenuProductForm({
  product,
  productId,
}: {
  product: MenuProduct;
  productId: string;
}) {
  const router = useRouter();
  const mutation = useUpdateMenuProductMutation();

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

  const onInvalidSubmit = useCallback(() => {
    ToastMessage("يرجى مراجعة الحقول المطلوبة قبل الحفظ", "error");
  }, []);

  return (
    <div className="w-full px-4 py-8 lg:px-8">
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
        onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
        className="space-y-6"
        noValidate
      >
        <MenuProductFormFields form={form} isEdit />
        <div className="sticky bottom-6 z-10 pt-2">
          <Card className="border-primary/30 bg-card/95 shadow-2xl ring-1 shadow-primary/10 ring-primary/10 backdrop-blur-md">
            <CardContent className="flex items-center justify-between p-4 sm:px-6">
              <p className="hidden text-sm font-medium text-muted-foreground sm:block">
                تأكد من مراجعة التعديلات
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
                    جارٍ الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
