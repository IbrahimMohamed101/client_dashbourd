import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Navigation,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { CourierQueueItem } from "@/hooks/useCourierBoard";

interface CourierTaskCardProps {
  task: CourierQueueItem;
  updateStatus: (id: string, action: string) => void;
  isPending: boolean;
}

const statusColors: Record<string, string> = {
  in_preparation: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  out_for_delivery: "bg-blue-500/10 text-blue-600 border-blue-200",
  fulfilled: "bg-green-500/10 text-green-600 border-green-200",
  delivery_canceled: "bg-red-500/10 text-red-600 border-red-200",
};

const statusLabels: Record<string, string> = {
  in_preparation: "قيد التحضير",
  out_for_delivery: "قيد التوصيل",
  fulfilled: "تم التوصيل",
  delivery_canceled: "ملغى",
};

export const CourierTaskCard: React.FC<CourierTaskCardProps> = ({
  task,
  updateStatus,
  isPending,
}) => {
  return (
    <Card className="overflow-hidden border-border transition-shadow hover:shadow-lg">
      <div
        className={`h-1.5 w-full ${
          (statusColors[task.status] || "bg-gray-500/10").split(" ")[0]
        }`}
      />
      <CardHeader className="p-5 pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">
                {task.userName}
              </CardTitle>
              <Badge
                className={
                  statusColors[task.status] ||
                  "bg-gray-500/10 text-gray-600 border-gray-200"
                }
              >
                {statusLabels[task.status] || task.status}
              </Badge>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {task.userPhone}
            </p>
          </div>
          {task.deliveryWindow && (
            <div className="text-left">
              <p className="text-xs text-muted-foreground">موعد التوصيل</p>
              <p className="text-sm font-bold">{task.deliveryWindow}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-3">
        <div className="space-y-3">
          {task.address && (
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-md bg-primary/10 p-1.5 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold">{task.address.zone}</p>
                <p className="text-xs text-muted-foreground">
                  {task.address.street}، {task.address.city}
                </p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Phone className="h-4 w-4" />
            </div>
            <p className="font-mono text-sm tracking-wider">
              {task.userPhone}
            </p>
          </div>
          {task.notes && (
            <div className="flex items-start gap-3 rounded-md border border-border/50 bg-muted/50 p-3">
              <div className="mt-0.5 text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="mb-1 text-xs font-bold">ملاحظات التوصيل</p>
                <p className="text-sm text-muted-foreground">{task.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {task.status === "in_preparation" &&
            task.allowedActions?.includes("dispatch") && (
              <Button
                className="col-span-2 gap-2"
                disabled={isPending}
                onClick={() => updateStatus(task.subscriptionDayId, "dispatch")}
              >
                <Truck className="h-4 w-4" />
                استلام الشحنة
              </Button>
            )}
          {task.status === "out_for_delivery" && (
            <>
              {task.allowedActions?.includes("fulfill") && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => updateStatus(task.subscriptionDayId, "fulfill")}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  تم التوصيل
                </Button>
              )}
              {task.allowedActions?.includes("cancel") && (
                <Button
                  variant="outline"
                  disabled={isPending}
                  className="gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => updateStatus(task.subscriptionDayId, "cancel")}
                >
                  <AlertCircle className="h-4 w-4" />
                  فشل التوصيل
                </Button>
              )}
            </>
          )}
          <Button variant="secondary" className="col-span-2 gap-2">
            <Navigation className="h-4 w-4" />
            عرض الموقع على الخريطة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
