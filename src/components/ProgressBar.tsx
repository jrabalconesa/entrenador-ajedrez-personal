interface ProgressBarProps {
  value: number;
  label: string;
}

export default function ProgressBar({ value, label }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-row">
      <div className="progress-label">
        <span>{label}</span>
        <strong>{clampedValue}%</strong>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${clampedValue}%` }} />
      </div>
    </div>
  );
}
