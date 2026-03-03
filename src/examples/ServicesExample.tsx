/**
 * ServicesExample - Componente de exemplo para demonstrar o uso do ServicesStore
 * 
 * Este arquivo demonstra como usar o hook useServices em um componente React.
 * Não é usado na aplicação, apenas para referência de desenvolvimento.
 * 
 * Features demonstradas:
 * - Auto-fetch de serviços ao montar
 * - Criação de novo serviço
 * - Atualização de serviço existente
 * - Exclusão de serviço
 * - Busca e filtros
 * - Exibição de estatísticas
 * - Tratamento de loading e errors
 */

import React, { useState } from 'react';
import { useServices } from '@/hooks/useServices';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';

export function ServicesExample() {
  // Hook com auto-fetch habilitado
  const {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    clearError,
    getServiceById,
    searchByName,
    getStats,
    isNameDuplicate,
  } = useServices({ autoFetch: true });

  const [formData, setFormData] = useState({
    name: '',
    category: 'cabelo' as any,
    price: 0,
    duration: 30,
    icon: 'scissors',
    color: '#8B5CF6',
  });

  const [searchQuery, setSearchQuery] = useState('');

  // Handler para criar serviço
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Valida duplicata
    if (isNameDuplicate(formData.name)) {
      alert('Já existe um serviço com este nome!');
      return;
    }

    try {
      await createService(formData);

      setFormData({
        name: '',
        category: 'cabelo' as any,
        price: 0,
        duration: 30,
        icon: 'scissors',
        color: '#8B5CF6',
      });

      alert('Serviço criado com sucesso!');
    } catch (err) {
      alert('Erro ao criar serviço');
    }
  };

  // Handler para atualizar preço
  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      await updateService(id, { price: newPrice });
      alert('Preço atualizado!');
    } catch (err) {
      alert('Erro ao atualizar preço');
    }
  };

  // Handler para excluir
  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este serviço?')) return;

    try {
      await deleteService(id);
      alert('Serviço excluído!');
    } catch (err) {
      alert('Erro ao excluir serviço');
    }
  };

  // Serviços filtrados por busca
  const filteredServices = searchQuery
    ? searchByName(searchQuery)
    : services;

  // Estatísticas
  const stats = getStats();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">
        Gerenciar Serviços
      </h1>

      {/* Banner de erro */}
      {error && (
        <Card className="bg-red-500/10 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <Icon name="help-circle" className="text-xl" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              <Icon name="x" className="text-xl" />
            </button>
          </div>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="text-slate-400 text-sm">Total de Serviços</div>
          <div className="text-2xl font-bold text-slate-100">
            {stats.total}
          </div>
        </Card>
        <Card>
          <div className="text-slate-400 text-sm">Preço Médio</div>
          <div className="text-2xl font-bold text-slate-100">
            R$ {stats.averagePrice.toFixed(2)}
          </div>
        </Card>
      </div>

      {/* Formulário de criação */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Novo Serviço
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Nome</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-400">Preço (R$)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">Duração (min)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-slate-100"
                min="1"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Serviço'}
          </button>
        </form>
      </Card>

      {/* Busca */}
      <div>
        <input
          type="text"
          placeholder="Buscar serviços..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100"
        />
      </div>

      {/* Lista de serviços */}
      <div className="space-y-3">
        {loading && services.length === 0 ? (
          <Card>
            <div className="text-center text-slate-400">
              Carregando serviços...
            </div>
          </Card>
        ) : filteredServices.length === 0 ? (
          <Card>
            <div className="text-center text-slate-400">
              {searchQuery
                ? 'Nenhum serviço encontrado'
                : 'Nenhum serviço cadastrado'}
            </div>
          </Card>
        ) : (
          filteredServices.map((service) => (
            <Card key={service.id} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-slate-100">
                  {service.name}
                </div>
                <div className="text-sm text-slate-400">
                  {service.duration} min • R$ {service.price.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const newPrice = prompt('Novo preço:', String(service.price));
                    if (newPrice) {
                      handleUpdatePrice(service.id, Number(newPrice));
                    }
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg text-violet-400"
                  title="Editar preço"
                >
                  <Icon name="pencil" className="text-lg" />
                </button>

                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-red-400"
                  title="Excluir"
                >
                  <Icon name="trash" className="text-lg" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Botão de refresh */}
      <button
        onClick={() => fetchServices()}
        disabled={loading}
        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? 'Atualizando...' : 'Atualizar Lista'}
      </button>
    </div>
  );
}
