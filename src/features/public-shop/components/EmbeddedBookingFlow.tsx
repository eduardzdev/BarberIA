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

    const [expandedCategories, setExpandedCategories] = useState<string[]>(['combos', 'cabelo']);

    const toggleCategory = (category: string) => {
        if (category === 'sobrancelhas') return; // Sobrancelhas não expande
        setExpandedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    if (!shopData) return null;

    // Agrupamento de itens
    const categoriesOrder: string[] = ['combos', 'cabelo', 'barba', 'especiais', 'sobrancelhas'];
    const allItems = [...(shopData.catalog || []), ...(shopData.combos || [])];

    // Total e validação
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
                `👤 Cliente: ${clientInfo.name}\n` +
                `🌹 Serviços: ${servicesText}\n` +
                `💈 Profissional: ${selectedBarber.name}\n` +
                `📅 Data: ${dateFormatted} às ${selectedTime}\n` +
                `💰 Total: R$ ${total.toFixed(2)}\n\n` +
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

    // Ícones e labels de categoria
    const categoryIcons: Record<string, string> = {
        combos: 'star',
        cabelo: 'scissors',
        barba: 'face',
        especiais: 'rocket',
        sobrancelhas: 'palette'
    };

    const categoryLabels: Record<string, string> = {
        combos: 'Combos',
        cabelo: 'Cabelo',
        barba: 'Barba',
        especiais: 'Especiais',
        sobrancelhas: 'Sobrancelhas'
    };

    return (
        <div className="space-y-8 pb-32">
            {/* 1. Serviços */}
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-shop-primary text-white text-sm">1</span>
                    Escolha os Serviços
                </h3>

                <div className="space-y-6">
                    {categoriesOrder.map(category => {
                        const items = allItems.filter(item => {
                            const itemCat = item.category || (('serviceIds' in item) ? 'combos' : 'cabelo');
                            return itemCat === category;
                        });

                        if (items.length === 0) return null;

                        const isExpanded = expandedCategories.includes(category);
                        const isSobrancelha = category === 'sobrancelhas';

                        return (
                            <div key={category} className="space-y-2">
                                {!isSobrancelha ? (
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all bg-transparent">
                                        {/* Category Header */}
                                        <div
                                            onClick={() => toggleCategory(category)}
                                            className="flex justify-between items-center p-4 cursor-pointer bg-transparent text-slate-900 hover:bg-slate-50/50 transition-all font-bold group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-shop-primary/10 flex items-center justify-center group-hover:bg-shop-primary/20 transition-colors">
                                                    <Icon name={categoryIcons[category]} className="w-6 h-6 text-shop-primary" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-lg">{categoryLabels[category]}</span>
                                                    <span className="text-[10px] text-slate-400 font-normal uppercase tracking-widest mt-0.5">
                                                        {isExpanded ? 'Toque para fechar' : 'Toque para abrir'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-bold px-2 py-1 bg-shop-primary text-white rounded-full uppercase tracking-tighter shadow-sm shadow-shop-primary/20">
                                                    {items.length} {items.length === 1 ? 'opção' : 'opções'}
                                                </span>
                                                <div className={`p-1 rounded-full bg-white/50 transition-transform duration-300 ${isExpanded ? 'rotate-0' : 'rotate-180'}`}>
                                                    <Icon
                                                        name={isExpanded ? 'up' : 'down'}
                                                        className="w-4 h-4 text-slate-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Items List */}
                                        {isExpanded && (
                                            <div className="p-2 space-y-2 bg-transparent animate-fade-in border-t border-slate-100">
                                                {items.map(item => {
                                                    const isSelected = selectedServices.some(s => s.id === item.id);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => toggleService(item)}
                                                            className={`
                                                                flex justify-between items-center p-3 rounded-lg cursor-pointer border transition-all
                                                                ${isSelected
                                                                    ? 'bg-shop-primary-dim border-shop-primary'
                                                                    : 'bg-white border-transparent hover:border-slate-200'
                                                                }
                                                            `}
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                <div className={`
                                                                    w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors
                                                                    ${isSelected ? 'border-shop-primary bg-shop-primary' : 'border-slate-300'}
                                                                `}>
                                                                    {isSelected && <Icon name="check" className="w-3 h-3 text-white" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="font-semibold text-slate-900 text-sm truncate">{item.name}</div>
                                                                    <div className="text-xs text-slate-500">{item.duration} min</div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <span className="font-bold text-emerald-600 text-sm">
                                                                    R$ {(item.promotionalPrice || item.price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Sobrancelhas - Direto */
                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center gap-3 px-1 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-shop-primary-dim flex items-center justify-center">
                                                <Icon name={categoryIcons[category]} className="w-5 h-5 text-shop-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">{categoryLabels[category]}</h4>
                                                <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">Seleção direta</span>
                                            </div>
                                        </div>
                                        {items.map(item => {
                                            const isSelected = selectedServices.some(s => s.id === item.id);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleService(item)}
                                                    className={`
                                                        flex justify-between items-center p-4 rounded-xl cursor-pointer border transition-all
                                                        ${isSelected
                                                            ? 'bg-shop-primary-dim border-shop-primary shadow-sm'
                                                            : 'bg-transparent border-slate-200 hover:bg-slate-50/50'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className={`
                                                            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                                            ${isSelected ? 'border-shop-primary bg-shop-primary' : 'border-slate-300'}
                                                        `}>
                                                            {isSelected && <Icon name="check" className="w-4 h-4 text-white" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-bold text-slate-900">{item.name}</div>
                                                            <div className="text-xs text-slate-500">{item.duration} min</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-4">
                                                        <span className="font-bold text-emerald-600">
                                                            R$ {(item.promotionalPrice || item.price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide pt-2">
                    {shopData.team.map(barber => {
                        const isSelected = selectedBarber?.id === barber.id;
                        return (
                            <div
                                key={barber.id}
                                onClick={() => selectBarber(barber)}
                                className={`
                                    flex flex-col items-center min-w-[110px] cursor-pointer transition-all
                                    ${isSelected ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}
                                `}
                            >
                                <div className={`
                                    w-24 h-24 rounded-full border-4 mb-3 overflow-hidden transition-all shadow-xl
                                    ${isSelected ? 'border-shop-primary shadow-shop-primary/20' : 'border-transparent'}
                                `}>
                                    {barber.avatarUrl ? (
                                        <img src={barber.avatarUrl} alt={barber.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                            <Icon name="user" className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                                <span className={`font-bold text-sm truncate w-full text-center px-1 ${isSelected ? 'text-shop-primary' : 'text-slate-600'}`}>
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
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Seu Nome</label>
                        <input
                            type="text"
                            value={clientInfo.name}
                            onChange={(e) => setClientInfo(e.target.value, clientInfo.phone)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-shop-primary transition-all placeholder:text-slate-400"
                            placeholder="Como gostaria de ser chamado?"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Seu Telefone (WhatsApp)</label>
                        <input
                            type="tel"
                            value={clientInfo.phone}
                            onChange={(e) => setClientInfo(clientInfo.name, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-shop-primary transition-all placeholder:text-slate-400"
                            placeholder="(00) 00000-0000"
                        />
                    </div>
                </div>
            </section>

            {/* Sticky Footer */}
            <div className="fixed bottom-6 left-0 right-0 px-3 md:px-4 z-50">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white/95 rounded-2xl md:rounded-full p-1.5 pl-4 md:p-2 md:pl-10 border-2 border-shop-primary shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex items-center justify-between gap-2 md:gap-4 backdrop-blur-xl">
                        <div className="flex flex-col">
                            <span className="text-slate-900 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap">Total Estimado</span>
                            <span className="text-xl md:text-3xl font-black text-emerald-600 tracking-tighter whitespace-nowrap">R$ {total.toFixed(2)}</span>
                        </div>

                        <button
                            onClick={handleConfirm}
                            disabled={!isValid || loading}
                            className={`
                                h-12 md:h-16 px-4 md:px-12 rounded-xl md:rounded-full font-bold text-white flex items-center justify-center gap-2 md:gap-3 transition-all duration-300 flex-shrink-0
                                ${isValid && !loading
                                    ? 'bg-green-500 hover:bg-green-600 active:bg-green-700 hover:scale-[1.02] shadow-lg shadow-green-500/40 active:scale-95'
                                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }
                            `}
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Icon name="whatsapp" className={`w-4 h-4 md:w-5 md:h-5 ${isValid ? 'text-white' : 'text-slate-300'}`} />
                                    <span className="text-xs md:text-base whitespace-nowrap">Confirmar no WhatsApp</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
