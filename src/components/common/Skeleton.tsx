import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
    className?: string; // Classes adicionais
    variant?: 'rectangular' | 'circular' | 'text';
    width?: string | number; // opcional
    height?: string | number; // opcional
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular',
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-slate-800/50";

    const variantClasses = {
        rectangular: "rounded-md",
        circular: "rounded-full",
        text: "rounded h-4 w-full",
    };

    const style = {
        width: width,
        height: height,
    };

    return (
        <div
            className={clsx(baseClasses, variantClasses[variant], className)}
            style={style}
            aria-hidden="true"
        />
    );
};

export default Skeleton;
