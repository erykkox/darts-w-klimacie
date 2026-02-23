import { usePlayers } from "@/hooks/usePlayers";
import { CreatePlayerDialog } from "@/components/CreatePlayerDialog";
import { GameSetupForm } from "@/components/GameSetupForm";
import { Button } from "@/components/ui/button";
import { Target, UserPlus } from "lucide-react";

export default function Index() {
  const { data: players, isLoading } = usePlayers();
  const hasPlayers = players && players.length > 0;

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
          <GameSetupForm />
        )}
      </div>
    </div>
  );
}
