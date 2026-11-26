import { databaseReady } from "@/lib/db";

/** Liveness and readiness probe for Docker, load balancers and uptime monitors. Reveals nothing about the system. */
export const dynamic = "force-dynamic";

export function GET() {
  const ready = databaseReady();
  return Response.json(
    { status: ready ? "ok" : "unavailable" },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

export const HEAD = GET;
