import { useState } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { usePlayerStats, usePlayerGames } from "@/hooks/useGames";
import { CreatePlayerDialog } from "@/components/CreatePlayerDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function PlayersPage() {
  const { data: players, isLoading } = usePlayers();
  const { data: stats } = usePlayerStats();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const selectedPlayer = players?.find((p) => p.id === selectedPlayerId);
  const playerStat = stats?.find((s) => s.player_id === selectedPlayerId);

  if (selectedPlayerId && selectedPlayer) {
    return (
      <PlayerProfile
        player={selectedPlayer}
        stats={playerStat}
        onBack={() => setSelectedPlayerId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-mono">Gracze</h1>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground font-mono text-center py-8">Ładowanie...</div>
        ) : !players?.length ? (
          <div className="glass-card p-6 text-center space-y-3">
            <p className="text-muted-foreground">Brak graczy</p>
            <CreatePlayerDialog />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {players.map((player) => {
                const stat = stats?.find((s) => s.player_id === player.id);
                const totalGames = (stat?.wins || 0) + (stat?.losses || 0);
                return (
                  <button
                    key={player.id}
                    onClick={() => setSelectedPlayerId(player.id)}
                    className="glass-card w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-mono font-bold text-lg">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {totalGames} {totalGames === 1 ? "gra" : "gier"} • {stat?.wins || 0}W / {stat?.losses || 0}L
                      </p>
                    </div>
                    <div className="text-right">
                      {totalGames > 0 && (
                        <span className="text-primary font-mono font-bold">
                          {Math.round(((stat?.wins || 0) / totalGames) * 100)}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <CreatePlayerDialog
              trigger={
                <Button variant="outline" size="sm" className="w-full border-primary/30 text-primary">
                  + Dodaj gracza
                </Button>
              }
            />
          </>
        )}
      </div>
    </div>
  );
}

function PlayerProfile({
  player,
  stats,
  onBack,
}: {
  player: { id: string; name: string };
  stats?: { wins: number; losses: number } | null;
  onBack: () => void;
}) {
  const { data: games, isLoading } = usePlayerGames(player.id);
  const totalGames = (stats?.wins || 0) + (stats?.losses || 0);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-4">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Wróć
        </button>

        <div className="glass-card p-6 text-center space-y-2">
          <h2 className="text-3xl font-extrabold font-mono">{player.name}</h2>
          <div className="flex justify-center gap-6 pt-2">
            <div>
              <p className="text-2xl font-bold font-mono text-primary">{stats?.wins || 0}</p>
              <p className="text-xs text-muted-foreground">Wygrane</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-destructive">{stats?.losses || 0}</p>
              <p className="text-xs text-muted-foreground">Przegrane</p>
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{totalGames}</p>
              <p className="text-xs text-muted-foreground">Łącznie</p>
            </div>
          </div>
        </div>

        <h3 className="font-mono font-bold text-sm text-muted-foreground uppercase">Historia gier</h3>

        {isLoading ? (
          <p className="text-muted-foreground text-center">Ładowanie...</p>
        ) : !games?.length ? (
          <p className="text-muted-foreground text-center text-sm">Brak rozegranych gier</p>
        ) : (
          <div className="space-y-2">
            {games.map((game) => {
              const isWinner = game.winner_id === player.id;
              const opponent =
                game.player1_id === player.id
                  ? game.player2?.name || "Solo"
                  : game.player1?.name || "—";
              return (
                <div key={game.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-mono">
                      vs <span className="font-bold">{opponent}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {game.started_at && format(new Date(game.started_at), "dd MMM yyyy, HH:mm", { locale: pl })}
                      {" • "}{game.mode}{game.double_out ? " • DO" : ""}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold text-sm px-2 py-1 rounded ${
                      isWinner ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {isWinner ? "W" : "L"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
