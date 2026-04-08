const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";

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

type WeatherArchiveResponse = {
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_mean: number[];
    sunrise: string[];
    sunset: string[];
  };
};

function isDateKey(value: string | null): value is string {
  if (!value) {
    return false;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPastDate(dateKey: string): boolean {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate(),
  ).padStart(2, "0")}`;
  return dateKey < todayKey;
}

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
  const selectedDate = url.searchParams.get("date");

  if (isDateKey(selectedDate) && isPastDate(selectedDate)) {
    const archiveUrl = new URL(OPEN_METEO_ARCHIVE_URL);
    archiveUrl.searchParams.set("latitude", String(lat));
    archiveUrl.searchParams.set("longitude", String(lon));
    archiveUrl.searchParams.set("start_date", selectedDate);
    archiveUrl.searchParams.set("end_date", selectedDate);
    archiveUrl.searchParams.set(
      "daily",
      "weather_code,temperature_2m_mean,sunrise,sunset",
    );
    archiveUrl.searchParams.set("timezone", "auto");

    try {
      const upstream = await fetch(archiveUrl.toString(), { cache: "no-store" });

      if (!upstream.ok) {
        return Response.json(
          { error: "Weather history request failed" },
          {
            status: 502,
            headers: { "Cache-Control": "no-store" },
          },
        );
      }

      const data = (await upstream.json()) as WeatherArchiveResponse;

      return Response.json(
        {
          mode: "history",
          day: {
            time: data.daily.time[0],
            weather_code: data.daily.weather_code[0],
            temperature_2m_mean: data.daily.temperature_2m_mean[0],
            sunrise: data.daily.sunrise[0],
            sunset: data.daily.sunset[0],
          },
        },
        {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch {
      return Response.json(
        { error: "Unable to reach weather history provider" },
        {
          status: 502,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
  }

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
        mode: "forecast",
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