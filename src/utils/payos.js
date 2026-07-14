// PayOS client — thin wrapper over the `payos` Supabase Edge Function.
//
// The PayOS CLIENT_ID / API_KEY / CHECKSUM_KEY used to be hardcoded here and
// shipped in the browser bundle. They now live as Edge Function secrets and the
// checksum signature is computed server-side; this module only forwards the
// order parameters. Deploy with:
//   supabase functions deploy payos
//   supabase secrets set PAYOS_CLIENT_ID=... PAYOS_API_KEY=... PAYOS_CHECKSUM_KEY=...
import { supabase } from '../supabaseClient';

async function invokePayos(body) {
  const { data, error } = await supabase.functions.invoke('payos', { body });
  if (error) throw new Error(error.message || 'PayOS request failed');
  if (data?.error) throw new Error(data.error);
  return data.data;
}

export async function createPaymentLink(orderCode, amount, description) {
  return invokePayos({
    action: 'create',
    orderCode,
    amount,
    description,
    returnUrl: window.location.origin,
    cancelUrl: window.location.origin,
  });
  // returns: checkoutUrl, qrCode, paymentLinkId, bin, accountNumber, amount,
  // description, accountName
}

export async function getPaymentStatus(orderCode) {
  return invokePayos({ action: 'status', orderCode });
  // returns: { status: 'PENDING' | 'PAID' | ... }
}
