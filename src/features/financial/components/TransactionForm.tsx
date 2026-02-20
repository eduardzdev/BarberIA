import React, { useState } from 'react';
import { useFinancial } from '@/hooks/useFinancial';
import { useUI } from '@/hooks/useUI';
import { Transaction, TransactionType } from '@/types';
import { CreateTransactionData, UpdateTransactionData } from '@/store/financial.store';
import { Icon } from '@/components/Icon';

interface TransactionFormProps {
    onClose: () => void;
    transaction?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, transaction }) => {
    const { createTransaction, updateTransaction } = useFinancial();
    const { success, error: showError } = useUI();

    const [type, setType] = useState<TransactionType>(transaction?.type || TransactionType.Income);
    const [description, setDescription] = useState(transaction?.description || '');
    const [amount, setAmount] = useState(transaction?.amount ? transaction.amount.toString() : '');
    const [category, setCategory] = useState(transaction?.category || 'Serviços');
    const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || 'Dinheiro');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!description.trim() || !amount || parseFloat(amount) <= 0) {
            showError('Preencha todos os campos corretamente');
            return;
        }

        setLoading(true);
        try {
            const now = new Date();

            if (transaction) {
                const updateData: UpdateTransactionData = {
                    type,
                    description: description.trim(),
                    category: category.trim(),
                    amount: parseFloat(amount),
                    paymentMethod: paymentMethod.trim()
                };
                await updateTransaction(transaction.id, updateData);
                success('Transação atualizada com sucesso!');
            } else {
                const date = now.toISOString().split('T')[0];
                const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                const createData: CreateTransactionData = {
                    type,
                    description: description.trim(),
                    category: category.trim(),
                    amount: parseFloat(amount),
                    date,
                    time,
                    paymentMethod: paymentMethod.trim()
                };
                await createTransaction(createData);
                success('Transação registrada com sucesso!');
            }
            onClose();
        } catch (err) {
            showError(transaction ? 'Erro ao atualizar transação' : 'Erro ao registrar transação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name={type === TransactionType.Income ? 'trendUp' : 'dollar'} className="w-4 h-4 mr-2 text-violet-400" />
                    Tipo *
                </label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as TransactionType)}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value={TransactionType.Income}>Receita</option>
                    <option value={TransactionType.Expense}>Despesa</option>
                </select>
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="pencil" className="w-4 h-4 mr-2 text-violet-400" />
                    Descrição *
                </label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Corte de cabelo - João Silva"
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="dollar" className="w-4 h-4 mr-2 text-violet-400" />
                    Valor (R$) *
                </label>
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="layer" className="w-4 h-4 mr-2 text-violet-400" />
                    Categoria *
                </label>
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Serviços, Produtos"
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="payment" className="w-4 h-4 mr-2 text-violet-400" />
                    Método de Pagamento *
                </label>
                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Pix">Pix</option>
                </select>
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
                    {loading ? 'Salvando...' : (transaction ? 'Atualizar' : 'Registrar')}
                </button>
            </div>
        </div>
    );
};
