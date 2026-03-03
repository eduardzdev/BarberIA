// firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getMessaging } from "firebase/messaging";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// ============================================
// VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

// Valida que todas as variáveis obrigatórias estão presentes
requiredEnvVars.forEach((varName) => {
  if (!import.meta.env[varName]) {
    throw new Error(
      `❌ Variável de ambiente obrigatória ausente: ${varName}\n` +
      `📝 Certifique-se de criar um arquivo .env.local com todas as credenciais do Firebase.\n` +
      `📄 Use o .env.example como referência.`
    );
  }
});

// ============================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ============================================
// INICIALIZAÇÃO DO FIREBASE
// ============================================

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Exporta a instância do app para uso em outros módulos (ex: App Check)
export { app };

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Messaging
export const messaging = getMessaging(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Configurar prompt do Google Provider para sempre mostrar seleção de conta
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// ============================================
// SERVIÇOS OPCIONAIS (APENAS EM PRODUÇÃO)
// ============================================

// Analytics e Performance apenas em produção para evitar poluir métricas de desenvolvimento
let analytics: ReturnType<typeof getAnalytics> | null = null;
let performance: ReturnType<typeof getPerformance> | null = null;

if (import.meta.env.PROD) {
  try {
    analytics = getAnalytics(app);
    performance = getPerformance(app);
    // Log removed
  } catch (error) {
    console.warn('⚠️ Erro ao inicializar Analytics/Performance:', error);
  }
}

export { analytics, performance };

// ============================================
// CLOUD FUNCTIONS
// ============================================

// Cloud Functions com região São Paulo (southamerica-east1)
export const functions = getFunctions(app, 'southamerica-east1');

// Em desenvolvimento, conectar ao emulador APENAS se explicitamente configurado
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    // Log removed
  } catch {
    // Emulador pode não estar rodando
  }
} else if (import.meta.env.DEV) {
  // Log removed
}

// ============================================
// DEBUG INFO (APENAS EM DESENVOLVIMENTO)
// ============================================

if (import.meta.env.DEV) {
  // Log removed
  // Log removed
  // Log removed
  // Log removed
}

// ============================================
// TROUBLESHOOTING NOTES
// ============================================
// 
// Se você encontrar o erro: auth/unauthorized-domain
// 
// 1. Acesse o Firebase Console: https://console.firebase.google.com/
// 2. Selecione seu projeto
// 3. Vá em Authentication > Settings > Authorized domains
// 4. Adicione seu domínio (ex: localhost, seu-app.web.app, etc.)
//
// Se estiver usando signInWithRedirect:
// - É recomendado usar redirect ao invés de popup para evitar bloqueio de popups
// - Funciona melhor em ambientes de desenvolvimento
//
// Para mais informações sobre segurança:
// - Consulte o arquivo firestore.rules para regras de segurança
// - Revise as configurações de API Key no Google Cloud Console
// ============================================