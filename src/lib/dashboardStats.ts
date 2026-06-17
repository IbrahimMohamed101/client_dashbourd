import type { SectionCardsData } from "@/types/sectionCardsTypes";
import type { DashboardOverviewStats } from "@/types/dashboardHomeTypes";

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
  return cards.map((card, index) => {
    return {
      description: card.description,
      helperText: card.helperText,
      icon: card.icon,
      value: formatStatValue(stats?.[DASHBOARD_STAT_KEYS[index]]),
    };
  });
}
