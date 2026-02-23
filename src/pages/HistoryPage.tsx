import { useGames } from "@/hooks/useGames";
import { History } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function HistoryPage() {
  const { data: games, isLoading } = useGames();
  const finishedGames = games?.filter((g) => g.finished_at);

  return (
    <div className="page-container">
      <div className="page-content space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold font-mono">Historia gier</h1>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground font-mono text-center py-8 text-sm">Ładowanie...</div>
        ) : !finishedGames?.length ? (
          <div className="glass-card p-5 text-center">
            <p className="text-muted-foreground text-sm">Brak zakończonych gier</p>
          </div>
        ) : (
          <div className="space-y-2">
            {finishedGames.map((game) => (
              <div key={game.id} className="glass-card p-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`font-mono font-bold text-sm ${
                      game.winner_id === game.player1_id ? "text-primary" : ""
                    }`}
                  >
                    {game.player1?.name}
                  </span>
                  <span className="text-muted-foreground text-xs">vs</span>
                  <span
                    className={`font-mono font-bold text-sm ${
                      game.winner_id === game.player2_id ? "text-primary" : ""
                    }`}
                  >
                    {game.player2?.name || "Solo"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>
                    {game.started_at && format(new Date(game.started_at), "dd MMM yyyy, HH:mm", { locale: pl })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-secondary px-1.5 py-0.5 rounded font-mono">{game.mode}</span>
                    {game.double_out && (
                      <span className="bg-dart-blue/20 text-dart-blue px-1.5 py-0.5 rounded font-mono">DO</span>
                    )}
                  </div>
                </div>
                {game.winner_id && (
                  <p className="text-[10px]">
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
