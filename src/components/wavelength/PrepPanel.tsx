import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface PrepPanelProps {
  game: WavelengthGame;
  playerRole: PlayerRole;
  onStartRound: () => void;
}

const PrepPanel: React.FC<PrepPanelProps> = ({ game, playerRole, onStartRound }) => {
  const handleStartRound = () => {
    console.log('[WAVELENGTH] Starting new round - local state transition');
    onStartRound();
  };

  const nextClueGiver = game.active_clue_giver === 'A' ? 'B' : 'A';

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Ready for Next Round</h2>
      
      <p className="text-gray-400 mb-6">
        Player {nextClueGiver} will give the next clue
      </p>
      
      <p className="text-gray-500 text-sm mb-4">
        Round {game.current_round_index + 1}
      </p>
      
      <button
        onClick={handleStartRound}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
      >
        Start Next Round
      </button>
    </div>
  );
};

export default PrepPanel;