import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import type { Timestamp } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';

initializeApp();
const db = getFirestore();
const auth = getAuth();

const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');
const smtpHost = defineSecret('SMTP_HOST');
const smtpPort = defineSecret('SMTP_PORT');
const mailFrom = defineSecret('MAIL_FROM');

interface AppointmentPayload {
  patientId: string;
  doctorId: string;
  preferredTime: string;
  reason: string;
  createdAt: Timestamp;
}

const buildTransport = () =>
  nodemailer.createTransport({
    host: smtpHost.value(),
    port: Number(smtpPort.value() ?? 587),
    secure: false,
    auth: {
      user: smtpUser.value(),
      pass: smtpPass.value()
    }
  });

const sendDoctorEmail = async ({
  doctorEmail,
  doctorName,
  patientName,
  preferredTime,
  reason
}: {
  doctorEmail: string;
  doctorName: string;
  patientName: string;
  preferredTime: string;
  reason: string;
}) => {
  if (!doctorEmail) {
    logger.warn('No doctor email found, skipping email notification.');
    return;
  }
  const transporter = buildTransport();
  await transporter.sendMail({
    from: mailFrom.value() ?? 'notifications@vitalcheck.app',
    to: doctorEmail,
    subject: `New appointment request from ${patientName}`,
    text: `Hello Dr. ${doctorName ?? 'team'},\n\nA new appointment was requested.\nPatient: ${patientName}\nPreferred time: ${preferredTime}\nReason: ${reason}`,
    html: `<p>Hello Dr. ${doctorName ?? 'team'},</p><p><strong>Patient:</strong> ${patientName}</p><p><strong>Preferred time:</strong> ${preferredTime}</p><p><strong>Reason:</strong> ${reason}</p>`
  });
};

const createNotification = async ({
  userId,
  type,
  payload
}: {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}) => {
  await db.collection('notifications').add({
    userId,
    type,
    payload,
    read: false,
    createdAt: new Date().toISOString()
  });
};

// Set custom claims when user document is created or updated
export const onUserWrite = onDocumentWritten(
  {
    document: 'users/{userId}',
    region: 'us-central1'
  },
  async (event) => {
    const userId = event.params.userId;
    const data = event.data?.after.data();
    
    if (!data || !data.role) {
      logger.warn(`No role found for user ${userId}`);
      return;
    }

    try {
      await auth.setCustomUserClaims(userId, { role: data.role });
      logger.info(`Set custom claims for user ${userId} with role ${data.role}`);
    } catch (error) {
      logger.error(`Error setting custom claims for user ${userId}:`, error);
    }
  }
);

export const onAppointmentCreate = onDocumentCreated(
  {
    document: 'appointments/{appointmentId}',
    region: 'us-central1',
    secrets: [smtpUser, smtpPass, smtpHost, smtpPort, mailFrom]
  },
  async (event) => {
    const data = event.data?.data() as AppointmentPayload | undefined;
    if (!data) {
      logger.warn('No appointment payload found.');
      return;
    }

    const doctorSnapshot = await db.collection('users').doc(data.doctorId).get();
    const patientSnapshot = await db.collection('users').doc(data.patientId).get();

    const doctor = doctorSnapshot.data() ?? {};
    const patient = patientSnapshot.data() ?? {};

    await Promise.all([
      sendDoctorEmail({
        doctorEmail: doctor.email ?? '',
        doctorName: doctor.name ?? 'Doctor',
        patientName: patient.name ?? 'Patient',
        preferredTime: data.preferredTime,
        reason: data.reason
      }),
      createNotification({
        userId: data.doctorId,
        type: 'appointment',
        payload: {
          appointmentId: event.params.appointmentId,
          patientId: data.patientId,
          preferredTime: data.preferredTime,
          reason: data.reason
        }
      })
    ]);
  }
);

// Example Express replacement (optional for Node/Express deployments)
// import express from 'express';
// const app = express();
// app.post('/webhooks/appointments', async (_req, res) => {
//   await createNotification({ userId: 'doctor-123', type: 'appointment', payload: {} });
//   res.status(204).send();
// });
// export const api = onRequest(app);

