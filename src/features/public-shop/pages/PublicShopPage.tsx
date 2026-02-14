import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { PublicShopData } from '@/types';
import { PublicLayout } from '../layouts/PublicLayout';
import { Icon } from '@/components/Icon';
import { useBookingStore } from '../stores/booking.store';
import { EmbeddedBookingFlow } from '../components/EmbeddedBookingFlow';

import { LocationModal } from '../components/LocationModal';

export const PublicShopPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [shopData, setShopData] = useState<PublicShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  
  const { initBooking } = useBookingStore();

  useEffect(() => {
    const fetchShopData = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, 'public_shops', slug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as PublicShopData;
          setShopData(data);
          // Inicializa store assim que os dados carregam
          initBooking(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erro ao carregar barbearia:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [slug]); // initBooking não deve estar na dependência para evitar loop se não for estável

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !shopData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <Icon name="scissors" className="w-16 h-16 text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Barbearia não encontrada</h1>
        <p className="text-slate-600">Verifique o endereço e tente novamente.</p>
      </div>
    );
  }

  return (
    <PublicLayout theme={shopData.theme}>
        <LocationModal 
            isOpen={isMapOpen}
            onClose={() => setIsMapOpen(false)}
            address={shopData.address}
            city={shopData.city}
            state={shopData.state}
            shopName={shopData.name}
            theme={shopData.theme}
        />

        {/* Navbar Simplificada */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {shopData.logoUrl ? (
                        <img src={shopData.logoUrl} alt={shopData.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-shop-primary flex items-center justify-center text-white font-bold">
                            {shopData.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <h1 className="font-bold text-lg text-slate-900">{shopData.name}</h1>
                </div>
            </div>
        </nav>

        {/* Hero Section */}
        {shopData.layout.showHero && (
            <div className="relative h-64 md:h-80 bg-slate-900 overflow-hidden">
                {shopData.layout.heroImage ? (
                    <img 
                        src={shopData.layout.heroImage} 
                        alt="Capa" 
                        className="w-full h-full object-cover opacity-60"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-slate-900 to-slate-800 opacity-90" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
                        {shopData.layout.heroTitle}
                    </h2>
                    {shopData.layout.heroSubtitle && (
                        <p className="text-lg md:text-xl text-slate-200 drop-shadow-md">
                            {shopData.layout.heroSubtitle}
                        </p>
                    )}
                </div>
            </div>
        )}

        <div className="max-w-4xl mx-auto p-4 space-y-8">
            {/* Sobre */}
            {shopData.layout.showAbout && shopData.layout.aboutText && (
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Icon name="info" className="w-5 h-5 text-shop-primary" />
                        Sobre Nós
                    </h3>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {shopData.layout.aboutText}
                    </p>

                </section>
            )}

            {/* Contato e Localização */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                    Contato e Localização
                </h3>
                
                <div className="space-y-4">
                    {/* Endereço */}
                    {shopData.address && (
                        <button 
                            onClick={() => setIsMapOpen(true)}
                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group w-full text-left"
                        >
                            <div className="bg-shop-primary/10 p-2 rounded-full text-shop-primary group-hover:bg-shop-primary group-hover:text-white transition-colors">
                                <Icon name="map" className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">Endereço</p>
                                <p className="text-slate-600 text-sm">{shopData.address}</p>
                            </div>
                            <Icon name="right" className="w-4 h-4 text-slate-400 ml-auto self-center" />
                        </button>
                    )}

                    {/* Contato e Redes */}
                    <div className="flex flex-wrap gap-3 pt-2">
                        {shopData.phone && (
                             <a 
                                href={`https://wa.me/55${shopData.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-green-500 hover:text-green-600 transition-colors text-slate-600 font-medium text-sm"
                             >
                                <Icon name="whatsapp" className="w-5 h-5" />
                                WhatsApp
                             </a>
                        )}
                        
                        {shopData.instagram && (
                             <a 
                                href={`https://instagram.com/${shopData.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-pink-500 hover:text-pink-600 transition-colors text-slate-600 font-medium text-sm"
                             >
                                <Icon name="instagram" className="w-5 h-5" />
                                Instagram
                             </a>
                        )}

                        {shopData.facebook && (
                             <a 
                                href={shopData.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-blue-600 hover:text-blue-600 transition-colors text-slate-600 font-medium text-sm"
                             >
                                <Icon name="facebook" className="w-5 h-5" />
                                Facebook
                             </a>
                        )}

                        {shopData.website && (
                             <a 
                                href={shopData.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-shop-primary hover:text-shop-primary transition-colors text-slate-600 font-medium text-sm"
                             >
                                <Icon name="globe" className="w-5 h-5" />
                                Site
                             </a>
                        )}
                    </div>
                </div>
            </section>

            {/* Novo Fluxo Embutido */}
            <EmbeddedBookingFlow />
        </div>
    </PublicLayout>
  );
};
