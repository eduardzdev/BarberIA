/**
 * ShopSettingsPage - Página de configurações da barbearia
 * 
 * Página para gerenciar configurações operacionais:
 * - Lista de profissionais (barbeiros/cabeleireiros)
 * - Horários de funcionamento
 * - Formas de pagamento aceitas
 * - CRUD de profissionais
 * 
 * Integração com BarbershopStore:
 * - Gestão de profissionais
 * - Configuração de horários
 * - Métodos de pagamento
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 10 (Configurações da Barbearia)
 * - DESCRICAO_FEATURES.md - Seção 10 (Configurações)
 * 
 * Features:
 * - Lista de profissionais com avatar
 * - Adicionar/Editar/Remover profissionais
 * - Horários semanais
 * - Toggle de métodos de pagamento
 */

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useBarbershop } from '@/hooks/useBarbershop';
import { useUI } from '@/hooks/useUI';
import { Barber } from '@/types';
import { ProfessionalFormModal } from '../components/ProfessionalFormModal';
import { BusinessHoursModal } from '../components/BusinessHoursModal';

// Helper para somar minutos a um horário HH:MM
const addMinutes = (time: string, minutes: number): string => {
  const [h, m] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
    <div className="flex items-center justify-between w-full py-3">
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
      <button onClick={onClick} className="w-full text-left hover:bg-slate-700/30 transition-colors">
        {content}
      </button>
    );
  }
  return <div className="w-full">{content}</div>;
};

