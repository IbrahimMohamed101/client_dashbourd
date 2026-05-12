import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionGroupSchema, {
  type MenuOptionGroupSchemaInput,
  type MenuOptionGroupSchemaType,
} from "@/lib/validations/menuOptionGroupSchema";
import { useCreateMenuOptionGroupMutation } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layers, Save, Loader2 } from "lucide-react";
import { MenuOptionGroupFormFields } from "@/components/pages/menu/option-groups/MenuOptionGroupFormFields";
import { toCreateMenuOptionGroupPayload } from "@/utils/menuPayloadMappers";

export const Route = createFileRoute("/_protected/menu/option-groups/create")({
  component: CreateOptionGroupPage,
});

function CreateOptionGroupPage() {
  const router = useRouter();
  const mutation = useCreateMenuOptionGroupMutation();

  const form = useForm<
    MenuOptionGroupSchemaInput,
    unknown,
    MenuOptionGroupSchemaType
  >({
    resolver: zodResolver(menuOptionGroupSchema),
    defaultValues: {
      key: "",
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      isActive: true,
      isAvailable: true,
      isVisible: true,
      sortOrder: 0,
    },
  });

  const onSubmit = async (data: MenuOptionGroupSchemaType) => {
    await mutation.mutateAsync(toCreateMenuOptionGroupPayload(data));
    router.navigate({ to: "/menu" });
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
              إضافة مجموعة خيارات
            </h1>
            <p className="text-sm text-muted-foreground">
              مثال: البروتينات، الفواكه، الصلصات
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
        <MenuOptionGroupFormFields form={form} />

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
                    جارٍ الإضافة...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    إضافة المجموعة
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
