import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionGroupSchema, {
  type MenuOptionGroupSchemaInput,
  type MenuOptionGroupSchemaType,
} from "@/lib/validations/menuOptionGroupSchema";
import { useUpdateMenuOptionGroupMutation, useMenuOptionGroupDetailQuery } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Layers, Save, Loader2, AlertCircle } from "lucide-react";
import { Loader } from "@/components/global/loader";
import { MenuOptionGroupFormFields } from "@/components/pages/menu/option-groups/MenuOptionGroupFormFields";
import { OptionGroupOptionsPanel } from "@/components/pages/menu/option-groups/OptionGroupOptionsPanel";
import { toUpdateMenuOptionGroupPayload } from "@/utils/menuPayloadMappers";
import { getMenuOptionGroupFormValues } from "@/utils/menuFormValues";
import { fetchAssignMenuOptionsToGroup } from "@/utils/fetchMenuOptions";
import type { MenuOptionGroupDetail } from "@/types/menuTypes";

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
  const { data: groupData, isLoading } = useMenuOptionGroupDetailQuery(groupId);
  const group = groupData?.data;

  if (isLoading)
    return <Loader variant="full-screen" label="جاري التحميل..." />;

  if (!group)
    return <Loader variant="full-screen" label="تعذر تحميل المجموعة" />;

  return (
    <UpdateOptionGroupForm
      key={group.id ?? groupId}
      group={group}
      groupId={groupId}
    />
  );
}

function UpdateOptionGroupForm({
  group,
  groupId,
}: {
  group: MenuOptionGroupDetail;
  groupId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useUpdateMenuOptionGroupMutation();
  const [isAssigningOptions, setIsAssigningOptions] = useState(false);

  const form = useForm<
    MenuOptionGroupSchemaInput,
    unknown,
    MenuOptionGroupSchemaType
  >({
    resolver: zodResolver(menuOptionGroupSchema),
    defaultValues: getMenuOptionGroupFormValues(group),
  });

  const onSubmit = async (data: MenuOptionGroupSchemaType) => {
    try {
      await mutation.mutateAsync({
        id: groupId,
        data: toUpdateMenuOptionGroupPayload(data),
      });
      router.navigate({
        to: "/menu",
        search: { tab: "builder" }
      });
    } catch (error: unknown) {
      console.error(error);
    }
  };

  const showValidationSummary =
    form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0;

  const handleAssignOptions = async (optionIds: string[]) => {
    if (!optionIds.length) return;
    setIsAssigningOptions(true);
    try {
      await fetchAssignMenuOptionsToGroup(groupId, optionIds);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["menu.optionGroups"] }),
        queryClient.invalidateQueries({ queryKey: ["menu.options"] }),
      ]);
    } finally {
      setIsAssigningOptions(false);
    }
  };

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
        <OptionGroupOptionsPanel
          assignedOptions={group.options ?? []}
          onAssignExistingOptions={handleAssignOptions}
          isAssigning={isAssigningOptions}
        />

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
