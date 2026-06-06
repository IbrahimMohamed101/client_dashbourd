import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionSchema, {
  type MenuOptionSchemaInput,
  type MenuOptionSchemaType,
} from "@/lib/validations/menuOptionSchema";
import { useUpdateMenuOptionMutation, useMenuOptionDetailQuery } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Settings2, Save, Loader2, AlertCircle } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuOptionFormFields } from "@/components/pages/menu/options/MenuOptionFormFields";
import { toUpdateMenuOptionPayload } from "@/utils/menuPayloadMappers";
import { fetchUploadImage, resolveUploadedImageUrl } from "@/utils/fetchUploadImage";
import { ToastMessage } from "@/components/global/ToastMessage";
import { getMenuOptionFormValues } from "@/utils/menuFormValues";
import type { MenuOption } from "@/types/menuTypes";

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
  const { data: optionData, isLoading } = useMenuOptionDetailQuery(optionId);
  const option = optionData?.data;

  if (isLoading)
    return <Loader variant="full-screen" label="جاري التحميل..." />;

  if (!option)
    return <Loader variant="full-screen" label="تعذر تحميل الخيار" />;

  return (
    <UpdateOptionForm
      key={option.id ?? optionId}
      option={option}
      optionId={optionId}
    />
  );
}

function UpdateOptionForm({
  option,
  optionId,
}: {
  option: MenuOption;
  optionId: string;
}) {
  const router = useRouter();
  const mutation = useUpdateMenuOptionMutation();

  const form = useForm<MenuOptionSchemaInput, unknown, MenuOptionSchemaType>({
    resolver: zodResolver(menuOptionSchema),
    defaultValues: getMenuOptionFormValues(option),
  });

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
        search: { tab: "builder" }
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
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
