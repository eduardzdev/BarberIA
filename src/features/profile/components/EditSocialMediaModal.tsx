/**
 * EditSocialMediaModal - Modal para editar redes sociais
 *
 * Funcionalidades:
 * - Editar Instagram
 * - Editar Facebook
 * - Editar Website/TikTok
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';

interface EditSocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditSocialMediaModal: React.FC<EditSocialMediaModalProps> = ({ isOpen, onClose }) => {
  const { shopInfo, updateShopInfo } = useBarbershop();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    instagram: shopInfo?.instagram || '',
    facebook: shopInfo?.facebook || '',
    website: shopInfo?.website || '',
  });

  // Atualizar formData quando o modal abrir
  useEffect(() => {
    if (isOpen && shopInfo) {
      setFormData({
        instagram: shopInfo.instagram || '',
        facebook: shopInfo.facebook || '',
        website: shopInfo.website || '',
      });
    }
  }, [isOpen, shopInfo]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateShopInfo({
        instagram: formData.instagram,
        facebook: formData.facebook,
        website: formData.website,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar redes sociais:', error);
      alert('Erro ao salvar redes sociais. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
      <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 border border-slate-800">
        {/* Header */}
        <div className="border-b border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Nossas Redes</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Instagram */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
              <Icon name="instagram" className="text-pink-500" />
              Instagram
            </label>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">@</span>
              <input
                type="text"
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value.replace('@', '') }))}
                placeholder="seuinstagram"
                className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Digite apenas o nome de usuário, sem @</p>
          </div>

          {/* Facebook */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
              <Icon name="facebook" className="text-blue-500" />
              Facebook
            </label>
            <input
              type="text"
              value={formData.facebook}
              onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
              placeholder="facebook.com/seu-perfil ou nome de usuário"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Pode ser o link completo ou apenas o nome de usuário
            </p>
          </div>

          {/* Website / TikTok */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2 flex items-center gap-2">
              <Icon name="globe" className="text-green-500" />
              Site / TikTok
            </label>
            <input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://seu-site.com ou @tiktok"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Link do seu site ou usuário do TikTok
            </p>
          </div>

          {/* Info */}
          <div className="bg-violet-500/10 border border-violet-500/30 rounded-lg p-3">
            <p className="text-xs text-slate-300">
              Essas informações serão exibidas no seu perfil público e na página de agendamento
              para que seus clientes possam encontrar suas redes sociais.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 p-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 font-medium hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${loading
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-violet-600 text-white hover:bg-violet-700'
              }`}
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};
