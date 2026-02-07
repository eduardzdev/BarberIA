import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useServicesStore } from '@/store/services.store';
import { Combo } from '@/types';
import { useUI } from '@/hooks/useUI';
import { ImageUploadModal } from '@/features/profile/components/ImageUploadModal';

interface ComboFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCombo?: Combo | null;
}

export const ComboFormModal: React.FC<ComboFormModalProps> = ({
  isOpen,
  onClose,
  editingCombo,
}) => {
  const { services, createCombo, updateCombo } = useServicesStore();
  const { success, error: showError } = useUI();
  const [loading, setLoading] = useState(false);

  // Image Upload state
  const [showImageModal, setShowImageModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    serviceIds: [] as string[],
    price: 0,
    promotionalPrice: undefined as number | undefined,
    duration: 0,
    imageUrl: '',
    isPromotion: false,
  });

  useEffect(() => {
    if (isOpen) {
      if (editingCombo) {
        setFormData({
          name: editingCombo.name,
          serviceIds: editingCombo.serviceIds,
          price: editingCombo.price,
          promotionalPrice: editingCombo.promotionalPrice,
          duration: editingCombo.duration,
          imageUrl: editingCombo.imageUrl || '',
          isPromotion: !!editingCombo.promotionalPrice,
        });
      } else {
        setFormData({
          name: '',
          serviceIds: [],
          price: 0,
          promotionalPrice: undefined,
          duration: 0,
          imageUrl: '',
          isPromotion: false,
        });
      }
    }
  }, [isOpen, editingCombo]);

  if (!isOpen) return null;

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.serviceIds.includes(serviceId);
      const newServiceIds = isSelected
        ? prev.serviceIds.filter(id => id !== serviceId)
        : [...prev.serviceIds, serviceId];

      // Recalcular preço e duração sugeridos
      const selectedServices = services.filter(s => newServiceIds.includes(s.id));
      const suggestedPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
      const suggestedDuration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

      return {
        ...prev,
        serviceIds: newServiceIds,
        price: suggestedPrice,
        duration: suggestedDuration,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.serviceIds.length === 0) {
      showError('Preencha o nome e selecione pelo menos um serviço');
      return;
    }

    setLoading(true);
    try {
      // Garantir que não enviamos undefined para o Firestore
      const comboData: any = {
        name: formData.name,
        serviceIds: formData.serviceIds,
        price: Number(formData.price),
        duration: Number(formData.duration),
        active: true,
      };

      if (formData.isPromotion && formData.promotionalPrice) {
        comboData.promotionalPrice = Number(formData.promotionalPrice);
      }

      if (formData.imageUrl) {
        comboData.imageUrl = formData.imageUrl;
      }

      if (editingCombo) {
        await updateCombo(editingCombo.id, comboData);
        success('Combo atualizado com sucesso!');
      } else {
        await createCombo(comboData);
        success('Combo criado com sucesso!');
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar combo:', error);
      showError('Erro ao salvar combo');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSave = async (url: string | null) => {
    setFormData(prev => ({ ...prev, imageUrl: url || '' }));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
        <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto border border-slate-800">
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10">
            <h2 className="text-lg font-bold text-slate-100">
              {editingCombo ? 'Editar Combo' : 'Novo Combo'}
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
                    <img src={formData.imageUrl} alt="Combo" className="w-full h-full object-cover" />
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
              <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Combo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="Ex: Barba + Cabelo"
              />
            </div>

            {/* Seleção de Serviços */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Serviços Incluídos *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-slate-800/30 p-2 rounded-lg border border-slate-700">
                {services.map(service => (
                  <label key={service.id} className="flex items-center space-x-3 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.serviceIds.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-4 h-4 text-violet-600 bg-slate-700 border-slate-600 rounded focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-200">{service.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preço e Duração */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Preço Original (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Duração (min) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 border-l-4 border-l-green-500"
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
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : editingCombo ? 'Atualizar' : 'Criar Combo'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSave={handleImageSave}
        title="Foto do Combo"
        aspectRatio="square"
        currentImage={formData.imageUrl}
      />
    </>
  );
};
