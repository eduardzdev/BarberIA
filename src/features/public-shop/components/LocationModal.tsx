import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Icon } from '@/components/Icon';

const ShopMap = lazy(() => import('./ShopMap'));

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    address: string;
    city?: string;
    state?: string;
    shopName: string;
    theme: {
        primaryColor: string;
        secondaryColor: string;
        font: string;
        mode?: 'light' | 'dark';
    };
}

export const LocationModal: React.FC<LocationModalProps> = ({ 
    isOpen, 
    onClose, 
    address, 
    city,
    state,
    shopName, 
    theme 
}) => {
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (isOpen && !coordinates && address) {
            setLoading(true);
            setError(false);
            
            // Construir query de busca mais precisa
            let searchQuery = address;
            if (city) searchQuery += `, ${city}`;
            if (state) searchQuery += ` - ${state}`;
            
            console.log('🗺️ Iniciando busca de coordenadas para:', searchQuery);

            // Usando Nominatim OpenStreetMap API para geocoding
            // Importante: Adicionar User-Agent para respeitar política de uso
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`, {
                headers: {
                    'User-Agent': 'BarberIA-App',
                    'Accept-Language': 'pt-BR' 
                }
            })
                .then(res => res.json())
                .then(data => {
                    console.log('📍 Resultado Nominatim:', data);
                    if (data && data.length > 0) {
                        setCoordinates({
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon)
                        });
                    } else {
                        console.warn('⚠️ Nenhum resultado encontrado para o endereço.');
                        setError(true);
                    }
                })
                .catch((err) => {
                    console.error('❌ Erro na busca de coordenadas:', err);
                    setError(true);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, address, city, state, coordinates]);

    if (!isOpen) return null;

    const bgColor = theme.mode === 'light' ? '#ffffff' : '#020617';
    const textColor = theme.mode === 'light' ? '#0f172a' : '#f8fafc';

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                style={{ 
                    border: `2px solid ${theme.primaryColor}`, 
                    backgroundColor: bgColor,
                    color: textColor
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 flex justify-between items-center border-b border-slate-200/10 shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Icon name="map" className="w-5 h-5" style={{ color: theme.primaryColor }} />
                        Localização
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-500/10 transition-colors"
                    >
                        <Icon name="x" className="w-6 h-6" style={{ color: theme.secondaryColor }} />
                    </button>
                </div>

                {/* Map Area */}
                <div className="w-full h-[350px] md:h-[400px] bg-slate-100 relative shrink-0">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: theme.primaryColor }}></div>
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 text-slate-500">
                            <Icon name="alert" className="w-10 h-10 mb-2 opacity-50" />
                            <p>Não foi possível carregar o mapa para este endereço.</p>
                            <p className="text-sm mt-2 opacity-75">{address}</p>
                        </div>
                    ) : coordinates ? (
                        <Suspense fallback={
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: theme.primaryColor }}></div>
                            </div>
                        }>
                            <ShopMap 
                                lat={coordinates.lat} 
                                lng={coordinates.lng} 
                                shopName={shopName} 
                            />
                        </Suspense>
                    ) : null}
                </div>

                {/* Footer with Address */}
                <div className="p-4 text-sm opacity-90 shrink-0 flex items-start gap-3 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="p-2 rounded-full bg-slate-200/20 shrink-0">
                         <Icon name="mapPin" className="w-4 h-4" style={{ color: theme.primaryColor }} />
                    </div>
                    <div>
                        <p className="font-medium" style={{ color: theme.primaryColor }}>Endereço Completo</p>
                        <p className="mt-0.5 leading-relaxed">{address}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
