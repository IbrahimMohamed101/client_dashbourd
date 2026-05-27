import type { ReactNode } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";

interface MenuSectionCardProps {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function MenuSectionCard({
  title,
  description,
  action,
  children,
}: MenuSectionCardProps) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="gap-3 border-b pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action ? (
            <CardAction className="static col-auto row-auto justify-self-auto">
              {action}
            </CardAction>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-5">{children}</CardContent>
    </Card>
  );
}

export function MenuToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  );
}

interface MenuSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function MenuSearchInput({
  value,
  onChange,
  placeholder,
}: MenuSearchInputProps) {
  return (
    <div className="relative w-full md:max-w-sm">
      <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 pr-9"
      />
    </div>
  );
}

export function MenuTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function MenuLoadingTable({ columns }: { columns: number }) {
  return (
    <MenuTableFrame>
      <Table>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((__, colIndex) => (
                <TableCell key={colIndex} className="py-4">
                  <Skeleton className="h-5 w-full min-w-16" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </MenuTableFrame>
  );
}

export function MenuEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 p-8 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function MenuKeyBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
      {value}
    </span>
  );
}

export function MenuStatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <Badge variant={active ? "default" : "outline"}>
      {active ? activeLabel : inactiveLabel}
    </Badge>
  );
}
