import React from 'react';

const NoteCardSkeleton = () => {
  return (
    <div className="card bg-base-100 shadow-xl animate-pulse border border-primary/20">
      <div className="card-body">
        <div className="h-6 bg-base-300 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-base-300 rounded w-full mb-2"></div>
        <div className="h-4 bg-base-300 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-base-300 rounded w-1/2"></div>
        <div className="h-10 bg-base-300 rounded w-full mt-4"></div>
      </div>
    </div>
  );
};

export default NoteCardSkeleton;
