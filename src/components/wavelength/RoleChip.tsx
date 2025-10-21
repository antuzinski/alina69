import React from 'react';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface RoleChipProps {
  playerRole: PlayerRole;
  onSwitchRole: () => void;
  autoSwitch: boolean;
  onToggleAutoSwitch: () => void;
}

const RoleChip: React.FC<RoleChipProps> = ({ 
  playerRole, 
  onSwitchRole, 
  autoSwitch, 
  onToggleAutoSwitch 
}) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
        Player {playerRole} {autoSwitch && '(Auto)'}
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleAutoSwitch}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            autoSwitch 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          Auto
        </button>
        
        {!autoSwitch && (
          <button
            onClick={onSwitchRole}
            className="text-gray-400 hover:text-emerald-500 text-sm underline transition-colors"
          >
            Switch
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleChip;