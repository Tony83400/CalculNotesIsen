import { AgendaProps } from '@/app/agenda';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
 * Programme des notifications pour les cours à venir.
 * Une notification est prévue 15 minutes avant chaque cours.
 * @param agenda - La liste des jours et de leurs événements.
 */
const programmerNotifications = async (agenda: AgendaProps[]) => {
  // Sur le web, les notifications programmées locales ne sont pas supportées
  if (Platform.OS === 'web') {
    return;
  }

  // 1. Demander la permission d'envoyer des notifications
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    console.log("Permission refusée, impossible de mettre des rappels");
    return;
  }

  // 2. Annuler toutes les notifications précédemment programmées pour éviter les doublons
  await Notifications.cancelAllScheduledNotificationsAsync();

  const maintenant = new Date();
  const rappelMinutes = 15; // On notifie 15 minutes avant le début du cours

  const formatHeure = (date: Date) => `${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')}`;

  // 3. Parcourir chaque cours de l'agenda
  for (const jour of agenda) {
    for (const cours of jour.events) {
      const dateRappel = new Date(cours.start.getTime() - rappelMinutes * 60 * 1000);
      
      const seconds = Math.floor((dateRappel.getTime() - maintenant.getTime()) / 1000);

      // 4. S'assurer que la date de la notification est dans le futur
      if (seconds > 0) {
        const horaire = `${formatHeure(cours.start)} - ${formatHeure(cours.end)}`;

        await Notifications.scheduleNotificationAsync({
          
          content: {
            title: `${cours.title}`,
            body: `${horaire}\n${cours.location}\n${cours.professors}`, 
            sound: 'default',
          },
          trigger: {
            seconds,
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          },
        });
      }
    }
  }
};

export default programmerNotifications;