import { queryOptions, useQuery } from "@tanstack/react-query";

import { fetchPublicMenuPreview } from "@/utils/fetchPublicMenu";

const PUBLIC_MENU_PREVIEW_KEY = "menu.publicPreview";

export const publicMenuPreviewQueryOptions = () =>
  queryOptions({
    queryKey: [PUBLIC_MENU_PREVIEW_KEY],
    queryFn: fetchPublicMenuPreview,
    staleTime: 1000 * 60,
  });

export const usePublicMenuPreviewQuery = () =>
  useQuery(publicMenuPreviewQueryOptions());
