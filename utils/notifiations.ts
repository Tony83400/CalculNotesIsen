import { AgendaProps } from '@/app/agenda';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
 * Programme des notifications pour les cours à venir.
 */
const programmerNotifications = async (agenda: AgendaProps[]) => {
  if (Platform.OS === 'web') return;

  // 1. Permissions
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log("Permission refusée");
    return;
  }

  // 2. CONFIGURATION DU CANAL ANDROID (Crucial pour que ça sonne tout le temps)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cours-rappel', {
      name: 'Rappels de cours',
      importance: Notifications.AndroidImportance.MAX, // Force l'affichage et le son
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  // 3. Nettoyage
  await Notifications.cancelAllScheduledNotificationsAsync();

  const maintenant = new Date();
  const rappelMinutes = 30; 
  const LIMIT_NOTIFS = 60; // Sécurité pour ne pas dépasser la limite iOS (64)
  let count = 0;

  const formatHeure = (date: Date) => 
    `${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')}`;

  // 4. Parcours
  // On utilise une boucle classique pour pouvoir "break" si on dépasse la limite
  for (const jour of agenda) {
    for (const cours of jour.events) {
      if (count >= LIMIT_NOTIFS) break;

      // Calcul de la date de rappel
      const dateRappel = new Date(cours.start.getTime() - rappelMinutes * 60 * 1000);

      // On ne programme que si la date de rappel est dans le FUTUR
      if (dateRappel > maintenant) {
        
        const horaire = `${formatHeure(cours.start)} - ${formatHeure(cours.end)}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Rappel : ${cours.title}`,
            body: `${horaire} en ${cours.location}\n${cours.professors}`,
            sound: 'default',
            // On lie la notif au canal Android haute importance créé plus haut
            color: '#FF231F7C', 
          },
          // AMÉLIORATION : On utilise directement la date (trigger absolu)
          trigger: { 
            date: dateRappel, // Plus fiable que 'seconds'
            channelId: 'cours-rappel', // Lien avec le canal Android
          },
        });

        count++;
      }
    }
  }
  
  console.log(`${count} notifications programmées.`);
};

export default programmerNotifications;