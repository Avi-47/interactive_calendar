import { useEffect, useMemo, useState } from "react";
import { dateToKey, normalizeDate, parseDateKey, sameDay, getTimeOfDay } from "@/lib/date";
import {
  WEATHER_THEME_MAP,
  resolveCondition,
  resolveMood,
  type WeatherCondition,
  type MoodTheme,
} from "@/lib/weatherTheme";

type WeatherSnapshot = {
  code: number;
  tempC: number;
  sunriseISO?: string;
  sunsetISO?: string;
};

type WeatherApiPayload =
  | {
      mode: "forecast";
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
    }
  | {
      mode: "history";
      day: {
        time: string;
        weather_code: number;
        temperature_2m_mean: number;
        sunrise: string;
        sunset: string;
      };
    };

type CachedWeather = Record<string, WeatherSnapshot>;

type WeatherCacheMeta = {
  lat: number;
  lon: number;
};

type WeatherHookResult = {
  condition: WeatherCondition;
  mood: string;
  theme: MoodTheme;
  temperatureC: number;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  loading: boolean;
  error: string | null;
  source: "live" | "forecast" | "cache" | "mock";
};

const DEFAULT_LAT = 40.7128;
const DEFAULT_LON = -74.006;
const WEATHER_REFRESH_MS = 10 * 60 * 1000;

let inFlightWeatherFetch: Promise<CachedWeather> | null = null;
let lastSuccessfulFetchAt = 0;
let rateLimitedUntil = 0;
const WEATHER_CACHE_META_KEY = "weatherCacheMeta";

function getCoords(): Promise<{ lat: number; lon: number }> {
  const fetchServerLocation = async () => {
    try {
      const response = await fetch("/api/location", { cache: "no-store" });
      if (!response.ok) {
        return { lat: DEFAULT_LAT, lon: DEFAULT_LON };
      }

      const payload = (await response.json()) as { lat?: number; lon?: number };
      if (
        typeof payload.lat === "number" &&
        Number.isFinite(payload.lat) &&
        typeof payload.lon === "number" &&
        Number.isFinite(payload.lon)
      ) {
        return { lat: payload.lat, lon: payload.lon };
      }
    } catch {
      // Fallback handled below.
    }

    return { lat: DEFAULT_LAT, lon: DEFAULT_LON };
  };

  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return fetchServerLocation();
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      async () => {
        resolve(await fetchServerLocation());
      },
      { timeout: 5000 },
    );
  });
}

function readCache(): CachedWeather {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem("weatherCacheByDay");
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as CachedWeather) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: CachedWeather) {
  localStorage.setItem("weatherCacheByDay", JSON.stringify(cache));
}

function clearCache() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem("weatherCacheByDay");
  localStorage.removeItem(WEATHER_CACHE_META_KEY);
}

function readCacheMeta(): WeatherCacheMeta | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(WEATHER_CACHE_META_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<WeatherCacheMeta>;
    if (
      typeof parsed?.lat === "number" &&
      Number.isFinite(parsed.lat) &&
      typeof parsed?.lon === "number" &&
      Number.isFinite(parsed.lon)
    ) {
      return { lat: parsed.lat, lon: parsed.lon };
    }
  } catch {
    // Ignore malformed cache metadata.
  }

  return null;
}

function writeCacheMeta(meta: WeatherCacheMeta) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(WEATHER_CACHE_META_KEY, JSON.stringify(meta));
}

function mergeWeatherIntoCache(date: Date, payload: WeatherApiPayload): CachedWeather {
  const nextCache = { ...readCache() };

  if (payload.mode === "history") {
    nextCache[payload.day.time] = {
      code: payload.day.weather_code,
      tempC: payload.day.temperature_2m_mean,
      sunriseISO: payload.day.sunrise,
      sunsetISO: payload.day.sunset,
    };
  } else {
    const todayKey = dateToKey(normalizeDate(new Date()));

    nextCache[todayKey] = {
      code: payload.current.weather_code,
      tempC: payload.current.temperature_2m,
    };

    payload.daily.time.forEach((dayKey, index) => {
      const tempAvg =
        (payload.daily.temperature_2m_max[index] + payload.daily.temperature_2m_min[index]) / 2;
      nextCache[dayKey] = {
        code: payload.daily.weather_code[index],
        tempC: tempAvg,
        sunriseISO: payload.daily.sunrise[index],
        sunsetISO: payload.daily.sunset[index],
      };
    });
  }

  writeCache(nextCache);
  return nextCache;
}

function resolveSource(
  targetDate: Date,
  cache: CachedWeather,
  fetchedFresh: boolean,
): "live" | "forecast" | "cache" | "mock" {
  const today = normalizeDate(new Date());
  const dayDiff = Math.floor((targetDate.getTime() - today.getTime()) / 86400000);
  const hasDateValue = Boolean(cache[dateToKey(targetDate)]);

  if (!hasDateValue) {
    return "mock";
  }

  if (!fetchedFresh) {
    return "cache";
  }

  if (dayDiff === 0) {
    return "live";
  }
  if (dayDiff > 0 && dayDiff <= 7) {
    return "forecast";
  }

  return "cache";
}

function getTimeOfDayFromSun(
  selectedTime: Date,
  snapshot: WeatherSnapshot,
): "morning" | "afternoon" | "evening" | "night" {
  if (!snapshot.sunriseISO || !snapshot.sunsetISO) {
    return getTimeOfDay(selectedTime);
  }

  const sunrise = new Date(snapshot.sunriseISO);
  const sunset = new Date(snapshot.sunsetISO);

  if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) {
    return getTimeOfDay(selectedTime);
  }

  const selectedMs = selectedTime.getTime();
  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();

  if (selectedMs < sunriseMs || selectedMs >= sunsetMs) {
    return "night";
  }

  return getTimeOfDay(selectedTime);
}

