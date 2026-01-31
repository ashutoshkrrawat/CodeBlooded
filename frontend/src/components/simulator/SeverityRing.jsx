import {
  CircularProgressbar,
  buildStyles,
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

/**
 * @param {number} value - severity in range 0–1
 */
export default function SeverityRing({ value = 0 }) {
  const percentage = Math.round(value * 100);

  const getSeverityColor = (p) => {
    if (p >= 80) return "var(--accent-red)";
    if (p >= 60) return "var(--accent-orange)";
    if (p >= 40) return "var(--accent-yellow)";
    return "var(--accent-green)";
  };

  const color = getSeverityColor(percentage);

  return (
    <div className="w-20 h-20">
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          pathColor: color,
          textColor: "var(--foreground)",
          trailColor: "var(--muted)",
          textSize: "26px",
          pathTransitionDuration: 0.8,
          strokeLinecap: "round",
        })}
      />
    </div>
  );
}
