import React from 'react';
import { WLGame } from '../../lib/wavelengthApi';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface PrepPanelProps {
  game: WLGame;
  playerRole: PlayerRole;
  onStartRound: () => void;
  isLoading?: boolean;
}

const PrepPanel: React.FC<PrepPanelProps> = ({ game, playerRole, onStartRound, isLoading = false }) => {
  const nextClueGiver = game.active_clue_giver === 'A' ? 'Алина' : 'Юра';

  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">
        {nextClueGiver} will give the next clue
      </h2>
      
      <p className="text-gray-500 text-sm mb-4">
        Round {game.current_round_index + 1}
      </p>
      
      <div className="flex justify-center">
        <button
          onClick={onStartRound}
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Starting...</span>
            </>
          ) : (
            <span>Start Next Round</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default PrepPanel;