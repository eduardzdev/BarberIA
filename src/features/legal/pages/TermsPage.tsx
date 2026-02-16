/**
 * TermsPage — Termos de Uso do BarberIA
 *
 * Página pública acessível via /termos
 * Design consistente com dark mode do app
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';

export const TermsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-violet-400" />
                        <h1 className="text-lg font-bold text-slate-100">Termos de Uso</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">

                    <p className="text-sm text-slate-500">
                        Última atualização: 15 de fevereiro de 2026
                    </p>

                    {/* 1. Aceitação */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">1.</span> Aceitação dos Termos
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Ao acessar ou utilizar a plataforma BarberIA ("Plataforma"), disponível em{' '}
                            <strong className="text-violet-400">obarberia.online</strong>, você ("Usuário")
                            concorda integralmente com estes Termos de Uso. Se não concordar com qualquer
                            disposição, não utilize a Plataforma.
                        </p>
                    </section>

                    {/* 2. Definições */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">2.</span> Definições
                        </h2>
                        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside marker:text-violet-400/60">
                            <li><strong className="text-slate-200">Plataforma:</strong> o software BarberIA, incluindo aplicação web, APIs e serviços relacionados.</li>
                            <li><strong className="text-slate-200">Assinante:</strong> profissional ou empresa do ramo de barbearia que contrata um plano pago.</li>
                            <li><strong className="text-slate-200">Cliente Final:</strong> pessoa que utiliza a página pública de agendamento de um Assinante.</li>
                            <li><strong className="text-slate-200">Conta:</strong> registro individual criado mediante e-mail e senha para acesso à Plataforma.</li>
                        </ul>
                    </section>

                    {/* 3. Cadastro */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">3.</span> Cadastro e Conta
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Para utilizar os serviços pagos, o Assinante deve fornecer informações verdadeiras,
                            completas e atualizadas durante o cadastro, incluindo nome, e-mail, CPF/CNPJ e
                            telefone. O Assinante é responsável pela confidencialidade de suas credenciais de
                            acesso e por todas as atividades realizadas em sua Conta.
                        </p>
                        <p className="text-sm leading-relaxed">
                            A BarberIA reserva-se o direito de suspender ou encerrar Contas que apresentem
                            informações falsas ou atividades que violem estes Termos.
                        </p>
                    </section>

                    {/* 4. Planos e Pagamento */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">4.</span> Planos, Pagamento e Cobrança
                        </h2>
                        <p className="text-sm leading-relaxed">
                            A Plataforma oferece planos de assinatura mensal com valores definidos na página de
                            preços. O pagamento é processado por meio de gateway de pagamento terceirizado (Asaas),
                            com opções de PIX ou cartão de crédito.
                        </p>
                        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside marker:text-violet-400/60">
                            <li>A cobrança é recorrente e realizada mensalmente na data de vencimento.</li>
                            <li>Em caso de inadimplência superior a 5 (cinco) dias, o acesso poderá ser suspenso.</li>
                            <li>Os preços podem ser reajustados com aviso prévio de 30 (trinta) dias.</li>
                            <li>Não há reembolso proporcional por cancelamento antecipado.</li>
                        </ul>
                    </section>

                    {/* 5. Uso da Plataforma */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">5.</span> Concessão de Uso
                        </h2>
                        <p className="text-sm leading-relaxed">
                            A BarberIA concede ao Assinante uma licença limitada, não exclusiva, intransferível e
                            revogável para uso da Plataforma durante a vigência da assinatura. O Assinante
                            <strong className="text-slate-200"> não pode</strong>:
                        </p>
                        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside marker:text-violet-400/60">
                            <li>Sublicenciar, vender, alugar ou transferir o acesso à Plataforma.</li>
                            <li>Realizar engenharia reversa, descompilar ou tentar extrair o código-fonte.</li>
                            <li>Utilizar a Plataforma para fins ilegais ou que violem direitos de terceiros.</li>
                            <li>Tentar acessar dados de outras Contas ou comprometer a segurança da Plataforma.</li>
                        </ul>
                    </section>

                    {/* 6. Responsabilidades */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">6.</span> Responsabilidades e Limitações
                        </h2>
                        <p className="text-sm leading-relaxed">
                            A BarberIA emprega esforços razoáveis para manter a Plataforma disponível e segura, mas
                            <strong className="text-slate-200"> não garante</strong> disponibilidade ininterrupta.
                            A Plataforma é fornecida "como está" (<em>as is</em>), sem garantias expressas ou
                            implícitas de adequação a um propósito específico.
                        </p>
                        <p className="text-sm leading-relaxed">
                            A BarberIA não se responsabiliza por: (a) danos decorrentes de uso indevido da
                            Plataforma pelo Assinante; (b) perda de receita ou lucros cessantes; (c) indisponibilidade
                            causada por eventos de força maior; (d) ações de terceiros sobre os dados do Assinante.
                        </p>
                    </section>

                    {/* 7. Propriedade Intelectual */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">7.</span> Propriedade Intelectual
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Todos os direitos de propriedade intelectual sobre a Plataforma, incluindo marca,
                            código-fonte, design, layout e conteúdos produzidos pela BarberIA, pertencem
                            exclusivamente à BarberIA. Os dados inseridos pelo Assinante são de propriedade
                            do Assinante.
                        </p>
                    </section>

                    {/* 8. Cancelamento */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">8.</span> Cancelamento
                        </h2>
                        <p className="text-sm leading-relaxed">
                            O Assinante pode cancelar sua assinatura a qualquer momento através do painel de
                            Configurações. O cancelamento entrará em vigor ao final do período já pago. Após
                            o cancelamento, os dados do Assinante serão mantidos por 90 (noventa) dias, podendo
                            ser solicitada sua exclusão definitiva.
                        </p>
                    </section>

                    {/* 9. Proteção de dados */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">9.</span> Proteção de Dados
                        </h2>
                        <p className="text-sm leading-relaxed">
                            O tratamento de dados pessoais é regido pela nossa{' '}
                            <Link to="/privacidade" className="text-violet-400 hover:text-violet-300 underline transition-colors">
                                Política de Privacidade
                            </Link>
                            , que faz parte integrante destes Termos. A BarberIA atua em conformidade com a
                            Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
                        </p>
                    </section>

                    {/* 10. Modificações */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">10.</span> Modificações dos Termos
                        </h2>
                        <p className="text-sm leading-relaxed">
                            A BarberIA poderá alterar estes Termos a qualquer momento, notificando os Assinantes
                            por e-mail ou por aviso na Plataforma com antecedência mínima de 15 (quinze) dias.
                            O uso continuado após a data de vigência das alterações implica aceitação dos novos
                            Termos.
                        </p>
                    </section>

                    {/* 11. Foro */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-violet-400">11.</span> Legislação e Foro
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir
                            quaisquer controvérsias decorrentes destes Termos, as partes elegem o foro da comarca
                            de domicílio do Assinante, nos termos do Código de Defesa do Consumidor.
                        </p>
                    </section>

                    {/* Contato */}
                    <section className="mt-8 pt-6 border-t border-slate-700 space-y-2">
                        <h2 className="text-lg font-bold text-slate-100">Dúvidas?</h2>
                        <p className="text-sm leading-relaxed">
                            Entre em contato conosco pelo e-mail{' '}
                            <a href="mailto:contato@obarberia.online" className="text-violet-400 hover:text-violet-300 underline transition-colors">
                                contato@obarberia.online
                            </a>
                        </p>
                    </section>
                </div>

                {/* Back button */}
                <div className="text-center pb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-sm text-slate-500 hover:text-violet-400 transition-colors"
                    >
                        ← Voltar à página anterior
                    </button>
                </div>
            </main>
        </div>
    );
};
