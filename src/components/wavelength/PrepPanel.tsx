import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface PrepPanelProps {
  game?: WavelengthGame;
  playerRole?: PlayerRole;
}

const PrepPanel: React.FC<PrepPanelProps> = ({ game, playerRole }) => {
  const handleStartRound = () => {
    console.log('Starting new round...');
    // TODO: Implement start round logic
  };

  const nextClueGiver = game?.active_clue_giver === 'A' ? 'B' : 'A';

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">Ready for Next Round</h2>
      
      {game && (
        <p className="text-gray-400 mb-6">
          Player {nextClueGiver} will give the next clue
        </p>
      )}
      
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