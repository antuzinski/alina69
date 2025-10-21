import React from 'react';
import { WLRound } from '../../lib/wavelengthApi';

interface RecentShotsProps {
  recentShots?: { playerA: WLRound[]; playerB: WLRound[] };
}

const getResultText = (delta: number): string => {
  if (delta === 0) return "идеально";
  if (delta <= 1) return "отлично";
  if (delta <= 5) return "попадание";
  if (delta <= 15) return "близко";
  return "мимо";
};

const RecentShots: React.FC<RecentShotsProps> = ({ recentShots }) => {
  console.log('[RECENT_SHOTS] Component received data:', recentShots);
  
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">Recent Shots</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Алина</h4>
          {recentShots?.playerA && recentShots.playerA.length > 0 ? (
            <div className="space-y-2">
              {recentShots.playerA.map((round) => (
                <div key={round.id} className="bg-gray-700 p-2 rounded text-xs">
                  <div className="text-emerald-400 font-bold">
                    {round.target} vs {round.guess} ({getResultText(round.delta || 0)})
                  </div>
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
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Юра</h4>
          {recentShots?.playerB && recentShots.playerB.length > 0 ? (
            <div className="space-y-2">
              {recentShots.playerB.map((round) => (
                <div key={round.id} className="bg-gray-700 p-2 rounded text-xs">
                  <div className="text-emerald-400 font-bold">
                    {round.target} vs {round.guess} ({getResultText(round.delta || 0)})
                  </div>
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

export default RecentShots;