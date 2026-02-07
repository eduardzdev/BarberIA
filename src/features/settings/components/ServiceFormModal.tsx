import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useServicesStore } from '@/store/services.store';
import { useUI } from '@/hooks/useUI';
import { Service } from '@/types';
import { ImageUploadModal } from '@/features/profile/components/ImageUploadModal';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService?: Service | null;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  editingService,
}) => {
  const { createService, updateService } = useServicesStore();
  const { success, error: showError } = useUI();

  // Modal de Imagem
  const [showImageModal, setShowImageModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    duration: 60,
    price: 0,
    promotionalPrice: undefined as number | undefined,
    imageUrl: '',
    isPromotion: false,
    active: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        setFormData({
          name: editingService.name,
          duration: editingService.duration,
          price: editingService.price,
          promotionalPrice: editingService.promotionalPrice,
          imageUrl: editingService.imageUrl || '',
          isPromotion: !!editingService.promotionalPrice,
          active: editingService.active ?? true,
        });
      } else {
        setFormData({
          name: '',
          duration: 60,
          price: 0,
          promotionalPrice: undefined,
          imageUrl: '',
          isPromotion: false,
          active: true,
        });
      }
    }
  }, [isOpen, editingService]);

  if (!isOpen) return null;

  const handleImageSave = async (url: string | null) => {
    setFormData(prev => ({ ...prev, imageUrl: url || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Digite o nome do serviço');
      return;
    }
    if (formData.price <= 0) {
      showError('Digite um preço válido');
      return;
    }
    if (formData.duration < 15) {
      showError('A duração mínima é de 15 minutos');
      return;
    }

    setLoading(true);
    try {
      // Garantir que não enviamos undefined para o Firestore
      const data: any = {
        name: formData.name.trim(),
        duration: formData.duration,
        price: Number(formData.price),
        active: formData.active,
      };

      if (formData.isPromotion && formData.promotionalPrice) {
        data.promotionalPrice = Number(formData.promotionalPrice);
      }

      if (formData.imageUrl) {
        data.imageUrl = formData.imageUrl;
      }

      if (editingService) {
        await updateService(editingService.id, data);
        success('Serviço atualizado com sucesso!');
      } else {
        await createService(data);
        success('Serviço adicionado com sucesso!');
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      showError('Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
        <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto border border-slate-800">
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-slate-100">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Foto */}
            <div className="flex justify-center">
              <div className="relative group cursor-pointer" onClick={() => setShowImageModal(true)}>
                <div className="w-32 h-32 rounded-lg bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="Serviço" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Icon name="camera" className="w-8 h-8 mx-auto text-slate-500 mb-1" />
                      <span className="text-xs text-slate-400">Adicionar foto</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                  <span className="text-white text-sm font-medium">Alterar</span>
                </div>
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Serviço *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Corte de Cabelo"
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Duração e Preço */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Duração (min) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                  min="15"
                  step="15"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Preço Original (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Promoção */}
            <div className="space-y-4 pt-2 border-t border-slate-800">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isPromotion ? 'bg-violet-600' : 'bg-slate-600'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.isPromotion ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
                <span className="text-sm font-medium text-slate-200">
                  Adicionar Preço Promocional?
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.isPromotion}
                  onChange={(e) => setFormData({ ...formData, isPromotion: e.target.checked })}
                />
              </label>

              {formData.isPromotion && (
                <div className="animate-fade-in-down">
                  <label className="block text-sm font-medium text-slate-400 mb-1">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.promotionalPrice || ''}
                    onChange={(e) => setFormData({ ...formData, promotionalPrice: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 border-l-4 border-l-green-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-green-400 mt-1">
                    Este será o preço exibido para o cliente.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-slate-800 text-slate-300 font-medium py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-violet-600 text-white font-medium py-2 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editingService ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSave={handleImageSave}
        title="Foto do Serviço"
        aspectRatio="square"
        currentImage={formData.imageUrl}
      />
    </>
  );
};
