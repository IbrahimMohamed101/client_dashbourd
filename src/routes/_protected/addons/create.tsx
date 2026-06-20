import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/addons/create")({
  beforeLoad: () => {
    throw redirect({ to: "/addons" });
  },
});
