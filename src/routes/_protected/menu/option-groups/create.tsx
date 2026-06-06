import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import menuOptionGroupSchema, {
  type MenuOptionGroupSchemaInput,
  type MenuOptionGroupSchemaType,
} from "@/lib/validations/menuOptionGroupSchema";
import { useCreateMenuOptionGroupMutation } from "@/hooks/useMenuQuery";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Layers, Save, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { MenuOptionGroupFormFields } from "@/components/pages/menu/option-groups/MenuOptionGroupFormFields";
import { toCreateMenuOptionGroupPayload } from "@/utils/menuPayloadMappers";
import { fetchCreateMenuOption } from "@/utils/fetchMenuOptions";

interface DraftOption {
  nameAr: string;
  nameEn: string;
  extraPriceSar: string;
  sortOrder: string;
}

const emptyDraftOption = (): DraftOption => ({
  nameAr: "",
  nameEn: "",
  extraPriceSar: "0",
  sortOrder: "0",
});

export const Route = createFileRoute("/_protected/menu/option-groups/create")({
  component: CreateOptionGroupPage,
});

function CreateOptionGroupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useCreateMenuOptionGroupMutation();
  const [options, setOptions] = useState<DraftOption[]>([emptyDraftOption()]);

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
      ui: { displayStyle: "chips" },
      sortOrder: 0,
    },
  });

  const onSubmit = async (data: MenuOptionGroupSchemaType) => {
    try {
      const response = await mutation.mutateAsync(toCreateMenuOptionGroupPayload(data));
      const groupId = response.data.id;
      const optionsToCreate = options.filter(
        (option) => option.nameAr.trim() || option.nameEn.trim()
      );

      for (const [index, option] of optionsToCreate.entries()) {
        await fetchCreateMenuOption({
          groupId,
          name: {
            ar: option.nameAr.trim() || option.nameEn.trim(),
            en: option.nameEn.trim() || option.nameAr.trim(),
          },
          description: { ar: "", en: "" },
          extraPriceHalala: Math.round(Number(option.extraPriceSar || 0) * 100),
          isActive: true,
          isAvailable: true,
          isVisible: true,
          sortOrder: Number(option.sortOrder || index),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["menu.options"] });

      router.navigate({
        to: "/menu",
        search: { tab: "builder" },
      });
    } catch (error: unknown) {
      console.error(error);
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
        <InlineOptionsBuilder options={options} onChange={setOptions} />

        {/* ── Sticky Save Bar ── */}
        <div className="sticky bottom-6 z-10 pt-2">
          <Card className="border-primary/30 bg-card/95 shadow-2xl ring-1 shadow-primary/10 ring-primary/10 backdrop-blur-md">
            <CardContent className="space-y-3 p-4 sm:px-6">
              {showValidationSummary ? (
                <Alert variant="destructive" className="text-right">
                  <AlertCircle className="size-4" />
                  <AlertTitle>بيانات مطلوبة ناقصة</AlertTitle>
                  <AlertDescription>
                    اكتب الاسم بالعربية والإنجليزية ثم حاول الإضافة مرة أخرى.
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
                disabled={mutation.isPending || form.formState.isSubmitting}
                className="w-full gap-2 px-10 text-base font-semibold shadow-md sm:w-auto"
              >
                {mutation.isPending || form.formState.isSubmitting ? (
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
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}

function InlineOptionsBuilder({
  options,
  onChange,
}: {
  options: DraftOption[];
  onChange: (options: DraftOption[]) => void;
}) {
  const updateOption = (
    index: number,
    key: keyof DraftOption,
    value: string
  ) => {
    onChange(
      options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [key]: value } : option
      )
    );
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">خيارات المجموعة</h2>
            <p className="text-sm text-muted-foreground">
              أضف الخيارات العامة لهذه المجموعة الآن، ثم اختر منها داخل كل منتج حسب الحاجة.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange([...options, emptyDraftOption()])}
          >
            <Plus data-icon="inline-start" />
            إضافة خيار
          </Button>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_120px_100px_auto]"
            >
              <div className="space-y-1.5">
                <Label>الاسم بالعربية</Label>
                <Input
                  value={option.nameAr}
                  placeholder="مثال: دجاج"
                  onChange={(event) =>
                    updateOption(index, "nameAr", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>الاسم بالإنجليزية</Label>
                <Input
                  dir="ltr"
                  value={option.nameEn}
                  placeholder="e.g. Chicken"
                  onChange={(event) =>
                    updateOption(index, "nameEn", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>سعر إضافي</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={option.extraPriceSar}
                  onChange={(event) =>
                    updateOption(index, "extraPriceSar", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>الترتيب</Label>
                <Input
                  type="number"
                  min="0"
                  value={option.sortOrder}
                  onChange={(event) =>
                    updateOption(index, "sortOrder", event.target.value)
                  }
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="self-end text-destructive hover:text-destructive"
                disabled={options.length === 1}
                onClick={() => removeOption(index)}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
