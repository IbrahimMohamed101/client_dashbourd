import { createFileRoute } from "@tanstack/react-router";
import ManualDeductionPage from "@/components/pages/manual-deduction/ManualDeductionPage";

export const Route = createFileRoute("/_protected/manual-deduction/")({
  component: ManualDeductionPage,
});
