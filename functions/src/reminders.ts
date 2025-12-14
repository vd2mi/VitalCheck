import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

const getDb = () => getFirestore();

interface MedicationDoc {
  patientId: string;
  name: string;
  dose: string;
  schedule: { frequency: string; times: string[] };
}

export const mapMedicationNotifications = (medicationId: string, medication: MedicationDoc, date: string) => {
  if (medication.schedule.frequency === 'weekly') {
    // Future: check specific weekday alignment.
    return [];
  }
  if (medication.schedule.frequency === 'as-needed') {
    return [];
  }
  return medication.schedule.times.map((time) => ({
    userId: medication.patientId,
    type: 'medication',
    payload: {
      medicationId,
      name: medication.name,
      dose: medication.dose,
      dueAt: `${date}T${time}`
    }
  }));
};

export const sendDailyReminders = onSchedule(
  {
    schedule: 'every day 06:00',
    timeZone: 'America/New_York',
    region: 'us-central1',
    retryCount: 3
  },
  async () => {
    logger.info('Running reminder sweep');
    const today = new Date().toISOString().slice(0, 10);
    const medsSnapshot = await getDb()
      .collection('medications')
      .where('schedule.frequency', 'in', ['daily', 'weekly'])
      .get();

    const notifications = medsSnapshot.docs.flatMap((docSnap) =>
      mapMedicationNotifications(docSnap.id, docSnap.data() as MedicationDoc, today)
    );

    if (!notifications.length) {
      logger.info('No reminders generated today.');
      return;
    }

    const db = getDb();
    const batch = db.batch();
    notifications.forEach((notification) => {
      const ref = db.collection('notifications').doc();
      batch.set(ref, {
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
    logger.info(`Created ${notifications.length} reminders.`);
  }
);

