"use client";
import { useState, useEffect } from "react";
import { useGameGraph, GameNode } from "./quests/gameGraph";
import FossilSchool from "./quests/FossilSchool";
import TrainingSummary from "./quests/TrainingSummary";
import DigSiteQuiz from "./quests/DigSiteQuiz";
import Excavation from "./quests/Excavation";
import BuildSkeleton from "./quests/BuildSkeleton";
import RexBuddy from "./quests/RexBuddy";
import Confetti from "./quests/Confetti";
import SessionTimer, { useSessionTimer } from "./quests/SessionTimer";
import SpeakingIndicator from "./quests/SpeakingIndicator";
import { sfxTap, sfxCelebrate } from "./quests/sfx";
import { startMusic, stopMusic } from "./quests/music";
import { recordCompletion, getCompletions } from "./quests/scores";
import { TrainingData } from "./quests/data";
import { VOICE } from "./quests/voice";

const GAME_GRAPH: GameNode[] = [
  { id: "start", on: { BEGIN: "menu" } },
  {
    id: "menu",
    enter: [
      { type: "speak", key: VOICE.welcome },
      { type: "speak", key: VOICE.menuSubtitle },
      { type: "unlock" },
    ],
    on: { Q1: "train", Q2: "test", Q3: "excavation", Q4: "build" },
  },
  { id: "train",      on: { COMPLETE: "summary" } },
  { id: "summary",    on: { NEXT: "test" } },
  { id: "test",       on: { PASS: "excavation", RETRAIN: "train" } },
  { id: "excavation", on: { COMPLETE: "build" } },
  { id: "build",      on: { COMPLETE: "menu" } },
];

const PARTS = [
  { emoji: "🖌️", label: "Brush" },
  { emoji: "🔨", label: "Hammer" },
  { emoji: "🗺️", label: "Dig Map" },
  { emoji: "🦴", label: "Fossil" },
  { emoji: "🏆", label: "Trophy" },
];
const QUESTS = [
  { name: "🦴 Fossil School",  event: "Q1" },
  { name: "🔍 Dig Site Quiz",  event: "Q2" },
  { name: "⛏️ Excavation",    event: "Q3" },
  { name: "🦕 Build Skeleton", event: "Q4" },
];

export default function Home() {
  const { state, send } = useGameGraph(GAME_GRAPH, "start");
  const [completed, setCompleted] = useState([false, false, false, false]);
  const [training, setTraining] = useState<TrainingData>({});
  const [completions, setCompletions] = useState(0);
  const { expired, dismiss } = useSessionTimer();

  useEffect(() => { setCompletions(getCompletions()); }, []);
  const markDone = (i: number) => setCompleted((p) => { const n = [...p]; n[i] = true; return n; });

  if (expired) { stopMusic(); return <SessionTimer onDismiss={dismiss} />; }

  const { nodeId, inputEnabled } = state;

  if (nodeId === "start") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 sm:p-8 fade-in">
        <SpeakingIndicator />
        <RexBuddy mood="idle" size={160} />
        <h1 className="text-3xl sm:text-5xl font-bold text-center">🦕 Dino Digger Quest</h1>
        <p className="text-base sm:text-xl text-center opacity-80 max-w-2xl px-4">Help Rex the robot discover dinosaurs and learn how AI classifies fossils!</p>
        <button className="btn btn-primary text-xl sm:text-2xl px-8 py-4" onClick={() => { sfxTap(); startMusic("adventure"); send("BEGIN"); }}>🎮 Start Digging!</button>
        {completions > 0 && <p className="text-sm opacity-40">🏆 Completed {completions} time{completions > 1 ? "s" : ""}!</p>}
      </div>
    );
  }

  if (nodeId === "menu") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4 sm:p-8 fade-in">
        <SpeakingIndicator />
        <Confetti active={completed.every(Boolean)} />
        <RexBuddy mood={completed.every(Boolean) ? "celebrate" : "idle"} size={140} />
        <h1 className="text-3xl sm:text-4xl font-bold text-center">Dino Digger Quest!</h1>
        <p className="text-base sm:text-lg text-center opacity-70 max-w-md px-4">Collect all dig tools and build a dinosaur!</p>
        <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
          {PARTS.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1" style={{ opacity: completed[Math.min(i, 3)] ? 1 : 0.3 }}>
              <span className="text-2xl sm:text-3xl" style={{ filter: completed[Math.min(i, 3)] ? "none" : "grayscale(1)" }}>{p.emoji}</span>
              <span className="text-xs">{p.label}</span>
            </div>
          ))}
        </div>
        <div className="text-sm opacity-60">{completed.filter(Boolean).length}/4 quests</div>
        <div className="flex flex-col gap-3 w-full max-w-sm px-4">
          {QUESTS.map((q, i) => (
            <button key={i} className="btn btn-primary flex justify-between items-center text-sm sm:text-base"
              style={{ opacity: i === 0 || completed[i - 1] ? 1 : 0.4 }}
              disabled={!inputEnabled || (i > 0 && !completed[i - 1])}
              onClick={() => { sfxTap(); send(q.event); }}>
              <span>{q.name}</span>
              {completed[i] ? <span>✅</span> : <span className="opacity-40">{PARTS[i].emoji}</span>}
            </button>
          ))}
        </div>
        {completed.every(Boolean) && <div className="text-lg sm:text-xl font-bold text-center fade-in px-4" style={{ color: "var(--success)" }}>🎉 Skeleton complete! You&apos;re a real paleontologist!</div>}
      </div>
    );
  }

  if (nodeId === "train") {
    return <FossilSchool onComplete={(data) => {
      setTraining((prev) => { const m = { ...prev }; for (const [k, v] of Object.entries(data)) m[k] = (m[k] || 0) + v; return m; });
      markDone(0); send("COMPLETE", data);
    }} />;
  }

  if (nodeId === "summary") {
    return <TrainingSummary training={training} onComplete={() => send("NEXT")} />;
  }

  if (nodeId === "test") {
    return <DigSiteQuiz training={training} onComplete={(retrain) => {
      if (retrain) send("RETRAIN");
      else { markDone(1); send("PASS"); }
    }} />;
  }

  if (nodeId === "excavation") {
    return <Excavation onComplete={() => { markDone(2); send("COMPLETE"); }} />;
  }

  if (nodeId === "build") {
    return <BuildSkeleton training={training} onComplete={() => {
      markDone(3); setCompletions(recordCompletion()); sfxCelebrate(); send("COMPLETE");
    }} />;
  }

  return null;
}
