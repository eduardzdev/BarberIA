/**
 * ProfilePage - Página de perfil da barbearia
 * 
 * Página pública do perfil da empresa:
 * - Logo
 * - Informações da barbearia
 * - Descrição "Sobre Nós"
 * - Contato e localização
 * - Redes sociais
 * - Botão para editar perfil
 * 
 * Integração com BarbershopStore:
 * - Busca informações da barbearia
 * - Atualização de dados (futura feature)
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 9 (Perfil)
 * - DESCRICAO_FEATURES.md - Seção 9 (Perfil da Barbearia)
 * 
 * Features:
 * - Design de perfil limpo e moderno
 * - Cards organizados com informações
 * - Links para redes sociais
 * - Localização e contato
 */

import React from 'react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useUI } from '@/hooks/useUI';
import { useAuth } from '@/hooks/useAuth';
import { BarbershopSetupModal } from '../components/BarbershopSetupModal';
import { ImageUploadModal } from '../components/ImageUploadModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { EditContactModal } from '../components/EditContactModal';
import { EditSocialMediaModal } from '../components/EditSocialMediaModal';

// Helper para determinar saudação baseado na hora
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

// ===== Sub-Components =====

/**
 * SettingsItem - Item de configuração reutilizável
 */
interface SettingsItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, sublabel, onClick, children }) => {
  const content = (
    <div className="flex items-center justify-between w-full py-4 px-4 transition-all">
      <div className="flex items-center space-x-4">
        <Icon name={icon} className="w-6 h-6 text-slate-400" />
        <div>
          <p className="font-semibold text-slate-200">{label}</p>
          {sublabel && <p className="text-sm text-slate-500">{sublabel}</p>}
        </div>
      </div>
      <div>{children ? children : onClick && <Icon name="right" className="w-5 h-5 text-slate-500" />}</div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-slate-700/40 transition-all rounded-xl">
        {content}
      </button>
    );
  }
  return <div className="w-full px-4">{content}</div>;
};

// ===== Main Component =====

