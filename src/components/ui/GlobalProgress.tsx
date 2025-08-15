import React from 'react';

interface Props { progress: number; }

export const GlobalProgress: React.FC<Props> = ({ progress }) => {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
  return (
    <div className="w-full px-4 py-3">
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-2 bg-blue-500"
          style={{ width: `${pct}%`, transition: 'width 600ms cubic-bezier(.2,.9,.2,1)' }}
        />
      </div>
    </div>
  );
};

export default GlobalProgress;
