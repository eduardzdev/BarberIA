/**
 * ProfessionalFormModal - Modal melhorado para criar/editar profissional
 *
 * Funcionalidades:
 * - Nome do profissional
 * - Upload de foto (1:1) em vez de URL
 * - Seleção de serviços que NÃO realiza
 * - Horários em que NÃO atende
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useServices } from '@/hooks/useServices';
import { useUI } from '@/hooks/useUI';
import { Barber } from '@/types';
import { ImageUploadModal } from '@/features/profile/components/ImageUploadModal';

interface ProfessionalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBarber?: Barber | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export const ProfessionalFormModal: React.FC<ProfessionalFormModalProps> = ({
  isOpen,
  onClose,
  editingBarber,
}) => {
  const { addBarber, updateBarber } = useBarbershop();
  const { services } = useServices({ autoFetch: true });
  const { success, error: showError } = useUI();

  const [loading, setLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    avatarUrl: '',
    servicesNotProvided: [] as string[],
    unavailableHours: [] as { dayOfWeek: number; startTime: string; endTime: string }[],
  });

  // Atualizar formData quando o modal abrir ou barber mudar
  useEffect(() => {
    if (isOpen) {
      if (editingBarber) {
        setFormData({
          name: editingBarber.name || '',
          avatarUrl: editingBarber.avatarUrl || '',
          servicesNotProvided: editingBarber.servicesNotProvided || [],
          unavailableHours: editingBarber.unavailableHours || [],
        });
      } else {
        setFormData({
          name: '',
          avatarUrl: '',
          servicesNotProvided: [],
          unavailableHours: [],
        });
      }
    }
  }, [isOpen, editingBarber]);

  if (!isOpen) return null;

  const handleAvatarSave = async (imageUrl: string | null) => {
    setFormData(prev => ({ ...prev, avatarUrl: imageUrl || '' }));
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      servicesNotProvided: prev.servicesNotProvided.includes(serviceId)
        ? prev.servicesNotProvided.filter(id => id !== serviceId)
        : [...prev.servicesNotProvided, serviceId],
    }));
  };

  const addUnavailableHour = () => {
    setFormData(prev => ({
      ...prev,
      unavailableHours: [
        ...prev.unavailableHours,
        { dayOfWeek: 1, startTime: '12:00', endTime: '13:00' },
      ],
    }));
  };

  const removeUnavailableHour = (index: number) => {
    setFormData(prev => ({
      ...prev,
      unavailableHours: prev.unavailableHours.filter((_, i) => i !== index),
    }));
  };

  const updateUnavailableHour = (
    index: number,
    field: 'dayOfWeek' | 'startTime' | 'endTime',
    value: number | string
  ) => {
    setFormData(prev => ({
      ...prev,
      unavailableHours: prev.unavailableHours.map((hour, i) =>
        i === index ? { ...hour, [field]: value } : hour
      ),
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('Digite o nome do profissional');
      return;
    }

    setLoading(true);
    try {
      // Cria o objeto barberData garantindo que não existam campos undefined
      // Firestore lança erro se passar undefined
      const barberData: any = {
        name: formData.name.trim(),
      };

      if (formData.avatarUrl) {
        barberData.avatarUrl = formData.avatarUrl;
      }

      if (formData.servicesNotProvided.length > 0) {
        barberData.servicesNotProvided = formData.servicesNotProvided;
      }

      if (formData.unavailableHours.length > 0) {
        barberData.unavailableHours = formData.unavailableHours;
      }

      if (editingBarber) {
        await updateBarber(editingBarber.id, barberData);
        success('Profissional atualizado com sucesso!');
      } else {
        await addBarber(barberData);
        success('Profissional adicionado com sucesso!');
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      showError('Erro ao salvar profissional. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2">
        <div className="bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm mx-2 max-h-[90vh] overflow-y-auto border border-slate-800">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100">
              {editingBarber ? 'Editar Profissional' : 'Novo Profissional'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Icon name="close" className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Foto */}
            <div className="flex flex-col items-center">
              <div className="relative">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-slate-800"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-800 flex items-center justify-center">
                    <Icon name="user" className="w-8 h-8 text-slate-600" />
                  </div>
                )}
                <button
                  onClick={() => setShowAvatarModal(true)}
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
                Nome do Profissional *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: João Silva"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Serviços que NÃO realiza */}
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Serviços que NÃO realiza (opcional)
              </label>
              {services.length > 0 ? (
                <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {services.map(service => (
                    <label key={service.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.servicesNotProvided.includes(service.id)}
                        onChange={() => toggleService(service.id)}
                        className="w-4 h-4 text-violet-600 bg-slate-700 border-slate-600 rounded focus:ring-violet-500"
                      />
                      <span className="text-slate-300 text-sm">{service.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm py-2">
                  Nenhum serviço cadastrado. Cadastre serviços na página de Serviços primeiro.
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Marque os serviços que este profissional NÃO realiza. Deixe vazio se realiza todos.
              </p>
            </div>

            {/* Horários em que NÃO atende */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-300">
                  Horários em que NÃO atende (opcional)
                </label>
                <button
                  onClick={addUnavailableHour}
                  className="text-violet-400 hover:text-violet-300 transition-colors text-sm flex items-center gap-1"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  Adicionar
                </button>
              </div>

              {formData.unavailableHours.length > 0 ? (
                <div className="space-y-2">
                  {formData.unavailableHours.map((hour, index) => (
                    <div
                      key={index}
                      className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 space-y-2"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Dia</label>
                          <select
                            value={hour.dayOfWeek}
                            onChange={(e) =>
                              updateUnavailableHour(index, 'dayOfWeek', parseInt(e.target.value))
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          >
                            {DAYS_OF_WEEK.map(day => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Início</label>
                          <input
                            type="time"
                            value={hour.startTime}
                            onChange={(e) =>
                              updateUnavailableHour(index, 'startTime', e.target.value)
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Fim</label>
                          <input
                            type="time"
                            value={hour.endTime}
                            onChange={(e) =>
                              updateUnavailableHour(index, 'endTime', e.target.value)
                            }
                            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeUnavailableHour(index)}
                        className="text-red-400 hover:text-red-300 transition-colors text-xs flex items-center gap-1"
                      >
                        <Icon name="trash" className="w-3 h-3" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm py-2 bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                  Nenhum horário indisponível. Deixe vazio se atende em todos os horários da barbearia.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
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
              {loading ? 'Salvando...' : editingBarber ? 'Atualizar' : 'Adicionar'}
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Upload Modal */}
      <ImageUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSave={handleAvatarSave}
        title="Foto do Profissional"
        currentImage={formData.avatarUrl}
        aspectRatio="square"
      />
    </>
  );
};
