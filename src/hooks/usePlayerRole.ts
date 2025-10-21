import { useState, useEffect } from 'react';

export type PlayerRole = 'A' | 'B';

export const usePlayerRole = () => {
  const [playerRole, setPlayerRole] = useState<PlayerRole>('A');

  useEffect(() => {
    // Get role from localStorage or default to 'A'
    const savedRole = localStorage.getItem('wavelength_player_role') as PlayerRole;
    if (savedRole === 'A' || savedRole === 'B') {
      setPlayerRole(savedRole);
    }
  }, []);

  const switchRole = () => {
    const newRole: PlayerRole = playerRole === 'A' ? 'B' : 'A';
    setPlayerRole(newRole);
    localStorage.setItem('wavelength_player_role', newRole);
  };

  return { playerRole, switchRole };
};