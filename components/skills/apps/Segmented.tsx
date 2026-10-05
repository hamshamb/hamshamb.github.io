"use client";

import { useId } from "react";

/**
 * A row of radio buttons drawn as a segmented control. Real inputs underneath, so arrow keys,
 * form semantics and screen readers all work; the visible part is just the label next to each.
 */
export function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
  className = "",
}: {
  legend: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  className?: string;
}) {
  const name = useId();
  return (
    <fieldset className={`seg ${className}`.trim()}>
      <legend className="seg-legend mono">{legend}</legend>
      <div className="seg-row">
        {options.map((option) => (
          <label key={option} className="seg-opt">
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
