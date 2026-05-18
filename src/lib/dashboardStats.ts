import type { SectionCardsData } from "@/types/sectionCardsTypes";

export type DashboardOverviewStats = {
  activeSubscriptions?: number;
  deliveriesToday?: number;
  pendingOrders?: number;
  appUsers?: number;
};

const DASHBOARD_STAT_KEYS: (keyof DashboardOverviewStats)[] = [
  "activeSubscriptions",
  "deliveriesToday",
  "pendingOrders",
  "appUsers",
];

const formatStatValue = (value: number | undefined) =>
  Number(value ?? 0).toLocaleString();

export function mapDashboardStatsToCards(
  cards: SectionCardsData[],
  stats: DashboardOverviewStats | undefined
) {
  return cards.map((card, index) => ({
    ...card,
    value: formatStatValue(stats?.[DASHBOARD_STAT_KEYS[index]]),
  }));
}
