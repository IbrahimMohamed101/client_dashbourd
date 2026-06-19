import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent, type HTMLInputTypeAttribute } from "react";
import {
  addonPlanPricesQueryOptions,
  addonPlansQueryOptions,
  addonsQueryOptions,
  useCreateAddonPlanPriceMutation,
  useDeleteAddonPlanPriceMutation,
  useToggleAddonPlanPriceMutation,
  useUpdateAddonPlanPriceMutation,
} from "@/hooks/useAddonsQuery";
import { packagesQueryOptions } from "@/hooks/usePackagesQuery";
import { Loader } from "@/components/global/loader";
import { AddonsTable } from "@/components/pages/addons/addons-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToastMessage } from "@/components/global/ToastMessage";
import {
  EditIcon,
  PlusIcon,
  PlusSquare,
  PowerIcon,
  TrashIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Addon, AddonPlanPrice } from "@/types/addonTypes";
import { fetchCreateAddon } from "@/utils/fetchCreateAddon";
import { fetchDeleteAddon } from "@/utils/fetchDeleteAddon";
import { fetchUpdateAddon, toggleAddonItem } from "@/utils/fetchUpdateAddon";

export const Route = createFileRoute("/_protected/addons/")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(addonsQueryOptions()),
      context.queryClient.ensureQueryData(addonPlansQueryOptions()),
      context.queryClient.ensureQueryData(addonPlanPricesQueryOptions()),
      context.queryClient.ensureQueryData(packagesQueryOptions()),
    ]);
  },
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل الإضافات..." />
  ),
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const { data: addonsResponse } = useSuspenseQuery(
    addonsQueryOptions()
  );
  const { data: plansResponse } = useSuspenseQuery(addonPlansQueryOptions());
  const { data: pricesResponse } = useSuspenseQuery(
    addonPlanPricesQueryOptions()
  );
  const { data: packagesResponse } = useSuspenseQuery(packagesQueryOptions());

  const addons = addonsResponse?.data || [];
  const plans = plansResponse?.data || [];
  const prices = pricesResponse?.data || [];
  const basePlans = normalizeBasePlans(packagesResponse);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Addon | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<AddonPlanPrice | null>(null);

  const invalidateAddonContract = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["addons"] }),
      queryClient.invalidateQueries({ queryKey: ["addons", "plans"] }),
      queryClient.invalidateQueries({ queryKey: ["addons", "plan-prices"] }),
    ]);
  };

  const createPlanMutation = useMutation({
    mutationFn: (formData: FormData) => fetchCreateAddon(formData),
    onSuccess: async () => {
      ToastMessage("Addon plan saved successfully.", "success");
      await invalidateAddonContract();
      setPlanDialogOpen(false);
      setEditingPlan(null);
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      fetchUpdateAddon(id, formData),
    onSuccess: async () => {
      ToastMessage("Addon plan updated successfully.", "success");
      await invalidateAddonContract();
      setPlanDialogOpen(false);
      setEditingPlan(null);
    },
  });

  const togglePlanMutation = useMutation({
    mutationFn: (id: string) => toggleAddonItem(id),
    onSuccess: async () => {
      await invalidateAddonContract();
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: (id: string) => fetchDeleteAddon(id),
    onSuccess: async () => {
      ToastMessage("Addon plan deleted successfully.", "success");
      await invalidateAddonContract();
    },
  });

  const createPriceMutation = useCreateAddonPlanPriceMutation();
  const updatePriceMutation = useUpdateAddonPlanPriceMutation();
  const togglePriceMutation = useToggleAddonPlanPriceMutation();
  const deletePriceMutation = useDeleteAddonPlanPriceMutation();

  const openCreatePlan = () => {
    setEditingPlan(null);
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: Addon) => {
    setEditingPlan(plan);
    setPlanDialogOpen(true);
  };

  const openCreatePrice = () => {
    setEditingPrice(null);
    setPriceDialogOpen(true);
  };

  const openEditPrice = (price: AddonPlanPrice) => {
    setEditingPrice(price);
    setPriceDialogOpen(true);
  };

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card className="bg-linear-to-br from-primary/10 via-background to-background text-foreground shadow-none">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner">
                <PlusSquare className="size-6 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight">
                  الإضافات (Addons)
                </h2>
                <p className="text-sm text-muted-foreground">
                  إدارة الإضافات واشتراكات المشروبات
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:border-r sm:pr-6">
              <div className="text-center sm:text-right">
                <p className="text-3xl font-black text-primary">
                  {addons.length}
                </p>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  إجمالي الإضافات
                </p>
              </div>
            </div>
            <Button onClick={openCreatePlan}>
              <PlusIcon className="size-4" />
              Add plan
            </Button>
          </CardContent>
        </Card>
      </div>
      <AddonsTable data={addons} />
      <div className="grid gap-4 px-4 lg:grid-cols-2 lg:px-6">
        <AddonPlansPanel
          plans={plans}
          onCreate={openCreatePlan}
          onEdit={openEditPlan}
          onToggle={(plan) => togglePlanMutation.mutate(addonId(plan))}
          onDelete={(plan) => deletePlanMutation.mutate(addonId(plan))}
          isMutating={
            createPlanMutation.isPending ||
            updatePlanMutation.isPending ||
            togglePlanMutation.isPending ||
            deletePlanMutation.isPending
          }
        />
        <AddonPricesPanel
          prices={prices}
          onCreate={openCreatePrice}
          onEdit={openEditPrice}
          onToggle={(price) =>
            togglePriceMutation.mutate(price.id || price._id || "")
          }
          onDelete={(price) =>
            deletePriceMutation.mutate(price.id || price._id || "")
          }
          isMutating={
            createPriceMutation.isPending ||
            updatePriceMutation.isPending ||
            togglePriceMutation.isPending ||
            deletePriceMutation.isPending
          }
        />
      </div>
      <AddonPlanDialog
        key={editingPlan ? addonId(editingPlan) : "create-addon-plan"}
        open={planDialogOpen}
        onOpenChange={(open) => {
          setPlanDialogOpen(open);
          if (!open) setEditingPlan(null);
        }}
        plan={editingPlan}
        isSaving={createPlanMutation.isPending || updatePlanMutation.isPending}
        onSubmit={(formData) => {
          if (editingPlan) {
            updatePlanMutation.mutate({ id: addonId(editingPlan), formData });
          } else {
            createPlanMutation.mutate(formData);
          }
        }}
      />
      <AddonPriceDialog
        key={editingPrice?.id || editingPrice?._id || "create-addon-price"}
        open={priceDialogOpen}
        onOpenChange={(open) => {
          setPriceDialogOpen(open);
          if (!open) setEditingPrice(null);
        }}
        price={editingPrice}
        plans={plans}
        basePlans={basePlans}
        isSaving={createPriceMutation.isPending || updatePriceMutation.isPending}
        onSubmit={(payload) => {
          if (editingPrice?.id || editingPrice?._id) {
            updatePriceMutation.mutate({
              id: editingPrice.id || editingPrice._id || "",
              data: payload,
            });
          } else {
            createPriceMutation.mutate(payload);
          }
          setPriceDialogOpen(false);
          setEditingPrice(null);
        }}
      />
    </>
  );
}

