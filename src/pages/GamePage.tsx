import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DartCalculator, type DartThrow } from "@/components/DartCalculator";
import { useSaveTurn, useFinishGame } from "@/hooks/useGames";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home } from "lucide-react";

interface GameState {
  gameId: string;
  player1Id: string;
  player2Id: string | null;
  player1Name: string;
  player2Name: string | null;
  mode: string;
  doubleOut: boolean;
}

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as GameState | null;
  const saveTurn = useSaveTurn();
  const finishGame = useFinishGame();

  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (!state) return {};
    const s: Record<string, number> = { [state.player1Id]: 501 };
    if (state.player2Id) s[state.player2Id] = 501;
    return s;
  });

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [turnCount, setTurnCount] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);

  const playerIds = state ? [state.player1Id, ...(state.player2Id ? [state.player2Id] : [])] : [];
  const playerNames: Record<string, string> = state
    ? {
        [state.player1Id]: state.player1Name,
        ...(state.player2Id && state.player2Name ? { [state.player2Id]: state.player2Name } : {}),
      }
    : {};

  const activePlayerId = playerIds[activePlayerIndex] || "";

  const handleTurnComplete = useCallback(
    async (throws: DartThrow[]) => {
      if (!state) return;
      const turnScore = throws.reduce((s, t) => s + t.value, 0);
      const currentScore = scores[activePlayerId];
      const newScore = currentScore - turnScore;

      let isBust = false;
      if (newScore < 0) isBust = true;
      if (state.doubleOut && newScore === 1) isBust = true;
      if (newScore === 0 && state.doubleOut) {
        const lastThrow = throws[throws.length - 1];
        if (lastThrow.modifier !== "double") isBust = true;
      }

      if (isBust) {
        await saveTurn.mutateAsync({
          game_id: state.gameId,
          player_id: activePlayerId,
          throw1: throws[0]?.value ?? null,
          throw2: throws[1]?.value ?? null,
          throw3: throws[2]?.value ?? null,
          turn_score: 0,
          score_after: currentScore,
        });
      } else {
        await saveTurn.mutateAsync({
          game_id: state.gameId,
          player_id: activePlayerId,
          throw1: throws[0]?.value ?? null,
          throw2: throws[1]?.value ?? null,
          throw3: throws[2]?.value ?? null,
          turn_score: turnScore,
          score_after: newScore,
        });

        setScores((prev) => ({ ...prev, [activePlayerId]: newScore }));

        if (newScore === 0) {
          const loserId = playerIds.find((id) => id !== activePlayerId);
          await finishGame.mutateAsync({
            gameId: state.gameId,
            winnerId: activePlayerId,
            loserId,
          });
          setWinner(activePlayerId);
          return;
        }
      }

      const nextIndex = (activePlayerIndex + 1) % playerIds.length;
      setActivePlayerIndex(nextIndex);
      if (nextIndex === 0) setTurnCount((c) => c + 1);
    },
    [scores, activePlayerId, activePlayerIndex, playerIds, state, saveTurn, finishGame]
  );

  if (!state) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Brak aktywnej gry.</p>
          <Button onClick={() => navigate("/")} variant="outline" className="gap-2">
            <Home className="w-4 h-4" /> Wróć do menu
          </Button>
        </div>
      </div>
    );
  }

  if (winner) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="glass-card p-6 sm:p-8 text-center space-y-5 max-w-sm w-full animate-slide-up">
          <Trophy className="w-14 h-14 text-dart-gold mx-auto animate-pulse-glow rounded-full p-2" />
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">Zwycięzca</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-primary mt-1">
              {playerNames[winner]}
            </h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Gra zakończona w {turnCount} {turnCount === 1 ? "turze" : "turach"}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/", { replace: true })} variant="outline" className="flex-1 gap-2 h-11 text-sm">
              <RotateCcw className="w-4 h-4" /> Ponownie
            </Button>
            <Button onClick={() => navigate("/")} className="flex-1 gap-2 h-11 text-sm">
              <Home className="w-4 h-4" /> Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] pb-[var(--bottom-nav-height)]">
      {/* Scoreboard - compact */}
      <div className="flex border-b border-border shrink-0">
        {playerIds.map((pid, idx) => (
          <div
            key={pid}
            className={`flex-1 py-3 px-2 text-center transition-all ${
              idx === activePlayerIndex ? "player-active" : "player-inactive"
            } ${idx > 0 ? "border-l border-border" : ""}`}
          >
            <p className="text-[10px] text-muted-foreground font-mono uppercase truncate">
              {playerNames[pid]}
            </p>
            <p className="dart-score mt-0.5">{scores[pid]}</p>
          </div>
        ))}
      </div>

      {/* Turn counter */}
      <div className="text-center py-1.5 border-b border-border shrink-0">
        <span className="text-[10px] text-muted-foreground font-mono">Tura {turnCount}</span>
      </div>

      {/* Calculator - takes remaining space */}
      <div className="flex-1 flex flex-col justify-end">
        <DartCalculator
          onTurnComplete={handleTurnComplete}
          currentScore={scores[activePlayerId]}
          doubleOut={state.doubleOut}
          playerName={playerNames[activePlayerId]}
        />
      </div>
    </div>
  );
}
