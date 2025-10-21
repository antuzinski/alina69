import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface GuessPanelProps {
  game: WavelengthGame;
  playerRole: PlayerRole;
}

const GuessPanel: React.FC<GuessPanelProps> = ({ game, playerRole }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Guess Phase</h2>
      <p className="text-gray-400">Guess panel implementation coming soon...</p>
    </div>
  );
};

export default GuessPanel;