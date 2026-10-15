import { STATUS_STEPS } from "../utils";

// Bonus: visual order progress  PLACED -> CONFIRMED -> SHIPPED -> DELIVERED
export default function StatusTracker({ status }) {
  const current = STATUS_STEPS.indexOf(status);
  return (
    <ol className="status-tracker">
      {STATUS_STEPS.map((step, i) => (
        <li key={step} className={i <= current ? "done" : ""}>
          <span className="dot" />
          {step}
        </li>
      ))}
    </ol>
  );
}
