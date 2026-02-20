import React, { useState, useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { useUI } from '@/hooks/useUI';
import { Client } from '@/types';
import { CreateClientData, UpdateClientData } from '@/store/clients.store';
import { formatPhone } from '@/lib/validations';
import { Icon } from '@/components/Icon';

interface ClientFormProps {
    initialData?: Client | null;
    onClose: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ initialData, onClose }) => {
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
        if (!name.trim() || !phone.trim()) {
            showError('Preencha os campos obrigatórios (Nome e Telefone)');
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
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="user" className="w-4 h-4 mr-2 text-violet-400" />
                    Nome *
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="phone" className="w-4 h-4 mr-2 text-violet-400" />
                    Telefone *
                </label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="envelope" className="w-4 h-4 mr-2 text-violet-400" />
                    Email (opcional)
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
            </div>
            <div>
                <label className="flex items-center text-sm font-medium text-slate-400 mb-1">
                    <Icon name="pencil" className="w-4 h-4 mr-2 text-violet-400" />
                    Notas
                </label>
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
