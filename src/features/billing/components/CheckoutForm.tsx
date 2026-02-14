/**
 * CheckoutForm — Formulário de cadastro + checkout para novos assinantes.
 *
 * Fluxos:
 * - Cartão: signUpAndSubscribe → auto-login → Dashboard
 * - PIX: signUpAndSubscribe → Exibe QR Code → Aguarda pagamento (via email)
 */

import React, { useState } from 'react';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/firebase';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiCreditCard, FiLoader, FiCopy, FiCheck } from 'react-icons/fi';
import { calculatePrice, formatCurrency } from '../constants';
import type { PlanType, BillingType } from '@/types';

interface CheckoutFormProps {
    plan: PlanType;
    barberCount: number;
    onCancel: () => void;
}

interface PixPaymentData {
    invoiceUrl: string;
    pixQrCode: string | null;
    pixCopiaECola: string | null;
    paymentId: string;
    value: number;
    dueDate: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ plan, barberCount, onCancel }) => {
    const navigate = useNavigate();
    const totalPrice = calculatePrice(plan, barberCount);

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [phone, setPhone] = useState('');
    const [billingType, setBillingType] = useState<BillingType>('PIX');

    // Card fields
    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [cardCep, setCardCep] = useState('');
    const [cardAddressNumber, setCardAddressNumber] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // PIX state
    const [pixData, setPixData] = useState<PixPaymentData | null>(null);
    const [pixCopied, setPixCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name || name.length < 3) { setError('Nome deve ter pelo menos 3 caracteres.'); return; }
        if (!email || !email.includes('@')) { setError('Email inválido.'); return; }
        if (!password || password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return; }
        if (!cpfCnpj || cpfCnpj.replace(/\D/g, '').length < 11) { setError('CPF inválido.'); return; }
        if (!phone || phone.replace(/\D/g, '').length < 10) { setError('Telefone inválido.'); return; }

        if (billingType === 'CREDIT_CARD') {
            if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
                setError('Preencha todos os dados do cartão.');
                return;
            }
        }

        setLoading(true);

        try {
            const payload: Record<string, any> = {
                name,
                email,
                password,
                cpfCnpj: cpfCnpj.replace(/\D/g, ''),
                phone: phone.replace(/\D/g, ''),
                plan,
                barberCount,
                billingType,
            };

            if (billingType === 'CREDIT_CARD') {
                const [expMonth, expYear] = cardExpiry.split('/');
                payload.creditCard = {
                    holderName: cardHolder,
                    number: cardNumber.replace(/\s/g, ''),
                    expiryMonth: expMonth?.trim(),
                    expiryYear: expYear?.trim().length === 2 ? `20${expYear.trim()}` : expYear?.trim(),
                    ccv: cardCvv,
                };
                payload.creditCardHolderInfo = {
                    name: cardHolder,
                    email,
                    cpfCnpj: cpfCnpj.replace(/\D/g, ''),
                    postalCode: cardCep.replace(/\D/g, ''),
                    addressNumber: cardAddressNumber,
                    phone: phone.replace(/\D/g, ''),
                };
            }

            // Call Cloud Function
            const PROD_FUNCTION_URL = 'https://southamerica-east1-saas-barbearia-8d49a.cloudfunctions.net/signUpAndSubscribe';
            const EMULATOR_URL = 'http://localhost:5001/saas-barbearia-8d49a/southamerica-east1/signUpAndSubscribe';

            let signUpUrl: string;
            if (!import.meta.env.DEV) {
                signUpUrl = '/api/sign-up';
            } else if (import.meta.env.VITE_USE_EMULATOR === 'true') {
                signUpUrl = EMULATOR_URL;
            } else {
                signUpUrl = PROD_FUNCTION_URL;
            }

            const response = await fetch(signUpUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao criar conta.');
            }

            // ── Handle response by payment type ──────────────────

            if (result.status === 'awaiting_pix') {
                // PIX: mostra QR Code
                setPixData(result.pendingPayment);
            } else if (result.customToken) {
                // Cartão: auto-login
                await signInWithCustomToken(auth, result.customToken);
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao processar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyPix = async () => {
        if (pixData?.pixCopiaECola) {
            await navigator.clipboard.writeText(pixData.pixCopiaECola);
            setPixCopied(true);
            setTimeout(() => setPixCopied(false), 3000);
        }
    };

    // ── PIX Success Screen ──────────────────────────────────
    if (pixData) {
        return (
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/30">
                    <FiCheck className="w-8 h-8 text-green-400" />
                </div>

                <h3 className="text-lg font-bold text-slate-100">Pague com PIX</h3>
                <p className="text-sm text-slate-400">
                    Escaneie o QR Code ou copie o código para pagar.
                </p>

                {/* QR Code */}
                {pixData.pixQrCode && (
                    <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                        <img
                            src={`data:image/png;base64,${pixData.pixQrCode}`}
                            alt="QR Code PIX"
                            className="w-48 h-48"
                        />
                    </div>
                )}

                {/* Copia e Cola */}
                {pixData.pixCopiaECola && (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-500">Ou copie o código PIX:</p>
                        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 flex items-center gap-2">
                            <code className="text-xs text-slate-300 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                {pixData.pixCopiaECola.substring(0, 40)}...
                            </code>
                            <button
                                onClick={handleCopyPix}
                                className="p-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors shrink-0"
                            >
                                {pixCopied
                                    ? <FiCheck className="w-4 h-4 text-green-400" />
                                    : <FiCopy className="w-4 h-4 text-white" />
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* Value and invoice */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-1">
                    <p className="text-sm text-slate-300">
                        Valor: <span className="font-bold text-violet-400">{formatCurrency(pixData.value)}</span>
                    </p>
                    {pixData.invoiceUrl && (
                        <a
                            href={pixData.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-violet-400 hover:underline"
                        >
                            Ver fatura completa →
                        </a>
                    )}
                </div>

                {/* Instruções pós-pagamento */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
                    <p className="text-xs text-green-300 text-left font-medium">
                        📋 Após pagar o PIX:
                    </p>
                    <ol className="text-xs text-green-300/90 text-left list-decimal list-inside space-y-1">
                        <li>Aguarde <strong>1-2 minutos</strong> para confirmação</li>
                        <li>Acesse a <a href="/#/login" className="text-violet-400 underline font-medium">página de login</a></li>
                        <li>Entre com <strong>{email}</strong> e a mesma senha cadastrada</li>
                    </ol>
                    <p className="text-[10px] text-slate-500 text-left">
                        Sua conta será liberada automaticamente após a confirmação do pagamento.
                    </p>
                </div>

                <a
                    href="/#/login"
                    className="block w-full text-center bg-violet-600/20 border border-violet-500/30 text-violet-300 font-medium text-sm py-2.5 rounded-lg hover:bg-violet-600/30 transition-colors"
                >
                    Ir para o Login →
                </a>
            </div>
        );
    }

    // ── Payment Form ────────────────────────────────────────
    const billingOptions: { value: BillingType; label: string; icon: string }[] = [
        { value: 'PIX', label: 'PIX', icon: '⚡' },
        { value: 'CREDIT_CARD', label: 'Cartão', icon: '💳' },
    ];

    const inputClass = 'w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm transition-all';

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {/* Price summary */}
            <div className="bg-violet-600/10 border border-violet-500/30 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-violet-300 text-sm font-medium">Total mensal:</span>
                <span className="text-violet-300 font-extrabold">{formatCurrency(totalPrice)}</span>
            </div>

            {/* Personal info */}
            <input type="text" placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} className={inputClass} disabled={loading} />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} disabled={loading} />
            <input type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} disabled={loading} />

            <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="CPF" value={cpfCnpj} onChange={e => setCpfCnpj(formatCPF(e.target.value))} maxLength={14} className={inputClass} disabled={loading} />
                <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} maxLength={15} className={inputClass} disabled={loading} />
            </div>

            {/* Payment method */}
            <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Forma de pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                    {billingOptions.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setBillingType(opt.value)}
                            className={`py-2 rounded-lg text-xs font-semibold transition-all border ${billingType === opt.value
                                ? 'border-violet-500 bg-violet-500/20 text-violet-300'
                                : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-500'
                                }`}
                            disabled={loading}
                        >
                            {opt.icon} {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Credit card fields */}
            {billingType === 'CREDIT_CARD' && (
                <div className="space-y-2 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="flex items-center gap-1.5 mb-1">
                        <FiCreditCard className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs font-medium text-slate-300">Dados do Cartão</span>
                    </div>
                    <input type="text" placeholder="Número do cartão" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} className={inputClass} disabled={loading} />
                    <input type="text" placeholder="Nome no cartão" value={cardHolder} onChange={e => setCardHolder(e.target.value)} className={inputClass} disabled={loading} />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} className={inputClass} disabled={loading} />
                        <input type="text" placeholder="CVV" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))} maxLength={4} className={inputClass} disabled={loading} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="CEP" value={cardCep} onChange={e => setCardCep(formatCEP(e.target.value))} maxLength={9} className={inputClass} disabled={loading} />
                        <input type="text" placeholder="Nº endereço" value={cardAddressNumber} onChange={e => setCardAddressNumber(e.target.value)} className={inputClass} disabled={loading} />
                    </div>
                </div>
            )}

            {/* PIX info */}
            {billingType === 'PIX' && (
                <p className="text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3">
                    ⚡ Após preencher seus dados, o QR Code PIX será exibido para pagamento.
                    Sua conta será criada automaticamente após a confirmação.
                </p>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-2.5 text-red-400 text-xs">
                    {error}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                ) : (
                    <FiLock className="w-4 h-4" />
                )}
                <span>
                    {loading
                        ? (billingType === 'CREDIT_CARD' ? 'Processando pagamento...' : 'Gerando PIX...')
                        : 'Finalizar Assinatura'
                    }
                </span>
            </button>

            {/* Cancel */}
            <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors py-1"
            >
                ← Voltar para os planos
            </button>

            <p className="text-[10px] text-slate-600 text-center flex items-center justify-center gap-1">
                <FiLock className="w-3 h-3" /> Dados protegidos com criptografia SSL
            </p>
        </form>
    );
};

// ─── Formatters ─────────────────────────────────────────────

function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCEP(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
