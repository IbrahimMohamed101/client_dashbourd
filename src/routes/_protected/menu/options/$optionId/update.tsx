import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionSchema, {
  type MenuOptionSchemaInput,
  type MenuOptionSchemaType,
} from "@/lib/validations/menuOptionSchema";
import { useUpdateMenuOptionMutation } from "@/hooks/useMenuQuery";
import { fetchMenuOptionById } from "@/utils/fetchMenuOptions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Save, Loader2 } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuOptionFormFields } from "@/components/pages/menu/options/MenuOptionFormFields";
import { useQuery } from "@tanstack/react-query";
import { toUpdateMenuOptionPayload } from "@/utils/menuPayloadMappers";
import { fetchUploadImage, resolveUploadedImageUrl } from "@/utils/fetchUploadImage";

import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuOptionCreateDefaults, getMenuOptionFormValues } from "@/utils/menuFormValues";

export const Route = createFileRoute(
  "/_protected/menu/options/$optionId/update"
)({
  component: UpdateOptionPage,
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري التحميل..." />
  ),
});

function UpdateOptionPage() {
  const { optionId } = Route.useParams();
  const router = useRouter();
  const mutation = useUpdateMenuOptionMutation();

  const { data: optionData, isLoading } = useQuery({
    queryKey: ["menu", "options", "detail", optionId],
    queryFn: () => fetchMenuOptionById(optionId),
    enabled: !!optionId,
  });

  const option = optionData?.data;

  const form = useForm<MenuOptionSchemaInput, unknown, MenuOptionSchemaType>({
    resolver: zodResolver(menuOptionSchema),
    defaultValues: getMenuOptionCreateDefaults(),
  });

  useEffect(() => {
    if (option) {
      form.reset(getMenuOptionFormValues(option));
    }
  }, [form, option]);

  const onSubmit = async (data: MenuOptionSchemaType) => {
    try {
      let imageUrl = data.imageUrl;
      if (data.imageFile instanceof File) {
        const uploadRes = await fetchUploadImage(data.imageFile);
        imageUrl = resolveUploadedImageUrl(uploadRes);
      }
      await mutation.mutateAsync({
        id: optionId,
        data: toUpdateMenuOptionPayload({ ...data, imageUrl }),
      });
      ToastMessage("تم تحديث الخيار بنجاح", "success");
      router.navigate({
        to: "/menu",
        search: { tab: "options" }
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
    return <Loader variant="full-screen" label="جاري التحميل..." />;

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">تعديل الخيار</h1>
            <p className="text-sm text-muted-foreground">
              تعديل &quot;{option?.name.ar}&quot;
            </p>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <MenuOptionFormFields form={form} isEdit />

        {/* ── Sticky Save Bar ── */}
        <div className="sticky bottom-6 z-10 pt-2">
          <Card className="border-primary/30 bg-card/95 shadow-2xl ring-1 shadow-primary/10 ring-primary/10 backdrop-blur-md">
            <CardContent className="flex items-center justify-between p-4 sm:px-6">
              <p className="hidden text-sm font-medium text-muted-foreground sm:block">
                تأكد من المراجعة
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
