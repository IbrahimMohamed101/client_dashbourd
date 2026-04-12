import React from "react";
import type { KitchenOperationsTab, KitchenTabsCounts } from "@/types/kitchenTypes";
import { Package, ShoppingBag, Store } from "lucide-react";

interface KitchenTabsProps {
  activeTab: KitchenOperationsTab;
  setActiveTab: (tab: KitchenOperationsTab) => void;
  tabCounts?: KitchenTabsCounts;
}

export const KitchenTabs: React.FC<KitchenTabsProps> = ({ activeTab, setActiveTab, tabCounts }) => {
  const tabs: { key: KitchenOperationsTab; label: string; icon: React.ReactNode; countKey: keyof KitchenTabsCounts }[] = [
    { key: "daily_subscriptions", label: "الاشتراكات اليومية", icon: <Package className="h-4 w-4" />, countKey: "subscriptionsDaily" },
    { key: "individual_orders", label: "الطلبات الفردية", icon: <ShoppingBag className="h-4 w-4" />, countKey: "individualOrders" },
    { key: "branch_pickup", label: "استلام من الفرع", icon: <Store className="h-4 w-4" />, countKey: "branchPickup" },
  ];

  return (
    <div className="mb-4 mt-2 flex w-fit flex-wrap gap-1 rounded-xl bg-muted/40 p-1 border shadow-sm">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <span className={isActive ? "text-primary" : "text-muted-foreground/70"}>
              {tab.icon}
            </span>
            {tab.label}
            {tabCounts && (
              <span className={`inline-flex items-center justify-center min-w-5 h-5 rounded-full text-[11px] px-1 font-bold ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "bg-muted-foreground/10 text-muted-foreground"
              }`}>
                {tabCounts[tab.countKey]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