function localizedName(value?: { ar?: string; en?: string } | null) {
  return value?.ar || value?.en || "-";
}

function addonId(addon: Addon) {
  return addon.id || addon._id;
}

function AddonPlansPanel({
  plans,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
  isMutating,
}: {
  plans: Addon[];
  onCreate: () => void;
  onEdit: (plan: Addon) => void;
  onToggle: (plan: Addon) => void;
  onDelete: (plan: Addon) => void;
  isMutating: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Addon subscription plans</h3>
            <p className="text-sm text-muted-foreground">
              Billing mode, daily allocation, and menu product entitlement IDs.
            </p>
          </div>
          <Button size="sm" onClick={onCreate}>
            <PlusIcon className="size-4" />
            Plan
          </Button>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No addon plans returned.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Max/day</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Prices</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={addonId(plan)}>
                  <TableCell>{localizedName(plan.name)}</TableCell>
                  <TableCell>{plan.billingMode || "-"}</TableCell>
                  <TableCell>{plan.maxPerDay ?? "-"}</TableCell>
                  <TableCell>
                    {plan.menuProductsCount ?? plan.menuProductIds?.length ?? 0}
                  </TableCell>
                  <TableCell>{plan.planPricesCount ?? 0}</TableCell>
                  <TableCell>{plan.isActive ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isMutating}
                        onClick={() => onEdit(plan)}
                      >
                        <EditIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isMutating}
                        onClick={() => onToggle(plan)}
                      >
                        <PowerIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isMutating}
                        onClick={() => onDelete(plan)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AddonPricesPanel({
  prices,
  onCreate,
  onEdit,
  onToggle,
  onDelete,
  isMutating,
}: {
  prices: AddonPlanPrice[];
  onCreate: () => void;
  onEdit: (price: AddonPlanPrice) => void;
  onToggle: (price: AddonPlanPrice) => void;
  onDelete: (price: AddonPlanPrice) => void;
  isMutating: boolean;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Pricing matrix</h3>
            <p className="text-sm text-muted-foreground">
              Source of truth for subscription add-on plan pricing.
            </p>
          </div>
          <Button size="sm" onClick={onCreate}>
            <PlusIcon className="size-4" />
            Price
          </Button>
        </div>
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No pricing matrix rows returned.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Addon plan</TableHead>
                <TableHead>Base plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prices.map((price) => (
                <TableRow key={price.id || price._id}>
                  <TableCell>{localizedName(price.addonPlanName)}</TableCell>
                  <TableCell>{localizedName(price.basePlanName)}</TableCell>
                  <TableCell>
                    {price.priceLabel || price.priceSar || price.priceHalala}
                  </TableCell>
                  <TableCell>
                    {price.isActive ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isMutating}
                        onClick={() => onEdit(price)}
                      >
                        <EditIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isMutating}
                        onClick={() => onToggle(price)}
                      >
                        <PowerIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isMutating}
                        onClick={() => onDelete(price)}
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

type BasePlanOption = {
  id: string;
  label: string;
};

type AddonPlanFormState = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: string;
  billingMode: "per_day" | "per_meal";
  maxPerDay: string;
  price: string;
  menuProductIds: string;
  isActive: boolean;
};

type AddonPriceFormState = {
  addonPlanId: string;
  basePlanId: string;
  priceHalala: string;
  isActive: boolean;
};

const emptyPlanForm = (): AddonPlanFormState => ({
  nameAr: "",
  nameEn: "",
  descriptionAr: "",
  descriptionEn: "",
  category: "addons",
  billingMode: "per_day",
  maxPerDay: "1",
  price: "0",
  menuProductIds: "",
  isActive: true,
});

const planToForm = (plan: Addon | null): AddonPlanFormState =>
  plan
    ? {
        nameAr: plan.name.ar,
        nameEn: plan.name.en,
        descriptionAr: plan.description.ar,
        descriptionEn: plan.description.en,
        category: plan.category,
        billingMode: plan.billingMode === "per_meal" ? "per_meal" : "per_day",
        maxPerDay: String(plan.maxPerDay ?? 1),
        price: String(plan.price ?? 0),
        menuProductIds: (plan.menuProductIds ?? []).join(", "),
        isActive: plan.isActive,
      }
    : emptyPlanForm();

const planFormToData = (form: AddonPlanFormState) => {
  const formData = new FormData();
  const menuProductIds = form.menuProductIds
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  formData.append("kind", "plan");
  formData.append("type", "subscription");
  formData.append("name[ar]", form.nameAr);
  formData.append("name[en]", form.nameEn);
  formData.append("description[ar]", form.descriptionAr);
  formData.append("description[en]", form.descriptionEn);
  formData.append("category", form.category);
  formData.append("price", form.price);
  formData.append("priceHalala", String(Math.round(Number(form.price) * 100)));
  formData.append("billingMode", form.billingMode);
  formData.append("maxPerDay", form.maxPerDay);
  formData.append("isActive", String(form.isActive));
  formData.append("menuProductIds", JSON.stringify(menuProductIds));

  menuProductIds.forEach((id) => formData.append("menuProductIds[]", id));

  return formData;
};

const emptyPriceForm = (
  plans: Addon[],
  basePlans: BasePlanOption[]
): AddonPriceFormState => ({
  addonPlanId: plans[0] ? addonId(plans[0]) : "",
  basePlanId: basePlans[0]?.id ?? "",
  priceHalala: "0",
  isActive: true,
});

const priceToForm = (
  price: AddonPlanPrice | null,
  plans: Addon[],
  basePlans: BasePlanOption[]
): AddonPriceFormState =>
  price
    ? {
        addonPlanId: price.addonPlanId,
        basePlanId: price.basePlanId,
        priceHalala: String(price.priceHalala),
        isActive: price.isActive,
      }
    : emptyPriceForm(plans, basePlans);

function AddonPlanDialog({
  open,
  onOpenChange,
  plan,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Addon | null;
  onSubmit: (formData: FormData) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<AddonPlanFormState>(() => planToForm(plan));

  const updateField = <K extends keyof AddonPlanFormState>(
    key: K,
    value: AddonPlanFormState[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(planFormToData(form));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) setForm(planToForm(plan));
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{plan ? "Edit addon plan" : "Create addon plan"}</DialogTitle>
          <DialogDescription>
            Sends kind=plan, billingMode, maxPerDay, and menuProductIds to
            /api/dashboard/addons.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name Arabic"
              value={form.nameAr}
              onChange={(value) => updateField("nameAr", value)}
              required
            />
            <Field
              label="Name English"
              value={form.nameEn}
              onChange={(value) => updateField("nameEn", value)}
              required
            />
            <Field
              label="Description Arabic"
              value={form.descriptionAr}
              onChange={(value) => updateField("descriptionAr", value)}
              required
            />
            <Field
              label="Description English"
              value={form.descriptionEn}
              onChange={(value) => updateField("descriptionEn", value)}
              required
            />
            <Field
              label="Category"
              value={form.category}
              onChange={(value) => updateField("category", value)}
              required
            />
            <div className="space-y-2">
              <Label>Billing mode</Label>
              <Select
                value={form.billingMode}
                onValueChange={(value: "per_day" | "per_meal") =>
                  updateField("billingMode", value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_day">Per day</SelectItem>
                  <SelectItem value="per_meal">Per meal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Max per day"
              type="number"
              value={form.maxPerDay}
              onChange={(value) => updateField("maxPerDay", value)}
              required
            />
            <Field
              label="Base price SAR"
              type="number"
              value={form.price}
              onChange={(value) => updateField("price", value)}
              required
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Menu product IDs</Label>
              <Input
                value={form.menuProductIds}
                onChange={(event) =>
                  updateField("menuProductIds", event.target.value)
                }
                placeholder="Comma separated ObjectIds"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
            <Label>Active addon plan</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              Save plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddonPriceDialog({
  open,
  onOpenChange,
  price,
  plans,
  basePlans,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  price: AddonPlanPrice | null;
  plans: Addon[];
  basePlans: BasePlanOption[];
  onSubmit: (payload: {
    addonPlanId: string;
    basePlanId: string;
    priceHalala: number;
    isActive: boolean;
  }) => void;
  isSaving: boolean;
}) {
  const [form, setForm] = useState<AddonPriceFormState>(() =>
    priceToForm(price, plans, basePlans)
  );

  const updateField = <K extends keyof AddonPriceFormState>(
    key: K,
    value: AddonPriceFormState[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      addonPlanId: form.addonPlanId,
      basePlanId: form.basePlanId,
      priceHalala: Number(form.priceHalala),
      isActive: form.isActive,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) setForm(priceToForm(price, plans, basePlans));
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{price ? "Edit matrix row" : "Create matrix row"}</DialogTitle>
          <DialogDescription>
            Uses priceHalala directly. No VAT or total calculations happen in
            the frontend.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Addon plan</Label>
              <Select
                value={form.addonPlanId}
                onValueChange={(value) => updateField("addonPlanId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select addon plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={addonId(plan)} value={addonId(plan)}>
                      {localizedName(plan.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base plan</Label>
              <Select
                value={form.basePlanId}
                onValueChange={(value) => updateField("basePlanId", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select base plan" />
                </SelectTrigger>
                <SelectContent>
                  {basePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Price halala"
              type="number"
              value={form.priceHalala}
              onChange={(value) => updateField("priceHalala", value)}
              required
            />
          </div>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
            <Label>Active matrix row</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !form.addonPlanId || !form.basePlanId}
            >
              Save price
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function normalizeBasePlans(response: unknown): BasePlanOption[] {
  const record =
    response && typeof response === "object" && !Array.isArray(response)
      ? (response as Record<string, unknown>)
      : {};
  const data = Array.isArray(record.data) ? record.data : [];

  return data
    .map((item) => {
      const plan =
        item && typeof item === "object" && !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};
      const name =
        plan.name && typeof plan.name === "object"
          ? (plan.name as Record<string, unknown>)
          : {};
      const id = String(plan.id ?? plan._id ?? "");
      if (!id) return null;

      return {
        id,
        label: String(name.ar ?? name.en ?? plan.displayName ?? id),
      };
    })
    .filter((item): item is BasePlanOption => item !== null);
}
