import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface CluePanelProps {
  game: WavelengthGame;
  playerRole: PlayerRole;
}

const CluePanel: React.FC<CluePanelProps> = ({ game, playerRole }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Clue Phase</h2>
      <p className="text-gray-400">Clue panel implementation coming soon...</p>
    </div>
  );
};

export default CluePanel;