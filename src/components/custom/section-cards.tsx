import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  description: string;
  value: string | number;
  percentage?: string | number;
  isPositive?: boolean;
  trendText?: string;
  icon: React.ReactNode;
}

interface SectionCardsProps {
  cardsData: SectionCardProps[];
  className?: string;
}

export function SectionCards({ cardsData, className }: SectionCardsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4 lg:px-6",
        className
      )}
    >
      {cardsData.map((card, index) => (
        <SectionCard key={index} {...card} />
      ))}
    </div>
  );
}

export function SectionCard({
  description,
  value,
  percentage,
  isPositive,
  trendText,
  icon,
}: SectionCardProps) {
  return (
    <Card className="overflow-hidden border-none bg-background/50 shadow-sm backdrop-blur-sm transition-all hover:bg-background/80 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {description}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold tracking-tight">{value}</div>
        {(percentage !== undefined || trendText) && (
          <p className="mt-1 flex items-center justify-end gap-3 text-xs">
            {percentage !== undefined && (
              <span
                className={cn(
                  "mr-1 flex items-center font-semibold",
                  isPositive ? "text-emerald-500" : "text-rose-500"
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-0.5 h-3 w-3" />
                )}
                {percentage}%
              </span>
            )}
            {trendText && (
              <span className="text-muted-foreground">{trendText}</span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
