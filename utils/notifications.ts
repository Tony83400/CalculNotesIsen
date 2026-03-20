import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AgendaEvent } from '@/types/agenda';
import { formatTime } from './agenda';

// Configuration du Handler (Ce qui se passe quand la notif arrive app ouverte)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Programme des notifications pour les cours à venir (Build Native uniquement).
 * @param events Liste complète des événements de l'agenda
 */
export const programmerNotifications = async (events: AgendaEvent[]) => {
  if (Platform.OS === 'web') return;

  try {
    // 1. Demande de permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log("[Notifications] Permission de notifications refusée");
      return;
    }

    // 2. Configuration du canal Android pour une priorité maximale
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('cours-rappel', {
        name: 'Rappels de cours',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    // 3. Nettoyage des anciennes notifications programmées
    await Notifications.cancelAllScheduledNotificationsAsync();

    const maintenant = new Date();
    const rappelMinutes = 30;
    
    // Calcul de la date limite (maintenant + 4 jours)
    const dateLimite = new Date();
    dateLimite.setDate(maintenant.getDate() + 4);
    dateLimite.setHours(23, 59, 59, 999);

    // Filtrage des événements valides
    const eventsAFiltre = events.filter(event => {
      // S'assurer que event.start est un objet Date
      const startDate = new Date(event.start);
      const dateRappel = new Date(startDate.getTime() - rappelMinutes * 60 * 1000);
      
      // On garde si le rappel est dans le futur ET avant la date limite
      return dateRappel > maintenant && dateRappel <= dateLimite;
    });

    // Tri par date de début
    const eventsSorted = [...eventsAFiltre].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Limite à 50 notifications
    const eventsToSchedule = eventsSorted.slice(0, 50);

    console.log(`[Notifications] Préparation de ${eventsToSchedule.length} notifications...`);

    let count = 0;
    for (const event of eventsToSchedule) {
      const startDate = new Date(event.start);
      const dateRappel = new Date(startDate.getTime() - rappelMinutes * 60 * 1000);
      
      // Calcul du délai en secondes à partir de l'instant T
      const secondsUntilNotification = Math.floor((dateRappel.getTime() - new Date().getTime()) / 1000);

      // Sécurité : Si le délai est devenu négatif entre temps, on ignore
      if (secondsUntilNotification <= 0) {
        continue;
      }

      const horaire = `${formatTime(startDate)} - ${formatTime(new Date(event.end))}`;
      const title = event.isExam ? `🚨 EXAMEN : ${event.title}` : `📅 Cours : ${event.title}`;
      const body = `${horaire} • Salle: ${event.location}${event.professors ? `\nProf: ${event.professors}` : ''}`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: 'default',
          data: { eventId: event.id },
          color: '#2563EB',
        },
        trigger: {
          seconds: secondsUntilNotification,
          channelId: 'cours-rappel',
        },
      });

      // Log détaillé pour vérification sur l'émulateur
      if (count < 5) { // On logue seulement les 5 premières pour ne pas polluer
        console.log(`[Notifications] Planifié: "${event.title}" pour le ${startDate.toLocaleDateString()} dans ${Math.round(secondsUntilNotification/60)} min.`);
      }
      count++;
    }

    console.log(`[Notifications] Terminé. ${count} rappels actifs.`);
  } catch (error) {
    console.error("[Notifications] Erreur critique:", error);
  }
};

export default programmerNotifications;
