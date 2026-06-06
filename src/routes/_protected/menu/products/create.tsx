import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuProductSchema, {
  type MenuProductSchemaInput,
  type MenuProductSchemaType,
} from "@/lib/validations/menuProductSchema";
import { useCreateMenuProductMutation } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Package, Save, Loader2, AlertCircle } from "lucide-react";
import { MenuProductFormFields } from "@/components/pages/menu/products/MenuProductFormFields";
import { toCreateMenuProductPayload } from "@/utils/menuPayloadMappers";
import { fetchUploadImage, resolveUploadedImageUrl } from "@/utils/fetchUploadImage";
import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuProductCreateDefaults } from "@/utils/menuFormValues";

export const Route = createFileRoute("/_protected/menu/products/create")({
  component: CreateMenuProductPage,
});

function CreateMenuProductPage() {
  const router = useRouter();
  const mutation = useCreateMenuProductMutation();

  const form = useForm<MenuProductSchemaInput, unknown, MenuProductSchemaType>({
    resolver: zodResolver(menuProductSchema),
    defaultValues: getMenuProductCreateDefaults(),
  });

  const onSubmit = async (data: MenuProductSchemaType) => {
    try {
      let imageUrl = data.imageUrl;
      if (data.imageFile instanceof File) {
        const uploadRes = await fetchUploadImage(data.imageFile);
        imageUrl = resolveUploadedImageUrl(uploadRes);
      }
      await mutation.mutateAsync(toCreateMenuProductPayload({ ...data, imageUrl }));
      ToastMessage("تم إنشاء المنتج بنجاح", "success");
      router.navigate({
        to: "/menu",
        search: { tab: "catalog" }
      });
    } catch (error: unknown) {
      ToastMessage(
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "حدث خطأ أثناء الحفظ",
        "error"
      );
    }
  };

  const showValidationSummary =
    form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0;

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              إضافة منتج جديد
            </h1>
            <p className="text-sm text-muted-foreground">
              قم بتعبئة البيانات أدناه لإضافة منتج للقائمة
            </p>
          </div>
        </div>
      </div>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <MenuProductFormFields form={form} />
        <div className="sticky bottom-6 z-10 pt-2">
          <Card className="border-primary/30 bg-card/95 shadow-2xl ring-1 shadow-primary/10 ring-primary/10 backdrop-blur-md">
            <CardContent className="space-y-3 p-4 sm:px-6">
              {showValidationSummary ? (
                <Alert variant="destructive" className="text-right">
                  <AlertCircle className="size-4" />
                  <AlertTitle>بيانات مطلوبة ناقصة أو غير صحيحة</AlertTitle>
                  <AlertDescription>
                    يرجى مراجعة الحقول الحمراء وتعبئة الحقول المطلوبة بشكل صحيح ثم حاول الإضافة مرة أخرى.
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <p className="hidden text-sm font-medium text-muted-foreground sm:block">
                  تأكد من مراجعة جميع البيانات
                </p>
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="w-full gap-2 px-10 text-base font-semibold shadow-md sm:w-auto"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    جارٍ الإضافة...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    إضافة المنتج
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
