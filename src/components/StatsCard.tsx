import React from 'react';
import { Card } from './Card';
import { Icon } from './Icon';

interface StatsCardProps {
    icon: string;
    title: string;
    value: string | number;
    trend?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
    className?: string;
}

/**
 * StatsCard - Componente padronizado para exibir KPI's e estatísticas.
 * 
 * Segue a identidade visual do projeto:
 * - Fundo escuro (Card)
 * - Ícone com fundo violeta translúcido
 * - Título em slate-400
 * - Valor em destaque (text-2xl, font-bold)
 * - Indicador de tendência opcional
 */
export const StatsCard: React.FC<StatsCardProps> = ({
    icon,
    title,
    value,
    trend,
    trendDirection,
    onClick,
    className = '',
}) => {
    const getTrendColor = () => {
        switch (trendDirection) {
            case 'up':
                return 'text-green-400';
            case 'down':
                return 'text-red-400';
            case 'neutral':
            default:
                return 'text-slate-400';
        }
    };

    const getTrendIcon = () => {
        if (trendDirection === 'up') return 'trending-up';
        if (trendDirection === 'down') return 'trending-down';
        return null;
    };

    const trendIcon = getTrendIcon();

    return (
        <Card
            className={`!p-4 ${onClick ? 'cursor-pointer hover:border-slate-600 transition-colors' : ''} ${className}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-violet-500/20 rounded-lg">
                    <Icon name={icon} className="w-5 h-5 text-violet-400" />
                </div>
            </div>

            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>

            {trend && (
                <p className={`text-xs mt-2 flex items-center ${getTrendColor()}`}>
                    {trendIcon && <Icon name={trendIcon} className="w-3 h-3 mr-1" />}
                    {trend}
                </p>
            )}
        </Card>
    );
};
