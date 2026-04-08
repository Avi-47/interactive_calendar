type HeroImageProps = {
  monthLabel: string;
  mood: string;
  condition: string;
  temperatureC: number;
  showSummary: boolean;
  showTemperature: boolean;
  showTime: boolean;
  timeOfDay: string;
  image: string;
  error: string | null;
  animation: "rain" | "sun" | "cloud" | "snow" | "none";
};

export function HeroImage({
  monthLabel,
  mood,
  condition,
  temperatureC,
  showSummary,
  showTemperature,
  showTime,
  timeOfDay,
  image,
  error,
  animation,
}: HeroImageProps) {
  return (
    <aside className="hero-panel">
      <div
        className={[
          "hero-art",
          `is-${timeOfDay}`,
          `is-${animation}`,
          animation === "rain" ? "fx-rain" : "",
          animation === "sun" ? "fx-sun" : "",
          animation === "cloud" ? "fx-cloud" : "",
          animation === "snow" ? "fx-snow" : "",
        ]
          .join(" ")
          .trim()}
        role="img"
        aria-label={`${condition} themed sky scene`}
      >
        <div className="hero-art__sky" aria-hidden="true" />
        <div className="hero-art__image" aria-hidden="true" style={{ backgroundImage: `url(${image})` }} />
        <div className="hero-art__sun" aria-hidden="true" />
        <div className="hero-art__moon" aria-hidden="true" />
        <div className="hero-art__fog" aria-hidden="true" />
        <div className="hero-art__rain" aria-hidden="true" />
      </div>
      <div className="hero-copy">
        <p className="hero-kicker">Weather Mood Planner</p>
        <h1 suppressHydrationWarning>{monthLabel}</h1>
        {showSummary ? (
          <p suppressHydrationWarning>
            Mood: <strong>{mood}</strong> | Condition: <strong>{condition}</strong>
            {showTemperature ? (
              <>
                {" "}| Temp:<strong> {Math.round(temperatureC)} C</strong>
              </>
            ) : null}
          </p>
        ) : null}
        {showTime ? <p suppressHydrationWarning>Time: {timeOfDay}</p> : null}
        {error ? <p suppressHydrationWarning className="hero-status">{error}</p> : null}
      </div>
    </aside>
  );
}
