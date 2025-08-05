// functions/enviarReporte.js
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const body = JSON.parse(event.body);

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbxQcEGyGdmNMWbIgibwP2PxkWrk5iDZPvaD2qnCYW0UPWWKI_fjG2QB-WQEpFJM6vNgaQ/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, response: result }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error al enviar a GAS", details: err.message }),
    };
  }
}
