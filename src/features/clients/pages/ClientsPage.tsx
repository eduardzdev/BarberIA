/**
 * ClientsPage - Página de gerenciamento de clientes
 * 
 * Página para gerenciar toda a base de clientes:
 * - Lista de clientes com cards expansíveis
 * - Busca por nome, telefone ou email
 * - Filtros por status (Ativo/Inativo) e avaliação
 * - Cards de estatísticas (total, ativos, VIP, receita)
 * - Ações CRUD (criar, editar, visualizar, deletar)
 * - Modais para formulários
 * 
 * Integração com ClientsStore:
 * - Auto-fetch de todos os clientes
 * - Busca e filtros em tempo real
 * - Estatísticas calculadas
 * - CRUD completo
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 5 (Clientes)
 * - DESCRICAO_FEATURES.md - Seção 4 (Gestão de Clientes)
 * - ESTADOS_ESPECIAIS.md - Loading, Empty, Error para clientes
 * 
 * Features:
 * - Cards com avatar (iniciais auto-geradas)
 * - Status visual (Ativo/Inativo)
 * - Avaliação com estrelas
 * - Última visita, total de visitas, gasto total
 * - Menu de ações (editar, deletar)
 * - Busca em tempo real
 * - Filtros múltiplos
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CardSkeleton from '@/components/common/CardSkeleton';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useClients } from '@/hooks/useClients';
import { useUI } from '@/hooks/useUI';
import { Client, ClientStatus } from '@/types';
import { CreateClientData, UpdateClientData } from '@/store/clients.store';
import { formatPhone } from '@/lib/validations';
import { ClientStatusSelector } from '@/features/clients/components/ClientStatusSelector';


interface StatCardProps {
  icon: string;
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value }) => (
  <Card className="!p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-transparent rounded-lg">
        <Icon name={icon} className="w-5 h-5 text-violet-400" />
      </div>
    </div>
    <p className="text-slate-400 text-sm">{title}</p>
    <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
  </Card>
);

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onStatusChange: (id: string, status: ClientStatus) => void;
  onToggleVip: (id: string, isVip: boolean) => void;
}


const formatDisplayName = (fullName: string) => {
  if (!fullName) return 'Cliente';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Cliente';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
};

const formatCurrencyBRL = (value: number) => {
  if (!Number.isFinite(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
};

const formatLastVisitLabel = (value?: string | null) => {
  if (!value) return 'Nunca';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
  }).format(date);
  return formatted.replace('.', '');
};

const buildWhatsAppLink = (phone?: string | null) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return '';
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
};

const ClientCard: React.FC<ClientCardProps> = ({ client, onEdit, onDelete, onStatusChange, onToggleVip }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const displayName = useMemo(() => formatDisplayName(client.name), [client.name]);
  const lastVisit = useMemo(() => formatLastVisitLabel(client.lastVisit), [client.lastVisit]);
  const totalSpent = useMemo(() => formatCurrencyBRL(client.spent), [client.spent]);
  const whatsappLink = useMemo(() => buildWhatsAppLink(client.phone), [client.phone]);

  const handleCardToggle = useCallback(() => {
    setExpanded((prev) => !prev);
    setMenuOpen(false);
  }, []);

  const handleKeyToggle = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardToggle();
    }
  }, [handleCardToggle]);

  const handleMenuToggle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  const handleEdit = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen(false);
    onEdit(client);
  }, [client, onEdit]);

  const handleDelete = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen(false);
    onDelete(client);
  }, [client, onDelete]);

  const handleWhatsAppClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!whatsappLink) return;
    window.open(whatsappLink, '_blank', 'noopener,noreferrer');
  }, [whatsappLink]);

  const handleStatusChange = useCallback((newStatus: ClientStatus) => {
    onStatusChange(client.id, newStatus);
  }, [client.id, onStatusChange]);

  const handleToggleVip = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpen(false);
    onToggleVip(client.id, !client.isVip);
  }, [client.id, client.isVip, onToggleVip]);

  return (
    <Card className="relative !p-4" data-testid="client-card">
      <div className="flex items-start">
        <div
          role="button"
          tabIndex={0}
          onClick={handleCardToggle}
          onKeyDown={handleKeyToggle}
          aria-expanded={expanded}
          className="flex-1 cursor-pointer select-none"
        >
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-violet-300 text-lg">
              {client.avatarInitials}
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-base font-semibold text-slate-100">{displayName}</p>
                  {client.isVip && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">
                      <Icon name="star-fill" className="w-3 h-3 mr-1" />
                      VIP
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>{client.phone}</span>
                  {whatsappLink && (
                    <button
                      type="button"
                      onClick={handleWhatsAppClick}
                      className="p-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
                      aria-label="Abrir WhatsApp"
                    >
                      <Icon name="whatsapp" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <Icon name="calendar" className="w-4 h-4 text-slate-500" />
                  <span>{lastVisit}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="door" className="w-4 h-4 text-slate-500" />
                  <span>{client.visits} visita{client.visits === 1 ? '' : 's'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icon name="wallet" className="w-4 h-4 text-slate-500" />
                  <span>{totalSpent}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-3 flex flex-col items-end space-y-2" onClick={(event) => event.stopPropagation()}>
          <ClientStatusSelector
            currentStatus={client.status}
            onStatusChange={handleStatusChange}
          />
          <div className="relative">
            <button
              type="button"
              onClick={handleMenuToggle}
              className="p-1 text-slate-400 hover:text-white transition"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-label="Abrir menu de ações"
            >
              <Icon name="dots" className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="w-full flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 rounded-t-lg"
                >
                  <Icon name="edit" className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={handleToggleVip}
                  className={`w-full flex items-center px-4 py-2 text-sm hover:bg-slate-700 ${client.isVip ? 'text-amber-400' : 'text-slate-200'
                    }`}
                >
                  <Icon name={client.isVip ? 'star-fill' : 'star'} className="w-4 h-4 mr-2" />
                  {client.isVip ? 'Remover VIP' : 'Tornar VIP'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-b-lg"
                >
                  <Icon name="x" className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-slate-800 pt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm text-slate-300">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="font-medium text-slate-100">{client.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Última visita</p>
              <p className="font-medium text-slate-200">{client.lastVisit || 'Nunca'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Visitas</p>
                <p className="font-semibold text-slate-100">{client.visits}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Gasto total</p>
                <p className="font-semibold text-slate-100">{totalSpent}</p>
              </div>
            </div>
          </div>
          {client.notes && (
            <div className="border border-slate-800 rounded-lg bg-slate-900/60 px-3 py-3 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Notas</p>
              <p className="italic">"{client.notes}"</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * ClientForm - Formulário inline para criar/editar cliente
 */
