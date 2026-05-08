import { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  playNewOrderSound,
  playUrgentNewOrderSound,
  showNewOrderBrowserNotification,
  requestNotificationPermission,
} from "@/utils/newOrderNotification";
import type { OneTimeOrderListItem } from "@/types/oneTimeOrderTypes";

interface UseNewOrderDetectionOptions {
  orders: OneTimeOrderListItem[];
  enabled?: boolean;
}

interface NewOrderInfo {
  orderNumber: string;
  customerName?: string;
  status: string;
  paymentStatus: string;
}

/**
 * Detects new orders that appear in the list that weren't there before.
 * Plays a sound, shows a toast, and sends a browser notification.
 *
 * Comparison is based on `entityId` – if a new ID appears that wasn't
 * in the previous render's set, it's considered a new order.
 */
export function useNewOrderDetection({
  orders,
  enabled = true,
}: UseNewOrderDetectionOptions) {
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (enabled) {
      requestNotificationPermission();
    }
  }, [enabled]);

  // Track new orders on every data change
  useEffect(() => {
    if (!enabled || !orders.length) {
      // Still track IDs even when empty so we detect the first batch
      if (enabled && orders.length === 0) {
        prevOrderIdsRef.current = new Set();
      }
      return;
    }

    const currentIds = new Set(orders.map((o) => o.entityId));
    const prevIds = prevOrderIdsRef.current;

    // Skip the very first load – we don't want to alert on existing orders
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevOrderIdsRef.current = currentIds;
      return;
    }

    // Find new order IDs that weren't in the previous set
    const newOrders: NewOrderInfo[] = [];
    for (const order of orders) {
      if (!prevIds.has(order.entityId)) {
        newOrders.push({
          orderNumber: order.orderNumber,
          customerName: order.customer?.name,
          status: order.status,
          paymentStatus: order.paymentStatus,
        });
      }
    }

    if (newOrders.length > 0) {
      // Determine if any new order is urgent (confirmed + paid = needs immediate action)
      const hasUrgent = newOrders.some(
        (o) => o.status === "confirmed" && o.paymentStatus === "paid"
      );

      // Play appropriate sound
      if (hasUrgent) {
        playUrgentNewOrderSound();
      } else {
        playNewOrderSound();
      }

      // Show toast notification
      if (newOrders.length === 1) {
        const order = newOrders[0];
        toast.info("طلب جديد!", {
          description: order.customerName
            ? `طلب ${order.orderNumber} من ${order.customerName}`
            : `طلب جديد: ${order.orderNumber}`,
          duration: 8_000,
        });

        // Browser notification for background tab
        showNewOrderBrowserNotification(
          order.orderNumber,
          order.customerName
        );
      } else {
        toast.info(`${newOrders.length} طلبات جديدة!`, {
          description: `تم استلام ${newOrders.length} طلبات جديدة`,
          duration: 8_000,
        });

        // Show browser notification for the first new order
        const first = newOrders[0];
        showNewOrderBrowserNotification(
          first.orderNumber,
          first.customerName
        );
      }
    }

    // Update the tracked set
    prevOrderIdsRef.current = currentIds;
  }, [orders, enabled]);

  // Reset detection state (e.g., when filters change)
  const resetDetection = useCallback(() => {
    prevOrderIdsRef.current = new Set();
    hasInitializedRef.current = false;
  }, []);

  return { resetDetection };
}
