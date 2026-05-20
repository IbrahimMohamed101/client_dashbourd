import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionSchema, {
  type MenuOptionSchemaInput,
  type MenuOptionSchemaType,
} from "@/lib/validations/menuOptionSchema";
import { useCreateMenuOptionMutation } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings2, Save, Loader2 } from "lucide-react";
import { MenuOptionFormFields } from "@/components/pages/menu/options/MenuOptionFormFields";
import { toCreateMenuOptionPayload } from "@/utils/menuPayloadMappers";

import { ToastMessage } from "@/components/global/ToastMessage";

export const Route = createFileRoute("/_protected/menu/options/create")({
  component: CreateOptionPage,
});

function CreateOptionPage() {
  const router = useRouter();
  const mutation = useCreateMenuOptionMutation();

  const form = useForm<MenuOptionSchemaInput, unknown, MenuOptionSchemaType>({
    resolver: zodResolver(menuOptionSchema),
    defaultValues: {
      groupId: "",
      key: "",
      name: { ar: "", en: "" },
      description: { ar: "", en: "" },
      imageUrl: "",
      extraPriceSar: 0,
      isActive: true,
      isAvailable: true,
      isVisible: true,
      sortOrder: 0,
    },
  });

  const onSubmit = async (data: MenuOptionSchemaType) => {
    try {
      await mutation.mutateAsync(toCreateMenuOptionPayload(data));
      ToastMessage("تم إنشاء الخيار بنجاح", "success");
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

  return (
    <div className="w-full px-4 py-8 lg:px-8">
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              إضافة خيار جديد
            </h1>
            <p className="text-sm text-muted-foreground">
              مثال: سمك السلمون، أفوكادو، صلصة الرانش
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
        <MenuOptionFormFields form={form} />

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
                    إضافة الخيار
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
