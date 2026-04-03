"use client";
import { useState, useEffect } from "react";
import { TrainingData, getConfidence, CATEGORIES } from "./data";
import RexBuddy from "./RexBuddy";
import { sfxCorrect, sfxTap, sfxCelebrate } from "./sfx";
import { speak, stopSpeaking } from "./speak";
import { VOICE } from "./voice";
import Confetti from "./Confetti";

const STEPS = [
  { label: "🦴 Sorting fossils!", desc: "Laying out the bones...", voice: VOICE.q5Step1 },
  { label: "🦖 Building the skull", desc: "Connecting jaw and teeth...", voice: VOICE.q5Step2 },
  { label: "🦕 Attaching the spine", desc: "Vertebrae clicking into place...", voice: VOICE.q5Step3 },
  { label: "🦅 Adding the ribs", desc: "Rib cage taking shape...", voice: VOICE.q5Step4 },
  { label: "🛡️ Mounting the legs", desc: "Standing tall...", voice: VOICE.q5Step5 },
  { label: "🏆 Skeleton complete!", desc: "What a magnificent dinosaur!", voice: VOICE.q5Step6 },
];

export default function BuildSkeleton({ training, onComplete }: { training: TrainingData; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [auto, setAuto] = useState(false);

  useEffect(() => { speak(VOICE.q5Start); return () => { stopSpeaking(); }; }, []);

  useEffect(() => {
    if (!auto || done) return;
    const next = step + 1;
    const t = setTimeout(() => {
      sfxCorrect();
      if (next >= STEPS.length) { setDone(true); sfxCelebrate(); speak(VOICE.q5Done); }
      else { setStep(next); speak(STEPS[next].voice); }
    }, 3000);
    return () => clearTimeout(t);
  }, [auto, step, done]);

  const avgConf = Math.round(CATEGORIES.reduce((sum, c) => sum + getConfidence(training, c), 0) / CATEGORIES.length);

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-8 fade-in">
        <Confetti active={true} />
        <RexBuddy mood="celebrate" size={160} />
        <h2 className="text-3xl font-bold text-center">🎉 Skeleton Complete!</h2>
        <p className="text-xl">AI Confidence: <b>{avgConf}%</b></p>
        <p className="text-lg opacity-80 text-center max-w-md">Your training data helped Rex reconstruct a real dinosaur!</p>
        <button className="btn btn-success mt-4" onClick={() => { stopSpeaking(); sfxTap(); speak(VOICE.q5Learned); onComplete(); }}>🏠 Mission Complete!</button>
      </div>
    );
  }

  const current = STEPS[step];
  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-5 p-4 sm:p-8 fade-in">
      <h2 className="text-2xl sm:text-3xl font-bold">🦕 Quest 4: Build Skeleton!</h2>
      <RexBuddy mood={auto ? "happy" : "idle"} size={100} />
      <div className="text-sm opacity-60">AI Confidence: {avgConf}%</div>
      <div className="w-72">
        <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
        <div className="text-center text-sm mt-1 opacity-70">Step {step + 1} / {STEPS.length}</div>
      </div>
      <div className="text-4xl my-2">{current.label}</div>
      <div className="text-lg font-semibold">{current.desc}</div>
      <div className="flex flex-col gap-1 w-72 max-h-32 overflow-y-auto text-sm opacity-60">
        {STEPS.slice(0, step + 1).map((s, i) => <div key={i}>✅ {s.label}</div>)}
      </div>
      {!auto ? (
        <button className="btn btn-primary text-xl mt-4" onClick={() => { stopSpeaking(); sfxTap(); setAuto(true); speak(VOICE.q5Launch).then(() => speak(STEPS[0].voice)); }}>🦴 Start Building!</button>
      ) : (
        <div className="text-sm opacity-50 mt-4">🤖 Rex is assembling...</div>
      )}
    </div>
  );
}
