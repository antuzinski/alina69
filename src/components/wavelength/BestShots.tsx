import React from 'react';

import { WLRound } from '../../lib/wavelengthApi';

interface BestShotsProps {
  bestShots?: { playerA: WLRound[]; playerB: WLRound[] };
}

const BestShots: React.FC<BestShotsProps> = ({ bestShots }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">Best Shots</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Player A</h4>
          {bestShots?.playerA && bestShots.playerA.length > 0 ? (
            <div className="space-y-2">
              {bestShots.playerA.slice(0, 3).map((round, index) => (
                <div key={round.id} className="bg-gray-700 p-2 rounded text-xs">
                  <div className="text-emerald-400 font-bold">{round.score} pts</div>
                  <div className="text-gray-300">"{round.clue}"</div>
                  <div className="text-gray-500">{round.card?.left_label} ←→ {round.card?.right_label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No shots yet</div>
          )}
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Player B</h4>
          {bestShots?.playerB && bestShots.playerB.length > 0 ? (
            <div className="space-y-2">
              {bestShots.playerB.slice(0, 3).map((round, index) => (
                <div key={round.id} className="bg-gray-700 p-2 rounded text-xs">
                  <div className="text-emerald-400 font-bold">{round.score} pts</div>
                  <div className="text-gray-300">"{round.clue}"</div>
                  <div className="text-gray-500">{round.card?.left_label} ←→ {round.card?.right_label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No shots yet</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BestShots;