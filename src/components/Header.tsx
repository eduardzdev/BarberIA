
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { NotificationsPanel } from './NotificationsPanel';
import { useAuth } from '@/hooks/useAuth';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useAuthStore } from '@/store/auth.store';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    title: string;
    onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Data hooks
    const { shopInfo } = useBarbershop({ autoFetch: true });
    const { user } = useAuthStore();
    const { unreadCount } = useNotifications({ autoStart: true });

    const shopName = shopInfo?.name || 'Minha Barbearia';
    const userEmail = user?.email || 'email@exemplo.com';

    // Close notifications and profile panel on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-800">
            <button
                className="p-2 -ml-2"
                onClick={onMenuClick}
                aria-label="Abrir menu"
                data-testid="menu-button"
            >
                <Icon name="menu" className="w-6 h-6 text-slate-400" />
            </button>
            <h1 className="text-lg font-bold text-slate-100 truncate">{title}</h1>
            <div className="flex items-center space-x-4">
                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2">
                        <Icon name="bell" className="w-6 h-6 text-slate-400" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <NotificationsPanel
                            onClose={() => setIsNotificationsOpen(false)}
                        />
                    )}
                </div>

                {/* Profile Menu */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="group relative w-10 h-10 rounded-full overflow-hidden shadow-[0_0_14px_rgba(76,29,149,0.45)] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        title="Menu de Perfil"
                        aria-label="Abrir menu de perfil"
                    >
                        <span className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-800" />
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.55),transparent_55%)]" />
                        <span className="absolute -bottom-3 right-0 w-12 h-12 rounded-full bg-white/20 blur-xl" />
                        <span className="relative z-10 flex h-full w-full items-center justify-center text-slate-100">
                            <svg
                                viewBox="0 0 64 64"
                                className="h-6 w-6 drop-shadow-[0_0_6px_rgba(15,23,42,0.35)]"
                                aria-hidden="true"
                            >
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="26"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <circle
                                    cx="32"
                                    cy="27"
                                    r="9"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    d="M18 47c4.5-8.3 11.4-12 14-12s9.5 3.7 14 12"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </span>
                    </button>

                    {/* Profile Menu Popup */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-lg shadow-xl shadow-black/50 border border-slate-700 overflow-hidden z-30">
                            {/* Header do Menu */}
                            <div className="px-4 py-3 border-b border-slate-700 bg-slate-900">
                                <p className="text-sm font-medium text-slate-200 truncate">{shopName}</p>
                                <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                            </div>

                            {/* Menu Items */}
                            <div className="py-2">
                                {/* Perfil da Empresa */}
                                <button
                                    onClick={() => {
                                        navigate('/profile');
                                        setIsProfileOpen(false);
                                    }}
                                    className="w-full px-4 py-2 flex items-center gap-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                                >
                                    <Icon name="user" className="text-lg" />
                                    <div className="text-left">
                                        <p className="font-medium">Perfil da Empresa</p>
                                        <p className="text-xs text-slate-500">Editar dados da barbearia</p>
                                    </div>
                                </button>

                                {/* Configurações da Barbearia */}
                                <button
                                    onClick={() => {
                                        navigate('/settings-shop');
                                        setIsProfileOpen(false);
                                    }}
                                    className="w-full px-4 py-2 flex items-center gap-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                                >
                                    <Icon name="settings" className="text-lg" />
                                    <div className="text-left">
                                        <p className="font-medium">Config. da Barbearia</p>
                                        <p className="text-xs text-slate-500">Horários, serviços, equipe</p>
                                    </div>
                                </button>

                                {/* Configurações */}
                                <button
                                    onClick={() => {
                                        navigate('/settings-app');
                                        setIsProfileOpen(false);
                                    }}
                                    className="w-full px-4 py-2 flex items-center gap-3 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-sm"
                                >
                                    <Icon name="shield" className="text-lg" />
                                    <div className="text-left">
                                        <p className="font-medium">Configurações</p>
                                        <p className="text-xs text-slate-500">Segurança, privacidade</p>
                                    </div>
                                </button>

                                {/* Divider */}
                                <div className="my-2 border-t border-slate-700"></div>

                                {/* Logout */}
                                <button
                                    onClick={async () => {
                                        setIsProfileOpen(false);
                                        try {
                                            await logout();
                                        } catch (err) {
                                            console.error('Erro ao fazer logout:', err);
                                        }
                                    }}
                                    className="w-full px-4 py-2 flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm"
                                >
                                    <Icon name="logout" className="text-lg" />
                                    <p className="font-medium">Sair</p>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};