/**
 * PlanCards — Cards comparativos dos planos Básico e Premium.
 *
 * Usado na aba Cadastro (LoginPage) e na BillingPage.
 * Exibe features, preços e badge "Popular" no Premium.
 */

import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { BILLING_PLANS, formatCurrency } from '../constants';
import type { PlanType } from '@/types';

interface PlanCardsProps {
    selectedPlan: PlanType;
    onSelectPlan: (plan: PlanType) => void;
}

export const PlanCards: React.FC<PlanCardsProps> = ({ selectedPlan, onSelectPlan }) => {
    return (
        <div className="grid grid-cols-2 gap-3">
            {(Object.keys(BILLING_PLANS) as PlanType[]).map((planKey) => {
                const plan = BILLING_PLANS[planKey];
                const isSelected = selectedPlan === planKey;
                const isPremium = planKey === 'premium';

                return (
                    <button
                        key={planKey}
                        type="button"
                        onClick={() => onSelectPlan(planKey)}
                        className={`
              relative rounded-xl p-4 text-left transition-all duration-200 border-2
              ${isSelected
                                ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                            }
            `}
                    >
                        {/* Popular badge */}
                        {isPremium && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                <span className="bg-violet-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                                    Popular
                                </span>
                            </div>
                        )}

                        {/* Plan name */}
                        <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-violet-400' : 'text-slate-200'}`}>
                            {plan.name}
                        </h3>

                        {/* Price */}
                        <div className="mb-3">
                            <span className={`text-2xl font-extrabold ${isSelected ? 'text-violet-300' : 'text-slate-100'}`}>
                                {formatCurrency(plan.basePrice)}
                            </span>
                            <span className="text-slate-500 text-xs">/mês</span>
                        </div>

                        {/* Extra barber price */}
                        <p className="text-slate-500 text-[10px] mb-3 leading-tight">
                            +{formatCurrency(plan.extraBarberPrice)} por barbeiro adicional
                        </p>

                        {/* Features */}
                        <ul className="space-y-1.5">
                            {plan.features.map((feature, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs text-slate-400">
                                    <FiCheck className={`w-3 h-3 mt-0.5 flex-shrink-0 ${isSelected ? 'text-violet-400' : 'text-green-500'}`} />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Selection indicator */}
                        <div className={`
              mt-3 w-full py-1.5 rounded-lg text-center text-xs font-semibold transition-colors
              ${isSelected
                                ? 'bg-violet-600 text-white'
                                : 'bg-slate-700 text-slate-400'
                            }
            `}>
                            {isSelected ? '✓ Selecionado' : 'Selecionar'}
                        </div>
                    </button>
                );
            })}
        </div>
    );
};
