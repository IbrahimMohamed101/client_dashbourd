import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionGroupSchema, {
  type MenuOptionGroupSchemaInput,
  type MenuOptionGroupSchemaType,
} from "@/lib/validations/menuOptionGroupSchema";
import { useUpdateMenuOptionGroupMutation } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Save, Loader2 } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuOptionGroupFormFields } from "@/components/pages/menu/option-groups/MenuOptionGroupFormFields";
import { useQuery } from "@tanstack/react-query";
import { fetchMenuOptionGroupById } from "@/utils/fetchMenuOptionGroups";
import { toUpdateMenuOptionGroupPayload } from "@/utils/menuPayloadMappers";

export const Route = createFileRoute(
  "/_protected/menu/option-groups/$groupId/update"
)({
  component: UpdateOptionGroupPage,
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري التحميل..." />
  ),
});

function UpdateOptionGroupPage() {
  const { groupId } = Route.useParams();
  const router = useRouter();
  const mutation = useUpdateMenuOptionGroupMutation();

  const { data: groupData, isLoading } = useQuery({
    queryKey: ["menu", "optionGroups", "detail", groupId],
    queryFn: () => fetchMenuOptionGroupById(groupId),
    enabled: !!groupId,
  });

  const group = groupData?.data;

  const form = useForm<
    MenuOptionGroupSchemaInput,
    unknown,
    MenuOptionGroupSchemaType
  >({
    resolver: zodResolver(menuOptionGroupSchema),
    values: group
      ? {
          key: group.key,
          name: group.name,
          description: group.description || { ar: "", en: "" },
          isActive: group.isActive,
          isAvailable: group.isAvailable,
          isVisible: group.isVisible ?? true,
          sortOrder: group.sortOrder,
        }
      : undefined,
  });

  const onSubmit = async (data: MenuOptionGroupSchemaType) => {
    await mutation.mutateAsync({
      id: groupId,
      data: toUpdateMenuOptionGroupPayload(data),
    });
    router.navigate({
      to: "/menu",
      search: { tab: "option-groups" }
    });
  };

  if (isLoading)
    return <Loader variant="full-screen" label="جاري التحميل..." />;

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              تعديل المجموعة
            </h1>
            <p className="text-sm text-muted-foreground">
              تعديل &quot;{group?.name.ar}&quot;
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
        <MenuOptionGroupFormFields form={form} isEdit />

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
