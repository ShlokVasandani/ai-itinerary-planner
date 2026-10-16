"use client";

import { useId, useState } from "react";

export interface PickerOption {
  id: string;
  label: string;
}

/** Type a place name (autocomplete from the city's data) and add it as a chip. */
export default function PlacePicker({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: PickerOption[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const byLabel = new Map(options.map((o) => [o.label.toLowerCase(), o]));
  const selected = value.map((v) => options.find((o) => o.id === v)).filter(Boolean) as PickerOption[];

  function add() {
    const match = byLabel.get(text.trim().toLowerCase());
    if (match && !value.includes(match.id)) onChange([...value, match.id]);
    if (match) setText("");
  }

  return (
    <div className="field">
      <label htmlFor={`${id}-in`}>{label}</label>
      <div className="picker-row">
        <input
          id={`${id}-in`}
          list={`${id}-list`}
          value={text}
          placeholder="Start typing a place"
          autoComplete="off"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <datalist id={`${id}-list`}>
          {options.map((o) => (
            <option key={o.id} value={o.label} />
          ))}
        </datalist>
        <button type="button" className="btn btn-small" onClick={add} disabled={!byLabel.has(text.trim().toLowerCase())}>
          Add
        </button>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
      {selected.length > 0 && (
        <ul className="chips" aria-label={`${label}, selected`}>
          {selected.map((o) => (
            <li key={o.id}>
              <span>{o.label}</span>
              <button type="button" aria-label={`Remove ${o.label}`} onClick={() => onChange(value.filter((v) => v !== o.id))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
