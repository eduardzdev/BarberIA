import React from 'react';
import Skeleton from './Skeleton';

interface CardSkeletonProps {
    count?: number;
    className?: string;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3, className }) => {
    return (
        <div className={`space-y-4 ${className || ''}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-4 w-full">
                        {/* Avatar/Icon area */}
                        <Skeleton variant="circular" className="w-10 h-10 shrink-0" />

                        {/* Content area */}
                        <div className="space-y-2 w-full max-w-[200px]">
                            <Skeleton variant="text" className="w-full" />
                            <Skeleton variant="text" className="w-2/3 h-3" />
                        </div>
                    </div>
                    {/* Action/Right area */}
                    <Skeleton variant="rectangular" className="w-8 h-8 shrink-0" />
                </div>
            ))}
        </div>
    );
};

export default CardSkeleton;
