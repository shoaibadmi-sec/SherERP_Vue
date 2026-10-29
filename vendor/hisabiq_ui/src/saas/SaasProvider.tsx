import "./fonts.css";
import React, { createContext, useContext, useRef, useState } from "react";
import { toast } from "sonner";
import type { Actor, SaasCommand, SaasState } from "./types";
import { applyCommand, readState, writeState } from "./state";
import { seed } from "./seed";
type Context = {
  state: SaasState;
  actor: Actor;
  setActor: (actor: Actor) => void;
  dispatch: (c: SaasCommand) => boolean;
  resetDemo: () => void;
  persistenceError: string;
};
const C = createContext<Context | null>(null);
export function SaasProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(() => {
    try {
      return readState(localStorage);
    } catch {
      return {
        state: seed(),
        error: "Browser storage is blocked. Demo changes remain in memory.",
      };
    }
  });
  const [state, setState] = useState(initial.state);
  const ref = useRef(state);
  const [actor, setActorState] = useState<Actor>({
    kind: "staff",
    id: "admin",
  });
  const [persistenceError, setError] = useState(initial.error);
  const save = (next: SaasState) => {
    ref.current = next;
    setState(() => next);
    try {
      setError(writeState(localStorage, next));
    } catch {
      setError("Changes are in memory only. Browser storage is blocked.");
    }
  };
  const dispatch = (c: SaasCommand) => {
    const result = applyCommand(
      ref.current,
      actor,
      c,
      new Date().toISOString(),
    );
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    save(result.state);
    toast.success("Saved in demo");
    return true;
  };
  return (
    <C.Provider
      value={{
        state,
        actor,
        setActor: setActorState,
        dispatch,
        persistenceError,
        resetDemo: () => {
          save(seed());
          setActorState({ kind: "staff", id: "admin" });
          toast.success("Demo reset");
        },
      }}
    >
      {children}
    </C.Provider>
  );
}
export function useSaas() {
  const c = useContext(C);
  if (!c) throw Error("SaasProvider missing");
  return c;
}
export const command = (
  type: string,
  target: string | undefined,
  data: Record<string, unknown> = {},
  expectedVersion?: number,
): SaasCommand => ({
  id: crypto.randomUUID(),
  type,
  target,
  data,
  expectedVersion,
});
