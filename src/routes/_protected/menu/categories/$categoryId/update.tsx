import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuCategorySchema, {
  type MenuCategorySchemaInput,
  type MenuCategorySchemaType,
} from "@/lib/validations/menuCategorySchema";
import type { MenuCategory } from "@/types/menuTypes";
import { useUpdateMenuCategoryMutation, useMenuCategoryDetailQuery } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, FolderOpen, Save, Loader2 } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuCategoryFormFields } from "@/components/pages/menu/categories/MenuCategoryFormFields";
import { toUpdateMenuCategoryPayload } from "@/utils/menuPayloadMappers";
import { fetchUploadImage, resolveUploadedImageUrl } from "@/utils/fetchUploadImage";
import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuCategoryFormValues } from "@/utils/menuFormValues";

export const Route = createFileRoute(
  "/_protected/menu/categories/$categoryId/update"
)({
  component: UpdateMenuCategoryPage,
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل التصنيف..." />
  ),
});

function UpdateMenuCategoryPage() {
  const { categoryId } = Route.useParams();

  const { data: catData, isLoading } = useMenuCategoryDetailQuery(categoryId);

  const category = catData?.data;

  if (isLoading)
    return <Loader variant="full-screen" label="جاري تحميل التصنيف..." />;

  if (!category)
    return <Loader variant="full-screen" label="تعذر تحميل التصنيف" />;

  return (
    <UpdateMenuCategoryForm
      key={category.id ?? categoryId}
      category={category}
      categoryId={categoryId}
    />
  );
}

function UpdateMenuCategoryForm({
  category,
  categoryId,
}: {
  category: MenuCategory;
  categoryId: string;
}) {
  const router = useRouter();
  const mutation = useUpdateMenuCategoryMutation();

  const form = useForm<
    MenuCategorySchemaInput,
    unknown,
    MenuCategorySchemaType
  >({
    resolver: zodResolver(menuCategorySchema),
    defaultValues: getMenuCategoryFormValues(category),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: MenuCategorySchemaType) => {
    try {
      let imageUrl = data.imageUrl;
      if (data.imageFile instanceof File) {
        const uploadRes = await fetchUploadImage(data.imageFile);
        imageUrl = resolveUploadedImageUrl(uploadRes);
      }
      await mutation.mutateAsync({
        id: categoryId,
        data: toUpdateMenuCategoryPayload({ ...data, imageUrl }),
      });
      ToastMessage("تم تحديث التصنيف بنجاح", "success");
      router.navigate({
        to: "/menu",
        search: { tab: "categories" }
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
            <FolderOpen className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">تعديل التصنيف</h1>
            <p className="text-sm text-muted-foreground">
              تعديل بيانات التصنيف "{category?.name.ar}"
            </p>
          </div>
        </div>
      </div>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <MenuCategoryFormFields form={form} isEdit />
        <div className="sticky bottom-6 z-10 pt-2">
          <Card className="border-primary/30 bg-card/95 shadow-2xl ring-1 shadow-primary/10 ring-primary/10 backdrop-blur-md">
            <CardContent className="space-y-3 p-4 sm:px-6">
              {showValidationSummary ? (
                <Alert variant="destructive" className="text-right">
                  <AlertCircle className="size-4" />
                  <AlertTitle>بيانات مطلوبة ناقصة</AlertTitle>
                  <AlertDescription>
                    اكتب الاسم بالعربية والإنجليزية ثم حاول الحفظ مرة أخرى.
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <p className="hidden text-sm font-medium text-muted-foreground sm:block">
                  تأكد من مراجعة التعديلات قبل الحفظ
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
                    جارٍ الحفظ...
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
