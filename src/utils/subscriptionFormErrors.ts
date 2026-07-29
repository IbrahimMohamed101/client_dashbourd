type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

export function getFirstSubscriptionFormErrorMessage(
  errors: unknown
): string | null {
  const visited = new WeakSet<object>();

  const visit = (value: unknown): string | null => {
    if (!isRecord(value)) return null;
    if (visited.has(value)) return null;
    visited.add(value);

    if (typeof value.message === "string" && value.message.trim()) {
      return value.message.trim();
    }

    for (const [key, child] of Object.entries(value)) {
      if (key === "ref") continue;
      const message = visit(child);
      if (message) return message;
    }

    return null;
  };

  return visit(errors);
}
