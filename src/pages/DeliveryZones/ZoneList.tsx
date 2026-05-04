import { useState } from "react";
import { useDeliveryZones } from "@/hooks/useDeliveryZones";
import { ZoneCard } from "./ZoneCard";
import { ZoneFormDialog } from "./ZoneFormDialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Map, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DeliveryZone } from "@/types/deliveryZoneTypes";

export default function ZoneList() {
  const { data: zones, isLoading, error } = useDeliveryZones();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);

  const filteredZones = zones?.filter(zone => 
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.coverage_description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedZone(null);
    setDialogOpen(true);
  };

  const handleEdit = (zone: DeliveryZone) => {
    setSelectedZone(zone);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">جاري تحميل مناطق التوصيل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center border-2 border-dashed rounded-xl">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-xl font-bold">عذراً، حدث خطأ ما</h3>
        <p className="text-muted-foreground max-w-xs">لم نتمكن من تحميل مناطق التوصيل. يرجى المحاولة مرة أخرى لاحقاً.</p>
        <Button onClick={() => window.location.reload()} variant="outline">إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Map className="h-7 w-7 text-primary" />
            </div>
            مناطق التوصيل
          </h1>
          <p className="text-muted-foreground text-sm pr-1">إدارة مناطق التغطية وتكاليف التوصيل المخصصة لكل منطقة.</p>
        </div>
        
        <Button onClick={handleAdd} className="w-full md:w-auto gap-2 h-11 px-6 shadow-sm hover:shadow-md transition-all">
          <Plus className="h-5 w-5" />
          إضافة منطقة جديدة
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="ابحث عن منطقة أو حي..." 
          className="pr-10 h-11"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredZones && filteredZones.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredZones.map((zone) => (
            <ZoneCard 
              key={zone.id} 
              zone={zone} 
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed">
          <div className="p-4 bg-background rounded-full shadow-sm mb-4">
            <Map className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold">لا توجد مناطق حالياً</h3>
          <p className="text-muted-foreground text-sm mb-6">ابدأ بإضافة مناطق التوصيل ليتمكن العملاء من اختيارها.</p>
          <Button variant="outline" onClick={handleAdd}>إضافة أول منطقة</Button>
        </div>
      )}

      <ZoneFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        zone={selectedZone}
      />
    </div>
  );
}
