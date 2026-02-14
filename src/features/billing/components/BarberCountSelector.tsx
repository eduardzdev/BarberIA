/**
 * BarberCountSelector — Stepper para número de barbeiros com preview de preço.
 */

import React from 'react';
import { FiMinus, FiPlus, FiUsers } from 'react-icons/fi';
import { calculatePrice, formatCurrency } from '../constants';
import type { PlanType } from '@/types';

interface BarberCountSelectorProps {
    plan: PlanType;
    count: number;
    onChange: (count: number) => void;
    maxBarbers?: number;
}

export const BarberCountSelector: React.FC<BarberCountSelectorProps> = ({
    plan,
    count,
    onChange,
    maxBarbers = 10,
}) => {
    const totalPrice = calculatePrice(plan, count);

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <FiUsers className="w-4 h-4 text-violet-400" />
                    <span>Barbeiros</span>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => count > 1 && onChange(count - 1)}
                        disabled={count <= 1}
                        className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <FiMinus className="w-4 h-4" />
                    </button>

                    <span className="text-xl font-bold text-slate-100 w-8 text-center">{count}</span>

                    <button
                        type="button"
                        onClick={() => count < maxBarbers && onChange(count + 1)}
                        disabled={count >= maxBarbers}
                        className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <FiPlus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Price preview */}
            <div className="flex items-baseline justify-between pt-3 border-t border-slate-700">
                <span className="text-slate-400 text-sm">Total mensal:</span>
                <span className="text-xl font-extrabold text-violet-400">
                    {formatCurrency(totalPrice)}
                </span>
            </div>
        </div>
    );
};
