import React from 'react';
import CardSkeleton from './CardSkeleton';
import Skeleton from './Skeleton';

const PageSkeleton: React.FC = () => {
    return (
        <div className="p-4 md:p-6 space-y-6 animate-fade-in">
            {/* Header-like skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <Skeleton variant="text" className="w-48 h-8" />
                    <Skeleton variant="text" className="w-32 h-4" />
                </div>
                <Skeleton variant="rectangular" className="w-32 h-10 rounded-lg" />
            </div>

            {/* Filters/Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>

            {/* Content list */}
            <CardSkeleton count={4} />
        </div>
    );
};

export default PageSkeleton;
