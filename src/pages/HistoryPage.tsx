import { useGames } from "@/hooks/useGames";
import { History } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function HistoryPage() {
  const { data: games, isLoading } = useGames();
  const finishedGames = games?.filter((g) => g.finished_at);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <History className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold font-mono">Historia gier</h1>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground font-mono text-center py-8">Ładowanie...</div>
        ) : !finishedGames?.length ? (
          <div className="glass-card p-6 text-center">
            <p className="text-muted-foreground">Brak zakończonych gier</p>
          </div>
        ) : (
          <div className="space-y-2">
            {finishedGames.map((game) => (
              <div key={game.id} className="glass-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold ${
                        game.winner_id === game.player1_id ? "text-primary" : ""
                      }`}
                    >
                      {game.player1?.name}
                    </span>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <span
                      className={`font-mono font-bold ${
                        game.winner_id === game.player2_id ? "text-primary" : ""
                      }`}
                    >
                      {game.player2?.name || "Solo"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {game.started_at && format(new Date(game.started_at), "dd MMM yyyy, HH:mm", { locale: pl })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="bg-secondary px-2 py-0.5 rounded font-mono">{game.mode}</span>
                    {game.double_out && (
                      <span className="bg-dart-blue/20 text-dart-blue px-2 py-0.5 rounded font-mono">DO</span>
                    )}
                  </div>
                </div>
                {game.winner_id && (
                  <p className="text-xs">
                    🏆 <span className="font-mono font-bold text-dart-gold">
                      {game.winner_id === game.player1_id ? game.player1?.name : game.player2?.name}
                    </span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
