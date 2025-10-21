import { useState, useEffect } from 'react';

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
    console.log('[WAVELENGTH] Initializing mock game state');
    setGame({
      id: 'default',
      current_round_index: 0,
      phase: 'ROUND_PREP',
      active_clue_giver: 'A',
      last_updated_at: new Date().toISOString()
    });
    setIsLoading(false);
  }, []);

  const updateGameState = (updates: Partial<WavelengthGame>) => {
    console.log('[WAVELENGTH] Updating game state:', updates);
    setGame(prev => prev ? { ...prev, ...updates, last_updated_at: new Date().toISOString() } : null);
  };

  return { game, isLoading, error, updateGameState };
};