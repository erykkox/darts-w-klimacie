import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useGames() {
  return useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*, player1:players!games_player1_id_fkey(name), player2:players!games_player2_id_fkey(name), winner:players!games_winner_id_fkey(name)")
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function usePlayerGames(playerId: string) {
  return useQuery({
    queryKey: ["player-games", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*, player1:players!games_player1_id_fkey(name), player2:players!games_player2_id_fkey(name), winner:players!games_winner_id_fkey(name)")
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .not("finished_at", "is", null)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });
}

export function useCreateGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      player1_id: string;
      player2_id?: string;
      mode: string;
      double_out: boolean;
      in_mode?: string;
      out_mode?: string;
      legs_target?: number;
      sets_target?: number;
      legs_mode?: string;
      sets_mode?: string;
    }) => {
      const { data, error } = await supabase
        .from("games")
        .insert({
          player1_id: params.player1_id,
          player2_id: params.player2_id || null,
          mode: params.mode,
          double_out: params.double_out,
          in_mode: params.in_mode || "straight_in",
          out_mode: params.out_mode || "straight_out",
          legs_target: params.legs_target || 1,
          sets_target: params.sets_target || 1,
          legs_mode: params.legs_mode || "first_to",
          sets_mode: params.sets_mode || "first_to",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}

export function useFinishGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { gameId: string; winnerId: string; loserId?: string }) => {
      const { error: gameError } = await supabase
        .from("games")
        .update({ winner_id: params.winnerId, finished_at: new Date().toISOString() })
        .eq("id", params.gameId);
      if (gameError) throw gameError;

      // Update winner stats
      const { data: winnerStats } = await supabase
        .from("player_stats")
        .select("wins")
        .eq("player_id", params.winnerId)
        .single();
      
      await supabase
        .from("player_stats")
        .update({ wins: (winnerStats?.wins || 0) + 1 })
        .eq("player_id", params.winnerId);

      // Update loser stats if 2-player game
      if (params.loserId) {
        const { data: loserStats } = await supabase
          .from("player_stats")
          .select("losses")
          .eq("player_id", params.loserId)
          .single();
        
        await supabase
          .from("player_stats")
          .update({ losses: (loserStats?.losses || 0) + 1 })
          .eq("player_id", params.loserId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      queryClient.invalidateQueries({ queryKey: ["player-stats"] });
    },
  });
}

export function useSaveTurn() {
  return useMutation({
    mutationFn: async (params: {
      game_id: string;
      player_id: string;
      throw1: number | null;
      throw2: number | null;
      throw3: number | null;
      turn_score: number;
      score_after: number;
    }) => {
      const { error } = await supabase.from("game_turns").insert(params);
      if (error) throw error;
    },
  });
}

export function usePlayerStats() {
  return useQuery({
    queryKey: ["player-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats")
        .select("*, player:players(name)");
      if (error) throw error;
      return data;
    },
  });
}

export function usePlayerDetailedStats(playerId: string) {
  return useQuery({
    queryKey: ["player-detailed-stats", playerId],
    queryFn: async () => {
      const { data: turns, error } = await supabase
        .from("game_turns")
        .select("turn_score, score_after")
        .eq("player_id", playerId);
      if (error) throw error;

      if (!turns || turns.length === 0) {
        return { avg3darts: 0, highestCheckout: 0, count180: 0 };
      }

      const nonBustTurns = turns.filter((t) => t.turn_score > 0);
      const avg3darts =
        nonBustTurns.length > 0
          ? nonBustTurns.reduce((sum, t) => sum + t.turn_score, 0) / nonBustTurns.length
          : 0;

      const checkouts = turns.filter((t) => t.score_after === 0 && t.turn_score > 0);
      const highestCheckout =
        checkouts.length > 0 ? Math.max(...checkouts.map((t) => t.turn_score)) : 0;

      const count180 = turns.filter((t) => t.turn_score === 180).length;

      return { avg3darts: Math.round(avg3darts * 10) / 10, highestCheckout, count180 };
    },
    enabled: !!playerId,
  });
}
