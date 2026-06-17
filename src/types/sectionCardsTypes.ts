interface SectionCardsData {
  description: string;
  value: string | number;
  helperText?: string;
  percentage?: string | number;
  isPositive?: boolean;
  trendText?: string;
  icon: React.ReactNode;
}

export type { SectionCardsData };
