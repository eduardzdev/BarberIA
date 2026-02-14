/**
 * useServices - Hook para gerenciar serviços da barbearia
 * 
 * Facilita o uso do ServicesStore em componentes React.
 * 
 * Features:
 * - Acesso ao estado de serviços (lista, loading, error)
 * - Métodos CRUD: fetch, create, update, delete
 * - Auto-loading inicial (opcional)
 * - forceRefresh para bypass de cache
 * - Helpers de validação memoizados
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 13 (Componentes Reutilizáveis)
 * - DESCRICAO_FEATURES.md - Seção 5.2 (Gestão de Serviços)
 * 
 * Exemplo de uso:
 * ```typescript
 * function ServicesManager() {
 *   const { 
 *     services, 
 *     loading, 
 *     error,
 *     fetchServices,
 *     createService,
 *     updateService,
 *     deleteService 
 *   } = useServices({ autoFetch: true });
 * 
 *   const handleCreate = async () => {
 *     await createService({
 *       name: 'Corte de Cabelo',
 *       price: 50,
 *       duration: 30,
 *       icon: 'scissors',
 *       color: '#8B5CF6'
 *     });
 *   };
 * 
 *   return (
 *     <div>
 *       {loading && <p>Carregando...</p>}
 *       {error && <p>Erro: {error}</p>}
 *       {services.map(service => (
 *         <ServiceCard key={service.id} service={service} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useMemo } from 'react';
import { useServicesStore, CreateServiceData, UpdateServiceData } from '@/store/services.store';

interface UseServicesOptions {
  /**
   * Se true, busca serviços automaticamente ao montar o componente
   * @default false
   */
  autoFetch?: boolean;

  /**
   * Força refetch ignorando cache
   * @default false
   */
  forceRefresh?: boolean;
}

export function useServices(options: UseServicesOptions = {}) {
  const { autoFetch = false, forceRefresh = false } = options;

  // Estado do store
  const services = useServicesStore((state) => state.services);
  const loading = useServicesStore((state) => state.loading);
  const error = useServicesStore((state) => state.error);
  const dataLoaded = useServicesStore((state) => state.dataLoaded);

  // Ações
  const fetchServices = useServicesStore((state) => state.fetchServices);
  const createService = useServicesStore((state) => state.createService);
  const updateService = useServicesStore((state) => state.updateService);
  const deleteService = useServicesStore((state) => state.deleteService);
  const clearError = useServicesStore((state) => state.clearError);
  const clearCache = useServicesStore((state) => state.clearCache);

  // Auto-fetch ao montar (usa cache a menos que forceRefresh)
  useEffect(() => {
    if (autoFetch) {
      fetchServices(forceRefresh);
    }
  }, [autoFetch, forceRefresh, fetchServices]);

  // Helpers memoizados para evitar re-renders desnecessários
  const helpers = useMemo(() => ({
    /**
     * Busca um serviço por ID
     */
    getServiceById: (id: string) => {
      return services.find(s => s.id === id) || null;
    },

    /**
     * Busca serviços por nome (case-insensitive)
     */
    searchByName: (query: string) => {
      const lowerQuery = query.toLowerCase();
      return services.filter(s =>
        s.name.toLowerCase().includes(lowerQuery)
      );
    },

    /**
     * Filtra serviços por faixa de preço
     */
    filterByPriceRange: (minPrice: number, maxPrice: number) => {
      return services.filter(s =>
        s.price >= minPrice && s.price <= maxPrice
      );
    },

    /**
     * Filtra serviços por faixa de duração (minutos)
     */
    filterByDuration: (minDuration: number, maxDuration: number) => {
      return services.filter(s =>
        s.duration >= minDuration && s.duration <= maxDuration
      );
    },

    /**
     * Retorna estatísticas dos serviços
     */
    getStats: () => {
      if (services.length === 0) {
        return {
          total: 0,
          averagePrice: 0,
          averageDuration: 0,
          minPrice: 0,
          maxPrice: 0,
        };
      }

      const prices = services.map(s => s.price);
      const durations = services.map(s => s.duration);

      return {
        total: services.length,
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
      };
    },

    /**
     * Valida se o nome do serviço já existe
     */
    isNameDuplicate: (name: string, excludeId?: string) => {
      return services.some(s =>
        s.name.toLowerCase() === name.toLowerCase() &&
        s.id !== excludeId
      );
    },
  }), [services]);

  return {
    // Estado
    services,
    loading,
    error,
    dataLoaded,

    // Ações
    fetchServices,
    createService,
    updateService,
    deleteService,
    clearError,
    clearCache,

    // Helpers
    ...helpers,
  };
}
