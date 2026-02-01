

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';
import { useAuth } from '@/hooks/useAuth';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useAuthStore } from '@/store/auth.store';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
    { path: '/dashboard', icon: 'home', label: 'Início' },
    { path: '/agenda', icon: 'calendar', label: 'Agenda' },
    { path: '/clients', icon: 'users', label: 'Clientes' },
    { path: '/financial', icon: 'dollar', label: 'Financeiro' },
    { path: '/history', icon: 'history', label: 'Histórico' },
];

const settingsNavItems = [
    { path: '/profile', icon: 'user', label: 'Perfil da Empresa' },
    { path: '/settings-shop', icon: 'scissors', label: 'Configurações da Barbearia' },
    { path: '/settings-services', icon: 'receipt', label: 'Serviços' },
    { path: '/settings-website', icon: 'globe', label: 'Site de Agendamento' },
    { path: '/settings-app', icon: 'settings', label: 'Configurações' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const { shopInfo } = useBarbershop({ autoFetch: true });
    const { user } = useAuthStore();

    const handleLogout = async () => {
        onClose();
        try {
            await logout();
        } catch (err) {
            console.error('Erro ao sair:', err);
        }
    };

    // Helper para iniciais
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const shopName = shopInfo?.name || 'Sua Barbearia';
    const userEmail = user?.email || 'email@exemplo.com';
    const initials = getInitials(shopName);

    const NavItem: React.FC<{ path: string, icon: string, label: string }> = ({ path, icon, label }) => (
        <NavLink
            to={path}
            onClick={onClose}
            className={({ isActive }) =>
                `flex items-center space-x-4 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    isActive ? 'bg-violet-500/20 text-violet-300' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`
            }
        >
            <Icon name={icon as any} className="w-6 h-6" />
            <span className="font-semibold text-sm">{label}</span>
        </NavLink>
    );

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                className={`fixed inset-0 bg-black/60 z-20 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            />
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-slate-800 shadow-2xl shadow-violet-800/20 z-30 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-700">
                         <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/30">
                               <Icon name="scissors" className="w-5 h-5 text-slate-950" />
                            </div>
                            <span className="text-xl font-bold text-slate-100">BarberIA</span>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                            <Icon name="x" className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Profile */}
                     <div className="p-4 border-b border-slate-700">
                        <div className="w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center font-bold text-white text-xl mb-2 shadow-lg shadow-violet-900/20">
                            {initials}
                        </div>
                        <p className="font-bold text-slate-100 truncate">{shopName}</p>
                        <p className="text-sm text-slate-400 truncate">{userEmail}</p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                        <p className="px-4 pt-0 pb-2 text-xs font-bold uppercase text-slate-500">Principal</p>
                        {mainNavItems.map(item => <NavItem key={item.path} {...item} />)}

                        <div className="pt-4">
                            <p className="px-4 py-2 text-xs font-bold uppercase text-slate-500">Gerenciamento</p>
                            {settingsNavItems.map(item => <NavItem key={item.path} {...item} />)}
                        </div>
                    </nav>

                    {/* Footer / Logout */}
                    <div className="p-4 border-t border-slate-700">
                         <button onClick={handleLogout} className="w-full flex items-center space-x-4 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors duration-200">
                            <Icon name="logout" className="w-6 h-6"/>
                            <span className="font-semibold">Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};