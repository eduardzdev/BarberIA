import React from 'react';
import { useBookingStore } from '../../stores/booking.store';
import { Icon } from '@/components/Icon';
import { StepDateTime } from './StepDateTime';

// Sub-componentes para cada passo (simplificados aqui, idealmente em arquivos separados)
const StepServices = () => {
    const { shopData, selectedServices, toggleService } = useBookingStore();

    return (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {shopData?.catalog.map(service => {
                const isSelected = selectedServices.some(s => s.id === service.id);
                return (
                    <div
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className={`p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${isSelected
                            ? 'border-shop-primary bg-shop-primary/5 ring-1 ring-shop-primary'
                            : 'border-slate-200 hover:border-shop-primary/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-shop-primary border-shop-primary' : 'border-slate-300'}`}>
                                {isSelected && <Icon name="check" className="w-3 h-3 text-white" />}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">{service.name}</p>
                                <p className="text-sm text-slate-500">{service.duration} min • R$ {service.price.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const StepBarber = () => {
    const { shopData, selectedBarber, selectBarber } = useBookingStore();

    return (
        <div className="grid grid-cols-2 gap-3">
            <div
                onClick={() => selectBarber(null)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${selectedBarber === null
                    ? 'border-shop-primary bg-shop-primary/5 ring-1 ring-shop-primary'
                    : 'border-slate-200 hover:border-shop-primary/50'
                    }`}
            >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Icon name="users" className="w-6 h-6" />
                </div>
                <span className="font-medium text-slate-800 text-sm">Sem Preferência</span>
            </div>

            {shopData?.team.map(barber => (
                <div
                    key={barber.id}
                    onClick={() => selectBarber(barber)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col items-center text-center gap-2 ${selectedBarber?.id === barber.id
                        ? 'border-shop-primary bg-shop-primary/5 ring-1 ring-shop-primary'
                        : 'border-slate-200 hover:border-shop-primary/50'
                        }`}
                >
                    {barber.avatarUrl ? (
                        <img src={barber.avatarUrl} alt={barber.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <Icon name="user" className="w-6 h-6" />
                        </div>
                    )}
                    <span className="font-medium text-slate-800 text-sm">{barber.name}</span>
                </div>
            ))}
        </div>
    );
};

const StepClientInfo = () => {
    const { clientInfo, setClientInfo } = useBookingStore();

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => setClientInfo(e.target.value, clientInfo.phone)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-shop-primary"
                    placeholder="Nos diga seu primeiro e sobrenome"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seu WhatsApp</label>
                <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => {
                        // Mascara simples
                        let v = e.target.value.replace(/\D/g, '');
                        if (v.length > 11) v = v.slice(0, 11);
                        if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                        if (v.length > 9) v = `${v.slice(0, 9)}-${v.slice(9)}`; // (XX) XXXXX-XXXX
                        setClientInfo(clientInfo.name, v);
                    }}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-shop-primary"
                    placeholder="(00) 00000-0000"
                />
                <p className="text-xs text-slate-500 mt-1">Enviaremos a confirmação para este número.</p>
            </div>
        </div>
    );
};

const StepSummary = () => {
    const { selectedServices, selectedBarber, selectedDate, selectedTime, clientInfo } = useBookingStore();
    const total = selectedServices.reduce((acc, s) => acc + (s.promotionalPrice || s.price), 0);
    const duration = selectedServices.reduce((acc, s) => acc + s.duration, 0);

    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-slate-800">Serviços</h4>
                        <ul className="text-sm text-slate-600 mt-1 space-y-1">
                            {selectedServices.map(s => (
                                <li key={s.id}>{s.name}</li>
                            ))}
                        </ul>
                    </div>
                    <span className="font-bold text-shop-primary">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Icon name="clock" className="w-4 h-4" />
                    {duration} min de duração
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-200 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-bold">Profissional</p>
                    <p className="text-slate-800 font-medium">{selectedBarber?.name || 'Sem Preferência'}</p>
                </div>
                <div className="border border-slate-200 p-3 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase font-bold">Data e Hora</p>
                    <p className="text-slate-800 font-medium">
                        {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                    </p>
                </div>
            </div>

            <div className="border border-slate-200 p-3 rounded-lg">
                <p className="text-xs text-slate-500 uppercase font-bold">Cliente</p>
                <p className="text-slate-800 font-medium">{clientInfo.name}</p>
                <p className="text-sm text-slate-600">{clientInfo.phone}</p>
            </div>
        </div>
    );
};

export const BookingWizard: React.FC = () => {
    const {
        isOpen,
        closeBooking,
        step,
        nextStep,
        prevStep,
        loading,
        confirmBooking,
        selectedServices,
        selectedDate,
        selectedTime,
        clientInfo
    } = useBookingStore();

    if (!isOpen) return null;

    const titles = [
        'Escolha os Serviços',
        'Escolha o Profissional',
        'Data e Horário',
        'Seus Dados',
        'Confirmar Agendamento'
    ];

    const canProceed = () => {
        switch (step) {
            case 1: return selectedServices.length > 0;
            case 2: return true; // Pode ser null
            case 3: return selectedDate && selectedTime;
            case 4: return clientInfo.name.length >= 3 && clientInfo.phone.length >= 14;
            default: return true;
        }
    };

    const handleNext = () => {
        if (canProceed()) nextStep();
    };

    const handleConfirm = async () => {
        try {
            await confirmBooking();
            // Redirecionamento futuro ou mensagem de sucesso na tela
            // Por enquanto o store fecha o modal após o alert
            alert('Agendamento realizado com sucesso! Enviamos os detalhes para seu WhatsApp.');
        } catch (error) {
            alert('Erro ao agendar. Tente novamente.');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeBooking} />

            {/* Modal */}
            <div className="relative bg-white w-full md:w-[500px] md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col animate-slide-in-up md:animate-scale-in">
                {/* Header */}
                <div className="p-3 md:p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button onClick={prevStep} className="text-slate-400 hover:text-slate-600">
                                <Icon name="chevronLeft" className="w-6 h-6" />
                            </button>
                        )}
                        <div>
                            <p className="text-xs text-shop-primary font-bold uppercase tracking-wider">Passo {step} de 5</p>
                            <h3 className="font-bold text-slate-900 text-lg">{titles[step - 1]}</h3>
                        </div>
                    </div>
                    <button onClick={closeBooking} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-3 md:p-4 overflow-y-auto flex-1">
                    {step === 1 && <StepServices />}
                    {step === 2 && <StepBarber />}
                    {step === 3 && <StepDateTime />}
                    {step === 4 && <StepClientInfo />}
                    {step === 5 && <StepSummary />}
                </div>

                {/* Footer */}
                <div className="p-3 md:p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={step === 5 ? handleConfirm : handleNext}
                        disabled={!canProceed() || loading}
                        className={`
                            w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                            ${!canProceed() || loading
                                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                : 'bg-shop-primary hover:opacity-90 active:scale-95'
                            }
                        `}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : step === 5 ? (
                            <>Confirmar Agendamento <Icon name="check" className="w-5 h-5" /></>
                        ) : (
                            <>Continuar <Icon name="chevronRight" className="w-5 h-5" /></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
