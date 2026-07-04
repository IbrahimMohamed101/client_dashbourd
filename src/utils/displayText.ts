type LocaleCode = "ar" | "en";

const ENTITY_KEY_FIELDS = [
  "id",
  "_id",
  "entityId",
  "key",
  "code",
  "slug",
  "email",
] as const;

function asDisplayString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? value : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

export function displayLocalizedText(
  value: unknown,
  fallback = "-",
  preferredLocale: LocaleCode = "ar"
): string {
  const directValue = asDisplayString(value);
  if (directValue) return directValue;

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const secondaryLocale: LocaleCode = preferredLocale === "ar" ? "en" : "ar";

  return (
    asDisplayString(record[preferredLocale]) ??
    asDisplayString(record[secondaryLocale]) ??
    asDisplayString(record.label) ??
    asDisplayString(record.name) ??
    asDisplayString(record.title) ??
    fallback
  );
}

export function getStableEntityKey(
  entity: unknown,
  fallbackPrefix: string,
  index: number
): string {
  if (entity && typeof entity === "object" && !Array.isArray(entity)) {
    const record = entity as Record<string, unknown>;

    for (const field of ENTITY_KEY_FIELDS) {
      const keyPart = asDisplayString(record[field]);
      if (keyPart) return `${fallbackPrefix}:${keyPart}`;
    }

    const localizedName = displayLocalizedText(record.name, "", "en");
    if (localizedName) return `${fallbackPrefix}:${localizedName}:${index}`;
  }

  return `${fallbackPrefix}:row-${index}`;
}
