import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DartCalculator, type DartThrow } from "@/components/DartCalculator";
import { useSaveTurn, useFinishGame } from "@/hooks/useGames";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Home } from "lucide-react";

type InMode = "straight_in" | "double_in" | "master_in";
type OutMode = "straight_out" | "double_out" | "master_out";
type LegSetMode = "best_of" | "first_to";

interface GameState {
  gameId: string;
  player1Id: string;
  player2Id: string | null;
  player1Name: string;
  player2Name: string | null;
  mode: string;
  inMode: InMode;
  outMode: OutMode;
  legsTarget: number;
  setsTarget: number;
  legsMode: LegSetMode;
  setsMode: LegSetMode;
}

function getWinTarget(target: number, mode: LegSetMode): number {
  return mode === "best_of" ? Math.ceil(target / 2) : target;
}

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as GameState | null;
  const saveTurn = useSaveTurn();
  const finishGame = useFinishGame();

  const playerIds = state ? [state.player1Id, ...(state.player2Id ? [state.player2Id] : [])] : [];
  const playerNames: Record<string, string> = state
    ? {
        [state.player1Id]: state.player1Name,
        ...(state.player2Id && state.player2Name ? { [state.player2Id]: state.player2Name } : {}),
      }
    : {};

  const legsToWin = state ? getWinTarget(state.legsTarget, state.legsMode) : 1;
  const setsToWin = state ? getWinTarget(state.setsTarget, state.setsMode) : 1;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    if (!state) return {};
    const s: Record<string, number> = { [state.player1Id]: 501 };
    if (state.player2Id) s[state.player2Id] = 501;
    return s;
  });

  const [legsWon, setLegsWon] = useState<Record<string, number>>(() =>
    Object.fromEntries(playerIds.map((id) => [id, 0]))
  );
  const [setsWon, setSetsWon] = useState<Record<string, number>>(() =>
    Object.fromEntries(playerIds.map((id) => [id, 0]))
  );

  // Track if player has "opened" (relevant for double_in / master_in)
  const [hasOpened, setHasOpened] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(playerIds.map((id) => [id, state?.inMode === "straight_in"]))
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [turnCount, setTurnCount] = useState(1);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);

  const activePlayerId = playerIds[activePlayerIndex] || "";

  const resetLeg = useCallback(() => {
    if (!state) return;
    const s: Record<string, number> = { [state.player1Id]: 501 };
    if (state.player2Id) s[state.player2Id] = 501;
    setScores(s);
    setActivePlayerIndex(0);
    setTurnCount(1);
    setHasOpened(Object.fromEntries(playerIds.map((id) => [id, state.inMode === "straight_in"])));
  }, [state, playerIds]);

  const handleTurnComplete = useCallback(
    async (throws: DartThrow[]) => {
      if (!state) return;

      const currentScore = scores[activePlayerId];
      let effectiveThrows = throws;

      // Handle "in" mode: filter out throws before opening
      if (!hasOpened[activePlayerId]) {
        const openIndex = throws.findIndex((t) => {
          if (state.inMode === "double_in") return t.modifier === "double";
          if (state.inMode === "master_in") return t.modifier === "double" || t.modifier === "triple";
          return true;
        });
        if (openIndex === -1) {
          // No valid opening throw — entire turn scores 0
          await saveTurn.mutateAsync({
            game_id: state.gameId,
            player_id: activePlayerId,
            throw1: throws[0]?.value ?? null,
            throw2: throws[1]?.value ?? null,
            throw3: throws[2]?.value ?? null,
            turn_score: 0,
            score_after: currentScore,
          });
          const nextIndex = (activePlayerIndex + 1) % playerIds.length;
          setActivePlayerIndex(nextIndex);
          if (nextIndex === 0) setTurnCount((c) => c + 1);
          return;
        }
        // Player opened — only count throws from openIndex onward
        effectiveThrows = throws.slice(openIndex);
        setHasOpened((prev) => ({ ...prev, [activePlayerId]: true }));
      }

      const turnScore = effectiveThrows.reduce((s, t) => s + t.value, 0);
      const newScore = currentScore - turnScore;

      // Check bust
      let isBust = false;
      if (newScore < 0) isBust = true;
      if (newScore === 1 && (state.outMode === "double_out" || state.outMode === "master_out")) isBust = true;
      if (newScore === 0) {
        const lastThrow = effectiveThrows[effectiveThrows.length - 1];
        if (state.outMode === "double_out" && lastThrow?.modifier !== "double") isBust = true;
        if (state.outMode === "master_out" && lastThrow?.modifier !== "double" && lastThrow?.modifier !== "triple") isBust = true;
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
          // Player won this leg
          const newLegs = { ...legsWon, [activePlayerId]: legsWon[activePlayerId] + 1 };
          setLegsWon(newLegs);

          if (newLegs[activePlayerId] >= legsToWin) {
            // Player won this set
            const newSets = { ...setsWon, [activePlayerId]: setsWon[activePlayerId] + 1 };
            setSetsWon(newSets);
            // Reset legs for all players
            setLegsWon(Object.fromEntries(playerIds.map((id) => [id, 0])));

            if (newSets[activePlayerId] >= setsToWin) {
              // Match won!
              const loserId = playerIds.find((id) => id !== activePlayerId);
              await finishGame.mutateAsync({
                gameId: state.gameId,
                winnerId: activePlayerId,
                loserId,
              });
              setMatchWinner(activePlayerId);
              return;
            }
          }
          // Start new leg
          resetLeg();
          return;
        }
      }

      const nextIndex = (activePlayerIndex + 1) % playerIds.length;
      setActivePlayerIndex(nextIndex);
      if (nextIndex === 0) setTurnCount((c) => c + 1);
    },
    [scores, activePlayerId, activePlayerIndex, playerIds, state, saveTurn, finishGame, hasOpened, legsWon, setsWon, legsToWin, setsToWin, resetLeg]
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

  if (matchWinner) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="glass-card p-6 sm:p-8 text-center space-y-5 max-w-sm w-full animate-slide-up">
          <Trophy className="w-14 h-14 text-dart-gold mx-auto animate-pulse-glow rounded-full p-2" />
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase">Zwycięzca</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-mono text-primary mt-1">
              {playerNames[matchWinner]}
            </h2>
          </div>
          <div className="flex justify-center gap-4 text-sm font-mono text-muted-foreground">
            {setsToWin > 1 && <span>Sets: {setsWon[matchWinner]}</span>}
            {legsToWin > 1 && <span>Legs: {legsWon[matchWinner]}</span>}
          </div>
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

  const showSets = setsToWin > 1 || state.setsTarget > 1;
  const showLegs = legsToWin > 1 || state.legsTarget > 1;

  return (
    <div className="flex flex-col min-h-[100dvh] pb-[var(--bottom-nav-height)]">
      {/* Scoreboard */}
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
            {(showSets || showLegs) && (
              <div className="flex justify-center gap-2 mt-0.5">
                {showSets && (
                  <span className="text-[9px] font-mono text-muted-foreground">S:{setsWon[pid]}</span>
                )}
                {showLegs && (
                  <span className="text-[9px] font-mono text-muted-foreground">L:{legsWon[pid]}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Turn counter + mode info */}
      <div className="text-center py-1.5 border-b border-border shrink-0 flex justify-center gap-3">
        <span className="text-[10px] text-muted-foreground font-mono">Tura {turnCount}</span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {state.inMode.replace("_", " ")} / {state.outMode.replace("_", " ")}
        </span>
      </div>

      {/* Calculator */}
      <div className="flex-1 flex flex-col justify-end">
        <DartCalculator
          onTurnComplete={handleTurnComplete}
          currentScore={scores[activePlayerId]}
          doubleOut={state.outMode === "double_out"}
          playerName={playerNames[activePlayerId]}
        />
      </div>
    </div>
  );
}
