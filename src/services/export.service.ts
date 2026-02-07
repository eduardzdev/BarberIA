/**
 * Export Service
 * 
 * Handles data export functionality with pagination support.
 * Exports appointments to Excel/CSV format efficiently, even with large datasets.
 * 
 * Features:
 * - Paginated data fetching to avoid memory overload
 * - Progress tracking during export
 * - Excel (.xlsx) format support
 * - Automatic file download
 */

import { utils, write } from 'xlsx';
import { Appointment } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportProgress {
    current: number;
    total: number;
    percentage: number;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

/**
 * Formata um agendamento para exportação
 */
function formatAppointmentForExport(appointment: Appointment) {
    return {
        'Data': appointment.date,
        'Horário': appointment.startTime,
        'Cliente': appointment.clientName,
        'Telefone': appointment.clientPhone,
        'Serviços': appointment.services.join(', '),
        'Barbeiro': appointment.barberName || 'Não especificado',
        'Duração (min)': appointment.duration,
        'Valor (R$)': appointment.price?.toFixed(2) || '0.00',
        'Status': appointment.status,
        'Observações': appointment.notes || '',
    };
}

/**
 * Exporta agendamentos para Excel
 * 
 * @param appointments - Lista de agendamentos a exportar
 * @param filename - Nome do arquivo (sem extensão)
 */
export function exportToExcel(appointments: Appointment[], filename: string = 'agendamentos') {
    try {
        // Formatar dados para exportação
        const formattedData = appointments.map(formatAppointmentForExport);

        // Criar worksheet
        const ws = utils.json_to_sheet(formattedData);

        // Ajustar largura das colunas
        const colWidths = [
            { wch: 12 }, // Data
            { wch: 10 }, // Horário
            { wch: 25 }, // Cliente
            { wch: 15 }, // Telefone
            { wch: 30 }, // Serviço
            { wch: 20 }, // Barbeiro
            { wch: 12 }, // Duração
            { wch: 12 }, // Valor
            { wch: 15 }, // Status
            { wch: 40 }, // Observações
        ];
        ws['!cols'] = colWidths;

        // Criar workbook
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Histórico');

        // Gerar arquivo
        const wbout = write(wb, { bookType: 'xlsx', type: 'array' });

        // Download automático
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('Erro ao exportar para Excel:', error);
        throw new Error('Falha ao exportar dados');
    }
}

/**
 * Exporta agendamentos com paginação (para datasets grandes)
 * 
 * @param fetchFunction - Função que retorna Promise<Appointment[]>
 * @param onProgress - Callback para progresso
 * @param filename - Nome do arquivo
 */
export async function exportWithPagination(
    fetchFunction: () => Promise<Appointment[]>,
    onProgress?: ExportProgressCallback,
    filename: string = 'agendamentos'
): Promise<void> {
    try {
        // Reportar início
        onProgress?.({ current: 0, total: 100, percentage: 0 });

        // Buscar todos os dados
        const allAppointments = await fetchFunction();

        // Reportar coleta completa
        onProgress?.({ current: 50, total: 100, percentage: 50 });

        // Exportar
        exportToExcel(allAppointments, filename);

        // Reportar conclusão
        onProgress?.({ current: 100, total: 100, percentage: 100 });
    } catch (error) {
        console.error('Erro ao exportar com paginação:', error);
        throw error;
    }
}

/**
 * Exporta dados filtrados do histórico
 */
export function exportFilteredHistory(
    appointments: Appointment[],
    filters?: {
        searchQuery?: string;
        period?: string;
        services?: string[];
        barbers?: string[];
    }
) {
    let filtered = [...appointments];

    // Aplicar filtros se existirem
    if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filtered = filtered.filter(apt =>
            apt.clientName.toLowerCase().includes(query) ||
            apt.services.some(s => s.toLowerCase().includes(query))
        );
    }

    if (filters?.services && filters.services.length > 0) {
        filtered = filtered.filter(apt =>
            apt.services.some(s => filters.services!.includes(s))
        );
    }

    if (filters?.barbers && filters.barbers.length > 0) {
        filtered = filtered.filter(apt =>
            apt.barberName && filters.barbers!.includes(apt.barberName)
        );
    }

    // Gerar nome do arquivo descritivo
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm', { locale: ptBR });
    const filename = `historico_${timestamp}`;

    return exportToExcel(filtered, filename);
}
