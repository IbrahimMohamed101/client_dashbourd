import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { EditIcon, MapPinIcon, PlusIcon, StoreIcon, TrashIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useSettingsQuery,
  useUpdateSettingsMutation,
} from "@/hooks/useSettingsQuery";
import type { PickupLocationSetting } from "@/types/settingsTypes";
import { displayLocalizedText } from "@/utils/displayText";

type PickupBranch = PickupLocationSetting;

type PickupBranchForm = {
  id: string;
  nameAr: string;
  nameEn: string;
  addressAr: string;
  addressEn: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
};

type PickupBranchFormErrors = Partial<Record<keyof PickupBranchForm, string>>;

const emptyForm = (): PickupBranchForm => ({
  id: "",
  nameAr: "",
  nameEn: "",
  addressAr: "",
  addressEn: "",
  latitude: "",
  longitude: "",
  isActive: true,
});

const normalizeLocalized = (value: unknown) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return {
      ar: String(record.ar ?? record.arabic ?? record.name_ar ?? ""),
      en: String(record.en ?? record.english ?? record.name_en ?? ""),
    };
  }

  return {
    ar: typeof value === "string" ? value : "",
    en: "",
  };
};

const toNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `pickup_${Date.now()}`;

const normalizeBranches = (value: unknown): PickupBranch[] => {
  const rawBranches = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.entries(value as Record<string, unknown>).map(([id, branch]) =>
          branch && typeof branch === "object"
            ? { id, ...(branch as Record<string, unknown>) }
            : { id, name: String(branch ?? id) }
        )
      : [];

  return rawBranches.map((raw, index) => {
    const record = raw as Record<string, unknown>;
    const name = normalizeLocalized(record.name ?? record.label ?? record.branchName);
    const address = normalizeLocalized(record.address);
    const id =
      String(
        record.id ??
          record.branchId ??
          record.pickupLocationId ??
          record.key ??
          record.code ??
          record.slug ??
          ""
      ) || `branch_${index + 1}`;

    return {
      id,
      name,
      address,
      isActive:
        record.isActive === undefined
          ? record.active === undefined
            ? record.isAvailable === undefined
              ? record.pickupAvailable !== false
              : record.isAvailable !== false
            : record.active !== false
          : record.isActive !== false,
      latitude: toNumber(record.latitude ?? record.lat),
      longitude: toNumber(record.longitude ?? record.lng ?? record.lon),
    };
  });
};

const branchToForm = (branch: PickupBranch): PickupBranchForm => ({
  id: branch.id,
  nameAr: branch.name.ar,
  nameEn: branch.name.en,
  addressAr: branch.address.ar,
  addressEn: branch.address.en,
  latitude: branch.latitude === undefined ? "" : String(branch.latitude),
  longitude: branch.longitude === undefined ? "" : String(branch.longitude),
  isActive: branch.isActive,
});

const formToBranch = (form: PickupBranchForm): PickupBranch => {
  const latitude = toNumber(form.latitude);
  const longitude = toNumber(form.longitude);

  return {
    id: form.id || createId(),
    name: {
      ar: form.nameAr.trim(),
      en: form.nameEn.trim(),
    },
    address: {
      ar: form.addressAr.trim(),
      en: form.addressEn.trim(),
    },
    isActive: form.isActive,
    ...(latitude === undefined ? {} : { latitude }),
    ...(longitude === undefined ? {} : { longitude }),
  };
};

const validateBranchForm = (form: PickupBranchForm): PickupBranchFormErrors => {
  const errors: PickupBranchFormErrors = {};
  const requiredFields: Array<[keyof PickupBranchForm, string]> = [
    ["nameAr", "Arabic branch name is required."],
    ["nameEn", "English branch name is required."],
    ["addressAr", "Arabic branch address is required."],
    ["addressEn", "English branch address is required."],
  ];

  requiredFields.forEach(([key, message]) => {
    if (!String(form[key]).trim()) errors[key] = message;
  });

  (["latitude", "longitude"] as const).forEach((key) => {
    const value = form[key].trim();
    if (value && !Number.isFinite(Number(value))) {
      errors[key] =
        key === "latitude"
          ? "Latitude must be a valid number."
          : "Longitude must be a valid number.";
    }
  });

  return errors;
};

