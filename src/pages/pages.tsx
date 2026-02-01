

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { MOCK_CLIENTS, MOCK_TRANSACTIONS, MOCK_HISTORY, MOCK_SERVICES, MOCK_BARBERS, MOCK_APPOINTMENTS } from '../constants';
import { Appointment, AppointmentStatus, Client, ClientStatus, Transaction, TransactionType, Service, Barber } from '../types';
import { auth, db, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';


// LoginPage Component
export const LoginPage: React.FC<{ onLoginSuccess: () => void; }> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifyingRedirect, setIsVerifyingRedirect] = useState(true);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in.
          onLoginSuccess();
        }
      } catch (err: any) {
        console.error("Error during redirect result:", err);
        setError('Falha ao autenticar com o Google. Tente novamente.');
      } finally {
        setIsVerifyingRedirect(false);
      }
    };
    checkRedirect();
  }, [onLoginSuccess]);


  const handleAuthAction = async () => {
    if (!email || !password) {
      setError('Por favor, preencha email e senha.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Erro: Domínio não autorizado. Adicione-o no Firebase Console. Veja firebase.ts para detalhes.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email ou senha inválidos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setError('Erro: Domínio não autorizado. Adicione-o no Firebase Console. Veja firebase.ts para detalhes.');
      } else {
        setError('Falha ao autenticar com o Google. Verifique o console para mais detalhes.');
      }
      console.error(err);
      setLoading(false);
    }
  };

  if (isVerifyingRedirect) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
            <p className="text-slate-300">Verificando autenticação...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <Icon name="scissors" className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">BarberIA</h1>
          <p className="text-slate-400 mt-1">Acesso ao Painel Profissional ou Tela de Agendamentos para Clientes</p>
        </div>

        <div className="px-4">
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${activeTab === 'login' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400'}`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${activeTab === 'register' ? 'text-violet-400 border-b-2 border-violet-400' : 'text-slate-400'}`}
            >
              Cadastro
            </button>
          </div>
        </div>

        <form className="px-4 pb-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-400" htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-400" htmlFor="password">Senha</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
          <button
            type="button"
            onClick={handleAuthAction}
            disabled={loading}
            className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors duration-300 shadow-lg shadow-violet-600/20 disabled:bg-slate-500"
          >
            {loading ? 'Aguarde...' : activeTab === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>

           <div className="flex items-center space-x-2">
            <div className="flex-grow h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm font-medium">ou</span>
            <div className="flex-grow h-px bg-slate-700"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:bg-slate-400"
          >
            <Icon name="google" className="w-5 h-5"/>
            <span>Continuar com Google</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/booking')}
            className="w-full bg-transparent border-2 border-slate-600 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-800 hover:border-slate-500 transition-colors duration-300"
          >
            Continuar sem login
          </button>
        </form>
      </Card>
    </div>
  );
};

