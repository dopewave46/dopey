import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { ErrorState } from "@/components/ui/ErrorState";

/** Router-level fallback. Kept human-readable — no stack traces, no status codes. */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  const message = isRouteErrorResponse(error)
    ? "We couldn't open that page."
    : "Something went wrong while loading DopeOrca OS.";

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <ErrorState
          title="This page didn't load"
          message={message}
          retryLabel="Back to dashboard"
          onRetry={() => navigate("/dashboard")}
        />
      </div>
    </div>
  );
}
