// Wavelength Game API
import { supabase } from './supabase';

export type WLPhase = 'ROUND_PREP' | 'CLUE_PHASE' | 'GUESS_PHASE' | 'REVEAL';
export type WLPlayerRole = 'A' | 'B';

export interface WLGame {
  id: string;
  phase: WLPhase;
  current_round_index: number;
  active_clue_giver: WLPlayerRole;
  updated_at: string;
}

export interface WLCard {
  id: string;
  left_label: string;
  right_label: string;
  created_at: string;
}

export interface WLRound {
  id: string;
  game_id: string;
  round_index: number;
  card_id: string;
  target: number;
  clue?: string;
  guess?: number;
  delta?: number;
  score?: number;
  clue_giver_role: WLPlayerRole;
  guesser_role: WLPlayerRole;
  is_best_shot: boolean;
  created_at: string;
  revealed_at?: string;
  card?: WLCard;
}

// Debug logging
const debugLog = (operation: string, data: any) => {
  console.log(`[WL_API] ${operation}:`, data);
};

const debugError = (operation: string, error: any) => {
  console.error(`[WL_API ERROR] ${operation}:`, error);
};

export const wavelengthApi = {
  // Clear all game rounds (for testing/reset)
  async clearAllRounds(): Promise<boolean> {
    try {
      debugLog('clearAllRounds called', {});
      
      // Delete all rounds
      const { error: roundsError } = await supabase
        .from('wl_rounds')
        .delete()
        .eq('game_id', 'default');
      
      if (roundsError) throw roundsError;
      
      // Reset game to initial state
      const { error: gameError } = await supabase
        .from('wl_game')
        .update({
          phase: 'ROUND_PREP',
          current_round_index: 0,
          active_clue_giver: 'A',
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default');
      
      if (gameError) throw gameError;
      
      debugLog('clearAllRounds success', {});
      return true;
    } catch (error) {
      debugError('clearAllRounds', error);
      return false;
    }
  },

  // Get current game state
  async getGame(): Promise<WLGame | null> {
    try {
      debugLog('getGame called', {});
      
      const { data, error } = await supabase
        .from('wl_game')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error) throw error;
      
      debugLog('getGame success', data);
      return data as WLGame;
    } catch (error) {
      debugError('getGame', error);
      return null;
    }
  },

  // Get current round (if exists)
  async getCurrentRound(): Promise<WLRound | null> {
    try {
      const game = await this.getGame();
      if (!game) return null;

      debugLog('getCurrentRound called', { round_index: game.current_round_index });

      const { data, error } = await supabase
        .from('wl_rounds')
        .select(`
          *,
          card:wl_cards(*)
        `)
        .eq('game_id', 'default')
        .eq('round_index', game.current_round_index)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }

      debugLog('getCurrentRound success', data);
      return data as WLRound | null;
    } catch (error) {
      debugError('getCurrentRound', error);
      return null;
    }
  },

  // Get random card (avoiding recent ones)
  async getRandomCard(excludeRecent = 5): Promise<WLCard | null> {
    try {
      debugLog('getRandomCard called', { excludeRecent });

      // Get recently used card IDs
      const { data: recentRounds } = await supabase
        .from('wl_rounds')
        .select('card_id')
        .eq('game_id', 'default')
        .order('created_at', { ascending: false })
        .limit(excludeRecent);

      const excludeIds = recentRounds?.map(r => r.card_id) || [];
      
      // Get available cards
      let query = supabase.from('wl_cards').select('*');
      
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.map(id => `"${id}"`).join(',')})`);
      }

      const { data: cards, error } = await query;
      
      if (error) throw error;
      if (!cards || cards.length === 0) {
        // Fallback: get any card if all are excluded
        const { data: fallbackCards } = await supabase
          .from('wl_cards')
          .select('*')
          .limit(10);
        
        if (fallbackCards && fallbackCards.length > 0) {
          const randomCard = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
          debugLog('getRandomCard fallback', randomCard);
          return randomCard as WLCard;
        }
        return null;
      }

      // Pick random card
      const randomCard = cards[Math.floor(Math.random() * cards.length)];
      debugLog('getRandomCard success', randomCard);
      return randomCard as WLCard;
    } catch (error) {
      debugError('getRandomCard', error);
      return null;
    }
  },

  // Start new round
  async startNewRound(): Promise<{ game: WLGame; round: WLRound } | null> {
    try {
      debugLog('startNewRound called', {});

      const game = await this.getGame();
      if (!game) throw new Error('Game not found');
      
      if (game.phase !== 'ROUND_PREP') {
        throw new Error(`Cannot start round from phase: ${game.phase}`);
      }

      // Get random card and generate target
      const card = await this.getRandomCard();
      if (!card) throw new Error('No cards available');

      const target = Math.floor(Math.random() * 101); // 0-100
      const newRoundIndex = game.current_round_index + 1;
      const newClueGiver: WLPlayerRole = game.active_clue_giver === 'A' ? 'B' : 'A';
      const guesser: WLPlayerRole = newClueGiver === 'A' ? 'B' : 'A';

      // Create new round
      const { data: roundData, error: roundError } = await supabase
        .from('wl_rounds')
        .insert({
          game_id: 'default',
          round_index: newRoundIndex,
          card_id: card.id,
          target,
          clue_giver_role: newClueGiver,
          guesser_role: guesser,
          is_best_shot: false
        })
        .select(`
          *,
          card:wl_cards(*)
        `)
        .single();

      if (roundError) throw roundError;

      // Update game state
      const { data: gameData, error: gameError } = await supabase
        .from('wl_game')
        .update({
          phase: 'CLUE_PHASE',
          current_round_index: newRoundIndex,
          active_clue_giver: newClueGiver,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default')
        .select()
        .single();

      if (gameError) throw gameError;

      const result = { game: gameData as WLGame, round: roundData as WLRound };
      debugLog('startNewRound success', result);
      return result;
    } catch (error) {
      debugError('startNewRound', error);
      return null;
    }
  },

  // Submit clue
  async submitClue(clue: string): Promise<{ game: WLGame; round: WLRound } | null> {
    try {
      debugLog('submitClue called', { clue });

      const game = await this.getGame();
      if (!game) throw new Error('Game not found');
      
      if (game.phase !== 'CLUE_PHASE') {
        throw new Error(`Cannot submit clue from phase: ${game.phase}`);
      }

      // Update round with clue
      const { data: roundData, error: roundError } = await supabase
        .from('wl_rounds')
        .update({ clue: clue.trim() })
        .eq('game_id', 'default')
        .eq('round_index', game.current_round_index)
        .select(`
          *,
          card:wl_cards(*)
        `)
        .single();

      if (roundError) throw roundError;

      // Update game phase
      const { data: gameData, error: gameError } = await supabase
        .from('wl_game')
        .update({
          phase: 'GUESS_PHASE',
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default')
        .select()
        .single();

      if (gameError) throw gameError;

      const result = { game: gameData as WLGame, round: roundData as WLRound };
      debugLog('submitClue success', result);
      return result;
    } catch (error) {
      debugError('submitClue', error);
      return null;
    }
  },

  // Lock guess
  async lockGuess(guess: number): Promise<{ game: WLGame; round: WLRound } | null> {
    try {
      debugLog('lockGuess called', { guess });

      const game = await this.getGame();
      if (!game) throw new Error('Game not found');
      
      if (game.phase !== 'GUESS_PHASE') {
        throw new Error(`Cannot lock guess from phase: ${game.phase}`);
      }

      const currentRound = await this.getCurrentRound();
      if (!currentRound) throw new Error('Current round not found');

      // Calculate delta and score
      const delta = Math.abs(guess - currentRound.target);
      
      // Update round with guess and results
      const { data: roundData, error: roundError } = await supabase
        .from('wl_rounds')
        .update({
          guess,
          delta,
          revealed_at: new Date().toISOString()
        })
        .eq('game_id', 'default')
        .eq('round_index', game.current_round_index)
        .select(`
          *,
          card:wl_cards(*)
        `)
        .single();

      if (roundError) throw roundError;

      // Update game phase
      const { data: gameData, error: gameError } = await supabase
        .from('wl_game')
        .update({
          phase: 'REVEAL',
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default')
        .select()
        .single();

      if (gameError) throw gameError;

      // Invalidate recent shots cache to refresh immediately
      // This will be handled by the mutation's onSuccess callback

      const result = { game: gameData as WLGame, round: roundData as WLRound };
      debugLog('lockGuess success', result);
      return result;
    } catch (error) {
      debugError('lockGuess', error);
      return null;
    }
  },

  // Back to prep (finish round)
  async backToPrep(): Promise<WLGame | null> {
    try {
      debugLog('backToPrep called', {});

      const game = await this.getGame();
      if (!game) throw new Error('Game not found');
      
      if (game.phase !== 'REVEAL') {
        throw new Error(`Cannot go to prep from phase: ${game.phase}`);
      }

      // Update game phase
      const { data: gameData, error: gameError } = await supabase
        .from('wl_game')
        .update({
          phase: 'ROUND_PREP',
          updated_at: new Date().toISOString()
        })
        .eq('id', 'default')
        .select()
        .single();

      if (gameError) throw gameError;

      debugLog('backToPrep success', gameData);
      return gameData as WLGame;
    } catch (error) {
      debugError('backToPrep', error);
      return null;
    }
  },

  // Get recent shots for each player (last 3 guesses)
  async getRecentShots(): Promise<{ playerA: WLRound[]; playerB: WLRound[] }> {
    try {
      debugLog('getRecentShots called', {});

      const { data: rounds, error } = await supabase
        .from('wl_rounds')
        .select(`
          *,
          card:wl_cards(*)
        `)
        .eq('game_id', 'default')
        .not('guess', 'is', null)
        .not('revealed_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      debugLog('getRecentShots raw data', { rounds, count: rounds?.length });

      const playerA = (rounds || [])
        .filter(r => {
          debugLog('filtering round for player A', { round: r, guesser_role: r.guesser_role });
          return r.guesser_role === 'A';
        })
        .slice(0, 3);
      
      const playerB = (rounds || [])
        .filter(r => {
          debugLog('filtering round for player B', { round: r, guesser_role: r.guesser_role });
          return r.guesser_role === 'B';
        })
        .slice(0, 3);

      debugLog('getRecentShots filtered', { playerA: playerA.length, playerB: playerB.length });

      const result = { playerA: playerA as WLRound[], playerB: playerB as WLRound[] };
      debugLog('getRecentShots success', result);
      return result;
    } catch (error) {
      debugError('getRecentShots', error);
      return { playerA: [], playerB: [] };
    }
  }
};