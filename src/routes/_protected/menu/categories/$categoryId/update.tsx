import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuCategorySchema, {
  type MenuCategorySchemaInput,
  type MenuCategorySchemaType,
} from "@/lib/validations/menuCategorySchema";
import { useUpdateMenuCategoryMutation } from "@/hooks/useMenuQuery";
import { fetchMenuCategoryById } from "@/utils/fetchMenuCategories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Save, Loader2 } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuCategoryFormFields } from "@/components/pages/menu/categories/MenuCategoryFormFields";
import { useQuery } from "@tanstack/react-query";
import { toUpdateMenuCategoryPayload } from "@/utils/menuPayloadMappers";
import { fetchUploadImage, resolveUploadedImageUrl } from "@/utils/fetchUploadImage";
import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuCategoryCreateDefaults, getMenuCategoryFormValues } from "@/utils/menuFormValues";

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
  const router = useRouter();
  const mutation = useUpdateMenuCategoryMutation();

  const { data: catData, isLoading } = useQuery({
    queryKey: ["menu", "categories", "detail", categoryId],
    queryFn: () => fetchMenuCategoryById(categoryId),
    enabled: !!categoryId,
  });

  const category = catData?.data;

  const form = useForm<
    MenuCategorySchemaInput,
    unknown,
    MenuCategorySchemaType
  >({
    resolver: zodResolver(menuCategorySchema),
    defaultValues: getMenuCategoryCreateDefaults(),
  });

  useEffect(() => {
    if (category) {
      form.reset(getMenuCategoryFormValues(category));
    }
  }, [form, category]);

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

  if (isLoading)
    return <Loader variant="full-screen" label="جاري تحميل التصنيف..." />;

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
            <CardContent className="flex items-center justify-between p-4 sm:px-6">
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
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
