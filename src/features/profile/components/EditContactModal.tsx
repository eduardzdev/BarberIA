import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({ isOpen, onClose }) => {
  const { shopInfo, updateShopInfo } = useBarbershop();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    address: '', // Rua e número
    neighborhood: '',
    city: '',
    state: '',
    phone: '',
  });

  useEffect(() => {
    if (isOpen && shopInfo) {
      // Tentar separar endereço e bairro se estiverem concatenados (formato "Rua, Bairro")
      // Se não, coloca tudo em address
      let addr = shopInfo.address || '';
      let neigh = '';

      if (addr.includes(' - ')) {
        const parts = addr.split(' - ');
        // Pega a última parte como bairro se houver separador " - "
        if (parts.length > 1) {
          neigh = parts.pop() || '';
          addr = parts.join(' - ');
        }
      }

      setFormData({
        address: addr,
        neighborhood: neigh,
        city: shopInfo.city || '',
        state: shopInfo.state || '',
        phone: shopInfo.phone || '',
      });
    }
  }, [isOpen, shopInfo]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!formData.address.trim() || !formData.phone.trim() || !formData.city.trim() || !formData.state.trim()) {
      alert('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      // Concatenando para manter compatibilidade com campo único
      const fullAddress = formData.neighborhood
        ? `${formData.address} - ${formData.neighborhood}`
        : formData.address;

      await updateShopInfo({
        address: fullAddress,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar contato:', error);
      alert('Erro ao salvar contato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
      <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto border border-slate-800">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">Contato e Localização</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Endereço */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Endereço (Rua, Número) *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Ex: Rua das Flores, 123"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Bairro */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              Bairro *
            </label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              placeholder="Ex: Centro"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Cidade *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Ex: São Paulo"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Estado *
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                placeholder="SP"
                maxLength={2}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase"
              />
            </div>
          </div>

          {/* Telefone */}
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-2">
              WhatsApp *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-8888"
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
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
