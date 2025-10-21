import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface WavelengthGame {
  id: string;
  current_round_index: number;
  phase: 'ROUND_PREP' | 'CLUE_PHASE' | 'GUESS_PHASE' | 'REVEAL';
  active_clue_giver: 'A' | 'B';
  last_updated_at: string;
}

export const useWavelengthGame = () => {
  const [game, setGame] = useState<WavelengthGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // For now, return a mock game state
    setGame({
      id: 'default',
      current_round_index: 0,
      phase: 'ROUND_PREP',
      active_clue_giver: 'A',
      last_updated_at: new Date().toISOString()
    });
    setIsLoading(false);
  }, []);

  return { game, isLoading, error };
};