interface ClientFormProps {
  initialData?: Client | null;
  onClose: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onClose }) => {
  const { createClient, updateClient } = useClients();
  const { success, error: showError } = useUI();

  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setEmail(initialData.email || '');
      setNotes(initialData.notes || '');
      return;
    }

    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
  }, [initialData]);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      showError('Preencha todos os campos obrigatórios');
      return;
    }

    const formattedPhone = formatPhone(phone);
    const digitsOnly = formattedPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      showError('Informe um telefone válido no formato (11) 99999-9999');
      return;
    }

    setPhone(formattedPhone);

    setLoading(true);
    try {
      if (initialData) {
        // Atualizar
        const updateData: UpdateClientData = {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim(),
          notes: notes.trim()
        };
        await updateClient(initialData.id, updateData);
        success('Cliente atualizado com sucesso!');
      } else {
        // Criar
        const createData: CreateClientData = {
          name: name.trim(),
          phone: formattedPhone,
          email: email.trim(),
          notes: notes.trim()
        };
        await createClient(createData);
        success('Cliente cadastrado com sucesso!');
      }
      onClose();
    } catch (err) {
      showError(initialData ? 'Erro ao atualizar cliente' : 'Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-400">Nome *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Telefone *</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(11) 99999-9999"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@email.com"
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-400">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações sobre o cliente..."
          rows={3}
          className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>
      <div className="flex space-x-3 pt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600 disabled:bg-slate-800"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 disabled:bg-slate-500"
        >
          {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Cadastrar'}
        </button>
      </div>
    </div>
  );
};

/**
 * ConfirmDeleteModal - Modal de confirmação de exclusão
 */
interface ConfirmDeleteModalProps {
  client: Client;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ client, onConfirm, onCancel }) => (
  <div className="space-y-4">
    <p className="text-slate-300">
      Tem certeza que deseja excluir o cliente <strong>{client.name}</strong>?
    </p>
    <p className="text-slate-400 text-sm">Esta ação não pode ser desfeita.</p>
    <div className="flex space-x-3">
      <button
        onClick={onCancel}
        className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700"
      >
        Excluir
      </button>
    </div>
  </div>
);

