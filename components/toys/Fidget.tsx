"use client";

import { type KeyboardEvent, type PointerEvent, useRef, useState } from "react";

/** Sound is opt-in and remembered locally; nothing ever plays until the visitor turns it on. */
function useClick() {
  const [on, setOn] = useState(() => {
    try {
      return window.localStorage.getItem("fidget-sound") === "1";
    } catch {
      return false;
    }
  });
  const ctx = useRef<AudioContext | null>(null);
  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      window.localStorage.setItem("fidget-sound", next ? "1" : "0");
    } catch {
      // fine
    }
  };
  const click = (pitch = 1) => {
    if (!on) return;
    ctx.current ??= new AudioContext();
    const audio = ctx.current;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = 1800 * pitch;
    gain.gain.setValueAtTime(0.05, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.04);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.05);
  };
  return { on, toggle, click };
}

/** A rotary control: drag around it, or use arrow keys. 24 detents. */
function Dial({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (event.buttons !== 1) return;
    const box = event.currentTarget.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - (box.top + box.height / 2), event.clientX - (box.left + box.width / 2));
    onChange(Math.round(((angle / (Math.PI * 2) + 1.25) % 1) * 24) % 24);
  };
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") onChange((value + 1) % 24);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") onChange((value + 23) % 24);
    else return;
    event.preventDefault();
  };
  return (
    <div
      className="fidget-dial"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={23}
      aria-valuenow={value}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        drag(event);
      }}
      onPointerMove={drag}
      onKeyDown={keys}
    >
      <span style={{ transform: `rotate(${value * 15}deg)` }} />
    </div>
  );
}

/** Switches, dials and buttons with no purpose. That is the purpose. */
export default function Fidget() {
  const { on, toggle, click } = useClick();
  const [toggled, setToggled] = useState(false);
  const [dial, setDial] = useState(0);
  const [knob, setKnob] = useState(6);
  const [slide, setSlide] = useState(40);
  const [lever, setLever] = useState(0);
  const [presses, setPresses] = useState(0);

  return (
    <div className="fidget">
      <div className="fidget-grid">
        <div className="fidget-cell">
          <span className="mono">toggle</span>
          <button type="button" className="fidget-toggle" role="switch" aria-label="toggle" aria-checked={toggled} onClick={() => { setToggled(!toggled); click(toggled ? 0.8 : 1.2); }}>
            <span />
          </button>
        </div>
        <div className="fidget-cell">
          <span className="mono">dial</span>
          <Dial label="dial" value={dial} onChange={(value) => { setDial(value); click(0.6 + value / 40); }} />
        </div>
        <div className="fidget-cell">
          <span className="mono">knob</span>
          <Dial label="knob" value={knob} onChange={(value) => { setKnob(value); click(1); }} />
        </div>
        <label className="fidget-cell fidget-wide">
          <span className="mono">slider · {slide}</span>
          <input type="range" min={0} max={100} value={slide} onChange={(event) => { setSlide(Number(event.target.value)); if (Number(event.target.value) % 10 === 0) click(0.9); }} />
        </label>
        <div className="fidget-cell">
          <span className="mono">spring</span>
          <button type="button" className="fidget-spring" onClick={() => { setPresses(presses + 1); click(1.4); }} aria-label={`spring button, pressed ${presses} times`}>
            <span>{presses}</span>
          </button>
        </div>
        <div className="fidget-cell" role="radiogroup" aria-label="switch">
          <span className="mono">switch</span>
          <div className="fidget-lever" data-pos={lever}>
            {[0, 1, 2].map((pos) => (
              <button key={pos} type="button" role="radio" aria-checked={lever === pos} aria-label={["off", "on", "definitely on"][pos]} onClick={() => { setLever(pos); click(0.7 + pos * 0.2); }} />
            ))}
            <i aria-hidden="true" />
          </div>
        </div>
      </div>
      <p className="toy-foot mono">
        <button type="button" className="text-link" onClick={toggle} aria-pressed={on}>{on ? "sound on" : "sound off"}</button> · nothing here does anything. that is the point.
      </p>
    </div>
  );
}
