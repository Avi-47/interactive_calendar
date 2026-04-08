export type ThemeAnimation = "rain" | "sun" | "cloud" | "snow" | "none";

export type WeatherCondition =
  | "Clear"
  | "Rain"
  | "Clouds"
  | "Night"
  | "Cold"
  | "Snow"
  | "Thunder"
  | "Mist";

export type MoodTheme = {
  mood: string;
  wallColor: string;
  panelColor: string;
  textColor: string;
  accentColor: string;
  image: string;
  animation: ThemeAnimation;
};

export const WEATHER_THEME_MAP: Record<WeatherCondition, MoodTheme> = {
  Clear: {
    mood: "energetic",
    wallColor: "#8d93ea",
    panelColor: "#fff1e0",
    textColor: "#2c1f14",
    accentColor: "#ea8f24",
    image: "/images/sunny.svg",
    animation: "sun",
  },
  Rain: {
    mood: "calm",
    wallColor: "#7e89e0",
    panelColor: "#fff3e6",
    textColor: "#172635",
    accentColor: "#2f5e86",
    image: "/images/rain.svg",
    animation: "rain",
  },
  Clouds: {
    mood: "neutral",
    wallColor: "#8790e3",
    panelColor: "#fff4e8",
    textColor: "#242932",
    accentColor: "#6d7482",
    image: "/images/cloudy.svg",
    animation: "cloud",
  },
  Night: {
    mood: "calm",
    wallColor: "#6870d6",
    panelColor: "#fff3ea",
    textColor: "#101724",
    accentColor: "#435f95",
    image: "/images/night.svg",
    animation: "none",
  },
  Cold: {
    mood: "chill",
    wallColor: "#8290e5",
    panelColor: "#fff1e5",
    textColor: "#18324d",
    accentColor: "#2f73a9",
    image: "/images/cold.svg",
    animation: "snow",
  },
  Snow: {
    mood: "quiet",
    wallColor: "#92a0e8",
    panelColor: "#fff6ec",
    textColor: "#15324f",
    accentColor: "#4a82a7",
    image: "/images/cold.svg",
    animation: "snow",
  },
  Thunder: {
    mood: "intense",
    wallColor: "#6f78d8",
    panelColor: "#fff2e6",
    textColor: "#1d232e",
    accentColor: "#5e4d95",
    image: "/images/rain.svg",
    animation: "rain",
  },
  Mist: {
    mood: "soft",
    wallColor: "#8f98e7",
    panelColor: "#fff4ea",
    textColor: "#24343f",
    accentColor: "#67808f",
    image: "/images/cloudy.svg",
    animation: "cloud",
  },
};

export function weatherCodeToCondition(code: number): WeatherCondition {
  if (code === 0) {
    return "Clear";
  }

  if ([1, 2, 3].includes(code)) {
    return "Clouds";
  }

  if ([45, 48].includes(code)) {
    return "Mist";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "Snow";
  }

  if ([95, 96, 99].includes(code)) {
    return "Thunder";
  }

  if (
    [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)
  ) {
    return "Rain";
  }

  return "Clouds";
}

export function resolveCondition(
  code: number,
  tempC: number,
  isNight: boolean,
): WeatherCondition {
  const base = weatherCodeToCondition(code);

  if (isNight && (base === "Clear" || base === "Clouds" || base === "Mist")) {
    return "Night";
  }

  // Only mark as "Cold" for non-precipitation conditions at very low temps.
  if (
    tempC <= 0 &&
    (base === "Clear" || base === "Clouds" || base === "Mist")
  ) {
    return "Cold";
  }

  return base;
}

export function resolveMood(
  condition: WeatherCondition,
  tempC: number,
  isDay: boolean,
): string {
  if (condition === "Rain") {
    return "cozy";
  }
  if (condition === "Snow") {
    return "quiet";
  }
  if (condition === "Mist") {
    return "mysterious";
  }
  if (condition === "Thunder") {
    return "electric";
  }
  if (condition === "Night") {
    return "calm night";
  }
  if (condition === "Cold") {
    return "crisp";
  }

  if (tempC < 5) {
    return "brisk";
  }
  if (tempC < 15) {
    return "calm";
  }
  if (tempC < 25) {
    return isDay ? "pleasant" : "cool";
  }
  if (tempC >= 25) {
    return "warm";
  }

  if (condition === "Clear" && isDay) {
    return "bright";
  }

  return "neutral";
}
