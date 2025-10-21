import React from 'react';
import { PlayerRole } from '../../hooks/usePlayerRole';

interface RoleChipProps {
  playerRole: PlayerRole;
  onSwitchRole: () => void;
}

const RoleChip: React.FC<RoleChipProps> = ({ playerRole, onSwitchRole }) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
        You are Player {playerRole}
      </div>
      <button
        onClick={onSwitchRole}
        className="text-gray-400 hover:text-emerald-500 text-sm underline transition-colors"
      >
        Switch role
      </button>
    </div>
  );
};

export default RoleChip;