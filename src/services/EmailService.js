import { supabase } from '../supabaseClient';

/**
 * EmailService — thin client wrapper around the `send-clinic-email` Supabase
 * Edge Function. It owns the invoke contract so the UI/controllers only pass
 * domain data (appointment / invoice) and never touch the function name or
 * payload shape directly.
 *
 * Edge Function contract:
 *   invoke('send-clinic-email', { body: { type, patientEmail, patientName, payload } })
 *     type: 'appointment' | 'invoice'
 */

const FN_NAME = 'send-clinic-email';
const LOG = '[HungBB-Email]';

/**
 * Internal dispatcher. Centralises invocation, observability logs and error
 * normalisation so both public methods stay tiny and consistent.
 *
 * @returns {Promise<{ ok: boolean, data?: any, error?: string }>}
 */
async function dispatch(type, patientEmail, patientName, payload) {
  if (!patientEmail) {
    const error = `Missing patientEmail for '${type}' email.`;
    console.error(`${LOG} ✗ ${error}`);
    return { ok: false, error };
  }

  console.info(`${LOG} → Sending '${type}' email to ${patientEmail}…`);

  try {
    const { data, error } = await supabase.functions.invoke(FN_NAME, {
      body: { type, patientEmail, patientName, payload },
    });

    // Edge Function returned a non-2xx (FunctionsHttpError) or transport failed.
    if (error) {
      // The function answers with { error, code, details }. `error` is a sentence
      // meant for a human — show that, and keep the raw body in the console for
      // debugging. Dumping the whole JSON into a toast (as before) made the UI
      // unreadable on the most common failure.
      let message = error.message;
      let code;
      try {
        if (error.context && typeof error.context.json === 'function') {
          const body = await error.context.json();
          message = body?.error || JSON.stringify(body);
          code = body?.code;
          console.error(`${LOG} ✗ '${type}' email rejected:`, body);
        }
      } catch {
        /* ignore — fall back to error.message */
      }
      console.error(`${LOG} ✗ '${type}' email failed:`, message);
      return { ok: false, error: message, code };
    }

    console.info(`${LOG} ✓ '${type}' email accepted (id: ${data?.id ?? 'n/a'}).`);
    return { ok: true, data };
  } catch (err) {
    console.error(`${LOG} ✗ Unexpected error sending '${type}' email:`, err);
    return { ok: false, error: err?.message ?? 'Unexpected error.' };
  }
}

export const ClinicEmailService = {
  /**
   * Send an appointment confirmation email.
   * @param {string} patientEmail Recipient address.
   * @param {string} patientName  Recipient name (used in the greeting).
   * @param {object} appointmentData { service, doctorName, date, time, location, note, status }
   */
  sendAppointmentEmail(patientEmail, patientName, appointmentData) {
    return dispatch('appointment', patientEmail, patientName, appointmentData);
  },

  /**
   * Send an invoice email.
   * @param {string} patientEmail Recipient address.
   * @param {string} patientName  Recipient name (used in the greeting).
   * @param {object} invoiceData  { invoiceNo, date, items:[{name,qty,price}], total, paymentMethod, status }
   */
  sendInvoiceEmail(patientEmail, patientName, invoiceData) {
    return dispatch('invoice', patientEmail, patientName, invoiceData);
  },

  /**
   * Send a reexamination reminder email.
   * @param {string} patientEmail Recipient address.
   * @param {string} patientName  Recipient name (used in the greeting).
   * @param {object} reexamData   { doctorName, date, time, reason, location, status }
   */
  sendReexaminationEmail(patientEmail, patientName, reexamData) {
    return dispatch('reexamination', patientEmail, patientName, reexamData);
  },

  /**
   * Send a medical record and prescription summary email.
   * @param {string} patientEmail Recipient address.
   * @param {string} patientName  Recipient name (used in the greeting).
   * @param {object} recordData   { diagnosis, symptoms, doctorNotes, medications:[{name,dosage,frequency,instructions,quantity}], followUpDate }
   */
  sendMedicalRecordEmail(patientEmail, patientName, recordData) {
    return dispatch('medical_record', patientEmail, patientName, recordData);
  },
};

export default ClinicEmailService;