/**
 * ToggleSwitch - Switch toggle reutilizável
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${enabled ? 'bg-violet-600' : 'bg-slate-600'
      }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
    />
  </button>
);


// ===== Main Component =====

export const ShopSettingsPage: React.FC = () => {
  // Hooks
  const {
    shopInfo,
    barbers,
    businessHours,
    paymentMethods,
    loading,
    removeBarber,
    addPaymentMethod,
    removePaymentMethod
  } = useBarbershop({ autoFetch: true });

  const { openModal, closeModal, isModalOpen, success, error: showError } = useUI();

  // State
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);

  // Payment methods state (initialized from barbershop data)
  const [localPaymentMethods, setLocalPaymentMethods] = useState({
    pix: paymentMethods.includes('Pix'),
    cash: paymentMethods.includes('Dinheiro'),
    card: paymentMethods.includes('Cartão')
  });

  // Handlers
  const handleNewProfessional = () => {
    setEditingBarber(null);
    setShowProfessionalModal(true);
  };

  const handleEditProfessional = (barber: Barber) => {
    setEditingBarber(barber);
    setShowProfessionalModal(true);
  };

  const handleCloseProfessionalModal = () => {
    setShowProfessionalModal(false);
    setEditingBarber(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    openModal('confirmDelete');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await removeBarber(deletingId);
      success('Profissional removido com sucesso!');
      closeModal('confirmDelete');
      setDeletingId(null);
    } catch (err) {
      showError('Erro ao remover profissional');
    }
  };

  const handlePaymentMethodToggle = async (method: 'pix' | 'cash' | 'card', enabled: boolean) => {
    const methodName = method === 'pix' ? 'Pix' : method === 'cash' ? 'Dinheiro' : 'Cartão';

    try {
      if (enabled) {
        await addPaymentMethod(methodName);
      } else {
        await removePaymentMethod(methodName);
      }
      setLocalPaymentMethods(prev => ({ ...prev, [method]: enabled }));
    } catch (err) {
      showError('Erro ao atualizar formas de pagamento');
    }
  };

  const deletingBarber = deletingId
    ? barbers.find(p => p.id === deletingId)
    : null;

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Professionals Section */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-100 text-lg">Profissionais</h2>
            <button
              onClick={handleNewProfessional}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Icon name="plus" className="w-4 h-4" />
              <span>Adicionar Novo</span>
            </button>
          </div>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin w-6 h-6 border-4 border-violet-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : barbers.length > 0 ? (
            <div className="space-y-3">
              {barbers.map(barber => (
                <div
                  key={barber.id}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {barber.avatarUrl ? (
                      <img
                        src={barber.avatarUrl}
                        alt={barber.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Icon name="user" className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <p className="font-semibold text-slate-200">{barber.name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProfessional(barber)}
                      className="p-1.5 text-slate-400 hover:text-white transition-colors"
                    >
                      <Icon name="edit" className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(barber.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Icon name="trash" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Icon name="users" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">Nenhum profissional cadastrado ainda.</p>
            </div>
          )}
        </Card>

        {/* Opening Hours Section */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-100 text-lg">Horários de Funcionamento</h2>
            <button
              onClick={() => setShowBusinessHoursModal(true)}
              className="px-3 py-1.5 text-sm font-semibold bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"
            >
              Editar
            </button>
          </div>
          <ul className="text-sm space-y-2">
            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dayName, index) => {
              // Encontrar a configuração específica para este dia
              // Se não existir schedule (dados antigos), fallback para lógica anterior ou fechado
              const daySchedule = businessHours?.schedule?.find(d => d.dayOfWeek === index);

              // Retrocompatibilidade: Se não houver schedule, tenta usar daysOfWeek antigo ou assume fechado
              const isOpen = daySchedule ? daySchedule.isOpen : false;

              const hours = isOpen && daySchedule
                ? `${daySchedule.startTime} - ${daySchedule.endTime}`
                : 'Fechado';

              const lunchInfo = isOpen && daySchedule?.hasLunchBreak
                ? ` (Almoço: ${daySchedule.lunchStart} - ${addMinutes(daySchedule.lunchStart, daySchedule.lunchDuration)})`
                : '';

              return (
                <li key={index} className="flex flex-col border-b border-slate-800/50 last:border-0 pb-2 last:pb-0">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{dayName}:</span>
                    <span className={`font-semibold ${isOpen ? 'text-slate-200' : 'text-red-400'}`}>
                      {hours}
                    </span>
                  </div>
                  {lunchInfo && (
                    <div className="text-xs text-slate-500 text-right">
                      {lunchInfo}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Payment Methods Section */}
        <Card>
          <h2 className="font-bold text-slate-100 text-lg mb-2">Formas de Pagamento</h2>
          <div className="divide-y divide-slate-700/50">
            <SettingsItem icon="receipt" label="PIX">
              <ToggleSwitch
                enabled={paymentMethods.includes('Pix')}
                onChange={(enabled) => handlePaymentMethodToggle('pix', enabled)}
              />
            </SettingsItem>
            <SettingsItem icon="cash" label="Dinheiro">
              <ToggleSwitch
                enabled={paymentMethods.includes('Dinheiro')}
                onChange={(enabled) => handlePaymentMethodToggle('cash', enabled)}
              />
            </SettingsItem>
            <SettingsItem icon="creditCard" label="Cartão de Crédito/Débito">
              <ToggleSwitch
                enabled={paymentMethods.includes('Cartão')}
                onChange={(enabled) => handlePaymentMethodToggle('card', enabled)}
              />
            </SettingsItem>
          </div>
        </Card>
      </div>

      {/* Professional Modal */}
      <ProfessionalFormModal
        isOpen={showProfessionalModal}
        onClose={handleCloseProfessionalModal}
        editingBarber={editingBarber}
      />

      {/* Business Hours Modal */}
      <BusinessHoursModal
        isOpen={showBusinessHoursModal}
        onClose={() => setShowBusinessHoursModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isModalOpen('confirmDelete')}
        onClose={() => {
          closeModal('confirmDelete');
          setDeletingId(null);
        }}
        title="Confirmar Exclusão"
      >
        {deletingBarber && (
          <div className="space-y-4">
            <p className="text-slate-300">
              Tem certeza que deseja remover <strong>{deletingBarber.name}</strong>?
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
