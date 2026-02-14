import React, { useState, useEffect } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useServicesStore } from '@/store/services.store';
import { useUI } from '@/hooks/useUI';
import { Service, Combo } from '@/types';
import { ServiceFormModal } from '../components/ServiceFormModal';
import { ComboFormModal } from '../components/ComboFormModal';

export const ServicesSettingsPage: React.FC = () => {
  // Store
  const {
    services,
    combos,
    loading,
    fetchServices,
    fetchCombos,
    deleteService,
    deleteCombo,
    toggleServiceStatus,
    toggleComboStatus
  } = useServicesStore();

  const { openModal, closeModal, isModalOpen, success, error: showError } = useUI();

  // State
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showComboModal, setShowComboModal] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'service' | 'combo'>('service');

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchServices();
    fetchCombos();
  }, []);

  // Handlers - Services
  const handleNewService = () => {
    setEditingService(null);
    setShowServiceModal(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setMenuOpenId(null);
    setShowServiceModal(true);
  };

  const handleToggleServiceStatus = async (service: Service) => {
    try {
      await toggleServiceStatus(service.id, !service.active);
      setMenuOpenId(null);
      success(`Serviço ${!service.active ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (err) {
      showError('Erro ao alterar status do serviço');
    }
  };

  const handleDeleteServiceClick = (id: string) => {
    setDeletingId(id);
    setDeleteType('service');
    setMenuOpenId(null);
    openModal('confirmDelete');
  };

  // Handlers - Combos
  const handleNewCombo = () => {
    setEditingCombo(null);
    setShowComboModal(true);
  };

  const handleEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    setMenuOpenId(null);
    setShowComboModal(true);
  };

  const handleToggleComboStatus = async (combo: Combo) => {
    try {
      await toggleComboStatus(combo.id, !combo.active);
      setMenuOpenId(null);
      success(`Combo ${!combo.active ? 'ativado' : 'inativado'} com sucesso!`);
    } catch (err) {
      showError('Erro ao alterar status do combo');
    }
  };

  const handleDeleteComboClick = (id: string) => {
    setDeletingId(id);
    setDeleteType('combo');
    setMenuOpenId(null);
    openModal('confirmDelete');
  };

  // General Delete Confirm
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      if (deleteType === 'service') {
        await deleteService(deletingId);
        success('Serviço removido com sucesso!');
      } else {
        await deleteCombo(deletingId);
        success('Combo removido com sucesso!');
      }
      closeModal('confirmDelete');
      setDeletingId(null);
    } catch (err) {
      showError(`Erro ao remover ${deleteType === 'service' ? 'serviço' : 'combo'}`);
    }
  };

  // Helper to sort items: Active first, then Inactive
  const sortItems = <T extends { active?: boolean, name: string }>(items: T[]) => {
    return [...items].sort((a, b) => {
      // First by status (Active first)
      const aActive = a.active ?? true;
      const bActive = b.active ?? true;
      if (aActive !== bActive) return aActive ? -1 : 1;
      // Then by name
      return a.name.localeCompare(b.name);
    });
  };

  const sortedServices = sortItems(services);
  const sortedCombos = sortItems(combos);

  const deletingItem = deletingId
    ? (deleteType === 'service' ? services.find(s => s.id === deletingId) : combos.find(c => c.id === deletingId))
    : null;

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* SERVIÇOS SECTION */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-100 text-lg">Serviços</h2>
            <button
              onClick={handleNewService}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>Novo Serviço</span>
            </button>
          </div>

          {loading && services.length === 0 ? (
            <div className="pt-4">
              <CardSkeleton count={3} />
            </div>
          ) : sortedServices.length > 0 ? (
            <div className="space-y-3">
              {sortedServices.map(service => {
                const isActive = service.active ?? true;
                return (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-3 bg-slate-700/50 rounded-lg transition-all ${!isActive ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Foto do Serviço */}
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-600">
                        {service.imageUrl ? (
                          <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Icon name="scissors" className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-200">{service.name}</p>
                          {!isActive && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-600 text-slate-300 rounded uppercase">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>{service.duration} min</span>
                          <span>•</span>
                          <span className={service.promotionalPrice ? 'line-through text-slate-500' : 'text-slate-300'}>
                            R$ {service.price.toFixed(2)}
                          </span>
                          {service.promotionalPrice && (
                            <span className="text-green-400 font-bold">
                              R$ {service.promotionalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === service.id ? null : service.id)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <Icon name="dots" className="w-5 h-5" />
                      </button>

                      {menuOpenId === service.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down">
                            <button
                              onClick={() => handleEditService(service)}
                              className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 text-left transition-colors"
                            >
                              <Icon name="edit" className="w-4 h-4 mr-3 text-slate-400" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleServiceStatus(service)}
                              className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 text-left transition-colors border-t border-slate-700"
                            >
                              <Icon name={isActive ? 'eyeOff' : 'eye'} className="w-4 h-4 mr-3 text-slate-400" />
                              {isActive ? 'Inativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeleteServiceClick(service.id)}
                              className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-slate-700 text-left transition-colors border-t border-slate-700"
                            >
                              <Icon name="trash" className="w-4 h-4 mr-3" />
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="scissors" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">Nenhum serviço cadastrado.</p>
            </div>
          )}
        </Card>

        {/* COMBOS SECTION */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-100 text-lg">Combos</h2>
            <button
              onClick={handleNewCombo}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>Novo Combo</span>
            </button>
          </div>

          {loading && combos.length === 0 ? (
            <div className="pt-4">
              <CardSkeleton count={2} />
            </div>
          ) : sortedCombos.length > 0 ? (
            <div className="space-y-3">
              {sortedCombos.map(combo => {
                const isActive = combo.active ?? true;
                return (
                  <div
                    key={combo.id}
                    className={`flex items-center justify-between p-3 bg-slate-700/50 rounded-lg transition-all ${!isActive ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Foto do Combo */}
                      <div className="w-12 h-12 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden border border-slate-600">
                        {combo.imageUrl ? (
                          <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <Icon name="layers" className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-200">{combo.name}</p>
                          {!isActive && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-600 text-slate-300 rounded uppercase">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>{combo.duration} min</span>
                          <span>•</span>
                          <span className={combo.promotionalPrice ? 'line-through text-slate-500' : 'text-slate-300'}>
                            R$ {combo.price.toFixed(2)}
                          </span>
                          {combo.promotionalPrice && (
                            <span className="text-green-400 font-bold">
                              R$ {combo.promotionalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === combo.id ? null : combo.id)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <Icon name="dots" className="w-5 h-5" />
                      </button>

                      {menuOpenId === combo.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-down">
                            <button
                              onClick={() => handleEditCombo(combo)}
                              className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 text-left transition-colors"
                            >
                              <Icon name="edit" className="w-4 h-4 mr-3 text-slate-400" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleToggleComboStatus(combo)}
                              className="w-full flex items-center px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 text-left transition-colors border-t border-slate-700"
                            >
                              <Icon name={isActive ? 'eyeOff' : 'eye'} className="w-4 h-4 mr-3 text-slate-400" />
                              {isActive ? 'Inativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={() => handleDeleteComboClick(combo.id)}
                              className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-slate-700 text-left transition-colors border-t border-slate-700"
                            >
                              <Icon name="trash" className="w-4 h-4 mr-3" />
                              Excluir
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="layers" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">Nenhum combo cadastrado.</p>
              <button
                onClick={handleNewCombo}
                className="mt-4 px-6 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600"
              >
                Criar Primeiro Combo
              </button>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <ServiceFormModal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          setEditingService(null);
        }}
        editingService={editingService}
      />

      <ComboFormModal
        isOpen={showComboModal}
        onClose={() => {
          setShowComboModal(false);
          setEditingCombo(null);
        }}
        editingCombo={editingCombo}
      />

      <Modal
        isOpen={isModalOpen('confirmDelete')}
        onClose={() => {
          closeModal('confirmDelete');
          setDeletingId(null);
        }}
        title="Confirmar Exclusão"
      >
        {deletingItem && (
          <div className="space-y-4">
            <p className="text-slate-300">
              Tem certeza que deseja remover o {deleteType === 'service' ? 'serviço' : 'combo'} <strong>{deletingItem.name}</strong>?
            </p>
            <p className="text-sm text-slate-400">Esta ação não pode ser desfeita.</p>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  closeModal('confirmDelete');
                  setDeletingId(null);
                }}
                className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700"
              >
                Sim, remover
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