async function fetchWeatherFromApi(lat: number, lon: number, date: Date): Promise<CachedWeather> {
  const dateKey = dateToKey(date);
  const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&date=${dateKey}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 429) {
      let retryAfterSeconds = 60;
      try {
        const payload = (await response.json()) as { retryAfterSeconds?: number };
        if (
          typeof payload.retryAfterSeconds === "number" &&
          Number.isFinite(payload.retryAfterSeconds) &&
          payload.retryAfterSeconds > 0
        ) {
          retryAfterSeconds = payload.retryAfterSeconds;
        }
      } catch {
        // Ignore malformed 429 body and keep default cooldown.
      }

      rateLimitedUntil = Date.now() + retryAfterSeconds * 1000;
      throw new Error(`RATE_LIMIT:${retryAfterSeconds}`);
    }

    throw new Error("Weather request failed");
  }

  const payload = (await response.json()) as WeatherApiPayload;
  const nextCache = mergeWeatherIntoCache(date, payload);
  writeCacheMeta({ lat, lon });
  return nextCache;
}

function buildMockWeather(date: Date): WeatherSnapshot {
  const day = date.getDate();
  const variants: WeatherSnapshot[] = [
    { code: 0, tempC: 25 },
    { code: 3, tempC: 19 },
    { code: 61, tempC: 16 },
    { code: 71, tempC: 2 },
  ];

  return variants[day % variants.length];
}

export function useWeather(selectedDate: Date | null): WeatherHookResult {
  const [cache, setCache] = useState<CachedWeather>({});
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"live" | "forecast" | "cache" | "mock">("mock");

  const date = useMemo(() => normalizeDate(selectedDate ?? new Date()), [selectedDate]);

  useEffect(() => {
    setCache(readCache());
  }, []);

  useEffect(() => {
    let cancelled = false;

    getCoords().then((resolvedCoords) => {
      if (!cancelled) {
        setCoords(resolvedCoords);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cacheMeta = readCacheMeta();
    if (!cacheMeta) {
      writeCacheMeta(coords);
      return;
    }

    const latDelta = Math.abs(cacheMeta.lat - coords.lat);
    const lonDelta = Math.abs(cacheMeta.lon - coords.lon);
    if (latDelta > 0.3 || lonDelta > 0.3) {
      clearCache();
      lastSuccessfulFetchAt = 0;
      rateLimitedUntil = 0;
      setCache({});
    }

    writeCacheMeta(coords);
  }, [coords]);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      const cacheSnapshot = readCache();
      const nowMs = Date.now();
      const dateKey = dateToKey(date);
      const hasDateInCache = Boolean(cacheSnapshot[dateKey]);
      const shouldRefreshNow = !hasDateInCache || nowMs - lastSuccessfulFetchAt >= WEATHER_REFRESH_MS;

      if (rateLimitedUntil > nowMs && !hasDateInCache) {
        const secondsLeft = Math.max(1, Math.ceil((rateLimitedUntil - nowMs) / 1000));
        setError(`Weather API is rate-limited. Retrying in ${secondsLeft}s.`);
        setSource(resolveSource(date, cacheSnapshot, false));
        return;
      }

      if (!shouldRefreshNow) {
        setError(null);
        setCache(cacheSnapshot);
        setSource(resolveSource(date, cacheSnapshot, false));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (!inFlightWeatherFetch) {
          inFlightWeatherFetch = fetchWeatherFromApi(coords.lat, coords.lon, date).finally(() => {
            inFlightWeatherFetch = null;
          });
        }
        const nextCache = await inFlightWeatherFetch;
        lastSuccessfulFetchAt = Date.now();

        if (!cancelled) {
          setCache(nextCache);
          setSource(resolveSource(date, nextCache, true));
        }
      } catch (fetchError) {
        if (!cancelled) {
          const errorMessage = fetchError instanceof Error ? fetchError.message : "";
          if (errorMessage.startsWith("RATE_LIMIT:")) {
            const retrySeconds = Number(errorMessage.split(":")[1] ?? "60");
            const prettyRetrySeconds = Number.isFinite(retrySeconds) ? retrySeconds : 60;
            setError(`Weather API is busy. Retrying in ${prettyRetrySeconds}s.`);
          } else {
            setError("Unable to fetch weather. Using fallback mood.");
          }

          const fallbackCache = readCache();
          setCache(fallbackCache);
          setSource(resolveSource(date, fallbackCache, false));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchWeather();

    return () => {
      cancelled = true;
    };
  }, [coords.lat, coords.lon, date]);

  const { condition, mood, theme, temperatureC, timeOfDay } = useMemo(() => {
    const today = normalizeDate(new Date());
    const dateKey = dateToKey(date);
    const cached = cache[dateKey] ?? buildMockWeather(date);
    const now = new Date();
    const parsed = parseDateKey(dateKey);
    const selectedTime = sameDay(date, today)
      ? now
      : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
    const currentTimeOfDay = getTimeOfDayFromSun(selectedTime, cached);

    const isNight = currentTimeOfDay === "night";
    const resolved = resolveCondition(cached.code, cached.tempC, isNight);
    const resolvedTheme = WEATHER_THEME_MAP[resolved];
    const resolvedMood = resolveMood(resolved, cached.tempC, !isNight);

    return {
      condition: resolved,
      mood: resolvedMood || resolvedTheme.mood,
      theme: resolvedTheme,
      temperatureC: cached.tempC,
      timeOfDay: currentTimeOfDay,
    };
  }, [cache, date]);

  return {
    condition,
    mood,
    theme,
    temperatureC,
    timeOfDay,
    loading,
    error,
    source,
  };
}