// BookingPage Component (for clients)
export const BookingPage: React.FC = () => {
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(MOCK_BARBERS[0]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('local');

    const toggleService = (service: Service) => {
        setSelectedServices(prev =>
            prev.find(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };

    const total = useMemo(() => {
        const subtotal = selectedServices.reduce((acc, service) => acc + service.price, 0);
        return paymentMethod === 'online' ? subtotal * 0.95 : subtotal;
    }, [selectedServices, paymentMethod]);

    const availableTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    
    const generateWhatsAppLink = () => {
        const servicesText = selectedServices.map(s => s.name).join(', ');
        const dateFormatted = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');
        const message = encodeURIComponent(
`Olá! Gostaria de confirmar meu agendamento:
Serviços: ${servicesText}
Profissional: ${selectedBarber?.name}
Data: ${dateFormatted}
Horário: ${selectedTime}
Total: R$ ${total.toFixed(2)}
Forma de Pagamento: ${paymentMethod === 'local' ? 'Pagar no local' : 'Pagar online com desconto'}`
        );
        // Replace with the barbershop's actual phone number
        const phone = '5511999999999'; 
        return `https://wa.me/${phone}?text=${message}`;
    };

    return (
        <div className="max-w-md mx-auto bg-slate-900 shadow-2xl shadow-violet-900/50 min-h-screen p-4 space-y-6">
             <div>
                <h1 className="text-3xl font-bold text-slate-100">Faça seu Agendamento</h1>
                <p className="text-slate-400">Rápido, fácil e sem login.</p>
            </div>
            
            <Card>
                <h2 className="font-bold text-slate-100 mb-4 text-lg">1. Escolha os Serviços</h2>
                <div className="space-y-3">
                    {MOCK_SERVICES.map(service => (
                        <div key={service.id} onClick={() => toggleService(service)} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${selectedServices.some(s => s.id === service.id) ? 'bg-violet-600/30 border-violet-500' : 'bg-slate-700/50 border-slate-700'} border`}>
                            <div>
                                <p className="font-semibold text-slate-100">{service.name}</p>
                                <p className="text-sm text-slate-400">{service.duration} min</p>
                            </div>
                            <p className="font-bold text-slate-200">R$ {service.price.toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </Card>

            <Card>
                <h2 className="font-bold text-slate-100 mb-4 text-lg">2. Escolha o Profissional</h2>
                <div className="flex space-x-3 overflow-x-auto pb-2">
                    {MOCK_BARBERS.map(barber => (
                        <div key={barber.id} onClick={() => setSelectedBarber(barber)} className={`flex flex-col items-center p-3 rounded-lg cursor-pointer border-2 transition-all ${selectedBarber?.id === barber.id ? 'border-violet-500 bg-violet-500/10' : 'border-transparent'}`}>
                            <img src={barber.avatarUrl} alt={barber.name} className="w-16 h-16 rounded-full mb-2"/>
                            <p className="font-semibold text-slate-200">{barber.name}</p>
                        </div>
                    ))}
                </div>
            </Card>

             <Card>
                <h2 className="font-bold text-slate-100 mb-4 text-lg">3. Escolha a Data e Horário</h2>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 mb-4"/>
                <div className="grid grid-cols-4 gap-2">
                    {availableTimes.map(time => (
                         <button key={time} onClick={() => setSelectedTime(time)} className={`p-2 rounded-lg text-center font-semibold transition-all ${selectedTime === time ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}>
                            {time}
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <h2 className="font-bold text-slate-100 mb-4 text-lg">4. Pagamento</h2>
                 <div className="space-y-3">
                    <div onClick={() => setPaymentMethod('online')} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${paymentMethod === 'online' ? 'bg-violet-600/30 border-violet-500' : 'bg-slate-700/50 border-slate-700'} border`}>
                        <div>
                            <p className="font-semibold text-slate-100">Pagar agora</p>
                            <p className="text-sm text-green-400">e ganhe 5% de desconto!</p>
                        </div>
                    </div>
                     <div onClick={() => setPaymentMethod('local')} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all ${paymentMethod === 'local' ? 'bg-violet-600/30 border-violet-500' : 'bg-slate-700/50 border-slate-700'} border`}>
                        <p className="font-semibold text-slate-100">Pagar no local</p>
                    </div>
                </div>
            </Card>
            
            <div className="sticky bottom-0 py-4 bg-slate-900">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 font-medium">Total</span>
                    <span className="text-3xl font-bold text-white">R$ {total.toFixed(2)}</span>
                </div>
                 <a 
                    href={generateWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 text-white font-bold py-4 rounded-lg flex items-center justify-center space-x-2 text-center"
                 >
                    <span>Confirmar no WhatsApp</span>
                </a>
            </div>
        </div>
    );
};

// --- Form Components for Modals ---

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="text-sm font-medium text-slate-400">{label}</label>
        {children}
    </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
     <input {...props} className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:bg-slate-800 disabled:text-slate-500" />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none" />
);

const AppointmentForm: React.FC<{ onClose: () => void; onSubmit: (data: Partial<Appointment>) => void; initialData?: Appointment | null; }> = ({ onClose, onSubmit, initialData }) => {
    const [mode, setMode] = useState<'appointment' | 'record'>(initialData ? 'appointment' : 'appointment');
    const [clientName, setClientName] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [selectedServices, setSelectedServices] = useState<Service[]>([]);
    const [selectedBarber, setSelectedBarber] = useState<string>(MOCK_BARBERS[0].id);

    useEffect(() => {
        if (initialData) {
            setClientName(initialData.clientName);
            setDate(initialData.date);
            setStartTime(initialData.startTime);
            setSelectedServices(MOCK_SERVICES.filter(s => initialData.services.includes(s.name)));
            const barber = MOCK_BARBERS.find(b => b.name === initialData.barberName);
            if (barber) setSelectedBarber(barber.id);
            setMode('appointment');
        } else {
            // Reset form for new entry
            setClientName('');
            setDate(new Date().toISOString().split('T')[0]);
            setStartTime('14:30');
            setSelectedServices([]);
            setSelectedBarber(MOCK_BARBERS[0].id);
        }
    }, [initialData]);

    const toggleService = (service: Service) => {
        setSelectedServices(prev =>
            prev.find(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };
    
    const handleSubmit = () => {
        const total = selectedServices.reduce((acc, service) => acc + service.price, 0);
        const barber = MOCK_BARBERS.find(b => b.id === selectedBarber);
        
        const formData: Partial<Appointment> = {
            clientName,
            date,
            startTime,
            services: selectedServices.map(s => s.name),
            barberName: barber?.name,
            price: total,
            // Keep other fields like id, status, etc., managed outside the form
        };
        onSubmit(formData);
    };

    const total = useMemo(() => {
        return selectedServices.reduce((acc, service) => acc + service.price, 0);
    }, [selectedServices]);

    return (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
             {!initialData && (
                <div className="flex p-1 bg-slate-700/50 rounded-lg">
                    <button type="button" onClick={() => setMode('appointment')} className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors duration-300 ${mode === 'appointment' ? 'bg-slate-800 text-violet-300 shadow' : 'text-slate-400'}`}>
                        Novo Agendamento
                    </button>
                    <button type="button" onClick={() => setMode('record')} className={`flex-1 py-2 text-center font-semibold rounded-md transition-colors duration-300 ${mode === 'record' ? 'bg-slate-800 text-violet-300 shadow' : 'text-slate-400'}`}>
                        Novo Registro
                    </button>
                </div>
            )}

            <FormField label="Cliente">
                <FormInput type="text" placeholder="Buscar ou adicionar cliente..." value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </FormField>

            <FormField label="Profissional">
                <FormSelect value={selectedBarber} onChange={(e) => setSelectedBarber(e.target.value)}>
                    {MOCK_BARBERS.map(barber => <option key={barber.id} value={barber.id}>{barber.name}</option>)}
                </FormSelect>
            </FormField>
            
            <FormField label="Serviços">
                <div className="mt-1 bg-slate-700/50 border border-slate-600 rounded-lg p-2 max-h-48 overflow-y-auto space-y-2">
                    {MOCK_SERVICES.map(service => {
                        const isSelected = selectedServices.some(s => s.id === service.id);
                        return (
                            <button type="button" key={service.id} onClick={() => toggleService(service)} className={`w-full flex justify-between items-center p-3 rounded-md text-left transition-colors ${isSelected ? 'bg-violet-600/30 text-slate-100' : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'}`}>
                                <span className="font-semibold">{service.name}</span>
                                <span className="font-bold">R$ {service.price.toFixed(2)}</span>
                            </button>
                        );
                    })}
                </div>
            </FormField>
            
            {mode === 'appointment' ? (
                <div key="appointment-fields" className="grid grid-cols-2 gap-4">
                    <FormField label="Data">
                        <FormInput type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </FormField>
                    <FormField label="Hora">
                        <FormInput type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </FormField>
                </div>
            ) : (
                 <div key="record-fields" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <FormField label="Valor Total">
                           <FormInput type="text" readOnly value={`R$ ${total.toFixed(2)}`} />
                        </FormField>
                        <FormField label="Forma de Pagamento">
                            <FormSelect>
                                <option>PIX</option>
                                <option>Dinheiro</option>
                                <option>Cartão</option>
                            </FormSelect>
                        </FormField>
                    </div>
                     <FormField label="Descrição (Opcional)">
                         <FormInput type="text" placeholder="Alguma observação sobre o atendimento?" />
                     </FormField>
                 </div>
            )}

            <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-white font-semibold bg-violet-600 hover:bg-violet-700 transition-colors">
                    {initialData ? 'Salvar Alterações' : (mode === 'appointment' ? 'Confirmar Agendamento' : 'Salvar Registro')}
                </button>
            </div>
        </form>
    );
};


const NewClientForm: React.FC<{onClose: () => void}> = ({onClose}) => (
     <form className="space-y-4">
        <FormField label="Nome Completo">
            <FormInput type="text" placeholder="Nome do cliente" />
        </FormField>
         <FormField label="Telefone">
            <FormInput type="tel" placeholder="(11) 99999-9999" />
        </FormField>
        <FormField label="Email (Opcional)">
            <FormInput type="email" placeholder="cliente@email.com" />
        </FormField>
         <div className="pt-4 flex justify-end space-x-3">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancelar</button>
             <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-white font-semibold bg-violet-600 hover:bg-violet-700 transition-colors">Salvar Cliente</button>
        </div>
    </form>
);

const NewPaymentForm: React.FC<{onClose: () => void}> = ({onClose}) => (
    <form className="space-y-4">
        <FormField label="Descrição">
            <FormInput type="text" placeholder="Ex: Corte João Silva" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
             <FormField label="Valor (R$)">
                <FormInput type="number" placeholder="Ex: 40.00" />
            </FormField>
            <FormField label="Tipo">
                <FormSelect>
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                </FormSelect>
            </FormField>
        </div>
         <FormField label="Forma de Pagamento">
            <FormSelect>
                <option>PIX</option>
                <option>Dinheiro</option>
                <option>Cartão de Crédito</option>
                <option>Cartão de Débito</option>
            </FormSelect>
        </FormField>
         <div className="pt-4 flex justify-end space-x-3">
             <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">Cancelar</button>
             <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg text-white font-semibold bg-violet-600 hover:bg-violet-700 transition-colors">Registrar</button>
        </div>
    </form>
);

const ConfirmationModalContent: React.FC<{ message: string; confirmText: string; onConfirm: () => void; onCancel: () => void; }> = ({ message, confirmText, onConfirm, onCancel }) => (
    <div className="text-center">
        <p className="text-slate-300 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
            <button onClick={onCancel} className="px-6 py-2 rounded-lg text-slate-300 font-semibold bg-slate-700 hover:bg-slate-600 transition-colors">
                Cancelar
            </button>
            <button onClick={onConfirm} className={`px-6 py-2 rounded-lg text-white font-semibold ${confirmText === 'Remover' ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'} transition-colors`}>
                {confirmText}
            </button>
        </div>
    </div>
);

// DashboardPage Component
const StatCard: React.FC<{ icon: string; title: string; value: string; trend?: string; trendUp?: boolean; iconBg?: string; }> = ({ icon, title, value, trend, trendUp, iconBg = 'bg-violet-500/10' }) => (
    <Card>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-slate-100 mt-1">{value}</p>
          {trend && (
             <div className={`flex items-center text-xs mt-2 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                <Icon name={trendUp ? 'arrowUp' : 'arrowDown'} className="w-4 h-4 mr-1" />
                <span>{trend}</span>
             </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${iconBg} flex-shrink-0`}>
            <Icon name={icon} className="w-5 h-5 text-violet-400"/>
        </div>
      </div>
    </Card>
);

const QuickActionButton: React.FC<{icon: string, label: string, onClick?: () => void}> = ({icon, label, onClick}) => (
    <button onClick={onClick} className="flex flex-col items-center space-y-2 p-3 bg-slate-700/50 rounded-lg w-full text-center hover:bg-slate-700 transition-colors">
        <Icon name={icon} className="w-6 h-6 text-violet-400"/>
        <span className="text-xs font-semibold text-slate-300">{label}</span>
    </button>
)

const UpcomingAppointmentItem: React.FC<{ appointment: Appointment; onEdit: (app: Appointment) => void; onRemove: (app: Appointment) => void; onComplete: (app: Appointment) => void; }> = ({ appointment, onEdit, onRemove, onComplete }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const formatUpcomingDate = (dateString: string, time: string) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const appointmentDate = new Date(`${dateString}T00:00:00Z`); // Use Z to treat as UTC and avoid timezone issues

        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        appointmentDate.setHours(0, 0, 0, 0);

        if (appointmentDate.getTime() === today.getTime()) {
            return `Hoje, ${time}`;
        }
        if (appointmentDate.getTime() === tomorrow.getTime()) {
            return `Amanhã, ${time}`;
        }
        
        const date = new Date(`${dateString}T00:00:00Z`);
        return `${new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)}, ${time}`;
    };

    const formattedDate = formatUpcomingDate(appointment.date, appointment.startTime);
    const whatsappLink = `https://wa.me/${appointment.clientPhone?.replace(/\D/g, '')}?text=Olá!%20Lembrete%20do%20seu%20agendamento%20na%20barbearia.`;
    
    return (
        <div className="bg-slate-700/40 rounded-xl p-3 space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold text-slate-100">{appointment.clientName}</p>
                    <p className="text-sm text-violet-300 font-semibold">{formattedDate}</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button onClick={() => setMenuOpen(o => !o)} className="p-1 text-slate-400 hover:text-white">
                        <Icon name="dots" className="w-5 h-5"/>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 animate-fade-in-down-fast">
                            <button onClick={() => { onEdit(appointment); setMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-t-lg"><Icon name="pencil" className="w-4 h-4 mr-3"/> Editar</button>
                            <button onClick={() => { onRemove(appointment); setMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600"><Icon name="trash" className="w-4 h-4 mr-3"/> Remover</button>
                            <button onClick={() => { onComplete(appointment); setMenuOpen(false); }} className="flex items-center w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-slate-600 rounded-b-lg"><Icon name="checkCircle" className="w-4 h-4 mr-3"/> Concluído</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-sm">
                 <p className="text-slate-400">Serviços: <span className="text-slate-200 font-medium">{appointment.services.join(', ')}</span></p>
                {appointment.barberName && <p className="text-slate-400">Profissional: <span className="text-slate-200 font-medium">{appointment.barberName}</span></p>}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-700">
                <p className="text-xl font-bold text-green-400">R$ {appointment.price?.toFixed(2).replace('.', ',')}</p>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full bg-green-500/10 hover:bg-green-500/20 transition-colors">
                  <Icon name="whatsapp" className="w-6 h-6 text-green-400" />
                </a>
            </div>
        </div>
    );
};

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>(() => MOCK_APPOINTMENTS.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime)));
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const handleEditClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setActiveModal('editAppointment');
    };

    const handleRemoveClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setActiveModal('confirmRemove');
    };

    const handleCompleteClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setActiveModal('confirmComplete');
    };

    const handleFormSubmit = (formData: Partial<Appointment>) => {
        if (selectedAppointment) { // Editing existing
            setAppointments(prev => prev.map(app => app.id === selectedAppointment.id ? { ...app, ...formData } : app));
        } else { // Creating new
            const newAppointment: Appointment = {
                id: `a${Math.random()}`, // Mock ID
                status: AppointmentStatus.Confirmed,
                duration: 60, // Mock duration
                ...formData
            } as Appointment;
            setAppointments(prev => [...prev, newAppointment].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime)));
        }
        setActiveModal(null);
        setSelectedAppointment(null);
    };
    
    const handleConfirmRemove = () => {
        if (!selectedAppointment) return;
        setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id));
        setActiveModal(null);
        setSelectedAppointment(null);
    };

    const handleConfirmComplete = () => {
        if (!selectedAppointment) return;
        // For now, completing also removes it from the upcoming list
        setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id));
        setActiveModal(null);
        setSelectedAppointment(null);
    };

    const closeModal = () => {
      setActiveModal(null);
      setSelectedAppointment(null);
    }

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(today);

    return (
        <>
        <div className="space-y-6 pb-6">
            <div>
                <p className="text-2xl font-bold">Dashboard</p>
                <p className="text-slate-400 capitalize">{formattedDate}</p>
            </div>
            <button
                onClick={() => { setSelectedAppointment(null); setActiveModal('newAppointment'); }}
                className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20"
            >
                <Icon name="plus" className="w-5 h-5"/>
                <span>Novo Agendamento</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
                <StatCard icon="calendar" title="Agendamentos Hoje" value="8" trend="+2 desde ontem" trendUp={true} />
                <StatCard icon="dollar" title="Receita Hoje" value="R$ 450" trend="+12.5% esta semana" trendUp={true} />
                <StatCard icon="users" title="Total de Clientes" value="127" trend="Clientes ativos" />
                <StatCard icon="clock" title="Próximo Cliente" value="14:30" trend="João Silva" />
            </div>

            <Card>
                <h3 className="font-bold text-slate-100 mb-4 flex items-center"><Icon name="scissors" className="w-5 h-5 mr-2 text-violet-400"/> Ações Rápidas</h3>
                <p className="text-sm text-slate-400 mb-4">Acesso rápido às funcionalidades principais</p>
                <div className="grid grid-cols-2 gap-3">
                    <QuickActionButton icon="calendar" label="Novo Agendamento" onClick={() => { setSelectedAppointment(null); setActiveModal('newAppointment'); }} />
                    <QuickActionButton icon="users" label="Cadastrar Cliente" onClick={() => setActiveModal('newClient')} />
                    <QuickActionButton icon="payment" label="Registrar Pagamento" onClick={() => setActiveModal('newPayment')} />
                    <QuickActionButton icon="clock" label="Ver Agenda" onClick={() => navigate('/agenda')}/>
                </div>
            </Card>

            <Card>
                <h3 className="font-bold text-slate-100 mb-1">Próximos Agendamentos</h3>
                <p className="text-sm text-slate-400 mb-4">Seus próximos compromissos</p>
                <div className="relative max-h-96 overflow-y-auto space-y-3 pr-2 -mr-2" style={{ maskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 95%, transparent 100%)' }}>
                    {appointments.length > 0 ? (
                        appointments.map(app => <UpcomingAppointmentItem key={app.id} appointment={app} onEdit={handleEditClick} onRemove={handleRemoveClick} onComplete={handleCompleteClick} />)
                    ) : (
                         <div className="text-center py-8">
                            <Icon name="calendar" className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-slate-500 text-sm mt-2">Nenhum agendamento futuro.</p>
                        </div>
                    )}
                </div>
                 <button onClick={() => navigate('/agenda')} className="w-full mt-6 text-center text-violet-400 font-semibold text-sm hover:underline">Ver Todos os Agendamentos</button>
            </Card>
        </div>

        <Modal isOpen={activeModal === 'newAppointment' || activeModal === 'editAppointment'} onClose={closeModal} title={selectedAppointment ? "Editar Agendamento" : "Novo Agendamento / Registro"}>
            <AppointmentForm onClose={closeModal} onSubmit={handleFormSubmit} initialData={selectedAppointment} />
        </Modal>
        
        <Modal isOpen={activeModal === 'confirmRemove'} onClose={closeModal} title="Confirmar Remoção">
            <ConfirmationModalContent message="Tem certeza que deseja remover este agendamento?" confirmText="Remover" onConfirm={handleConfirmRemove} onCancel={closeModal} />
        </Modal>
        
        <Modal isOpen={activeModal === 'confirmComplete'} onClose={closeModal} title="Confirmar Conclusão">
             <ConfirmationModalContent message="Deseja marcar este agendamento como concluído?" confirmText="Concluir" onConfirm={handleConfirmComplete} onCancel={closeModal} />
        </Modal>

        <Modal isOpen={activeModal === 'newClient'} onClose={closeModal} title="Cadastrar Novo Cliente">
            <NewClientForm onClose={closeModal} />
        </Modal>

        <Modal isOpen={activeModal === 'newPayment'} onClose={closeModal} title="Registrar Transação">
            <NewPaymentForm onClose={closeModal} />
        </Modal>
        </>
    );
};