export const ProfilePage: React.FC = () => {
  // Hooks
  const { shopInfo, loading, updateShopInfo } = useBarbershop({ autoFetch: true });
  const { user } = useAuth();
  const { openModal } = useUI();
  const [showSetupModal, setShowSetupModal] = React.useState(false);
  const [showLogoModal, setShowLogoModal] = React.useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = React.useState(false);
  const [showEditContactModal, setShowEditContactModal] = React.useState(false);
  const [showEditSocialModal, setShowEditSocialModal] = React.useState(false);

  const handleEditProfile = () => {
    setShowEditProfileModal(true);
  };

  const handleLogoSave = async (imageUrl: string | null) => {
    await updateShopInfo({ logoUrl: imageUrl || '' });
  };

  const handleOpenLocation = () => {
    if (shopInfo?.address) {
      // Log removed
    }
  };

  const handleOpenPhone = () => {
    if (shopInfo?.phone) {
      window.open(`https://wa.me/${shopInfo.phone.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleOpenSocialMedia = (platform: string, username?: string) => {
    if (!username) return;

    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${username.replace('@', '')}`,
      facebook: username.includes('facebook.com')
        ? username
        : `https://facebook.com/${username}`,
      website: username.startsWith('http') ? username : `https://${username}`,
    };

    const url = urls[platform];
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-6">
        <div className="animate-pulse">
          <div className="h-32 bg-slate-700 rounded-lg"></div>
          <div className="h-24 w-24 bg-slate-700 rounded-full mt-[-3rem] ml-4"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="-m-4">
        {/* Simplified Header with Logo */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 pt-12 pb-8 px-4 relative border-b border-slate-800">
          <div className="flex flex-col items-center">
            {/* Logo with Edit Button */}
            <div className="relative group/logo cursor-pointer mb-4" onClick={() => setShowLogoModal(true)}>
              {shopInfo?.logoUrl ? (
                <img
                  src={shopInfo.logoUrl}
                  alt="Logo da Barbearia"
                  className="w-28 h-28 rounded-full border-4 border-slate-900 object-cover shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center shadow-2xl">
                  <Icon name="image" className="w-10 h-10 text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/logo:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                <Icon name="camera" className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title and Username */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-100 mb-1">
                {shopInfo?.name || 'Minha Barbearia'}
              </h1>
              <p className="text-slate-400 text-sm">
                @{shopInfo?.username || shopInfo?.name?.toLowerCase().replace(/\s+/g, '') || 'barbershop'}
              </p>
            </div>

            {/* Edit Button */}
            <button
              onClick={handleEditProfile}
              className="mt-6 px-6 py-2 text-sm font-semibold bg-violet-600/10 text-violet-400 border border-violet-500/20 rounded-full hover:bg-violet-600/20 transition-all active:scale-95"
            >
              Editar Perfil
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-6 space-y-6">
          {/* About Section */}
          {shopInfo?.description && (
            <Card>
              <h2 className="font-bold text-slate-100 mb-2">Sobre Nós</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{shopInfo.description}</p>
            </Card>
          )}

          {/* Contact and Location */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-100">Contato e Localização</h2>
              <button
                onClick={() => setShowEditContactModal(true)}
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Icon name="edit" className="w-5 h-5" />
              </button>
            </div>
            {(shopInfo?.address || shopInfo?.phone) ? (
              <div className="divide-y divide-slate-700/50">
                {shopInfo.address && (
                  <SettingsItem
                    icon="map"
                    label={shopInfo.address}
                    sublabel={shopInfo.city && shopInfo.state ? `${shopInfo.city}, ${shopInfo.state}` : undefined}
                    onClick={handleOpenLocation}
                  />
                )}
                {shopInfo.phone && (
                  <SettingsItem
                    icon="phone"
                    label={shopInfo.phone}
                    sublabel="WhatsApp"
                    onClick={handleOpenPhone}
                  />
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">
                Adicione informações de contato e localização
              </p>
            )}
          </Card>

          {/* Social Media */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-slate-100">Nossas Redes</h2>
              <button
                onClick={() => setShowEditSocialModal(true)}
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Icon name="edit" className="w-5 h-5" />
              </button>
            </div>
            {(shopInfo?.instagram || shopInfo?.facebook || shopInfo?.website) ? (
              <div className="divide-y divide-slate-700/50">
                {shopInfo.instagram && (
                  <SettingsItem
                    icon="instagram"
                    label="Instagram"
                    sublabel={`@${shopInfo.instagram}`}
                    onClick={() => handleOpenSocialMedia('instagram', shopInfo.instagram)}
                  />
                )}
                {shopInfo.facebook && (
                  <SettingsItem
                    icon="facebook"
                    label="Facebook"
                    sublabel={shopInfo.facebook}
                    onClick={() => handleOpenSocialMedia('facebook', shopInfo.facebook)}
                  />
                )}
                {shopInfo.website && (
                  <SettingsItem
                    icon="globe"
                    label="Nosso Site"
                    sublabel={shopInfo.website}
                    onClick={() => handleOpenSocialMedia('website', shopInfo.website)}
                  />
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">
                Adicione suas redes sociais
              </p>
            )}
          </Card>

          {/* Empty State */}
          {!shopInfo?.address && !shopInfo?.phone && !shopInfo?.instagram && !shopInfo?.facebook && !shopInfo?.website && (
            <div className="text-center py-8">
              <Icon name="user" className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-slate-400 text-sm mt-4">
                Complete seu perfil para que seus clientes conheçam melhor sua barbearia.
              </p>
              <button
                onClick={() => setShowSetupModal(true)}
                className="mt-4 px-6 py-2 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-all active:scale-95"
              >
                Completar Perfil
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Setup Modal */}
      <BarbershopSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
      />

      {/* Logo Image Modal */}
      <ImageUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onSave={handleLogoSave}
        title="Alterar Logo"
        currentImage={shopInfo?.logoUrl}
        aspectRatio="square"
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={showEditContactModal}
        onClose={() => setShowEditContactModal(false)}
      />

      {/* Edit Social Media Modal */}
      <EditSocialMediaModal
        isOpen={showEditSocialModal}
        onClose={() => setShowEditSocialModal(false)}
      />
    </>
  );
};
