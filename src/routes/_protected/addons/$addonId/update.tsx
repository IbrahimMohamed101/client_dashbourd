import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/addons/$addonId/update")({
  beforeLoad: () => {
    throw redirect({ to: "/addons" });
  },
});
