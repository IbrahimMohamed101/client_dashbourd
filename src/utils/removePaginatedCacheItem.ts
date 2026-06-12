import type { PaginatedResponse } from "@/types/menuTypes";

type IdentifiedRow = {
  id: string;
};

export function removePaginatedCacheItem<T extends IdentifiedRow>(
  response: PaginatedResponse<T> | undefined,
  id: string
): PaginatedResponse<T> | undefined {
  if (!response?.data?.items?.length) return response;

  const nextItems = response.data.items.filter((item) => item.id !== id);
  const removedCount = response.data.items.length - nextItems.length;
  if (!removedCount) return response;

  const pagination = response.data.pagination;
  const total = Math.max(0, pagination.total - removedCount);
  const limit = pagination.limit || nextItems.length || 1;

  return {
    ...response,
    data: {
      ...response.data,
      items: nextItems,
      pagination: {
        ...pagination,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  };
}
