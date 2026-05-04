import type { DeliveryZone } from "@/types/deliveryZoneTypes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Truck, Edit2, Trash2, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteDeliveryZone } from "@/hooks/useDeliveryZones";
import { toast } from "sonner";

interface ZoneCardProps {
  zone: DeliveryZone;
  onEdit: (zone: DeliveryZone) => void;
}

export function ZoneCard({ zone, onEdit }: ZoneCardProps) {
  const deleteMutation = useDeleteDeliveryZone();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(zone.id);
      toast.success("تم حذف المنطقة بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border/50">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {zone.name}
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" />
            رسوم التوصيل: <span className="font-semibold text-foreground">{zone.delivery_fee} ر.س</span>
          </CardDescription>
        </div>
        <Badge variant={zone.is_active ? "default" : "secondary"}>
          {zone.is_active ? "نشط" : "متوقف"}
        </Badge>
      </CardHeader>
      
      <CardContent className="pb-3">
        {zone.coverage_description ? (
          <div className="bg-muted/50 p-3 rounded-md border border-border/30">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1.5">
              <Info className="h-3.5 w-3.5" />
              تغطية المنطقة
            </div>
            <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
              {zone.coverage_description}
            </p>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic py-2">
            لا يوجد وصف لهذه المنطقة
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t bg-muted/20 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-2"
          onClick={() => onEdit(zone)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          تعديل
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف منطقة "{zone.name}" بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                تأكيد الحذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
