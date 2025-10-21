import React from 'react';
import { WavelengthGame } from '../../hooks/useWavelengthGame';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface CluePanelProps {
  game: WavelengthGame;
  playerRole: PlayerRole;
  onSubmitClue: () => void;
}

const CluePanel: React.FC<CluePanelProps> = ({ game, playerRole, onSubmitClue }) => {
  const isClueGiver = playerRole === game.active_clue_giver;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 mb-4">Clue Phase</h2>
      
      {isClueGiver ? (
        <div className="space-y-4">
          <p className="text-emerald-400">You are giving the clue this round!</p>
          <div className="bg-gray-700 p-4 rounded">
            <p className="text-gray-300 mb-2">Mock Card: <strong>Hot ←→ Cold</strong></p>
            <p className="text-gray-400 text-sm">Target: 75 (closer to Hot)</p>
          </div>
          <input
            type="text"
            placeholder="Enter your clue..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100"
          />
          <button
            onClick={onSubmitClue}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded transition-colors"
          >
            Submit Clue
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-400">Waiting for Player {game.active_clue_giver} to give a clue...</p>
        </div>
      )}
    </div>
  );
};

export default CluePanel;