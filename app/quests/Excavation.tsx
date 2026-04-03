"use client";
import { useState, useEffect, useCallback } from "react";
import { RESCUE_EVENTS } from "./data";
import RexBuddy from "./RexBuddy";
import { sfxCorrect, sfxWrong, sfxTap, sfxCelebrate } from "./sfx";
import { speak, stopSpeaking } from "./speak";
import { VOICE } from "./voice";
import Confetti from "./Confetti";

export default function Excavation({ onComplete }: { onComplete: () => void }) {
  const [events] = useState(() => [...RESCUE_EVENTS]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"scanning" | "event" | "result">("scanning");
  const [overridden, setOverridden] = useState(false);
  const [aiActed, setAiActed] = useState(false);
  const [finds, setFinds] = useState(0);
  const [oops, setOops] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [digDepth, setDigDepth] = useState(10);

  useEffect(() => { speak(VOICE.q4Start); return () => { stopSpeaking(); }; }, []);

  const event = events[idx];
  const isFossil = event.correct === "dig";

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => { setPhase("event"); setTimer(0); }, 1200);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "event") return;
    const t = setInterval(() => setTimer((v) => v + 100), 100);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "event" || overridden || aiActed) return;
    if (timer >= event.delay) setAiActed(true);
  }, [phase, timer, event.delay, overridden, aiActed]);

  useEffect(() => {
    if (!aiActed || phase !== "event") return;
    if (isFossil) { setOops((c) => c + 1); sfxWrong(); speak(VOICE.q4Crash); }
    else { sfxCorrect(); speak(VOICE.q4AiRight); }
    setPhase("result");
  }, [aiActed, phase, isFossil]);

  const override = useCallback(() => {
    if (phase !== "event" || aiActed) return;
    setOverridden(true); setPhase("result");
    setDigDepth((d) => Math.min(d + 12, 90));
    if (isFossil) { setFinds((s) => s + 1); sfxCorrect(); speak(VOICE.q4Save); }
    else { speak(VOICE.q4FalseAlarm); }
  }, [phase, aiActed, isFossil]);

  const advance = () => {
    if (idx + 1 >= events.length) { setDone(true); return; }
    setIdx(idx + 1); setPhase("scanning"); setOverridden(false); setAiActed(false); setTimer(0);
  };

  if (done) {
    const totalFossils = events.filter((e) => e.correct === "dig").length;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 fade-in">
        <Confetti active={true} />
        <RexBuddy mood="celebrate" size={140} />
        <h2 className="text-3xl font-bold">Excavation Complete!</h2>
        <div className="flex gap-6 text-lg"><span>🦴 Found: {finds}/{totalFossils}</span><span>😅 Missed: {oops}</span></div>
        <button className="btn btn-success mt-4" onClick={() => { stopSpeaking(); sfxTap(); sfxCelebrate(); speak(VOICE.q4Learned); onComplete(); }}>Final Quest →</button>
      </div>
    );
  }

  const urgencyPct = isFossil ? Math.min((timer / event.delay) * 100, 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 sm:p-8 fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold">⛏️ Quest 3: Excavation!</h2>
      <RexBuddy mood={phase === "event" && isFossil ? "scared" : "idle"} size={80} />
      <div className="text-sm opacity-70">{idx + 1} / {events.length}</div>
      <div className="w-full max-w-lg h-32 rounded-2xl relative overflow-hidden" style={{ background: "#3d2b1f" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #8B7355 0%, #5C4033 50%, #3d2b1f 100%)" }} />
        <div className="text-4xl absolute transition-all" style={{ left: "15%", top: `${digDepth}%`, transform: "translateY(-50%)", transitionDuration: "0.3s" }}>⛏️</div>
        {phase !== "scanning" && <div className="text-5xl absolute top-1/2 right-8" style={{ transform: "translateY(-50%)" }}>{event.emoji}</div>}
        {[20, 40, 60, 80].map((x) => <div key={x} className="absolute w-1 h-1 rounded-full bg-amber-300 opacity-20" style={{ left: `${x}%`, top: `${(x * 37) % 80 + 10}%` }} />)}
      </div>
      {phase === "event" && isFossil && !overridden && !aiActed && (
        <div className="w-full max-w-lg">
          <div className="text-sm text-center mb-1" style={{ color: "var(--warn)" }}>⚠️ Dig before it crumbles!</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${urgencyPct}%`, background: urgencyPct > 70 ? "#ef4444" : "var(--warn)", transition: "width 0.1s linear" }} /></div>
        </div>
      )}
      {phase === "event" && <div className="text-xl font-semibold">{event.label}</div>}
      {phase === "event" && !overridden && !aiActed && (
        <button className="btn text-2xl fade-in" style={{ background: "#fb923c", animation: "pulse 0.6s infinite alternate" }} onClick={override}>⛏️ DIG!</button>
      )}
      {phase === "result" && (
        <div className="flex flex-col items-center gap-3 fade-in">
          <div className="text-lg text-center max-w-md" style={{ color: (overridden && isFossil) || (!isFossil) ? "var(--success)" : "var(--warn)" }}>
            {overridden && isFossil ? "🦴 Great find!" : overridden && !isFossil ? "😅 That was just a rock!" : !isFossil ? "🤖 Rex skipped that correctly!" : "😅 Oops! Should have dug that up!"}
          </div>
          <button className="btn btn-primary mt-2" onClick={advance}>Continue →</button>
        </div>
      )}
      <div className="flex gap-4 text-sm opacity-70"><span>🦴 Found: {finds}</span><span>😅 Missed: {oops}</span></div>
    </div>
  );
}
