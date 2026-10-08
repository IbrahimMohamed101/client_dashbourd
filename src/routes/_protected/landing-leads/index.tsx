import { createFileRoute } from "@tanstack/react-router";
import { LandingLeadsPage } from "@/features/landing-leads/LandingLeadsPage";

export const Route = createFileRoute("/_protected/landing-leads/")({
  component: LandingLeadsPage,
});
