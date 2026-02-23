import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayers } from "@/hooks/usePlayers";
import { useCreateGame } from "@/hooks/useGames";
import { CreatePlayerDialog } from "@/components/CreatePlayerDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus, Play, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

type InMode = "straight_in" | "double_in" | "master_in";
type OutMode = "straight_out" | "double_out" | "master_out";
type LegSetMode = "best_of" | "first_to";

const IN_MODES: { value: InMode; label: string }[] = [
  { value: "straight_in", label: "Straight In" },
  { value: "double_in", label: "Double In" },
  { value: "master_in", label: "Master In" },
];

const OUT_MODES: { value: OutMode; label: string }[] = [
  { value: "straight_out", label: "Straight Out" },
  { value: "double_out", label: "Double Out" },
  { value: "master_out", label: "Master Out" },
];

export function GameSetupForm() {
  const { data: players } = usePlayers();
  const createGame = useCreateGame();
  const navigate = useNavigate();

  const [inMode, setInMode] = useState<InMode>("straight_in");
  const [outMode, setOutMode] = useState<OutMode>("double_out");
  const [legsTarget, setLegsTarget] = useState(1);
  const [setsTarget, setSetsTarget] = useState(1);
  const [legsMode, setLegsMode] = useState<LegSetMode>("first_to");
  const [setsMode, setSetsMode] = useState<LegSetMode>("first_to");
  const [playerCount, setPlayerCount] = useState<1 | 2>(2);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  const handleStart = async () => {
    if (!player1Id) { toast.error("Wybierz Gracza 1"); return; }
    if (playerCount === 2 && !player2Id) { toast.error("Wybierz Gracza 2"); return; }

    try {
      const game = await createGame.mutateAsync({
        player1_id: player1Id,
        player2_id: playerCount === 2 ? player2Id : undefined,
        mode: "501",
        double_out: outMode === "double_out",
        in_mode: inMode,
        out_mode: outMode,
        legs_target: legsTarget,
        sets_target: setsTarget,
        legs_mode: legsMode,
        sets_mode: setsMode,
      });
      navigate("/game", {
        state: {
          gameId: game.id,
          player1Id,
          player2Id: playerCount === 2 ? player2Id : null,
          player1Name: players?.find((p) => p.id === player1Id)?.name || "",
          player2Name: playerCount === 2 ? players?.find((p) => p.id === player2Id)?.name || "" : null,
          mode: "501",
          inMode,
          outMode,
          legsTarget,
          setsTarget,
          legsMode,
          setsMode,
        },
      });
    } catch {
      toast.error("Nie udało się rozpocząć gry");
    }
  };

  return (
    <div className="space-y-3 animate-slide-up">
      {/* In/Out mode */}
      <div className="flex gap-3">
        <div className="glass-card p-3 flex-1 space-y-1.5">
          <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">In</Label>
          <div className="flex flex-col gap-1">
            {IN_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setInMode(m.value)}
                className={`py-2 rounded-lg font-mono font-bold text-xs transition-all touch-manipulation ${
                  inMode === m.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-card p-3 flex-1 space-y-1.5">
          <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Out</Label>
          <div className="flex flex-col gap-1">
            {OUT_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => setOutMode(m.value)}
                className={`py-2 rounded-lg font-mono font-bold text-xs transition-all touch-manipulation ${
                  outMode === m.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legs & Sets */}
      <div className="flex gap-3">
        <CounterCard
          label="Legs"
          value={legsTarget}
          onChange={setLegsTarget}
          mode={legsMode}
          onModeChange={setLegsMode}
        />
        <CounterCard
          label="Sets"
          value={setsTarget}
          onChange={setSetsTarget}
          mode={setsMode}
          onModeChange={setSetsMode}
        />
      </div>

      {/* Player count */}
      <div className="glass-card p-3 space-y-2">
        <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Liczba graczy</Label>
        <div className="flex gap-2">
          {([1, 2] as const).map((count) => (
            <button
              key={count}
              onClick={() => { setPlayerCount(count); if (count === 1) setPlayer2Id(""); }}
              className={`flex-1 py-2.5 rounded-lg font-mono font-bold text-sm transition-all touch-manipulation ${
                playerCount === count
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {count} {count === 1 ? "gracz" : "graczy"}
            </button>
          ))}
        </div>
      </div>

      {/* Player selection */}
      <div className="glass-card p-3 space-y-2">
        <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Gracz 1</Label>
        <Select value={player1Id} onValueChange={setPlayer1Id}>
          <SelectTrigger className="h-11 bg-secondary border-border text-sm">
            <SelectValue placeholder="Wybierz gracza" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {players?.map((p) => (
              <SelectItem key={p.id} value={p.id} disabled={p.id === player2Id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {playerCount === 2 && (
          <>
            <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider pt-1 block">Gracz 2</Label>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger className="h-11 bg-secondary border-border text-sm">
                <SelectValue placeholder="Wybierz gracza" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {players?.filter((p) => p.id !== player1Id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Add player */}
      <CreatePlayerDialog
        onCreated={(id) => {
          if (!player1Id) setPlayer1Id(id);
          else if (playerCount === 2 && !player2Id) setPlayer2Id(id);
        }}
        trigger={
          <button className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto touch-manipulation py-1">
            <UserPlus className="w-3.5 h-3.5" />
            Dodaj nowego gracza
          </button>
        }
      />

      {/* Start */}
      <Button
        onClick={handleStart}
        size="lg"
        className="w-full h-12 text-lg font-mono font-bold gap-2"
        disabled={!player1Id || (playerCount === 2 && !player2Id) || createGame.isPending}
      >
        <Play className="w-5 h-5" />
        Rozpocznij grę
      </Button>
    </div>
  );
}

function CounterCard({
  label,
  value,
  onChange,
  mode,
  onModeChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  mode: LegSetMode;
  onModeChange: (m: LegSetMode) => void;
}) {
  return (
    <div className="glass-card p-3 flex-1 space-y-2">
      <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{label}</Label>
      <div className="flex gap-1">
        {(["first_to", "best_of"] as LegSetMode[]).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`flex-1 py-1.5 rounded-md font-mono font-bold text-[10px] transition-all touch-manipulation ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {m === "first_to" ? "First to" : "Best of"}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center touch-manipulation hover:text-foreground transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="font-mono font-extrabold text-xl text-primary min-w-[2rem] text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(15, value + 1))}
          className="w-8 h-8 rounded-lg bg-secondary text-muted-foreground flex items-center justify-center touch-manipulation hover:text-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
