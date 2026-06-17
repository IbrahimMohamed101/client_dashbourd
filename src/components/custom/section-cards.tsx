import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  description: string;
  value: string | number;
  helperText?: string;
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
  helperText,
  percentage,
  isPositive,
  trendText,
  icon,
}: SectionCardProps) {
  return (
    <Card className="relative min-w-0 rounded-lg bg-card shadow-sm transition-all before:absolute before:inset-y-6 before:right-0 before:w-1 before:rounded-l-md before:bg-primary/65 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="min-w-0 text-sm leading-5 font-medium text-muted-foreground">
          {description}
        </CardTitle>
        <div className="shrink-0">{icon}</div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="truncate text-3xl leading-tight font-semibold tracking-normal text-foreground tabular-nums xl:text-4xl">
          {value}
        </div>
        {helperText && (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {helperText}
          </p>
        )}
        {(percentage !== undefined || trendText) && (
          <p className="mt-3 flex min-w-0 flex-wrap items-center gap-2 text-xs">
            {percentage !== undefined && (
              <span
                className={cn(
                  "flex shrink-0 items-center rounded-md px-2 py-1 font-semibold tabular-nums",
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
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {trendText}
              </span>
            )}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
