/**
 * LandingPage — Página institucional / vitrine do BarberIA
 *
 * Rota pública: /precos
 * Seções: Hero, Features, Como Funciona, Depoimentos (carousel), Preços, CTA, Footer
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    FiCalendar, FiUsers, FiDollarSign, FiGlobe,
    FiBell, FiBarChart2, FiCheck, FiArrowRight,
    FiStar, FiChevronLeft, FiChevronRight, FiSmartphone,
    FiZap, FiShield
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

// ─── Plan Pricing (espelho de billing/constants) ───────────
const PLANS = {
    basic: {
        name: 'Básico',
        basePrice: 47,
        extraBarberPrice: 24,
        features: [
            'Agendamentos ilimitados',
            'Gestão de clientes',
            'Link público de agendamento',
            'Controle financeiro básico',
            'Notificações push',
            'Suporte por WhatsApp',
        ],
    },
    premium: {
        name: 'Premium',
        basePrice: 87,
        extraBarberPrice: 44,
        popular: true,
        features: [
            'Tudo do plano Básico',
            'Até 5 barbeiros',
            'Relatórios avançados',
            'Exportação para Excel',
            'Personalização do site público',
            'Suporte prioritário',
        ],
    },
};

// ─── Testimonial Placeholders ──────────────────────────────
const testimonials = [
    {
        name: 'Carlos Silva',
        role: 'Barbearia do Carlos — SP',
        text: 'Desde que comecei a usar o BarberIA, meu faturamento aumentou 30%. Os clientes adoram o agendamento online e eu tenho controle total da minha agenda.',
        avatar: '👨🏽',
        rating: 5,
    },
    {
        name: 'Ricardo Mendes',
        role: 'Studio R Barber — RJ',
        text: 'A melhor decisão que tomei foi digitalizar minha barbearia. O financeiro automático me poupa horas toda semana. Recomendo demais!',
        avatar: '👨🏻',
        rating: 5,
    },
    {
        name: 'André Oliveira',
        role: 'Barber House — MG',
        text: 'Tenho 3 barbeiros e o BarberIA organiza tudo perfeitamente. Cada um com sua agenda, e eu vejo tudo pelo dashboard. Fantástico!',
        avatar: '👨🏿',
        rating: 5,
    },
    {
        name: 'Felipe Santos',
        role: 'Dom Barber — BA',
        text: 'Antes eu perdia clientes por falta de organização. Agora eles agendam pelo link, recebem confirmação e nunca mais perdi um horário.',
        avatar: '👨🏽',
        rating: 5,
    },
    {
        name: 'Lucas Pereira',
        role: 'Barbearia LP — RS',
        text: 'O suporte é excepcional e a plataforma é muito intuitiva. Em 10 minutos já estava usando tudo. Melhor investimento do meu negócio.',
        avatar: '👨🏻',
        rating: 5,
    },
];

// ─── Features ──────────────────────────────────────────────
const features = [
    {
        icon: FiCalendar,
        title: 'Agenda Inteligente',
        description: 'Visualize seus agendamentos por dia, semana ou mês. Kanban, Timeline e Calendário em um só lugar.',
        color: 'violet',
    },
    {
        icon: FiUsers,
        title: 'Gestão de Clientes',
        description: 'Histórico completo de cada cliente: agendamentos, preferências e frequência de visitas.',
        color: 'blue',
    },
    {
        icon: FiDollarSign,
        title: 'Controle Financeiro',
        description: 'Registre receitas e despesas, veja seu lucro real e tome decisões com dados concretos.',
        color: 'green',
    },
    {
        icon: FiGlobe,
        title: 'Site de Agendamento',
        description: 'Seu link exclusivo para clientes agendarem 24h. Compartilhe nas redes sociais e WhatsApp.',
        color: 'purple',
    },
    {
        icon: FiBell,
        title: 'Notificações Push',
        description: 'Receba alertas em tempo real de novos agendamentos, cancelamentos e lembretes.',
        color: 'amber',
    },
    {
        icon: FiBarChart2,
        title: 'Dashboard & Relatórios',
        description: 'Visão completa do seu negócio: KPIs, gráficos e insights para crescer com segurança.',
        color: 'rose',
    },
];

const colorMap: Record<string, string> = {
    violet: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    green: 'bg-green-500/15 text-green-400 border-green-500/20',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

// ─── Steps ─────────────────────────────────────────────────
const steps = [
    {
        number: '01',
        title: 'Cadastre-se',
        description: 'Escolha seu plano, preencha seus dados e pague com PIX ou cartão. Sua conta é criada instantaneamente.',
        icon: FiSmartphone,
    },
    {
        number: '02',
        title: 'Configure',
        description: 'Adicione seus serviços, preços e horários de funcionamento. Personalize seu link público.',
        icon: FiZap,
    },
    {
        number: '03',
        title: 'Gerencie',
        description: 'Comece a receber agendamentos, controlar seu financeiro e acompanhar o crescimento do seu negócio.',
        icon: FiBarChart2,
    },
];

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const whatsappPhone = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE || '5511999999999';

    // ─── Testimonial Carousel ─────────────────────────────────
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const carouselRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        carouselRef.current = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
        }, 4000);
        return () => {
            if (carouselRef.current) clearInterval(carouselRef.current);
        };
    }, []);

    const goToTestimonial = (index: number) => {
        setCurrentTestimonial(index);
        if (carouselRef.current) clearInterval(carouselRef.current);
        carouselRef.current = setInterval(() => {
            setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
        }, 4000);
    };

    const nextTestimonial = () => goToTestimonial((currentTestimonial + 1) % testimonials.length);
    const prevTestimonial = () => goToTestimonial((currentTestimonial - 1 + testimonials.length) % testimonials.length);

    const handleCTA = () => navigate('/login');

    const handleWhatsApp = () => {
        const message = 'Olá! Gostaria de saber mais sobre o BarberIA.';
        window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">

            {/* ─── Navbar ──────────────────────────────────────────── */}
            <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/60">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-black text-white">B</span>
                        </div>
                        <span className="text-lg font-bold">Barber<span className="text-violet-400">IA</span></span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-slate-400 hover:text-slate-200 transition-colors font-medium px-3 py-1.5"
                        >
                            Entrar
                        </button>
                        <button
                            onClick={handleCTA}
                            className="text-sm bg-violet-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/20"
                        >
                            Começar Agora
                        </button>
                    </div>
                </div>
            </nav>

            {/* ─── Hero ────────────────────────────────────────────── */}
            <section className="relative py-16 md:py-24 px-4">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 via-transparent to-transparent" />
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />

                <div className="relative max-w-4xl mx-auto text-center space-y-6">
                    <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-violet-300">
                        <FiZap className="w-3.5 h-3.5" />
                        Plataforma Completa para Barbearias
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black leading-tight">
                        Gerencie sua barbearia com{' '}
                        <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                            inteligência
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Agenda, clientes, financeiro e agendamento online em um só lugar.
                        Pare de perder tempo com planilhas e cadernetas — profissionalize seu negócio.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                        <button
                            onClick={handleCTA}
                            className="w-full sm:w-auto bg-violet-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 text-base"
                        >
                            Começar Agora <FiArrowRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleWhatsApp}
                            className="w-full sm:w-auto bg-green-600/10 border border-green-500/30 text-green-400 font-semibold px-8 py-3.5 rounded-xl hover:bg-green-600/20 transition-all flex items-center justify-center gap-2 text-base"
                        >
                            <FaWhatsapp className="w-5 h-5" /> Fale Conosco
                        </button>
                    </div>

                    <p className="text-xs text-slate-600 pt-2">
                        ✓ Sem contrato de fidelidade &nbsp; ✓ Cancele quando quiser &nbsp; ✓ Dados protegidos
                    </p>

                    {/* Hero placeholder mockup */}
                    <div className="mt-10 mx-auto max-w-3xl relative">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-violet-900/10">
                            <div className="bg-slate-800/50 rounded-xl aspect-[16/9] flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <div className="w-16 h-16 bg-violet-500/20 rounded-2xl mx-auto flex items-center justify-center">
                                        <FiCalendar className="w-8 h-8 text-violet-400" />
                                    </div>
                                    <p className="text-slate-500 text-sm font-medium">Preview do Dashboard</p>
                                    <p className="text-slate-600 text-xs">Imagem ilustrativa do painel de controle</p>
                                </div>
                            </div>
                        </div>
                        {/* Floating decorations */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                    </div>
                </div>
            </section>

            {/* ─── Features ────────────────────────────────────────── */}
            <section className="py-16 md:py-20 px-4" id="features">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center space-y-3 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Tudo que você precisa,{' '}
                            <span className="text-violet-400">em um só lugar</span>
                        </h2>
                        <p className="text-slate-400 max-w-xl mx-auto">
                            Funcionalidades pensadas para o dia a dia do barbeiro profissional.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorMap[feature.color]} mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-100 mb-2">{feature.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Como Funciona ───────────────────────────────────── */}
            <section className="py-16 md:py-20 px-4 bg-slate-900/30">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center space-y-3 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Comece em <span className="text-violet-400">3 passos</span>
                        </h2>
                        <p className="text-slate-400">Simples, rápido e sem burocracia.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <div key={step.number} className="relative text-center space-y-4 p-6">
                                {/* Connector line */}
                                {i < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
                                )}
                                <div className="w-16 h-16 bg-violet-500/10 border border-violet-500/20 rounded-2xl mx-auto flex items-center justify-center">
                                    <step.icon className="w-7 h-7 text-violet-400" />
                                </div>
                                <span className="text-xs text-violet-400 font-bold tracking-widest">{step.number}</span>
                                <h3 className="text-xl font-bold text-slate-100">{step.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Depoimentos ─────────────────────────────────────── */}
            <section className="py-16 md:py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center space-y-3 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            O que dizem nossos <span className="text-violet-400">clientes</span>
                        </h2>
                        <p className="text-slate-400">Barbeiros reais. Resultados reais.</p>
                    </div>

                    {/* Carousel */}
                    <div className="relative">
                        <div className="overflow-hidden rounded-2xl">
                            <div
                                className="flex transition-transform duration-500 ease-in-out"
                                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                            >
                                {testimonials.map((t, i) => (
                                    <div key={i} className="min-w-full px-2">
                                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 text-center max-w-2xl mx-auto">
                                            {/* Stars */}
                                            <div className="flex items-center justify-center gap-1 mb-4">
                                                {Array.from({ length: t.rating }).map((_, j) => (
                                                    <FiStar key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                ))}
                                            </div>
                                            {/* Quote */}
                                            <p className="text-slate-300 text-base md:text-lg leading-relaxed mb-6 italic">
                                                "{t.text}"
                                            </p>
                                            {/* Author */}
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-3xl">{t.avatar}</span>
                                                <div className="text-left">
                                                    <p className="font-bold text-slate-100 text-sm">{t.name}</p>
                                                    <p className="text-xs text-slate-500">{t.role}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Carousel Controls */}
                        <button
                            onClick={prevTestimonial}
                            className="absolute top-1/2 -translate-y-1/2 -left-2 md:-left-5 w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors text-slate-400"
                        >
                            <FiChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextTestimonial}
                            className="absolute top-1/2 -translate-y-1/2 -right-2 md:-right-5 w-10 h-10 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors text-slate-400"
                        >
                            <FiChevronRight className="w-5 h-5" />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center justify-center gap-2 mt-6">
                            {testimonials.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToTestimonial(i)}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentTestimonial
                                        ? 'bg-violet-400 w-6'
                                        : 'bg-slate-700 hover:bg-slate-600'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Preços ──────────────────────────────────────────── */}
            <section className="py-16 md:py-20 px-4 bg-slate-900/30" id="pricing">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center space-y-3 mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Planos que cabem no seu <span className="text-violet-400">bolso</span>
                        </h2>
                        <p className="text-slate-400">Invista menos do que uma diária para profissionalizar seu negócio.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                        {/* Basic Plan */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 hover:border-slate-700 transition-all">
                            <div>
                                <h3 className="text-xl font-bold text-slate-100">{PLANS.basic.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">Para barbeiros autônomos</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-100">R${PLANS.basic.basePrice}</span>
                                <span className="text-slate-500">/mês</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                +R${PLANS.basic.extraBarberPrice}/mês por barbeiro adicional
                            </p>
                            <ul className="space-y-3">
                                {PLANS.basic.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <FiCheck className="w-4 h-4 text-green-400 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleCTA}
                                className="w-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold py-3 rounded-xl hover:bg-slate-700 transition-colors"
                            >
                                Começar com Básico
                            </button>
                        </div>

                        {/* Premium Plan */}
                        <div className="relative bg-slate-900/50 border-2 border-violet-500/40 rounded-2xl p-6 md:p-8 space-y-6 shadow-lg shadow-violet-500/5">
                            {/* Popular badge */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                Mais Popular
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-100">{PLANS.premium.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">Para barbearias em crescimento</p>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-violet-400">R${PLANS.premium.basePrice}</span>
                                <span className="text-slate-500">/mês</span>
                            </div>
                            <p className="text-xs text-slate-500">
                                +R${PLANS.premium.extraBarberPrice}/mês por barbeiro adicional
                            </p>
                            <ul className="space-y-3">
                                {PLANS.premium.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                        <FiCheck className="w-4 h-4 text-violet-400 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={handleCTA}
                                className="w-full bg-violet-600 text-white font-bold py-3 rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-600/25"
                            >
                                Começar com Premium
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CTA Final ───────────────────────────────────────── */}
            <section className="py-16 md:py-20 px-4">
                <div className="max-w-3xl mx-auto text-center space-y-6 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 via-purple-600/5 to-violet-600/5 rounded-3xl blur-3xl" />
                    <div className="relative bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12 space-y-6">
                        <div className="w-16 h-16 bg-violet-500/15 rounded-2xl mx-auto flex items-center justify-center">
                            <FiShield className="w-8 h-8 text-violet-400" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold">
                            Pronto para profissionalizar sua barbearia?
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto">
                            Comece agora. Sem contrato, sem burocracia. Cancele quando quiser.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <button
                                onClick={handleCTA}
                                className="w-full sm:w-auto bg-violet-600 text-white font-bold px-10 py-4 rounded-xl hover:bg-violet-700 transition-all shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 text-lg"
                            >
                                Criar Minha Conta <FiArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Footer ──────────────────────────────────────────── */}
            <footer className="border-t border-slate-800 py-10 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Brand */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center">
                                    <span className="text-sm font-black text-white">B</span>
                                </div>
                                <span className="text-lg font-bold">Barber<span className="text-violet-400">IA</span></span>
                            </div>
                            <p className="text-sm text-slate-500">
                                A plataforma completa para gestão de barbearias.
                            </p>
                        </div>

                        {/* Links */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-300">Links</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li>
                                    <Link to="/login" className="hover:text-violet-400 transition-colors">Login</Link>
                                </li>
                                <li>
                                    <Link to="/termos" className="hover:text-violet-400 transition-colors">Termos de Uso</Link>
                                </li>
                                <li>
                                    <Link to="/privacidade" className="hover:text-violet-400 transition-colors">Política de Privacidade</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-300">Contato</h4>
                            <ul className="space-y-2 text-sm text-slate-500">
                                <li>
                                    <a href="mailto:contato@obarberia.online" className="hover:text-violet-400 transition-colors">
                                        contato@obarberia.online
                                    </a>
                                </li>
                                <li>
                                    <button onClick={handleWhatsApp} className="hover:text-green-400 transition-colors flex items-center gap-1.5">
                                        <FaWhatsapp className="w-4 h-4" /> WhatsApp
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
                        <p className="text-xs text-slate-600">
                            © {new Date().getFullYear()} BarberIA. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};
