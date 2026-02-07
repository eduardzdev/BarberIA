export enum AppointmentStatus {
    Confirmed = "Confirmado",
    Pending = "Pendente",
    Cancelled = "Cancelado",
    Completed = "Concluído",
}

export interface Appointment {
    id: string;
    clientName: string;
    clientPhone: string;
    services: string[];
    startTime: string;
    duration: number; // in minutes
    status: AppointmentStatus;
    price?: number;
    notes?: string;
    date: string;
    barberName?: string;
    createdAt?: number; // Firebase timestamp
}

export enum ClientStatus {
    Active = "Ativo",
    Inactive = "Inativo",
}

export interface Client {
    id: string;
    name: string;
    avatarInitials: string;
    status: ClientStatus;
    phone: string;
    email: string;
    lastVisit: string;
    visits: number;
    spent: number;
    notes: string;
    isVip: boolean;
}

export enum TransactionType {
    Income = "income",
    Expense = "expense",
}

export interface Transaction {
    id: string;
    type: TransactionType;
    description: string;
    category: string;
    amount: number;
    date: string;
    time: string;
    paymentMethod: string;
    referenceId?: string;
    referenceType?: string;
}

export interface Service {
    id: string;
    name: string;
    price: number;
    promotionalPrice?: number;
    duration: number; // in minutes
    icon?: string;
    color?: string;
    imageUrl?: string;
    active?: boolean; // default true if undefined
}

export interface Combo {
    id: string;
    name: string;
    serviceIds: string[];
    price: number;
    promotionalPrice?: number;
    duration: number; // in minutes
    imageUrl?: string;
    active?: boolean; // default true if undefined
}

export interface Barber {
    id: string;
    name: string;
    avatarUrl?: string;
    servicesNotProvided?: string[]; // IDs dos serviços que NÃO realiza
    unavailableHours?: {
        dayOfWeek: number; // 0-6 (Domingo-Sábado)
        startTime: string; // HH:MM
        endTime: string; // HH:MM
    }[];
}

export enum NotificationType {
    NewAppointment = "new_appointment",
    GoalAchieved = "goal_achieved",
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    time: string;
    read: boolean;
}

export interface Barbershop {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address: string;
    city?: string;
    state?: string;
    zipCode?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    description?: string;
    username?: string;
    defaultPaymentMethod?: string;
    slug?: string;
    theme?: {
        primaryColor: string;
        secondaryColor: string;
        font: string;
        mode?: 'light' | 'dark';
    };
    layout?: {
        showHero: boolean;
        heroTitle: string;
        heroSubtitle?: string;
        heroImage?: string;
        showAbout: boolean;
        aboutText?: string;
        aboutImage?: string;
    };
}

export interface WorkingHours {
    schedule: DaySchedule[];
}

export interface DaySchedule {
    dayOfWeek: number;
    isOpen: boolean;
    startTime: string;
    endTime: string;
    hasLunchBreak: boolean;
    lunchStart: string;
    lunchDuration: number;
}

export interface PublicShopData {
    ownerId: string;
    name: string;
    phone: string;
    address: string;
    logoUrl?: string;
    slug: string;
    theme: {
        primaryColor: string;
        secondaryColor: string;
        font: string;
        mode?: 'light' | 'dark';
    };
    layout: {
        showHero: boolean;
        heroTitle: string;
        heroSubtitle?: string;
        heroImage?: string;
        showAbout: boolean;
        aboutText?: string;
        aboutImage?: string;
    };
    catalog: Service[];
    team: Barber[];
    businessHours: WorkingHours;
    instagram?: string;
    facebook?: string;
    website?: string;
    updatedAt: string;
}

/**
 * OccupiedSlot - Public-safe type for availability queries
 * Contains NO personal identifiable information (PII)
 * Used by public booking page to check time slot availability
 */
export interface OccupiedSlot {
    time: string;          // HH:MM format
    duration: number;      // minutes
    barberName?: string;   // optional, for multi-barber shops
}

/**
 * AvailabilitySlot - Firestore document structure for availability collection
 * This is the sanitized public version of appointment time slots
 * LGPD/GDPR compliant - no client data stored
 */
export interface AvailabilitySlot {
    id?: string;
    date: string;          // YYYY-MM-DD
    time: string;          // HH:MM
    duration: number;      // minutes
    barberName?: string;   // optional
    appointmentId: string; // Reference to the actual appointment
    createdAt?: any;       // Firebase Timestamp
}