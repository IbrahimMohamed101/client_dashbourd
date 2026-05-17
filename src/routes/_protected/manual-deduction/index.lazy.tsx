import { createLazyFileRoute } from "@tanstack/react-router";
import ManualDeductionPage from "@/components/pages/manual-deduction/ManualDeductionPage";

export const Route = createLazyFileRoute("/_protected/manual-deduction/")({
  component: ManualDeductionPage,
});
