import React, { useEffect, useState } from 'react';
import { useBookingStore } from '../stores/booking.store';
import { Icon } from '@/components/Icon';
import { StepDateTime } from './booking-wizard/StepDateTime';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const EmbeddedBookingFlow: React.FC = () => {
    const { 
        shopData, 
        selectedServices, 
        toggleService, 
        selectedBarber, 
        selectBarber, 
        selectedDate,
        selectedTime,
        clientInfo,
        setClientInfo,
        confirmBooking,
        loading,
        error
    } = useBookingStore();

    const [whatsappMode, setWhatsappMode] = useState(true); // Se true, envia pro whats. Se false, salva no banco.
    // O prompt pediu "confirmação via whatsapp", mas o sistema atual é firestore.
    // Vou implementar Híbrido: Salva no banco E redireciona/gera link.

    if (!shopData) return null;

    const total = selectedServices.reduce((acc, s) => acc + (s.promotionalPrice || s.price), 0);
    const isValid = selectedServices.length > 0 && selectedBarber && selectedDate && selectedTime && clientInfo.name && clientInfo.phone;

    const handleConfirm = async () => {
        if (!isValid) return;

        try {
            // 1. Salvar no Firestore
            await confirmBooking();

            // 2. Gerar link do WhatsApp
            const servicesText = selectedServices.map(s => s.name).join(', ');
            const dateFormatted = format(new Date(selectedDate), "dd/MM/yyyy");
            
            const message = encodeURIComponent(
                `Olá, ${shopData.name}! Gostaria de confirmar meu agendamento:\n\n` +
                `\ud83d\udc64 Cliente: ${clientInfo.name}\n` +
                `\ud83c\udf39 Serviços: ${servicesText}\n` +
                `\ud83d\udc88 Profissional: ${selectedBarber.name}\n` +
                `\ud83d\udcc5 Data: ${dateFormatted} às ${selectedTime}\n` +
                `\ud83d\udcb0 Total: R$ ${total.toFixed(2)}\n\n` +
                `Agendamento realizado pelo link!\n` +
                `Me comprometo à estar presente no horário a cima escolhido por mim.`
            );

            // Redirecionar
            const phone = shopData.phone.replace(/\D/g, ''); // Remove formatação
            window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');

        } catch (err) {
            console.error(err);
            alert('Erro ao realizar agendamento. Tente novamente.');
        }
    };

    return (
        <div className="space-y-8 pb-32">
            {/* 1. Serviços */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-shop-primary text-white text-sm">1</span>
                    Escolha os Serviços
                </h3>
                <div className="space-y-3">
                    {shopData.catalog.map(service => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        return (
                            <div 
                                key={service.id}
                                onClick={() => toggleService(service)}
                                className={`
                                    flex justify-between items-center p-4 rounded-xl cursor-pointer border transition-all
                                    ${isSelected 
                                        ? 'bg-shop-primary-dim border-shop-primary ring-1 ring-shop-primary' 
                                        : 'bg-white border-slate-100 hover:border-slate-300'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    <div className={`
                                        w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0
                                        ${isSelected ? 'border-shop-primary bg-shop-primary' : 'border-slate-300'}
                                    `}>
                                        {isSelected && <Icon name="check" className="w-4 h-4 text-white" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-slate-900 truncate">{service.name}</h4>
                                        <p className="text-sm text-slate-500">{service.duration} min</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="font-bold text-shop-primary">
                                        R$ {(service.promotionalPrice || service.price).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 2. Profissional */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-shop-primary text-white text-sm">2</span>
                    Escolha o Profissional
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {shopData.team.map(barber => {
                        const isSelected = selectedBarber?.id === barber.id;
                        return (
                            <div
                                key={barber.id}
                                onClick={() => selectBarber(barber)}
                                className={`
                                    flex flex-col items-center min-w-[100px] cursor-pointer transition-all
                                    ${isSelected ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'}
                                `}
                            >
                                <div className={`
                                    w-20 h-20 rounded-full border-4 mb-2 overflow-hidden transition-all
                                    ${isSelected ? 'border-shop-primary shadow-lg' : 'border-transparent'}
                                `}>
                                    {barber.avatarUrl ? (
                                        <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                            <Icon name="user" className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <span className={`font-medium text-sm truncate w-full text-center px-1 ${isSelected ? 'text-shop-primary font-bold' : 'text-slate-600'}`}>
                                    {barber.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 3. Data e Horário */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-shop-primary text-white text-sm">3</span>
                    Data e Horário
                </h3>
                {/* Reutilizando componente existente, mas garantindo que ele use o store corretamente */}
                <StepDateTime />
            </section>

            {/* 4. Identificação */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-shop-primary text-white text-sm">4</span>
                    Seus Dados
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                        <input 
                            type="text" 
                            value={clientInfo.name}
                            onChange={(e) => setClientInfo(e.target.value, clientInfo.phone)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-shop-primary transition-all"
                            placeholder="Como gostaria de ser chamado?"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Telefone (WhatsApp)</label>
                        <input 
                            type="tel" 
                            value={clientInfo.phone}
                            onChange={(e) => setClientInfo(clientInfo.name, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-shop-primary transition-all"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>
            </section>

            {/* Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-40">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex justify-between w-full md:w-auto md:flex-col">
                        <span className="text-slate-500 text-sm">Total a pagar</span>
                        <span className="text-2xl font-bold text-shop-primary">R$ {total.toFixed(2)}</span>
                    </div>
                    
                    <button
                        onClick={handleConfirm}
                        disabled={!isValid || loading}
                        className={`
                            w-full md:w-auto px-8 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all
                            ${isValid && !loading
                                ? 'bg-green-500 hover:bg-green-600 shadow-green-500/30 translate-y-0' 
                                : 'bg-slate-300 cursor-not-allowed'
                            }
                        `}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Processando...
                            </>
                        ) : (
                            <>
                                <Icon name="whatsapp" className="w-6 h-6" />
                                Confirmar no WhatsApp
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
