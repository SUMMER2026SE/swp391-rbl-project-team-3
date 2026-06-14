const CLIENT_ID = "3b2714b9-c733-4976-b2d2-bc701cdf45a5";
const API_KEY = "bd64da8e-e46a-4693-bac4-4d9c770a839a";

async function run() {
  const response = await fetch('https://api-merchant.payos.vn/v2/payment-requests/1781422953763', {
    method: 'GET',
    headers: {
      'x-client-id': CLIENT_ID,
      'x-api-key': API_KEY
    }
  });

  const resJson = await response.json();
  console.log(JSON.stringify(resJson, null, 2));
}

run();
