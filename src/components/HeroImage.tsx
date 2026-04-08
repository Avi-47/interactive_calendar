type HeroImageProps = {
  monthLabel: string;
  mood: string;
  condition: string;
  temperatureC: number;
  timeOfDay: string;
  image: string;
  error: string | null;
  source: string;
  animation: "rain" | "sun" | "cloud" | "snow" | "none";
};

export function HeroImage({
  monthLabel,
  mood,
  condition,
  temperatureC,
  timeOfDay,
  image,
  error,
  source,
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
        <h1>{monthLabel}</h1>
        <p>
          Mood: <strong>{mood}</strong> | Condition: <strong>{condition}</strong> | Temp:
          <strong> {Math.round(temperatureC)} C</strong>
        </p>
        <p>
          Time: {timeOfDay} | Source: {source}
        </p>
        {error ? <p className="hero-status">{error}</p> : null}
      </div>
    </aside>
  );
}
