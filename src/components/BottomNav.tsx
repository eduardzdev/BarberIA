
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const navItems = [
    { path: '/dashboard', icon: 'home', label: 'Início' },
    { path: '/agenda', icon: 'calendar', label: 'Agenda' },
    { path: '/clients', icon: 'users', label: 'Clientes' },
    { path: '/financial', icon: 'dollar', label: 'Financeiro' },
];

export const BottomNav: React.FC = () => {
    return (
        <nav className="sticky bottom-0 bg-slate-800/80 backdrop-blur-md border-t border-slate-700">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        data-testid={`bottom-link-${item.label.toLowerCase()}`}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center space-y-1 w-full text-slate-400 ${isActive ? 'text-violet-400' : ''}`
                        }
                    >
                        <Icon name={item.icon as any} className="w-6 h-6" />
                        <span className="text-xs font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
