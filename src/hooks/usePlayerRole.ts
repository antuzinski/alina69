import { useState, useEffect } from 'react';
import { WLGame } from '../lib/wavelengthApi';

export type PlayerRole = 'Алина' | 'Юра';

export const usePlayerRole = (game?: WLGame | null) => {
  const [playerRole, setPlayerRole] = useState<PlayerRole>('Алина');
  const [autoSwitch, setAutoSwitch] = useState(true);

  useEffect(() => {
    // Get role from localStorage or default to 'A'
    const savedRole = localStorage.getItem('wavelength_player_role') as PlayerRole;
    const savedAutoSwitch = localStorage.getItem('wavelength_auto_switch');
    if (savedRole === 'Алина' || savedRole === 'Юра') {
      setPlayerRole(savedRole);
    }
    // Default to true if not set
    setAutoSwitch(savedAutoSwitch !== 'false');
  }, []);

  // Auto-switch role based on game phase
  useEffect(() => {
    if (!autoSwitch || !game) return;
    
    let targetRole: PlayerRole | null = null;
    
    if (game.phase === 'CLUE_PHASE') {
      // During CLUE_PHASE, switch to the active clue giver
      targetRole = game.active_clue_giver === 'A' ? 'Алина' : 'Юра';
    } else if (game.phase === 'GUESS_PHASE') {
      // During GUESS_PHASE, switch to the guesser (opposite of clue giver)
      targetRole = game.active_clue_giver === 'A' ? 'Юра' : 'Алина';
    }
    
    if (targetRole && playerRole !== targetRole) {
      console.log(`[ROLE] Auto-switching from ${playerRole} to ${targetRole} for phase ${game.phase}`);
      setPlayerRole(targetRole);
      localStorage.setItem('wavelength_player_role', targetRole);
    }
  }, [game?.phase, game?.active_clue_giver, autoSwitch, playerRole]);

  const switchRole = () => {
    const newRole: PlayerRole = playerRole === 'Алина' ? 'Юра' : 'Алина';
    setPlayerRole(newRole);
    localStorage.setItem('wavelength_player_role', newRole);
  };

  const toggleAutoSwitch = () => {
    const newAutoSwitch = !autoSwitch;
    setAutoSwitch(newAutoSwitch);
    localStorage.setItem('wavelength_auto_switch', newAutoSwitch.toString());
  };

  return { 
    playerRole, 
    switchRole, 
    autoSwitch, 
    toggleAutoSwitch 
  };
};