import crypto from 'crypto';

const CLIENT_ID = "3b2714b9-c733-4976-b2d2-bc701cdf45a5";
const API_KEY = "bd64da8e-e46a-4693-bac4-4d9c770a839a";
const CHECKSUM_KEY = "4d4861212b5258b9053504be3a61bd724dc742eee2c39ef2fc49e1138c9488ce";

// Generate HMAC SHA256 using Node crypto
function generateSignatureSync(dataObj) {
  const sortedKeys = Object.keys(dataObj).sort();
  const dataPairs = [];
  for (const key of sortedKeys) {
    if (dataObj[key] !== undefined && dataObj[key] !== null) {
      dataPairs.push(`${key}=${dataObj[key]}`);
    }
  }
  const dataString = dataPairs.join('&');
  const hmac = crypto.createHmac('sha256', CHECKSUM_KEY);
  hmac.update(dataString);
  return hmac.digest('hex');
}

async function testPayOS() {
  const orderCode = Date.now();
  const bodyData = {
    orderCode,
    amount: 50000,
    description: `Dat lich ${orderCode}`.substring(0, 25),
    returnUrl: 'http://localhost:5173',
    cancelUrl: 'http://localhost:5173',
  };
  
  const signature = generateSignatureSync(bodyData);
  const requestBody = {
    ...bodyData,
    signature
  };

  try {
      const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': CLIENT_ID,
          'x-api-key': API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      const resJson = await response.json();
      console.log("PayOS response:", resJson);
  } catch (e) {
      console.error("Error:", e);
  }
}
testPayOS();
