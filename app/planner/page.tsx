import { Suspense } from "react";
import PlannerClient from "@/components/PlannerClient";

export default function PlannerPage() {
  return (
    <Suspense fallback={<main style={{ padding: 100 }}>Loading planner…</main>}>
      <PlannerClient />
    </Suspense>
  );
}