// AppointmentsPage Component
const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const statusColor = appointment.status === AppointmentStatus.Confirmed ? 'bg-violet-500/20 text-violet-400' : appointment.status === AppointmentStatus.Pending ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';

    return (
        <div className="flex space-x-4">
            <div className="flex flex-col items-center">
                <p className="font-bold text-slate-100">{appointment.startTime}</p>
                <p className="text-xs text-slate-400">{appointment.duration}min</p>
            </div>
            <Card className="flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold text-slate-100">{appointment.clientName}</p>
                        <p className="text-sm text-slate-300">{appointment.services.join(' + ')}</p>
                        <p className="text-sm text-slate-400 flex items-center mt-2">
                           <Icon name="user" className="w-4 h-4 mr-2" />{appointment.clientPhone}
                        </p>
                        {appointment.notes && <p className="text-xs text-slate-500 italic mt-2">"{appointment.notes}"</p>}
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>{appointment.status}</span>
                        {appointment.price && <p className="text-lg font-bold text-slate-100 mt-2">R$ {appointment.price}</p>}
                        <div className="relative mt-2">
                             <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 text-slate-400 hover:text-white">
                                <Icon name="dots" className="w-6 h-6"/>
                             </button>
                             {menuOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10">
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 rounded-t-lg"><Icon name="check" className="w-4 h-4 mr-2"/>Confirmar</a>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"><Icon name="clock" className="w-4 h-4 mr-2"/>Reagendar</a>
                                    <a href="#" className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-slate-600 rounded-b-lg"><Icon name="x" className="w-4 h-4 mr-2"/>Cancelar</a>
                                </div>
                             )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export const AppointmentsPage: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                const q = query(
                    collection(db, `barbershops/${user.uid}/appointments`),
                    orderBy("date"),
                    orderBy("startTime")
                );

                const unsubscribeFirestore = onSnapshot(q, (querySnapshot) => {
                    const appointmentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
                    setAppointments(appointmentsData);
                    setLoading(false);
                }, (error) => {
                    console.error("Error fetching appointments:", error);
                    setAppointments([]);
                    setLoading(false);
                });

                return () => unsubscribeFirestore(); // Cleanup Firestore listener
            } else {
                setAppointments([]); // Clear appointments if user logs out or is not authenticated
                setLoading(false);
            }
        });
        return () => unsubscribeAuth(); // Cleanup Auth listener
    }, []);

    return (
        <div className="space-y-6 pb-6">
             <div>
                <p className="text-2xl font-bold">Agendamentos</p>
                <p className="text-slate-400">Gerencie todos os seus agendamentos</p>
            </div>
            <button className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20">
                <Icon name="plus" className="w-5 h-5"/>
                <span>Novo Agendamento</span>
            </button>
             <div className="relative">
                <Icon name="search" className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                <input type="text" placeholder="Buscar por cliente ou serviço..." className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div className="flex space-x-3">
                 <input type="text" readOnly value="27 de set. de 2025" className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100" />
                 <button className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 flex items-center justify-center space-x-2">
                    <Icon name="filter" className="w-5 h-5 text-slate-400"/>
                    <span className="font-semibold">Filtros</span>
                 </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                <Card className="!p-3"><p className="text-slate-400 text-xs">Agendamentos Hoje</p><p className="font-bold text-xl mt-1">{appointments.length}</p></Card>
                <Card className="!p-3"><p className="text-slate-400 text-xs">Confirmados</p><p className="font-bold text-xl mt-1">{appointments.filter(a => a.status === AppointmentStatus.Confirmed).length}</p></Card>
                <Card className="!p-3"><p className="text-slate-400 text-xs">Receita Prevista</p><p className="font-bold text-xl mt-1">R$ {appointments.reduce((sum, a) => sum + (a.price || 0), 0)}</p></Card>
            </div>
            <div>
                <h3 className="font-bold text-slate-100 mb-4 flex items-center"><Icon name="clock" className="w-5 h-5 mr-2 text-violet-400"/> Agendamentos do Dia</h3>
                <div className="space-y-4">
                    {loading ? <p>Carregando...</p> : appointments.length === 0 ? <p className="text-slate-500 text-sm">Nenhum agendamento para hoje.</p> :
                    appointments.map(app => <AppointmentCard key={app.id} appointment={app} />)}
                </div>
            </div>
        </div>
    );
};


