"use client";

export const CATEGORIES = ["carnivore", "herbivore", "flying", "marine", "armored"] as const;
export type Category = typeof CATEGORIES[number];
export type TrainingData = Record<string, number>;

export function getConfidence(training: TrainingData, cat: string): number {
  const count = training[cat] || 0;
  return count === 0 ? 25 : count === 1 ? 55 : 90;
}

export const TRAIN_ITEMS = [
  { emoji: "🦖", label: "T-Rex", answer: "carnivore" as const, category: "carnivore", voiceCorrect: "t_carni_trex_y.mp3", voiceWrong: "t_carni_trex_n.mp3" },
  { emoji: "🦖", label: "Velociraptor", answer: "carnivore" as const, category: "carnivore", voiceCorrect: "t_carni_veloci_y.mp3", voiceWrong: "t_carni_veloci_n.mp3" },
  { emoji: "🦕", label: "Triceratops", answer: "herbivore" as const, category: "herbivore", voiceCorrect: "t_herbi_trice_y.mp3", voiceWrong: "t_herbi_trice_n.mp3" },
  { emoji: "🦕", label: "Brachiosaurus", answer: "herbivore" as const, category: "herbivore", voiceCorrect: "t_herbi_brachio_y.mp3", voiceWrong: "t_herbi_brachio_n.mp3" },
  { emoji: "🦅", label: "Pteranodon", answer: "flying" as const, category: "flying", voiceCorrect: "t_flying_ptera_y.mp3", voiceWrong: "t_flying_ptera_n.mp3" },
  { emoji: "🦅", label: "Quetzalcoatlus", answer: "flying" as const, category: "flying", voiceCorrect: "t_flying_quetz_y.mp3", voiceWrong: "t_flying_quetz_n.mp3" },
  { emoji: "🐋", label: "Mosasaurus", answer: "marine" as const, category: "marine", voiceCorrect: "t_marine_mosa_y.mp3", voiceWrong: "t_marine_mosa_n.mp3" },
  { emoji: "🐋", label: "Plesiosaur", answer: "marine" as const, category: "marine", voiceCorrect: "t_marine_plesio_y.mp3", voiceWrong: "t_marine_plesio_n.mp3" },
  { emoji: "🛡️", label: "Ankylosaurus", answer: "armored" as const, category: "armored", voiceCorrect: "t_armored_ankylo_y.mp3", voiceWrong: "t_armored_ankylo_n.mp3" },
  { emoji: "🛡️", label: "Stegosaurus", answer: "armored" as const, category: "armored", voiceCorrect: "t_armored_stego_y.mp3", voiceWrong: "t_armored_stego_n.mp3" },
];

export const CAT_LABELS: Record<string, { emoji: string; label: string }> = {
  carnivore: { emoji: "🦖", label: "Carnivore" },
  herbivore: { emoji: "🦕", label: "Herbivore" },
  flying:    { emoji: "🦅", label: "Flying Reptile" },
  marine:    { emoji: "🐋", label: "Marine Reptile" },
  armored:   { emoji: "🛡️", label: "Armored Dino" },
};

export const AI_FEATURES: Record<string, string[]> = {
  carnivore: ["Tooth scan", "Claw size", "Jaw shape"],
  herbivore: ["Tooth scan", "Neck length", "Body size"],
  flying:    ["Wing span", "Bone density", "Claw shape"],
  marine:    ["Flipper scan", "Skull shape", "Tail type"],
  armored:   ["Plate scan", "Tail shape", "Shell thickness"],
};

const CONFUSIONS: Record<string, string> = {
  carnivore: "Tooth scanner confused — misread the jaw shape!",
  herbivore: "Neck measurement glitched — wrong body type!",
  flying: "Wing scanner lagged — missed the wingspan!",
  marine: "Flipper sensor confused — wrong habitat!",
  armored: "Plate scanner glitched — missed the armor!",
};

export type TestRound = {
  emoji: string; label: string; correct: string; category: string;
  aiChoice: string; confidence: number; features: string[]; reason?: string;
};

export function generateTestRounds(training: TrainingData): TestRound[] {
  const scenarios = [
    { emoji: "🦖", label: "Sharp teeth fossil found!", correct: "carnivore", category: "carnivore" },
    { emoji: "🦕", label: "Long neck bones spotted!", correct: "herbivore", category: "herbivore" },
    { emoji: "🦅", label: "Thin hollow bones found!", correct: "flying", category: "flying" },
    { emoji: "🐋", label: "Flipper fossil in rock!", correct: "marine", category: "marine" },
    { emoji: "🛡️", label: "Bony plates uncovered!", correct: "armored", category: "armored" },
    { emoji: "🦖", label: "Curved claws in the dirt!", correct: "carnivore", category: "carnivore" },
    { emoji: "🦕", label: "Flat grinding teeth!", correct: "herbivore", category: "herbivore" },
    { emoji: "🛡️", label: "Club-shaped tail bone!", correct: "armored", category: "armored" },
  ].sort(() => Math.random() - 0.5);

  return scenarios.map((s) => {
    const conf = getConfidence(training, s.category);
    const correct = Math.random() < conf / 100;
    const cats = Object.keys(CAT_LABELS);
    const aiChoice = correct ? s.correct : cats.filter((c) => c !== s.correct)[Math.floor(Math.random() * (cats.length - 1))];
    return { ...s, aiChoice, confidence: conf, features: AI_FEATURES[s.category] || [], reason: correct ? undefined : CONFUSIONS[s.category] };
  });
}

export const RESCUE_EVENTS = [
  { emoji: "🦴", label: "Fossil sticking out!", correct: "dig", delay: 2000 },
  { emoji: "🪨", label: "Just a plain rock", correct: "skip", delay: 800 },
  { emoji: "🦷", label: "Giant tooth spotted!", correct: "dig", delay: 1800 },
  { emoji: "🪨", label: "Gravel and sand", correct: "skip", delay: 600 },
  { emoji: "🦴", label: "Rib bone visible!", correct: "dig", delay: 2200 },
  { emoji: "🪨", label: "Smooth river stone", correct: "skip", delay: 500 },
  { emoji: "🦴", label: "Claw fossil peeking out!", correct: "dig", delay: 1600 },
  { emoji: "🪨", label: "Nothing here", correct: "skip", delay: 700 },
];
