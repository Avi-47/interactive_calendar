const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;

function parseCoord(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export async function GET(request: Request) {
  const headers = request.headers;

  // Vercel provides these geo headers for deployed requests.
  const vercelLat = parseCoord(headers.get("x-vercel-ip-latitude"));
  const vercelLon = parseCoord(headers.get("x-vercel-ip-longitude"));

  return Response.json(
    {
      lat: vercelLat ?? DEFAULT_LAT,
      lon: vercelLon ?? DEFAULT_LON,
      source: vercelLat !== null && vercelLon !== null ? "vercel-geo" : "default",
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
