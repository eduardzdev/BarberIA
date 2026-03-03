
import React from 'react';
import { Card } from './Card';
import { Icon } from './Icon';
import { Notification, NotificationType } from '../types';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationsPanelProps {
    onClose: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ onClose }) => {
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        clearAll,
        loading
    } = useNotifications({ autoStart: true });

    const getIconInfo = (type: Notification['type']) => {
        switch (type) {
            case NotificationType.NewAppointment:
                return { name: 'calendar', color: 'text-blue-400', bg: 'bg-blue-500/10' };
            case NotificationType.GoalAchieved:
                return { name: 'trendUp', color: 'text-green-400', bg: 'bg-green-500/10' };
            default:
                return { name: 'bell', color: 'text-slate-400', bg: 'bg-slate-500/10' };
        }
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                onClick={onClose}
            ></div>

            {/* Panel */}
            <div className="fixed inset-x-0 top-0 z-50 md:absolute md:inset-auto md:top-full md:right-0 md:mt-2 md:w-80 animate-fade-in-down-fast">
                <style>{`
                    @keyframes fade-in-down-fast {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-down-fast {
                        animation: fade-in-down-fast 0.2s ease-out forwards;
                    }
                 `}</style>
                <Card className="!p-0 overflow-hidden bg-slate-900 shadow-2xl shadow-violet-500/20 rounded-b-xl md:rounded-xl border-t-0 md:border-t border-slate-700">
                    <div className="p-4 md:p-3 border-b border-slate-700 flex justify-between items-center text-slate-100">
                        <h3 className="font-bold text-lg md:text-base">Notificações</h3>
                        <div className="flex items-center space-x-1">
                            {notifications.length > 0 && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Deseja limpar todo o histórico de notificações?')) {
                                            clearAll();
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Limpar todas"
                                >
                                    <Icon name="trash" className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors md:hidden"
                            >
                                <Icon name="close" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[70vh] md:max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map(notif => {
                                const iconInfo = getIconInfo(notif.type);
                                return (
                                    <div
                                        key={notif.id}
                                        onClick={() => markAsRead(notif.id)}
                                        className={`flex items-start space-x-3 p-4 md:p-3 border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors duration-150 cursor-pointer ${!notif.read ? 'bg-violet-500/5' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 mt-1 p-2 rounded-lg ${iconInfo.bg}`}>
                                            <Icon name={iconInfo.name} className={`w-5 h-5 ${iconInfo.color}`} />
                                        </div>
                                        <div className="flex-grow">
                                            <p className={`text-sm ${notif.read ? 'text-slate-400 font-medium' : 'text-slate-200 font-bold'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-400 line-clamp-2">{notif.description}</p>
                                            <p className="text-xs text-slate-500 mt-1">{notif.time}</p>
                                        </div>
                                        {!notif.read && <span className="w-2 h-2 mt-2 bg-violet-400 rounded-full flex-shrink-0"></span>}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="p-8 text-center text-sm text-slate-500">Nenhuma notificação.</p>
                        )}
                    </div>
                    <div className="p-3 bg-slate-800/50 text-center border-t border-slate-700/50">
                        <button
                            onClick={() => markAllAsRead()}
                            className="text-violet-400 font-semibold text-sm w-full py-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            Marcar todas como lidas
                        </button>
                    </div>
                </Card>
            </div>
        </>
    );
};