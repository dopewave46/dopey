import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <EmptyState
          icon="search"
          title="Page not found"
          description="That page doesn't exist in DopeOrca OS. Check the address or head back to your dashboard."
          action={<Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>}
        />
      </div>
    </div>
  );
}
