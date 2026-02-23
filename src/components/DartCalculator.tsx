import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";

type Modifier = "single" | "double" | "triple";

interface DartThrow {
  base: number;
  modifier: Modifier;
  value: number;
  label: string;
}

interface Props {
  onTurnComplete: (throws: DartThrow[]) => void;
  currentScore: number;
  doubleOut: boolean;
  playerName: string;
}

const numbers = Array.from({ length: 20 }, (_, i) => i + 1);

export function DartCalculator({ onTurnComplete, currentScore, doubleOut, playerName }: Props) {
  const [modifier, setModifier] = useState<Modifier>("single");
  const [throws, setThrows] = useState<DartThrow[]>([]);

  const getMultiplier = (mod: Modifier) => mod === "double" ? 2 : mod === "triple" ? 3 : 1;

  const addThrow = useCallback((base: number, mod: Modifier, label: string) => {
    if (throws.length >= 3) return;
    const value = base * getMultiplier(mod);
    const newThrow: DartThrow = { base, modifier: mod, value, label };
    const updated = [...throws, newThrow];
    setThrows(updated);
    setModifier("single");

    if (updated.length === 3) {
      setTimeout(() => {
        onTurnComplete(updated);
        setThrows([]);
      }, 400);
    }
  }, [throws, onTurnComplete]);

  const handleNumber = (n: number) => {
    const mod = modifier;
    const prefix = mod === "double" ? "D" : mod === "triple" ? "T" : "";
    addThrow(n, mod, `${prefix}${n}`);
  };

  const handleBull = (value: 25 | 50) => {
    const label = value === 50 ? "Bull" : "25";
    addThrow(value, "single", label);
  };

  const handleMiss = () => {
    addThrow(0, "single", "Miss");
  };

  const undoLast = () => {
    setThrows((prev) => prev.slice(0, -1));
  };

  const turnScore = throws.reduce((sum, t) => sum + t.value, 0);
  const remainingAfter = currentScore - turnScore;

  const submitEarly = () => {
    if (throws.length > 0) {
      onTurnComplete(throws);
      setThrows([]);
      setModifier("single");
    }
  };

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3">
      {/* Current throws summary */}
      <div className="glass-card p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono truncate">{playerName}</span>
          <span className="font-mono text-sm font-bold">
            {currentScore} → <span className={remainingAfter < 0 ? "text-destructive" : "text-primary"}>{remainingAfter}</span>
          </span>
        </div>
        <div className="flex gap-1.5 items-center">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex-1 text-center py-1 rounded-md font-mono text-base font-bold ${
                throws[i]
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : i === throws.length
                  ? "bg-secondary border-2 border-dashed border-muted-foreground/30"
                  : "bg-secondary/50 border border-border"
              }`}
            >
              {throws[i]?.label || (i === throws.length ? "?" : "—")}
            </div>
          ))}
          <div className="font-mono text-lg font-extrabold min-w-[2.5rem] text-center">
            = {turnScore}
          </div>
        </div>
      </div>

      {/* Modifier toggles */}
      <div className="flex gap-1.5">
        {(["single", "double", "triple"] as Modifier[]).map((mod) => (
          <button
            key={mod}
            onClick={() => setModifier(mod)}
            className={`dart-btn-modifier flex-1 text-xs font-bold uppercase ${
              modifier === mod
                ? mod === "double"
                  ? "bg-dart-blue/20 text-dart-blue border-dart-blue"
                  : mod === "triple"
                  ? "bg-dart-red/20 text-dart-red border-dart-red"
                  : "bg-primary/20 text-primary border-primary"
                : "bg-secondary text-muted-foreground border-border"
            }`}
            disabled={throws.length >= 3}
          >
            {mod === "single" ? "S" : mod === "double" ? "D×2" : "T×3"}
          </button>
        ))}
      </div>

      {/* Number grid - 5 columns, compact */}
      <div className="grid grid-cols-5 gap-1">
        {numbers.map((n) => (
          <button
            key={n}
            onClick={() => handleNumber(n)}
            className="dart-btn-number text-sm"
            disabled={throws.length >= 3}
          >
            {modifier === "double" ? `D${n}` : modifier === "triple" ? `T${n}` : n}
          </button>
        ))}
      </div>

      {/* Special buttons row */}
      <div className="grid grid-cols-4 gap-1">
        <button onClick={() => handleBull(25)} className="dart-btn-bull text-sm" disabled={throws.length >= 3}>
          Outer (25)
        </button>
        <button onClick={() => handleBull(50)} className="dart-btn-bull text-sm" disabled={throws.length >= 3}>
          Bull (50)
        </button>
        <button onClick={handleMiss} className="dart-btn-miss text-sm" disabled={throws.length >= 3}>
          Miss
        </button>
        <button onClick={undoLast} className="dart-btn bg-secondary text-muted-foreground border border-border hover:bg-secondary/80" disabled={throws.length === 0}>
          <Undo2 className="w-4 h-4 mx-auto" />
        </button>
      </div>

      {/* Submit early button */}
      {throws.length > 0 && throws.length < 3 && (
        <Button onClick={submitEarly} className="dart-btn-submit h-10">
          Zatwierdź ({throws.length}/3)
        </Button>
      )}
    </div>
  );
}

export type { DartThrow };
