import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/packages/create")({
  beforeLoad: () => {
    throw redirect({ to: "/packages" });
  },
  component: () => null,
});
