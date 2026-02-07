/**
 * BaseService - Serviço genérico para operações CRUD no Firestore
 * 
 * Fornece métodos base para todas as entidades do sistema:
 * - getAll: Buscar todos os documentos
 * - getById: Buscar documento específico
 * - create: Criar novo documento
 * - update: Atualizar documento existente
 * - delete: Remover documento
 * 
 * Todos os serviços específicos devem estender esta classe.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '@/firebase';

export class BaseService<T extends DocumentData> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Obtém a referência da coleção do usuário atual
   * Estrutura: barbershops/{userId}/{collectionName}
   */
  protected getCollectionRef() {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('Usuário não autenticado');
    }
    return collection(db, 'barbershops', userId, this.collectionName);
  }

  /**
   * Busca todos os documentos da coleção
   * @param constraints - Filtros opcionais (where, orderBy, limit)
   * @param limitCount - Limite opcional de documentos a retornar
   */
  async getAll(constraints: QueryConstraint[] = [], limitCount?: number): Promise<T[]> {
    try {
      const colRef = this.getCollectionRef();

      // Adiciona limit se especificado
      const finalConstraints = limitCount
        ? [...constraints, limit(limitCount)]
        : constraints;

      const q = query(colRef, ...finalConstraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as unknown as T[];
    } catch (error) {
      console.error(`Erro ao buscar ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Busca um documento pelo ID
   * @param id - ID do documento
   */
  async getById(id: string): Promise<T | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const docRef = doc(db, 'barbershops', userId, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as unknown as T;
      }

      return null;
    } catch (error) {
      console.error(`Erro ao buscar ${this.collectionName} por ID:`, error);
      throw error;
    }
  }

  /**
   * Cria um novo documento
   * @param data - Dados do documento (sem ID)
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const colRef = this.getCollectionRef();
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error(`Erro ao criar ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza um documento existente
   * @param id - ID do documento
   * @param data - Dados parciais para atualização
   */
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const docRef = doc(db, 'barbershops', userId, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Erro ao atualizar ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Remove um documento
   * @param id - ID do documento
   */
  async delete(id: string): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('Usuário não autenticado');
      }

      const docRef = doc(db, 'barbershops', userId, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Erro ao deletar ${this.collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Helpers para construir queries
   */
  protected whereEqual(field: string, value: any): QueryConstraint {
    return where(field, '==', value);
  }

  protected orderByField(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
    return orderBy(field, direction);
  }

  protected limitTo(count: number): QueryConstraint {
    return limit(count);
  }
}
