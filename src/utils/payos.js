const CLIENT_ID = "3b2714b9-c733-4976-b2d2-bc701cdf45a5";
const API_KEY = "bd64da8e-e46a-4693-bac4-4d9c770a839a";
const CHECKSUM_KEY = "4d4861212b5258b9053504be3a61bd724dc742eee2c39ef2fc49e1138c9488ce";

// Generate HMAC SHA256 using Web Crypto API
async function generateSignature(dataObj) {
  const sortedKeys = Object.keys(dataObj).sort();
  const dataPairs = [];
  for (const key of sortedKeys) {
    if (dataObj[key] !== undefined && dataObj[key] !== null) {
      dataPairs.push(`${key}=${dataObj[key]}`);
    }
  }
  const dataString = dataPairs.join('&');

  const encoder = new TextEncoder();
  const keyData = encoder.encode(CHECKSUM_KEY);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(dataString)
  );
  
  // Convert ArrayBuffer to Hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return signatureHex;
}

export async function createPaymentLink(orderCode, amount, description) {
  const bodyData = {
    orderCode,
    amount,
    description,
    returnUrl: window.location.origin,
    cancelUrl: window.location.origin,
  };
  
  const signature = await generateSignature(bodyData);
  const requestBody = {
    ...bodyData,
    signature
  };

  const response = await fetch('/payos-api/v2/payment-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CLIENT_ID,
      'x-api-key': API_KEY
    },
    body: JSON.stringify(requestBody)
  });

  const resJson = await response.json();
  if (resJson.code !== "00") {
    throw new Error(resJson.desc || "Failed to create payment link");
  }
  return resJson.data; // contains checkoutUrl, qrCode, paymentLinkId, bin, accountNumber, amount, description, accountName
}

export async function getPaymentStatus(orderCode) {
  const response = await fetch(`/payos-api/v2/payment-requests/${orderCode}`, {
    method: 'GET',
    headers: {
      'x-client-id': CLIENT_ID,
      'x-api-key': API_KEY
    }
  });
  const resJson = await response.json();
  if (resJson.code !== "00") {
    throw new Error(resJson.desc || "Failed to get payment status");
  }
  return resJson.data; // contains status ('PENDING', 'PAID', etc.)
}
