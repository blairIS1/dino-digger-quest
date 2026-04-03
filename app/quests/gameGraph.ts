"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { speak, stopSpeaking } from "./speak";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Actions that run sequentially when entering a game node. */
export type Action =
  | { type: "speak"; key: string }
  | { type: "sfx"; fn: () => void }
  | { type: "wait"; ms: number }
  | { type: "unlock" };

/**
 * A node in the game graph.
 *
 * - "screen" nodes render nothing themselves — the host page.tsx shows UI
 *   based on nodeId (start screen, menu, completion screen, etc.)
 * - "phase" nodes delegate rendering to a React component (StudyOcean,
 *   TestKnowledge, etc.) that calls send() when done.
 *
 * `on` maps event names → next node ids.
 * Events can carry a payload (e.g. training data) via send().
 */
export type GameNode = {
  id: string;
  enter?: Action[];
  on: Record<string, string>;
};

export type GameGraphState = {
  nodeId: string;
  inputEnabled: boolean;
  /** Accumulated payload from phase completions — keyed by event name. */
  data: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameGraph(nodes: GameNode[], initial: string) {
  const [state, setState] = useState<GameGraphState>({
    nodeId: initial,
    inputEnabled: true,
    data: {},
  });
  const cancelRef = useRef<() => void>(() => {});
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Run enter actions for current node
  const runEnter = useCallback((node: GameNode, nodeId: string) => {
    if (!node.enter?.length) {
      setState((s) => ({ ...s, nodeId, inputEnabled: true }));
      return;
    }

    let cancelled = false;
    stopSpeaking();
    cancelRef.current();
    cancelRef.current = () => { cancelled = true; };

    setState((s) => ({ ...s, nodeId, inputEnabled: false }));

    (async () => {
      for (const action of node.enter!) {
        if (cancelled) return;
        switch (action.type) {
          case "speak":
            await speak(action.key);
            break;
          case "sfx":
            action.fn();
            break;
          case "wait":
            await new Promise<void>((r) => {
              const t = setTimeout(r, action.ms);
              const check = () => { if (cancelled) { clearTimeout(t); r(); } };
              const id = setInterval(check, 50);
              setTimeout(() => clearInterval(id), action.ms + 100);
            });
            break;
          case "unlock":
            if (!cancelled) setState((s) => ({ ...s, inputEnabled: true }));
            break;
        }
      }
    })();
  }, []);

  // When nodeId changes, run enter actions
  useEffect(() => {
    const node = nodesRef.current.find((n) => n.id === state.nodeId);
    if (node) runEnter(node, node.id);
    return () => { cancelRef.current(); stopSpeaking(); };
  }, [state.nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Transition to the next node.
   * @param event - event name matching a key in current node's `on` map
   * @param payload - optional data to stash (e.g. training results)
   */
  const send = useCallback((event: string, payload?: unknown) => {
    const node = nodesRef.current.find((n) => n.id === state.nodeId);
    if (!node) return;
    const next = node.on[event];
    if (!next) return;
    stopSpeaking();
    cancelRef.current();
    setState((prev) => ({
      nodeId: next,
      inputEnabled: false,
      data: payload !== undefined ? { ...prev.data, [event]: payload } : prev.data,
    }));
  }, [state.nodeId]);

  return { state, send };
}
