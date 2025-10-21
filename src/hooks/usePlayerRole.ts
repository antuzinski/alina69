import { useState, useEffect } from 'react';
import { WLGame } from '../lib/wavelengthApi';

export type PlayerRole = 'A' | 'B';

export const usePlayerRole = (game?: WLGame | null) => {
  const [playerRole, setPlayerRole] = useState<PlayerRole>('A');
  const [autoSwitch, setAutoSwitch] = useState(true);

  useEffect(() => {
    // Get role from localStorage or default to 'A'
    const savedRole = localStorage.getItem('wavelength_player_role') as PlayerRole;
    const savedAutoSwitch = localStorage.getItem('wavelength_auto_switch') === 'true';
    if (savedRole === 'A' || savedRole === 'B') {
      setPlayerRole(savedRole);
    }
    setAutoSwitch(savedAutoSwitch !== false); // Default to true
  }, []);

  // Auto-switch role based on game phase
  useEffect(() => {
    if (!autoSwitch || !game) return;
    
    let targetRole: PlayerRole | null = null;
    
    if (game.phase === 'CLUE_PHASE') {
      // During CLUE_PHASE, switch to the active clue giver
      targetRole = game.active_clue_giver;
    } else if (game.phase === 'GUESS_PHASE') {
      // During GUESS_PHASE, switch to the guesser (opposite of clue giver)
      targetRole = game.active_clue_giver === 'A' ? 'B' : 'A';
    }
    
    if (targetRole && playerRole !== targetRole) {
      console.log(`[ROLE] Auto-switching from ${playerRole} to ${targetRole} for phase ${game.phase}`);
      setPlayerRole(targetRole);
      localStorage.setItem('wavelength_player_role', targetRole);
    }
  }, [game?.phase, game?.active_clue_giver, autoSwitch, playerRole]);

  const switchRole = () => {
    const newRole: PlayerRole = playerRole === 'A' ? 'B' : 'A';
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