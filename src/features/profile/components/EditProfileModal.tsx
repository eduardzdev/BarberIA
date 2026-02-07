/**
 * EditProfileModal - Modal para editar perfil da barbearia
 *
 * Funcionalidades:
 * - Editar nome da barbearia
 * - Editar username (@usuario)
 * - Editar descrição (Sobre Nós)
 * - Upload de logo (foto de perfil)
 */

import React, { useState } from 'react';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';
import { ImageUploadModal } from './ImageUploadModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { shopInfo, updateShopInfo } = useBarbershop();
  const [loading, setLoading] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const [formData, setFormData] = useState({
    name: shopInfo?.name || '',
    username: shopInfo?.username || '',
    description: shopInfo?.description || '',
    logoUrl: shopInfo?.logoUrl || '',
  });

  // Atualizar formData quando o modal abrir
  React.useEffect(() => {
    if (isOpen && shopInfo) {
      setFormData({
        name: shopInfo.name || '',
        username: shopInfo.username || '',
        description: shopInfo.description || '',
        logoUrl: shopInfo.logoUrl || '',
      });
    }
  }, [isOpen, shopInfo]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Nome da barbearia é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await updateShopInfo({
        name: formData.name,
        username: formData.username,
        description: formData.description,
        logoUrl: formData.logoUrl,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSave = async (imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, logoUrl: imageUrl || '' }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
        <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto border border-slate-800">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">Editar Perfil</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Logo */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={formData.logoUrl || 'https://i.pravatar.cc/150?u=barbershop'}
                  alt="Logo"
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-800"
                />
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="absolute bottom-0 right-0 bg-violet-600 text-white p-2 rounded-full hover:bg-violet-700 transition-colors"
                >
                  <Icon name="camera" className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Clique no ícone para alterar a foto</p>
            </div>

            {/* Nome */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Nome da Barbearia *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Barbearia do João"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Username */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Nome de Usuário
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s+/g, '') }))}
                  placeholder="nomedeusuario"
                  className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Apenas letras minúsculas e números, sem espaços</p>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Sobre Nós
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Conte um pouco sobre sua barbearia..."
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                Máximo 500 caracteres ({formData.description.length}/500)
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 font-medium hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !formData.name.trim()}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${loading || !formData.name.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      {/* Logo Upload Modal */}
      <ImageUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        onSave={handleLogoSave}
        title="Alterar Logo"
        currentImage={formData.logoUrl}
        aspectRatio="square"
      />
    </>
  );
};
