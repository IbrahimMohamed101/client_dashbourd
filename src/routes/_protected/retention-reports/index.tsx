import { createFileRoute } from "@tanstack/react-router";
import { RetentionSnapshotPage } from "@/features/retention/RetentionSnapshotPage";

export const Route = createFileRoute("/_protected/retention-reports/")({
  component: RetentionSnapshotRoute,
});

function RetentionSnapshotRoute() {
  return <div className="space-y-4 px-4 lg:px-6"><RetentionSnapshotPage /></div>;
}
