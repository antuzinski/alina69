import React from 'react';

const BestShots: React.FC = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-100 mb-3">Best Shots</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Player A</h4>
          <div className="text-gray-400 text-sm">No shots yet</div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-emerald-400 mb-2">Player B</h4>
          <div className="text-gray-400 text-sm">No shots yet</div>
        </div>
      </div>
    </div>
  );
};

export default BestShots;