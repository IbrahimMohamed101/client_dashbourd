interface SectionCardsData {
  description: string;
  value: string | number;
  percentage?: string | number;
  isPositive?: boolean;
  trendText?: string;
  icon: React.ReactNode;
}

export type { SectionCardsData };
