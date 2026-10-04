import React from 'react';
import { ConceptState } from '../types';
import { getStatusBadgeInfo } from '../features/concepts/stateMachine';

interface Props {
  state: ConceptState;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ state, size = 'sm' }) => {
  const info = getStatusBadgeInfo(state);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs sm:text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono rounded-md border ${info.bgClass} ${info.textClass} ${info.borderClass} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${info.dotClass}`} />
      <span>{info.label}</span>
    </span>
  );
};