// AgendaPage Component
const TimelineSlot: React.FC<{time: string, appointment?: Appointment}> = ({ time, appointment }) => {
    if (appointment) {
        return (
             <div className="flex space-x-4 items-start">
                <p className="w-12 text-right text-slate-400 text-sm">{time}</p>
                <div className="w-px bg-slate-700 h-full relative">
                    <div className="w-2 h-2 rounded-full bg-violet-500 absolute top-1 -left-1 ring-4 ring-slate-900"></div>
                </div>
                <div className="flex-1 -mt-1">
                     <Card className="bg-slate-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-slate-100">{appointment.clientName}</p>
                                <p className="text-sm text-slate-300">{appointment.services.join(' + ')}</p>
                                <p className="text-xs text-slate-400 mt-1">{appointment.duration}min</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400`}>{appointment.status}</span>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }
    return (
        <div className="flex space-x-4 items-start h-20">
            <p className="w-12 text-right text-slate-400 text-sm pt-2">{time}</p>
            <div className="w-px bg-slate-700 h-full relative">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-600 absolute top-3 -left-0.5"></div>
            </div>
            <div className="flex-1 pt-1">
                <div className="border-2 border-dashed border-slate-700 rounded-xl p-3 text-center">
                    <p className="text-slate-500 text-sm font-semibold">Horário disponível</p>
                    <button className="text-violet-400 text-sm font-bold flex items-center justify-center w-full mt-1">
                        <Icon name="plus" className="w-4 h-4 mr-1"/> Agendar
                    </button>
                </div>
            </div>
        </div>
    )
}

export const AgendaPage: React.FC = () => {
    // This page would also fetch real data. For brevity, it's left with mock data.
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(user => {
            if (user) {
                const q = query(collection(db, `barbershops/${user.uid}/appointments`), orderBy("startTime"));
                const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
                    setAppointments(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Appointment)));
                }, (error) => {
                    console.error("Error fetching appointments:", error);
                    setAppointments([]);
                });
                return () => unsubscribeFirestore(); // Cleanup Firestore listener
            } else {
                setAppointments([]); // Clear appointments if user logs out or is not authenticated
            }
        });
        return () => unsubscribeAuth(); // Cleanup Auth listener
    }, []);

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(today);

    return (
        <div className="space-y-6 pb-6">
            <div>
                <p className="text-2xl font-bold">Agenda</p>
                <p className="text-slate-400 capitalize">{formattedDate}</p>
            </div>
            <div className="flex space-x-2">
                <div className="flex-grow flex items-center bg-slate-800/50 border border-slate-700 rounded-lg">
                    <button className="p-2.5 text-slate-400"><Icon name="left" className="w-5 h-5"/></button>
                    <div className="flex-grow text-center font-semibold">Hoje</div>
                    <button className="p-2.5 text-slate-400"><Icon name="right" className="w-5 h-5"/></button>
                </div>
                <button className="bg-violet-600 text-white font-bold p-2.5 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20">
                    <Icon name="plus" className="w-5 h-5"/>
                </button>
            </div>
             <div className="grid grid-cols-2 gap-3 text-left">
                <Card className="!p-3 flex items-center"><Icon name="calendar" className="w-5 h-5 mr-3 text-violet-400" /><div ><p className="text-slate-400 text-xs">Total Agendamentos</p><p className="font-bold text-xl">{appointments.length}</p></div></Card>
                <Card className="!p-3 flex items-center"><Icon name="check" className="w-5 h-5 mr-3 text-green-400" /><div ><p className="text-slate-400 text-xs">Confirmados</p><p className="font-bold text-xl">{appointments.filter(a => a.status === AppointmentStatus.Confirmed).length}</p></div></Card>
                 <Card className="!p-3 flex items-center"><Icon name="clock" className="w-5 h-5 mr-3 text-yellow-400" /><div ><p className="text-slate-400 text-xs">Pendentes</p><p className="font-bold text-xl">{appointments.filter(a => a.status === AppointmentStatus.Pending).length}</p></div></Card>
                <Card className="!p-3 flex items-center"><Icon name="clock" className="w-5 h-5 mr-3 text-slate-400" /><div ><p className="text-slate-400 text-xs">Próximo Cliente</p><p className="font-bold text-xl">{appointments[0]?.startTime || '--:--'}</p></div></Card>
            </div>
            <div>
                 <div className="flex space-x-2 items-center">
                    <div className="flex-grow flex space-x-1 p-1 bg-slate-800/50 rounded-lg">
                        <button className="flex-1 text-center text-sm py-1.5 rounded-md bg-slate-700 font-semibold">Calendário</button>
                        <button className="flex-1 text-center text-sm py-1.5 rounded-md text-slate-400">Kanban</button>
                        <button className="flex-1 text-center text-sm py-1.5 rounded-md text-slate-400">Timeline</button>
                    </div>
                     <button className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 flex items-center justify-center space-x-2">
                        <Icon name="filter" className="w-5 h-5 text-slate-400"/>
                        <span className="font-semibold text-sm">Filtros</span>
                     </button>
                 </div>
            </div>
            
             <Card>
                <h3 className="font-bold text-slate-100 mb-2">Linha do Tempo</h3>
                <p className="text-sm text-slate-400 mb-6">Visualização cronológica dos agendamentos</p>
                <div className="space-y-1">
                    <TimelineSlot time="08:00" />
                    <TimelineSlot time="08:30" />
                    <TimelineSlot time="09:00" appointment={appointments.find(a => a.startTime === '09:00')} />
                </div>
            </Card>

        </div>
    );
};


// ClientsPage Component
// This page still uses MOCK_CLIENTS. You would apply the same pattern of useEffect and onSnapshot to fetch real client data.
const ClientCard: React.FC<{client: Client}> = ({ client }) => {
    return (
        <Card className="relative">
             <div className="absolute top-4 right-4 flex items-center space-x-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${client.status === ClientStatus.Active ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-600 text-slate-300'}`}>{client.status}</span>
                <button className="p-1 text-slate-400"><Icon name="dots" className="w-5 h-5"/></button>
            </div>
            <div className="flex space-x-4">
                <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-bold text-violet-300 text-xl">{client.avatarInitials}</div>
                <div>
                    <p className="font-bold text-slate-100">{client.name}</p>
                    <p className="text-sm text-slate-400">{client.phone}</p>
                    <p className="text-sm text-slate-400">{client.email}</p>
                </div>
            </div>
            <div className="text-sm text-slate-400 mt-4 flex items-center">
                <Icon name="calendar" className="w-4 h-4 mr-2"/>
                Última visita: {client.lastVisit}
            </div>
            <div className="flex items-center space-x-1 text-yellow-400 mt-2">
{/* Rating removido pois não existe no tipo Client ainda */}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-slate-400">Visitas</p>
                    <p className="font-semibold text-slate-200">{client.visits}</p>
                </div>
                 <div>
                    <p className="text-slate-400">Gasto Total</p>
                    <p className="font-semibold text-slate-200">R$ {client.spent}</p>
                </div>
            </div>
             {client.notes && <p className="text-xs text-slate-500 italic mt-4 pt-4 border-t border-slate-700">"{client.notes}"</p>}
        </Card>
    )
}
export const ClientsPage: React.FC = () => {
    return (
        <div className="space-y-6 pb-6">
            <div>
                <p className="text-2xl font-bold">Clientes</p>
                <p className="text-slate-400">Gerencie sua base de clientes</p>
            </div>
             <button className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20">
                <Icon name="plus" className="w-5 h-5"/>
                <span>Novo Cliente</span>
            </button>
             <div className="relative">
                <Icon name="search" className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2"/>
                <input type="text" placeholder="Buscar por nome, telefone ou email..." className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
             <button className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 flex items-center justify-center space-x-2">
                <Icon name="filter" className="w-5 h-5 text-slate-400"/>
                <span className="font-semibold">Filtros</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
                <StatCard icon="users" title="Total de Clientes" value="5" iconBg="bg-transparent"/>
                <StatCard icon="check" title="Clientes Ativos" value="3" iconBg="bg-transparent"/>
                <StatCard icon="star" title="Clientes VIP" value="1" iconBg="bg-transparent"/>
                <StatCard icon="dollar" title="Receita Total" value="R$ 3.890" iconBg="bg-transparent"/>
            </div>
            <Card>
                 <h3 className="font-bold text-slate-100 mb-2 flex items-center"><Icon name="users" className="w-5 h-5 mr-2 text-violet-400"/> Lista de Clientes</h3>
                 <p className="text-sm text-slate-400 mb-4">5 clientes encontrados</p>
                 <div className="space-y-4">
                    {MOCK_CLIENTS.slice(0, 2).map(client => <ClientCard key={client.id} client={client}/>)}
                 </div>
            </Card>
        </div>
    );
};


