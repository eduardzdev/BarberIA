import { useState, useEffect } from 'react';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { messaging, db } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/hooks/useUI';

export const useFCM = () => {
  const { user } = useAuth();
  const { info } = useUI();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Solicitar permissão e obter token
  const requestPermissionAndGetToken = async () => {
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          console.error('VITE_FIREBASE_VAPID_KEY não está definida no .env');
          return;
        }

        const currentToken = await getToken(messaging, {
          vapidKey: vapidKey
        });

        if (currentToken) {
          setFcmToken(currentToken);

          // Salvar token no Firestore se o usuário estiver logado
          if (user?.uid) {
            const userRef = doc(db, 'users', user.uid);
            // Usamos arrayUnion para adicionar o token sem duplicar,
            // permitindo múltiplos dispositivos (celular, note, tablet)
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(currentToken)
            });
          }
        } else {
          // Log removed
        }
      } else {
        // Log removed
      }
    } catch (error) {
    }
  };

  // Monitorar mensagens em Foreground
  useEffect(() => {
    // Escuta mensagens quando o app está aberto e em foco
    const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {

      // Exibir Toast ou atualizar store de notificações
      if (payload.notification) {
        info(
          `${payload.notification.title}: ${payload.notification.body}`
        );
        // TODO: Adicionar à store de notificações persistente se necessário
      }
    });

    return () => {
      unsubscribe();
    };
  }, [info]);

  return {
    fcmToken,
    permission,
    requestPermissionAndGetToken
  };
};
