import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayers } from "@/hooks/usePlayers";
import { useCreateGame } from "@/hooks/useGames";
import { CreatePlayerDialog } from "@/components/CreatePlayerDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Target, UserPlus, Play } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const { data: players, isLoading } = usePlayers();
  const createGame = useCreateGame();
  const navigate = useNavigate();

  const [mode] = useState("501");
  const [doubleOut, setDoubleOut] = useState(false);
  const [playerCount, setPlayerCount] = useState<1 | 2>(2);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  const hasPlayers = players && players.length > 0;

  const handleStart = async () => {
    if (!player1Id) {
      toast.error("Wybierz Gracza 1");
      return;
    }
    if (playerCount === 2 && !player2Id) {
      toast.error("Wybierz Gracza 2");
      return;
    }

    try {
      const game = await createGame.mutateAsync({
        player1_id: player1Id,
        player2_id: playerCount === 2 ? player2Id : undefined,
        mode,
        double_out: doubleOut,
      });
      navigate("/game", {
        state: {
          gameId: game.id,
          player1Id,
          player2Id: playerCount === 2 ? player2Id : null,
          player1Name: players?.find((p) => p.id === player1Id)?.name || "",
          player2Name: playerCount === 2 ? players?.find((p) => p.id === player2Id)?.name || "" : null,
          mode,
          doubleOut,
        },
      });
    } catch {
      toast.error("Nie udało się rozpocząć gry");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <div className="animate-pulse text-muted-foreground font-mono">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content space-y-4">
        {/* Header */}
        <div className="text-center space-y-1 py-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Target className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
            Dart<span className="text-primary">Score</span>
          </h1>
          <p className="text-muted-foreground text-xs">Śledź wyniki swoich gier w darta</p>
        </div>

        {!hasPlayers ? (
          <div className="glass-card p-6 text-center space-y-4 animate-slide-up">
            <p className="text-muted-foreground text-sm">Brak graczy w bazie. Dodaj pierwszego gracza, aby rozpocząć!</p>
            <CreatePlayerDialog
              trigger={
                <Button size="lg" className="gap-2 text-base h-12 px-6 font-mono font-bold w-full">
                  <UserPlus className="w-5 h-5" />
                  Stwórz nowego gracza
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {/* Mode + Double out in a row */}
            <div className="flex gap-3">
              <div className="glass-card p-3 flex-1">
                <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Tryb</Label>
                <div className="bg-primary/10 text-primary font-mono font-bold text-center py-2 rounded-lg border border-primary/20 text-lg mt-1">
                  501
                </div>
              </div>
              <div className="glass-card p-3 flex-1 flex flex-col justify-between">
                <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Double out</Label>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-mono">{doubleOut ? "TAK" : "NIE"}</span>
                  <Switch checked={doubleOut} onCheckedChange={setDoubleOut} />
                </div>
              </div>
            </div>

            {/* Player count */}
            <div className="glass-card p-3 space-y-2">
              <Label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Liczba graczy</Label>
              <div className="flex gap-2">
                {([1, 2] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setPlayerCount(count);
                      if (count === 1) setPlayer2Id("");
                    }}
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
                    <SelectItem key={p.id} value={p.id} disabled={p.id === player2Id}>
                      {p.name}
                    </SelectItem>
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
                      {players
                        ?.filter((p) => p.id !== player1Id)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>

            {/* Add player link */}
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

            {/* Start button */}
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
        )}
      </div>
    </div>
  );
}