export const Route = createFileRoute("/_protected/pickup-branches/")({
  component: PickupBranchesPage,
});

function PickupBranchesPage() {
  const { data, isLoading, isError } = useSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();
  const branches = useMemo(
    () => normalizeBranches(data?.data?.pickup_locations),
    [data?.data?.pickup_locations]
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PickupBranchForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<PickupBranchFormErrors>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">
            Unable to load pickup branches.
          </CardContent>
        </Card>
      </div>
    );
  }

  const openCreateDialog = () => {
    setForm(emptyForm());
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (branch: PickupBranch) => {
    setForm(branchToForm(branch));
    setFormErrors({});
    setDialogOpen(true);
  };

  const saveBranches = (nextBranches: PickupBranch[]) => {
    updateSettings.mutate({ pickup_locations: nextBranches });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateBranchForm(form);
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const nextBranch = formToBranch(form);
    const exists = branches.some((branch) => branch.id === nextBranch.id);
    const nextBranches = exists
      ? branches.map((branch) =>
          branch.id === nextBranch.id ? nextBranch : branch
        )
      : [...branches, nextBranch];

    saveBranches(nextBranches);
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    saveBranches(branches.filter((branch) => branch.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="space-y-4 px-4 lg:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Pickup Branches
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage the contract-backed pickup_locations array stored in
            dashboard settings.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusIcon className="size-4" />
          Add branch
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {branches.length === 0 ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <StoreIcon className="size-8 text-muted-foreground" />
              <div>
                <p className="font-medium">No pickup branches yet</p>
                <p className="text-sm text-muted-foreground">
                  Add the first branch to populate pickup_locations.
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Arabic address</TableHead>
                  <TableHead>English address</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <MapPinIcon className="size-4" />
                        </span>
                        <div>
                          <p className="font-medium">
                            {displayLocalizedText(branch.name, branch.id, "en")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {displayLocalizedText(branch.name, "-")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{displayLocalizedText(branch.address, "-")}</TableCell>
                    <TableCell>{displayLocalizedText(branch.address, "-", "en")}</TableCell>
                    <TableCell>
                      {branch.latitude !== undefined &&
                      branch.longitude !== undefined
                        ? `${branch.latitude}, ${branch.longitude}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={branch.isActive ? "default" : "secondary"}>
                        {branch.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(branch)}
                        >
                          <EditIcon className="size-4" />
                          <span className="sr-only">Edit branch</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setDeleteId(branch.id)}
                        >
                          <TrashIcon className="size-4" />
                          <span className="sr-only">Delete branch</span>
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

      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        errors={formErrors}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isSaving={updateSettings.isPending}
      />

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete pickup branch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will save a new pickup_locations array without this branch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BranchDialog({
  open,
  onOpenChange,
  form,
  errors,
  onFormChange,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PickupBranchForm;
  errors: PickupBranchFormErrors;
  onFormChange: React.Dispatch<React.SetStateAction<PickupBranchForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSaving: boolean;
}) {
  const updateField = <K extends keyof PickupBranchForm>(
    key: K,
    value: PickupBranchForm[K]
  ) => onFormChange((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            Branches are saved using id, localized name/address, coordinates,
            and isActive.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Name Arabic"
              value={form.nameAr}
              onChange={(value) => updateField("nameAr", value)}
              error={errors.nameAr}
              required
            />
            <Field
              label="Name English"
              value={form.nameEn}
              onChange={(value) => updateField("nameEn", value)}
              error={errors.nameEn}
              required
            />
            <Field
              label="Address Arabic"
              value={form.addressAr}
              onChange={(value) => updateField("addressAr", value)}
              error={errors.addressAr}
              required
            />
            <Field
              label="Address English"
              value={form.addressEn}
              onChange={(value) => updateField("addressEn", value)}
              error={errors.addressEn}
              required
            />
            <Field
              label="Latitude"
              value={form.latitude}
              onChange={(value) => updateField("latitude", value)}
              type="number"
              error={errors.latitude}
            />
            <Field
              label="Longitude"
              value={form.longitude}
              onChange={(value) => updateField("longitude", value)}
              type="number"
              error={errors.longitude}
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
            <Label>Active pickup branch</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              Save branch
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
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        value={value}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