// ===== Main Component =====

export const ClientsPage: React.FC = () => {
  // Hooks
  const {
    clients,
    loading,
    searchClients,
    getStats,
    deleteClient,
    updateStatus,
    toggleVip,
  } = useClients({ autoFetch: true });

  const { openModal, closeModal, isModalOpen, success, error: showError } = useUI();

  // Estado local
  const [searchQuery, setSearchQuery] = useState('');
  type ClientFilter = 'all' | 'active' | 'vip' | 'inactive';

  const [filterStatus, setFilterStatus] = useState<ClientFilter>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement | null>(null);

  const filterOptions = useMemo(
    () => [
      { key: 'all' as ClientFilter, label: 'Todos' },
      { key: 'active' as ClientFilter, label: 'Clientes Ativos (inclui VIPs)' },
      { key: 'vip' as ClientFilter, label: 'Clientes VIP' },
      { key: 'inactive' as ClientFilter, label: 'Clientes Inativos' },
    ],
    []
  );

  const currentFilterLabel = useMemo(() => {
    return filterOptions.find((option) => option.key === filterStatus)?.label ?? 'Todos';
  }, [filterOptions, filterStatus]);

  const isFiltered = filterStatus !== 'all';

  useEffect(() => {
    if (!filterMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setFilterMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filterMenuOpen]);

  // Estatísticas
  const stats = getStats();
  const vipClients = clients.filter(c => c.isVip).length;

  // Filtros aplicados
  const filteredClients = useMemo(() => {
    let result = clients;

    // Busca por texto
    if (searchQuery.trim()) {
      result = searchClients(searchQuery);
    }

    // Filtro por status
    if (filterStatus === 'active') {
      result = result.filter(c => c.status === ClientStatus.Active);
    } else if (filterStatus === 'vip') {
      result = result.filter(c => c.isVip);
    } else if (filterStatus === 'inactive') {
      result = result.filter(c => c.status === ClientStatus.Inactive);
    }

    const sorted = [...result];

    sorted.sort((a, b) => {
      if (a.isVip && !b.isVip) return -1;
      if (!a.isVip && b.isVip) return 1;

      const aInactive = a.status === ClientStatus.Inactive;
      const bInactive = b.status === ClientStatus.Inactive;

      if (aInactive && !bInactive) return 1;
      if (!aInactive && bInactive) return -1;

      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [clients, searchQuery, filterStatus, searchClients]);

  // Handlers
  const handleNewClient = () => {
    setSelectedClient(null);
    openModal('newClient');
  };

  const handleFilterToggle = useCallback(() => {
    setFilterMenuOpen((prev) => !prev);
  }, []);

  const handleFilterSelect = useCallback((option: ClientFilter) => {
    setFilterStatus(option);
    setFilterMenuOpen(false);
  }, []);

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    openModal('editClient');
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    openModal('confirmDelete');
  };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;

    try {
      await deleteClient(selectedClient.id);
      success('Cliente excluído com sucesso!');
      closeModal('confirmDelete');
      setSelectedClient(null);
    } catch (err) {
      showError('Erro ao excluir cliente');
    }
  };

  const handleCloseNewClientModal = () => {
    closeModal('newClient');
    setSelectedClient(null);
  };

  const handleCloseEditClientModal = () => {
    closeModal('editClient');
    setSelectedClient(null);
  };

  const handleCloseDeleteModal = () => {
    closeModal('confirmDelete');
    setSelectedClient(null);
  };

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Header */}
        <div>
          <p className="text-2xl font-bold text-slate-100">Clientes</p>
          <p className="text-slate-400">Gerencie sua base de clientes</p>
        </div>

        {/* Novo Cliente Button */}
        <button
          onClick={handleNewClient}
          className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition-colors"
        >
          <Icon name="plus" className="w-5 h-5" />
          <span>Novo Cliente</span>
        </button>

        {/* Busca */}
        <div className="relative">
          <Icon
            name="search"
            className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, telefone ou email..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon="users" title="Total de Clientes" value={stats.total.toString()} />
          <StatCard icon="check" title="Clientes Ativos" value={stats.active.toString()} />
          <StatCard icon="star" title="Clientes VIP" value={vipClients.toString()} />
          <StatCard
            icon="dollar"
            title="Receita Total"
            value={`R$ ${stats.totalRevenue.toFixed(0)}`}
          />
        </div>

        {/* Lista de Clientes */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-100 flex items-center">
              <Icon name="users" className="w-5 h-5 mr-2 text-violet-400" />
              Lista de Clientes
            </h3>
            <div ref={filterMenuRef} className="relative">
              <button
                type="button"
                onClick={handleFilterToggle}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-200 transition-colors ${isFiltered ? 'bg-violet-600/10 border-violet-500 text-violet-200' : 'bg-slate-800'
                  }`}
                aria-haspopup="true"
                aria-expanded={filterMenuOpen}
                aria-label="Filtrar clientes"
              >
                <Icon name="filter" className="w-4 h-4" />
                {isFiltered && (
                  <span className="text-xs font-medium">
                    {filterStatus === 'vip' ? 'VIP' : filterStatus === 'active' ? 'Ativos' : 'Inativos'}
                  </span>
                )}
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  {filterOptions.map((option, index) => {
                    const isActive = filterStatus === option.key;
                    const isFirst = index === 0;
                    const isLast = index === filterOptions.length - 1;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleFilterSelect(option.key)}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
                          } ${isFirst ? 'rounded-t-lg' : ''} ${isLast ? 'rounded-b-lg' : ''}`}
                      >
                        <span className="flex-1 text-left pr-3">{option.label}</span>
                        {isActive && <Icon name="check" className="w-4 h-4 text-violet-300" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-400 mb-4">
            {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} encontrado
            {filteredClients.length !== 1 ? 's' : ''}
            {isFiltered && ` • ${currentFilterLabel}`}
          </p>

          {loading ? (
            <div className="pt-4">
              <CardSkeleton count={5} />
            </div>
          ) : filteredClients.length > 0 ? (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClick}
                  onStatusChange={updateStatus}
                  onToggleVip={toggleVip}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Icon name="users" className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-slate-500 text-sm mt-2">
                {searchQuery || filterStatus !== 'all'
                  ? 'Nenhum cliente encontrado com os filtros aplicados.'
                  : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen('newClient')}
        onClose={handleCloseNewClientModal}
        title="Novo Cliente"
      >
        <ClientForm
          initialData={null}
          onClose={handleCloseNewClientModal}
        />
      </Modal>

      <Modal
        isOpen={isModalOpen('editClient')}
        onClose={handleCloseEditClientModal}
        title="Editar Cliente"
      >
        {selectedClient && (
          <ClientForm
            initialData={selectedClient}
            onClose={handleCloseEditClientModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen('confirmDelete')}
        onClose={handleCloseDeleteModal}
        title="Confirmar Exclusão"
      >
        {selectedClient && (
          <ConfirmDeleteModal
            client={selectedClient}
            onConfirm={handleConfirmDelete}
            onCancel={handleCloseDeleteModal}
          />
        )}
      </Modal>
    </>
  );
};
