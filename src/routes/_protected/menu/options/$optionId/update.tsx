import { createFileRoute, useRouter } from "@tanstack/react-router";
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
import { normalizeAvailableForFromApi } from "@/constants/menuCatalog";

import { ToastMessage } from "@/components/global/ToastMessage";

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
    values: option
      ? {
          groupId: option.groupId || "",
          key: option.key,
          name: option.name,
          description: option.description || { ar: "", en: "" },
          imageUrl: option.imageUrl || "",
          extraPriceSar: option.extraPriceHalala / 100,
          extraWeightUnitGrams: option.extraWeightUnitGrams,
          extraWeightPriceSar: option.extraWeightPriceHalala
            ? option.extraWeightPriceHalala / 100
            : undefined,
          isActive: option.isActive,
          isAvailable: option.isAvailable,
          isVisible: option.isVisible ?? true,
          displayCategoryKey: option.displayCategoryKey ?? "",
          proteinFamilyKey: option.proteinFamilyKey ?? "",
          availableFor: normalizeAvailableForFromApi(option.availableFor),
          availableForSubscription:
            option.availableForSubscription ??
            option.availableFor?.includes("subscription") ??
            true,
          sortOrder: option.sortOrder,
        }
      : undefined,
  });

  const onSubmit = async (data: MenuOptionSchemaType) => {
    try {
      await mutation.mutateAsync({
        id: optionId,
        data: toUpdateMenuOptionPayload(data),
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
