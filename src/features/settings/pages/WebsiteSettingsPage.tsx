import React, { useState, useEffect } from 'react';
import PageSkeleton from '@/components/common/PageSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useUI } from '@/hooks/useUI';
import { ImageUploadModal } from '@/features/profile/components/ImageUploadModal';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/store/auth.store';

export const WebsiteSettingsPage: React.FC = () => {
    const { shopInfo, updateShopInfo, loading, barbers, businessHours } = useBarbershop({ autoFetch: true });
    const { user } = useAuthStore();
    const { success, error: showError } = useUI();

    // Estados do formulário
    const [slug, setSlug] = useState('');
    const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
    const [slugLoading, setSlugLoading] = useState(false);

    const [theme, setTheme] = useState<{
        primaryColor: string;
        secondaryColor: string;
        font: string;
        mode: 'light' | 'dark';
    }>({
        primaryColor: '#7c3aed', // violet-600
        secondaryColor: '#1e293b', // slate-800
        font: 'inter',
        mode: 'light'
    });

    const [layout, setLayout] = useState({
        showHero: true,
        heroTitle: '',
        heroSubtitle: '',
        heroImage: '',
        showAbout: true,
        aboutText: '',
        aboutImage: ''
    });

    const [showHeroImageModal, setShowHeroImageModal] = useState(false);
    const [showAboutImageModal, setShowAboutImageModal] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Carregar dados iniciais
    useEffect(() => {
        if (shopInfo) {
            setSlug(shopInfo.slug || '');
            if (shopInfo.theme) setTheme({
                ...shopInfo.theme,
                mode: shopInfo.theme.mode || 'light'
            });
            if (shopInfo.layout) {
                setLayout(prev => ({
                    ...prev,
                    ...shopInfo.layout,
                    heroSubtitle: shopInfo.layout?.heroSubtitle || '',
                    heroImage: shopInfo.layout?.heroImage || '',
                    aboutText: shopInfo.layout?.aboutText || '',
                    aboutImage: shopInfo.layout?.aboutImage || ''
                }));
            }

            // Defaults se vazio
            if (!shopInfo.layout?.heroTitle) {
                setLayout(prev => ({ ...prev, heroTitle: `Bem-vindo à ${shopInfo.name}` }));
            }
        }
    }, [shopInfo]);

    // Verificar disponibilidade do Slug
    const checkSlugAvailability = async (value: string) => {
        if (!value || value.length < 3) {
            setIsSlugAvailable(null);
            return;
        }

        // Se for o mesmo slug atual, está disponível
        if (value === shopInfo?.slug) {
            setIsSlugAvailable(true);
            return;
        }

        setSlugLoading(true);
        try {
            // Verifica na coleção public_shops
            const docRef = doc(db, 'public_shops', value);
            const docSnap = await getDoc(docRef);
            setIsSlugAvailable(!docSnap.exists());
        } catch (error) {
            console.error('Erro ao verificar slug:', error);
            setIsSlugAvailable(null);
        } finally {
            setSlugLoading(false);
        }
    };

    // Debounce na verificação de slug
    useEffect(() => {
        const timer = setTimeout(() => {
            if (slug) checkSlugAvailability(slug);
        }, 500);
        return () => clearTimeout(timer);
    }, [slug]);

    const handleSaveAndPublish = async () => {
        if (!slug || !isSlugAvailable) {
            showError('Escolha um link válido e disponível');
            return;
        }

        setPublishing(true);
        try {
            // 1. Salvar configurações na collection barbershops (privada)
            const updateData = {
                slug,
                theme,
                layout
            };
            await updateShopInfo(updateData);

            // 2. Publicar/Atualizar na collection public_shops (pública)
            // Aqui vamos agregar os dados necessários para a página pública
            // Precisamos buscar serviços e profissionais ativos

            // Buscar serviços
            const servicesSnapshot = await getDocs(
                query(collection(db, 'barbershops', user!.uid, 'services'), where('active', '==', true))
            );
            const services = servicesSnapshot.docs.map(d => ({ id: d.id, ...d.data(), type: 'service' }));

            // Buscar combos
            const combosSnapshot = await getDocs(
                query(collection(db, 'barbershops', user!.uid, 'combos'), where('active', '==', true))
            );
            const combos = combosSnapshot.docs.map(d => ({ id: d.id, ...d.data(), type: 'combo' }));

            const catalog = [...services, ...combos];

            // Montar objeto público otimizado
            const publicData = {
                ownerId: user!.uid,
                name: shopInfo!.name,
                phone: shopInfo!.phone,
                address: shopInfo!.address,
                logoUrl: shopInfo!.logoUrl,
                slug,
                theme,
                layout,
                catalog,
                team: barbers,     // Da store
                businessHours,     // Da store
                instagram: shopInfo?.instagram,
                facebook: shopInfo?.facebook,
                website: shopInfo?.website,
                updatedAt: new Date().toISOString()
            };

            // Se o slug mudou, precisaríamos deletar o antigo, mas por segurança vamos apenas criar/sobrescrever o novo
            // TODO: Lidar com exclusão de slug antigo se necessário para liberar nome

            await setDoc(doc(db, 'public_shops', slug), publicData);

            success('Site publicado com sucesso!');
        } catch (error) {
            console.error('Erro ao publicar site:', error);
            showError('Erro ao publicar site');
        } finally {
            setPublishing(false);
        }
    };

    const handleHeroImageSave = async (url: string | null) => {
        setLayout(prev => ({ ...prev, heroImage: url || '' }));
    };

    const handleAboutImageSave = async (url: string | null) => {
        setLayout(prev => ({ ...prev, aboutImage: url || '' }));
    };

    if (loading) return <PageSkeleton />;

    return (
        <div className="space-y-6 pb-20">
            <h1 className="text-2xl font-bold text-slate-100">Configuração do Site</h1>
            <p className="text-slate-400">Personalize a página de agendamento que seus clientes verão.</p>

            {/* Link Personalizado */}
            <Card>
                <h3 className="text-lg font-bold text-slate-100 mb-4">Seu Link</h3>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Endereço do Site</label>
                    <div className="flex items-center space-x-2">
                        <span className="text-slate-500 bg-slate-800 px-3 py-2 rounded-l-lg border border-slate-700 border-r-0">
                            obarberia.online/
                        </span>
                        <input
                            type="text"
                            value={slug}
                            onChange={(e) => {
                                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                                setSlug(val);
                            }}
                            placeholder="minha-barbearia"
                            className={`flex-1 min-w-0 bg-slate-800 border rounded-r-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 ${isSlugAvailable === false ? 'border-red-500 focus:ring-red-500' :
                                    isSlugAvailable === true ? 'border-green-500 focus:ring-green-500' :
                                        'border-slate-700 focus:ring-violet-500'
                                }`}
                        />
                    </div>
                    {slugLoading && <p className="text-xs text-slate-400">Verificando disponibilidade...</p>}
                    {isSlugAvailable === true && <p className="text-xs text-green-400">Endereço disponível!</p>}
                    {isSlugAvailable === false && <p className="text-xs text-red-400">Este endereço já está em uso.</p>}
                </div>
            </Card>

            {/* Tema e Cores */}
            <Card>
                <h3 className="text-lg font-bold text-slate-100 mb-4">Aparência</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Cor Principal</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={theme.primaryColor}
                                onChange={(e) => setTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                            />
                            <input
                                type="text"
                                value={theme.primaryColor}
                                onChange={(e) => setTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Cor Secundária</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={theme.secondaryColor}
                                onChange={(e) => setTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                className="h-10 w-10 rounded cursor-pointer border-0 p-0"
                            />
                            <input
                                type="text"
                                value={theme.secondaryColor}
                                onChange={(e) => setTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                            />
                        </div>
                    </div>

                    {/* Mode Selector */}
                    <div className="col-span-1 md:col-span-2 border-t border-slate-800 pt-4 mt-2">
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Tema de Fundo</label>
                        <div className="flex gap-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${theme.mode === 'light' ? 'border-violet-500' : 'border-slate-600'}`}>
                                    {theme.mode === 'light' && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                                </div>
                                <input
                                    type="radio"
                                    name="themeMode"
                                    value="light"
                                    checked={theme.mode === 'light'}
                                    onChange={() => setTheme(prev => ({ ...prev, mode: 'light' }))}
                                    className="sr-only"
                                />
                                <span className="text-slate-200 group-hover:text-white font-medium">Claro (Branco)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${theme.mode === 'dark' ? 'border-violet-500' : 'border-slate-600'}`}>
                                    {theme.mode === 'dark' && <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />}
                                </div>
                                <input
                                    type="radio"
                                    name="themeMode"
                                    value="dark"
                                    checked={theme.mode === 'dark'}
                                    onChange={() => setTheme(prev => ({ ...prev, mode: 'dark' }))}
                                    className="sr-only"
                                />
                                <span className="text-slate-200 group-hover:text-white font-medium">Escuro (Preto)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Preview das Cores */}
                <div className="mt-6 p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <p className="text-sm text-slate-400 mb-2">Pré-visualização do Botão:</p>
                    <button
                        style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
                        className="px-6 py-2 rounded-lg font-bold shadow-lg"
                    >
                        Agendar Agora
                    </button>
                </div>
            </Card>

            {/* Seção Hero (Capa) */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-100">Capa do Site (Hero)</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={layout.showHero}
                            onChange={(e) => setLayout(prev => ({ ...prev, showHero: e.target.checked }))}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                </div>

                {layout.showHero && (
                    <div className="space-y-4">
                        {/* Imagem */}
                        <div
                            className="h-48 rounded-lg bg-slate-800 border-2 border-dashed border-slate-700 flex items-center justify-center cursor-pointer hover:border-violet-500 transition-colors relative overflow-hidden group"
                            onClick={() => setShowHeroImageModal(true)}
                        >
                            {layout.heroImage ? (
                                <>
                                    <img src={layout.heroImage} alt="Hero" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center gap-2 text-white font-medium">
                                            <Icon name="camera" className="w-5 h-5" /> Alterar Imagem
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center">
                                    <Icon name="image" className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                                    <p className="text-slate-400 text-sm">Adicionar imagem de capa</p>
                                </div>
                            )}
                        </div>

                        {/* Textos */}
                        <div>
                            <label className="text-sm font-medium text-slate-300 block mb-1">Título de Destaque</label>
                            <input
                                type="text"
                                value={layout.heroTitle}
                                onChange={(e) => setLayout(prev => ({ ...prev, heroTitle: e.target.value }))}
                                placeholder="Ex: Seu estilo, nossa paixão"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 block mb-1">Subtítulo (Opcional)</label>
                            <input
                                type="text"
                                value={layout.heroSubtitle}
                                onChange={(e) => setLayout(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                                placeholder="Ex: A melhor barbearia da região"
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Seção Sobre */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-100">Sobre Nós</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={layout.showAbout}
                            onChange={(e) => setLayout(prev => ({ ...prev, showAbout: e.target.checked }))}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                </div>

                {layout.showAbout && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-300 block mb-1">Texto Descritivo</label>
                            <textarea
                                value={layout.aboutText}
                                onChange={(e) => setLayout(prev => ({ ...prev, aboutText: e.target.value }))}
                                placeholder="Conte um pouco sobre sua barbearia..."
                                rows={4}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 resize-none"
                            />
                        </div>
                    </div>
                )}
            </Card>

            {/* Botão Flutuante de Salvar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 md:relative md:bg-transparent md:border-0 md:p-0 z-10">
                <button
                    onClick={handleSaveAndPublish}
                    disabled={publishing || slugLoading || !isSlugAvailable}
                    className="w-full md:w-auto px-8 py-3 bg-violet-600 text-white font-bold rounded-lg shadow-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {publishing ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Publicando...
                        </>
                    ) : (
                        <>
                            <Icon name="check" className="w-5 h-5" />
                            Salvar e Publicar Site
                        </>
                    )}
                </button>
            </div>

            {/* Modais de Imagem */}
            <ImageUploadModal
                isOpen={showHeroImageModal}
                onClose={() => setShowHeroImageModal(false)}
                onSave={handleHeroImageSave}
                title="Imagem de Capa"
                aspectRatio="cover"
                currentImage={layout.heroImage}
            />
        </div>
    );
};
