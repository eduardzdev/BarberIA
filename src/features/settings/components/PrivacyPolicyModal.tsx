import React from 'react';
import { Modal } from '@/components/Modal';
import { useUI } from '@/hooks/useUI';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Política de Privacidade e Dados"
    >
      <div className="space-y-6 text-slate-300 text-sm h-[60vh] overflow-y-auto pr-2">
        <section>
          <h3 className="font-bold text-slate-100 mb-2">1. Introdução</h3>
          <p>
            Bem-vindo ao BarberIA. Sua privacidade é fundamental para nós. Esta política descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais e os dados de sua barbearia ao utilizar nossa plataforma SaaS de agendamento e gestão.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-slate-100 mb-2">2. Dados Coletados</h3>
          <p className="mb-2">Coletamos os seguintes tipos de informações para fornecer nossos serviços:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Informações da Conta:</strong> Nome, e-mail e senha para autenticação e gestão de acesso.</li>
            <li><strong>Dados da Barbearia:</strong> Nome do estabelecimento, endereço, telefone, horários de funcionamento e serviços oferecidos.</li>
            <li><strong>Dados de Clientes e Agendamentos:</strong> Nomes, telefones e históricos de serviços de seus clientes, inseridos por você para gestão da agenda.</li>
            <li><strong>Dados Financeiros:</strong> Registros de receitas e despesas que você insere na plataforma para controle financeiro (não coletamos dados bancários ou de cartão de crédito diretamente).</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-slate-100 mb-2">3. Uso dos Dados</h3>
          <p className="mb-2">Utilizamos seus dados exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornecer, manter e melhorar a plataforma BarberIA.</li>
            <li>Processar e gerenciar seus agendamentos e cadastro de clientes.</li>
            <li>Gerar relatórios e métricas de desempenho do seu negócio.</li>
            <li>Enviar comunicações importantes sobre sua conta, atualizações de serviço ou suporte técnico.</li>
          </ul>
        </section>

        <section>
          <h3 className="font-bold text-slate-100 mb-2">4. Armazenamento e Segurança</h3>
          <p>
            Seus dados são armazenados de forma segura em servidores na nuvem (Google Firebase), protegidos por criptografia e rigorosos controles de acesso. Adotamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-slate-100 mb-2">5. Compartilhamento de Dados</h3>
          <p>
            Não vendemos, alugamos ou compartilhamos seus dados pessoais ou comerciais com terceiros para fins de marketing. Seus dados podem ser acessados apenas por nossa equipe técnica para fins de suporte e manutenção, ou quando exigido por lei.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-slate-100 mb-2">6. Seus Direitos</h3>
          <p>
            Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento através das configurações do aplicativo. Caso deseje encerrar sua conta e remover todos os dados associados, entre em contato com nosso suporte ou utilize a opção de exclusão de conta nas configurações.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-slate-100 mb-2">7. Alterações nesta Política</h3>
          <p>
            Podemos atualizar esta política periodicamente para refletir mudanças em nossos serviços ou na legislação aplicável. Notificaremos você sobre alterações significativas através do aplicativo ou e-mail cadastrado.
          </p>
        </section>

        <div className="pt-4 text-xs text-slate-500">
          <p>Última atualização: 26 de Outubro de 2025</p>
        </div>
      </div>
      
      <div className="pt-4 mt-4 border-t border-slate-700">
        <button
          onClick={onClose}
          className="w-full bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Entendi e Concordo
        </button>
      </div>
    </Modal>
  );
};
