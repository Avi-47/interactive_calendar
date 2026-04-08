const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

type WeatherApiResponse = {
  current: {
    weather_code: number;
    temperature_2m: number;
    is_day: 0 | 1;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
  };
};

function getCoordParam(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return parsed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = getCoordParam(url.searchParams.get("lat"), 40.7128);
  const lon = getCoordParam(url.searchParams.get("lon"), -74.006);

  const upstreamUrl = new URL(OPEN_METEO_URL);
  upstreamUrl.searchParams.set("latitude", String(lat));
  upstreamUrl.searchParams.set("longitude", String(lon));
  upstreamUrl.searchParams.set("current", "weather_code,temperature_2m,is_day");
  upstreamUrl.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset",
  );
  upstreamUrl.searchParams.set("timezone", "auto");
  upstreamUrl.searchParams.set("forecast_days", "8");

  try {
    const upstream = await fetch(upstreamUrl.toString(), { cache: "no-store" });

    if (!upstream.ok) {
      const retryAfter = upstream.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;

      if (upstream.status === 429) {
        return Response.json(
          {
            error: "Weather API rate-limited",
            retryAfterSeconds:
              typeof retryAfterSeconds === "number" && Number.isFinite(retryAfterSeconds)
                ? retryAfterSeconds
                : 60,
          },
          {
            status: 429,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }

      return Response.json(
        { error: "Weather API request failed" },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const data = (await upstream.json()) as WeatherApiResponse;

    return Response.json(
      {
        current: data.current,
        daily: data.daily,
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch {
    return Response.json(
      { error: "Unable to reach weather provider" },
      {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}