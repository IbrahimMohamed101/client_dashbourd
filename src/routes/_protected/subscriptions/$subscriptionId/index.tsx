import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  subscriptionDetailsQueryOptions,
  useUnfreezeSubscriptionMutation,
} from "@/hooks/useSubscriptionsQuery";
import { Loader } from "@/components/global/loader";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ReceiptText, ShieldCheck } from "lucide-react";

import { SubscriptionHeader } from "@/components/pages/subscriptions/details/subscription-header";
import {
  CustomerInfoCard,
  SubscriptionContractCard,
  DeliveryInfoCard,
  TechnicalDetailsAccordion,
  PremiumMealsCard,
  AddonsCard,
  AddonEntitlementsCard,
} from "@/components/pages/subscriptions/details/subscription-details-cards";

import { FreezeModal } from "@/components/pages/subscriptions/details/modals/freeze-modal";
import { ExtendModal } from "@/components/pages/subscriptions/details/modals/extend-modal";
import { CancelModal } from "@/components/pages/subscriptions/details/modals/cancel-modal";
import { ToastMessage } from "@/components/global/ToastMessage";
import { SubscriptionStackingOverview } from "@/components/pages/subscriptions/SubscriptionStackingOverview";
import { SubscriptionInvoiceDialog } from "@/components/pages/subscriptions/invoice/SubscriptionInvoiceDialog";

export const Route = createFileRoute(
  "/_protected/subscriptions/$subscriptionId/"
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      subscriptionDetailsQueryOptions(params.subscriptionId)
    ),
  pendingComponent: () => (
    <Loader variant="full-screen" label="جاري تحميل تفاصيل الاشتراك..." />
  ),
  component: SubscriptionDetailsPage,
});

function SubscriptionDetailsPage() {
  const { subscriptionId } = Route.useParams();
  const { data: response } = useSuspenseQuery(
    subscriptionDetailsQueryOptions(subscriptionId)
  );

  const subscription = response.data;
  const { mutateAsync: unfreezeSubscription } =
    useUnfreezeSubscriptionMutation();

  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const handleUnfreeze = async () => {
    try {
      await unfreezeSubscription(subscription._id);
      ToastMessage("تم إلغاء التجميد بنجاح", "success");
    } catch (error) {
      console.error(error);
      ToastMessage("حدث خطأ أثناء إلغاء تجميد الاشتراك", "error");
    }
  };

  return (
    <div className="flex-1 space-y-6 px-2 pt-4">
      <SubscriptionHeader
        subscription={subscription}
        onFreeze={() => setIsFreezeModalOpen(true)}
        onExtend={() => setIsExtendModalOpen(true)}
        onCancel={() => setIsCancelModalOpen(true)}
        onUnfreeze={handleUnfreeze}
        onInvoice={() => setIsInvoiceOpen(true)}
      />

      <section className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-gradient-to-l from-primary/10 via-primary/5 to-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ReceiptText className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold">فاتورة الاشتراك</h2>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="size-3.5" />
                فاتورة ضريبية + QR
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              اعرض الفاتورة المرتبطة بهذا الاشتراك وراجع بياناتها ثم اطبعها مباشرة.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          onClick={() => setIsInvoiceOpen(true)}
          className="w-full gap-2 px-6 font-bold shadow-sm sm:w-auto"
        >
          <ReceiptText className="size-5" />
          عرض وطباعة الفاتورة
        </Button>
      </section>

      <SubscriptionStackingOverview subscription={subscription} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-6">
          <CustomerInfoCard subscription={subscription} />
          <DeliveryInfoCard subscription={subscription} />
          <TechnicalDetailsAccordion subscription={subscription} />
        </div>
        <div className="flex flex-col gap-6">
          <SubscriptionContractCard subscription={subscription} />
          <PremiumMealsCard subscription={subscription} />
          <AddonsCard subscription={subscription} />
          <AddonEntitlementsCard subscriptionId={subscription._id} />
        </div>
      </div>

      <FreezeModal
        subscriptionId={subscription._id}
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
      />
      <ExtendModal
        subscriptionId={subscription._id}
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
      />
      <CancelModal
        subscriptionId={subscription._id}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />
      <SubscriptionInvoiceDialog
        subscriptionId={subscription._id}
        open={isInvoiceOpen}
        onOpenChange={setIsInvoiceOpen}
      />
    </div>
  );
}
