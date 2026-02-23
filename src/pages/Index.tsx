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
      <div className="flex items-center justify-center min-h-screen pb-20">
        <div className="animate-pulse text-muted-foreground font-mono">Ładowanie...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Target className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold font-mono tracking-tight">
            Dart<span className="text-primary">Score</span>
          </h1>
          <p className="text-muted-foreground text-sm">Śledź wyniki swoich gier w darta</p>
        </div>

        {!hasPlayers ? (
          /* No players - show only create button */
          <div className="glass-card p-8 text-center space-y-4 animate-slide-up">
            <p className="text-muted-foreground">Brak graczy w bazie. Dodaj pierwszego gracza, aby rozpocząć!</p>
            <CreatePlayerDialog
              trigger={
                <Button size="lg" className="gap-2 text-lg h-14 px-8 font-mono font-bold">
                  <UserPlus className="w-6 h-6" />
                  Stwórz nowego gracza
                </Button>
              }
            />
          </div>
        ) : (
          /* Game configuration */
          <div className="space-y-4 animate-slide-up">
            {/* Mode */}
            <div className="glass-card p-4 space-y-3">
              <Label className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Tryb gry</Label>
              <div className="bg-primary/10 text-primary font-mono font-bold text-center py-3 rounded-lg border border-primary/20 text-xl">
                501
              </div>
            </div>

            {/* Double out */}
            <div className="glass-card p-4 flex items-center justify-between">
              <Label className="text-sm font-mono uppercase tracking-wider">Kończenie doublem</Label>
              <Switch checked={doubleOut} onCheckedChange={setDoubleOut} />
            </div>

            {/* Player count */}
            <div className="glass-card p-4 space-y-3">
              <Label className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Liczba graczy</Label>
              <div className="flex gap-2">
                {([1, 2] as const).map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      setPlayerCount(count);
                      if (count === 1) setPlayer2Id("");
                    }}
                    className={`flex-1 py-3 rounded-lg font-mono font-bold transition-all ${
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
            <div className="glass-card p-4 space-y-3">
              <Label className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Gracz 1</Label>
              <Select value={player1Id} onValueChange={setPlayer1Id}>
                <SelectTrigger className="h-12 bg-secondary border-border text-base">
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
                  <Label className="text-sm text-muted-foreground font-mono uppercase tracking-wider pt-2 block">Gracz 2</Label>
                  <Select value={player2Id} onValueChange={setPlayer2Id}>
                    <SelectTrigger className="h-12 bg-secondary border-border text-base">
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
                <button className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
                  <UserPlus className="w-4 h-4" />
                  Dodaj nowego gracza
                </button>
              }
            />

            {/* Start button */}
            <Button
              onClick={handleStart}
              size="lg"
              className="w-full h-14 text-xl font-mono font-bold gap-2"
              disabled={!player1Id || (playerCount === 2 && !player2Id) || createGame.isPending}
            >
              <Play className="w-6 h-6" />
              Rozpocznij grę
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