// FinancialPage Component
// This page still uses MOCK_TRANSACTIONS.
const PaymentMethodDistribution: React.FC<{method: string; percentage: number; amount: string; icon: string;}> = ({method, percentage, amount, icon}) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-2">
                 <Icon name={icon} className="w-5 h-5 text-slate-400"/>
                 <span className="text-slate-300 font-medium">{method}</span>
                 <span className="text-slate-500">{percentage}% do total</span>
            </div>
            <span className="font-bold text-slate-100">{amount}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div className="bg-violet-500 h-1.5 rounded-full" style={{width: `${percentage}%`}}></div>
        </div>
    </div>
);
const TransactionItem: React.FC<{transaction: Transaction}> = ({transaction}) => {
    const isIncome = transaction.type === TransactionType.Income;
    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${isIncome ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    <Icon name={isIncome ? 'arrowUp' : 'arrowDown'} className={`w-5 h-5 ${isIncome ? 'text-green-400' : 'text-red-400'}`}/>
                </div>
                <div>
                    <p className="font-bold text-slate-100">{transaction.description}</p>
                    <p className="text-xs text-slate-400">{transaction.date} - {transaction.time}</p>
                </div>
            </div>
            <div className="text-right">
                <p className={`font-bold text-lg ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                    {isIncome ? '+' : '-'}R$ {transaction.amount}
                </p>
                <p className="text-xs text-slate-400">{transaction.category}</p>
            </div>
        </div>
    );
}
export const FinancialPage: React.FC = () => {
    return (
        <div className="space-y-6 pb-6">
            <div>
                <p className="text-2xl font-bold">Financeiro</p>
                <p className="text-slate-400">Controle completo das suas finanças</p>
            </div>
            <button className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 shadow-lg shadow-violet-600/20">
                <Icon name="plus" className="w-5 h-5"/>
                <span>Nova Transação</span>
            </button>
            <div className="grid grid-cols-2 gap-4">
                <StatCard icon="dollar" title="Receita Mensal" value="R$ 12.450" trend="+15.2% vs mês anterior" trendUp={true}/>
                <StatCard icon="calendar" title="Receita Semanal" value="R$ 3.200" trend="-5.1% vs semana anterior" trendUp={false}/>
                <StatCard icon="receipt" title="Receita Diária" value="R$ 650" trend="Hoje, 27/09/2025"/>
                <StatCard icon="trendUp" title="Lucro Líquido" value="R$ 9.650" trend="Receita - Despesas"/>
            </div>
            <Card>
                 <h3 className="font-bold text-slate-100 mb-2 flex items-center"><Icon name="clock" className="w-5 h-5 mr-2 text-violet-400"/> Formas de Pagamento</h3>
                 <p className="text-sm text-slate-400 mb-6">Distribuição dos recebimentos do mês</p>
                 <div className="space-y-4">
                    <PaymentMethodDistribution method="PIX" percentage={45} amount="R$ 4.580" icon="receipt"/>
                    <PaymentMethodDistribution method="Dinheiro" percentage={32} amount="R$ 3.200" icon="cash"/>
                    <PaymentMethodDistribution method="Cartão" percentage={23} amount="R$ 2.340" icon="creditCard"/>
                 </div>
            </Card>
             <Card>
                 <h3 className="font-bold text-slate-100 mb-2 flex items-center"><Icon name="history" className="w-5 h-5 mr-2 text-violet-400"/> Transações Recentes</h3>
                 <p className="text-sm text-slate-400 mb-2">Últimas movimentações financeiras</p>
                 <div className="divide-y divide-slate-700">
                    {MOCK_TRANSACTIONS.map(tx => <TransactionItem key={tx.id} transaction={tx}/>)}
                 </div>
                 <button className="w-full mt-4 text-center text-violet-400 font-semibold text-sm">Ver Todas as Transações</button>
            </Card>
        </div>
    );
};

// --- Helper Components for Settings Pages ---

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
                <Icon name={icon} className="w-6 h-6 text-slate-400"/>
                <div>
                    <p className="font-semibold text-slate-200">{label}</p>
                    {sublabel && <p className="text-sm text-slate-500">{sublabel}</p>}
                </div>
            </div>
            <div>
                {children ? children : (onClick && <Icon name="right" className="w-5 h-5 text-slate-500"/>)}
            </div>
        </div>
    );

    if (onClick) {
        return <button onClick={onClick} className="w-full text-left">{content}</button>;
    }
    return <div className="w-full">{content}</div>;
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${enabled ? 'bg-violet-600' : 'bg-slate-600'}`}
    >
        <span
            className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
        />
    </button>
);


// Profile Page
export const ProfilePage: React.FC = () => {
    return (
        <div className="-m-4">
             <div className="relative h-48">
                <img src="https://images.unsplash.com/photo-1599351431202-1810c26a87c3?q=80&w=1974&auto=format&fit=crop" alt="Capa da Barbearia" className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                <img src="https://i.pravatar.cc/150?u=barbershop" alt="Logo da Barbearia" className="absolute -bottom-12 left-4 w-24 h-24 rounded-full border-4 border-slate-900"/>
            </div>
            <div className="pt-16 px-4 pb-6 space-y-6">
                 <div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold">André Barber</h1>
                        <button className="px-4 py-2 text-sm font-semibold bg-slate-700/50 border border-slate-600 rounded-lg hover:bg-slate-700">Editar Perfil</button>
                    </div>
                    <p className="text-slate-400">@andrebarber</p>
                </div>
                 <Card>
                    <h2 className="font-bold text-slate-100 mb-2">Sobre Nós</h2>
                    <p className="text-slate-300 text-sm">A melhor barbearia da cidade, especializada em cortes clássicos e modernos. Venha nos visitar e saia com o visual renovado!</p>
                </Card>
                 <Card>
                     <h2 className="font-bold text-slate-100 mb-2">Contato e Localização</h2>
                     <div className="divide-y divide-slate-700/50">
                        <SettingsItem icon="map" label="Rua Fictícia, 123 - Centro" sublabel="São Paulo, SP" onClick={() => {}} />
                        <SettingsItem icon="phone" label="(11) 99999-8888" sublabel="WhatsApp" onClick={() => {}}/>
                     </div>
                </Card>
                 <Card>
                     <h2 className="font-bold text-slate-100 mb-2">Nossas Redes</h2>
                      <div className="divide-y divide-slate-700/50">
                        <SettingsItem icon="instagram" label="Instagram" onClick={() => {}}/>
                        <SettingsItem icon="facebook" label="Facebook" onClick={() => {}}/>
                        <SettingsItem icon="tiktok" label="TikTok" onClick={() => {}}/>
                        <SettingsItem icon="globe" label="Nosso Site" onClick={() => {}}/>
                     </div>
                </Card>
            </div>
        </div>
    );
};

// Shop Settings Page
export const ShopSettingsPage: React.FC = () => {
    const [paymentMethods, setPaymentMethods] = useState({ pix: true, cash: true, card: false });

    return (
        <div className="space-y-6 pb-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                     <h2 className="font-bold text-slate-100 text-lg">Profissionais</h2>
                     <button className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                        <Icon name="plus" className="w-4 h-4"/>
                        <span>Adicionar Novo</span>
                     </button>
                </div>
                <div className="space-y-3">
                    {MOCK_BARBERS.map(barber => (
                        <div key={barber.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <img src={barber.avatarUrl} alt={barber.name} className="w-10 h-10 rounded-full"/>
                                <p className="font-semibold text-slate-200">{barber.name}</p>
                            </div>
                            <button className="text-slate-400 p-1"><Icon name="dots" className="w-5 h-5"/></button>
                        </div>
                    ))}
                </div>
            </Card>

             <Card>
                <div className="flex justify-between items-center mb-4">
                     <h2 className="font-bold text-slate-100 text-lg">Horários de Funcionamento</h2>
                     <button className="px-3 py-1.5 text-sm font-semibold bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600">Editar</button>
                </div>
                <ul className="text-sm space-y-2">
                    <li className="flex justify-between"><span className="text-slate-400">Segunda a Sexta:</span><span className="font-semibold text-slate-200">09:00 - 19:00</span></li>
                    <li className="flex justify-between"><span className="text-slate-400">Sábado:</span><span className="font-semibold text-slate-200">09:00 - 16:00</span></li>
                    <li className="flex justify-between"><span className="text-slate-400">Domingo:</span><span className="font-semibold text-red-400">Fechado</span></li>
                </ul>
            </Card>

            <Card>
                <h2 className="font-bold text-slate-100 text-lg mb-2">Formas de Pagamento</h2>
                <div className="divide-y divide-slate-700/50">
                     <SettingsItem icon="receipt" label="PIX">
                        <ToggleSwitch enabled={paymentMethods.pix} onChange={(e) => setPaymentMethods(p => ({...p, pix: e}))} />
                    </SettingsItem>
                    <SettingsItem icon="cash" label="Dinheiro">
                        <ToggleSwitch enabled={paymentMethods.cash} onChange={(e) => setPaymentMethods(p => ({...p, cash: e}))} />
                    </SettingsItem>
                    <SettingsItem icon="creditCard" label="Cartão de Crédito/Débito">
                        <ToggleSwitch enabled={paymentMethods.card} onChange={(e) => setPaymentMethods(p => ({...p, card: e}))} />
                    </SettingsItem>
                </div>
            </Card>
        </div>
    );
};

// Services Settings Page
export const ServicesSettingsPage: React.FC = () => (
    <div className="space-y-6 pb-6">
        <Card>
            <div className="flex justify-between items-center mb-4">
                 <h2 className="font-bold text-slate-100 text-lg">Serviços Cadastrados</h2>
                 <button className="flex items-center space-x-2 px-3 py-1.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700">
                    <Icon name="plus" className="w-4 h-4"/>
                    <span>Novo Serviço</span>
                 </button>
            </div>
            <div className="space-y-3">
                {MOCK_SERVICES.map(service => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div>
                            <p className="font-semibold text-slate-200">{service.name}</p>
                            <p className="text-sm text-slate-400">{service.duration} min - R$ {service.price.toFixed(2)}</p>
                        </div>
                        <button className="text-slate-400 p-1"><Icon name="dots" className="w-5 h-5"/></button>
                    </div>
                ))}
            </div>
        </Card>
    </div>
);

// App Settings Page
export const AppSettingsPage: React.FC = () => {
    const [theme, setTheme] = useState('dark');
    const [notifications, setNotifications] = useState({ newAppointments: true, reminders: true });
    const user = auth.currentUser;

    return (
        <div className="space-y-6 pb-6">
            <Card>
                 <h2 className="font-bold text-slate-100 text-lg mb-2">Aparência</h2>
                 <SettingsItem icon="palette" label="Tema do Aplicativo">
                     <div className="flex p-1 bg-slate-700 rounded-lg">
                        <button onClick={() => setTheme('light')} className={`px-4 py-1 text-sm font-semibold rounded ${theme === 'light' ? 'bg-slate-500 text-white' : 'text-slate-400'}`}>Claro</button>
                        <button onClick={() => setTheme('dark')} className={`px-4 py-1 text-sm font-semibold rounded ${theme === 'dark' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>Escuro</button>
                     </div>
                 </SettingsItem>
            </Card>
             <Card>
                 <h2 className="font-bold text-slate-100 text-lg mb-2">Conta</h2>
                 <div className="divide-y divide-slate-700/50">
                    <SettingsItem icon="user" label="Email" sublabel={user?.email || 'N/A'} />
                    <SettingsItem icon="key" label="Redefinir Senha" onClick={() => {}} />
                </div>
            </Card>
            <Card>
                 <h2 className="font-bold text-slate-100 text-lg mb-2">Notificações</h2>
                 <div className="divide-y divide-slate-700/50">
                    <SettingsItem icon="calendar" label="Novos Agendamentos">
                        <ToggleSwitch enabled={notifications.newAppointments} onChange={e => setNotifications(p => ({...p, newAppointments: e}))} />
                    </SettingsItem>
                    <SettingsItem icon="bell" label="Lembretes de Agendamento">
                         <ToggleSwitch enabled={notifications.reminders} onChange={e => setNotifications(p => ({...p, reminders: e}))} />
                    </SettingsItem>
                </div>
            </Card>
            <Card>
                 <h2 className="font-bold text-slate-100 text-lg mb-2">Mais</h2>
                 <div className="divide-y divide-slate-700/50">
                    <SettingsItem icon="shield" label="Dados e Privacidade" onClick={() => {}} />
                    <SettingsItem icon="help" label="Suporte" onClick={() => {}} />
                    <SettingsItem icon="gift" label="Novidades do App" onClick={() => {}} />
                </div>
            </Card>
        </div>
    );
};