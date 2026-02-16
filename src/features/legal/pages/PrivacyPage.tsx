/**
 * PrivacyPage — Política de Privacidade do BarberIA
 *
 * Página pública acessível via /privacidade
 * Conforme LGPD (Lei nº 13.709/2018)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShield } from 'react-icons/fi';

export const PrivacyPage: React.FC = () => {
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
                        <FiShield className="w-5 h-5 text-green-400" />
                        <h1 className="text-lg font-bold text-slate-100">Política de Privacidade</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">

                    <p className="text-sm text-slate-500">
                        Última atualização: 15 de fevereiro de 2026
                    </p>

                    <p className="text-sm leading-relaxed">
                        Esta Política de Privacidade descreve como a plataforma BarberIA ("nós", "nosso"),
                        disponível em <strong className="text-violet-400">obarberia.online</strong>, coleta,
                        utiliza, armazena e protege os dados pessoais dos seus usuários, em conformidade com
                        a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
                    </p>

                    {/* 1. Dados Coletados */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">1.</span> Dados Pessoais Coletados
                        </h2>

                        <h3 className="text-sm font-semibold text-slate-200 mt-4">1.1 Dados do Assinante (barbeiro/empresa)</h3>
                        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside marker:text-green-400/60">
                            <li>Nome completo e CPF/CNPJ (cadastro e cobrança)</li>
                            <li>Endereço de e-mail (autenticação e comunicação)</li>
                            <li>Número de telefone (contato e recuperação de conta)</li>
                            <li>Endereço da barbearia (exibição no site público)</li>
                            <li>Dados de pagamento (processados pelo gateway Asaas — não armazenamos dados de cartão)</li>
                        </ul>

                        <h3 className="text-sm font-semibold text-slate-200 mt-4">1.2 Dados dos Clientes Finais</h3>
                        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside marker:text-green-400/60">
                            <li>Nome e telefone (inseridos pelo Assinante para agendamentos)</li>
                            <li>Histórico de agendamentos (vinculado à barbearia do Assinante)</li>
                        </ul>

                        <h3 className="text-sm font-semibold text-slate-200 mt-4">1.3 Dados Técnicos</h3>
                        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside marker:text-green-400/60">
                            <li>Endereço IP, tipo de navegador e sistema operacional</li>
                            <li>Dados de performance e uso da aplicação (via Firebase Analytics)</li>
                            <li>Tokens de notificação push (quando autorizado)</li>
                        </ul>
                    </section>

                    {/* 2. Finalidade */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">2.</span> Finalidade do Tratamento
                        </h2>
                        <p className="text-sm leading-relaxed">Os dados pessoais são utilizados para:</p>
                        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside marker:text-green-400/60">
                            <li>Criar e gerenciar a conta do Assinante na Plataforma</li>
                            <li>Processar pagamentos de assinaturas</li>
                            <li>Fornecer as funcionalidades contratadas (agenda, clientes, financeiro)</li>
                            <li>Enviar comunicações essenciais (transacionais, redefinição de senha)</li>
                            <li>Melhorar a experiência do usuário e a performance da Plataforma</li>
                            <li>Cumprir obrigações legais e regulatórias</li>
                        </ul>
                    </section>

                    {/* 3. Base Legal */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">3.</span> Base Legal (Art. 7º da LGPD)
                        </h2>
                        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside marker:text-green-400/60">
                            <li><strong className="text-slate-200">Execução de contrato:</strong> tratamento necessário para a prestação do serviço contratado (assinatura).</li>
                            <li><strong className="text-slate-200">Consentimento:</strong> para envio de notificações push e comunicações opcionais.</li>
                            <li><strong className="text-slate-200">Obrigação legal:</strong> para cumprimento de obrigações fiscais e regulatórias.</li>
                            <li><strong className="text-slate-200">Legítimo interesse:</strong> para análise de uso e melhoria da Plataforma, quando não prevalece sobre os direitos do titular.</li>
                        </ul>
                    </section>

                    {/* 4. Compartilhamento */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">4.</span> Compartilhamento de Dados
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Seus dados pessoais podem ser compartilhados com:
                        </p>
                        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside marker:text-green-400/60">
                            <li><strong className="text-slate-200">Asaas (gateway de pagamento):</strong> para processamento de cobranças e assinaturas.</li>
                            <li><strong className="text-slate-200">Google Firebase:</strong> infraestrutura de autenticação, banco de dados e hospedagem.</li>
                            <li><strong className="text-slate-200">Autoridades governamentais:</strong> quando exigido por lei ou ordem judicial.</li>
                        </ul>
                        <p className="text-sm leading-relaxed">
                            <strong className="text-slate-200">Não vendemos, alugamos ou compartilhamos</strong> seus
                            dados pessoais com terceiros para fins de marketing.
                        </p>
                    </section>

                    {/* 5. Armazenamento e Segurança */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">5.</span> Armazenamento e Segurança
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Os dados são armazenados em servidores seguros do Google Cloud Platform (Firebase),
                            com data centers localizados na América do Sul. Adotamos as seguintes medidas de
                            segurança:
                        </p>
                        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside marker:text-green-400/60">
                            <li>Criptografia em trânsito (TLS/SSL) e em repouso</li>
                            <li>Regras de acesso granulares no banco de dados (Firestore Security Rules)</li>
                            <li>Autenticação segura via Firebase Auth com App Check (reCAPTCHA v3)</li>
                            <li>Isolamento de dados por conta (cada Assinante acessa apenas seus próprios dados)</li>
                            <li>Senhas temporárias criptografadas com AES-256 para o fluxo de pagamento PIX</li>
                        </ul>
                    </section>

                    {/* 6. Direitos do Titular */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">6.</span> Direitos do Titular dos Dados
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Conforme a LGPD, você tem o direito de:
                        </p>
                        <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside marker:text-green-400/60">
                            <li>Confirmar a existência de tratamento dos seus dados</li>
                            <li>Acessar seus dados pessoais</li>
                            <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários</li>
                            <li>Solicitar a portabilidade dos seus dados</li>
                            <li>Revogar o consentimento a qualquer momento</li>
                            <li>Obter informações sobre o compartilhamento dos seus dados</li>
                        </ul>
                        <p className="text-sm leading-relaxed">
                            Para exercer seus direitos, envie uma solicitação para{' '}
                            <a href="mailto:contato@obarberia.online" className="text-violet-400 hover:text-violet-300 underline transition-colors">
                                contato@obarberia.online
                            </a>.
                            Responderemos em até 15 (quinze) dias úteis.
                        </p>
                    </section>

                    {/* 7. Cookies */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">7.</span> Cookies e Tecnologias de Rastreamento
                        </h2>
                        <p className="text-sm leading-relaxed">
                            A Plataforma utiliza armazenamento local (localStorage) para manter a sessão do
                            usuário e preferências de configuração. Também utilizamos o Firebase Analytics para
                            métricas agregadas de uso (acessos, tempo de sessão). Nenhum cookie é compartilhado
                            com redes de publicidade.
                        </p>
                    </section>

                    {/* 8. Retenção */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">8.</span> Período de Retenção
                        </h2>
                        <ul className="text-sm leading-relaxed space-y-2 list-disc list-inside marker:text-green-400/60">
                            <li><strong className="text-slate-200">Dados da conta ativa:</strong> mantidos durante a vigência da assinatura.</li>
                            <li><strong className="text-slate-200">Após cancelamento:</strong> dados mantidos por 90 dias para possível reativação, após os quais podem ser excluídos.</li>
                            <li><strong className="text-slate-200">Dados fiscais/financeiros:</strong> mantidos por 5 anos conforme obrigação legal.</li>
                            <li><strong className="text-slate-200">Dados de pending_signups:</strong> excluídos automaticamente após 24 horas se o pagamento não for confirmado.</li>
                        </ul>
                    </section>

                    {/* 9. Alterações */}
                    <section className="space-y-3">
                        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                            <span className="text-green-400">9.</span> Alterações nesta Política
                        </h2>
                        <p className="text-sm leading-relaxed">
                            Esta Política de Privacidade pode ser atualizada periodicamente. Notificaremos os
                            usuários sobre alterações significativas por e-mail ou por aviso na Plataforma.
                            A data da última atualização será sempre indicada no topo deste documento.
                        </p>
                    </section>

                    {/* 10. Contato */}
                    <section className="mt-8 pt-6 border-t border-slate-700 space-y-2">
                        <h2 className="text-lg font-bold text-slate-100">Encarregado de Proteção de Dados (DPO)</h2>
                        <p className="text-sm leading-relaxed">
                            Para questões relacionadas à proteção de dados pessoais, entre em contato:
                        </p>
                        <p className="text-sm leading-relaxed">
                            📧 E-mail:{' '}
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
