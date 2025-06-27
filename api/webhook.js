import { google } from 'googleapis';

// Variables de entorno (subidas en Vercel)
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Configuración de Google Sheets
const auth = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
const sheets = google.sheets({ version: 'v4', auth });

// Capitalizar solo primera letra
function capitalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Frases aleatorias
function generarFrase(nombre, personas, fecha, hora) {
  const frases = [
    `¡Perfecto, ${nombre}! Tu reserva para ${personas} personas el ${fecha} a las ${hora} está lista. ¡Gracias por elegir Local 3!`,
    `¡Reserva lista! Te apuntamos, ${nombre}, con ${personas} personas para el ${fecha} a las ${hora}. ¡Prepárate para pasarla increíble en Local 3!`,
    `Estimado/a ${nombre}, su reserva ha sido confirmada para ${personas} personas el ${fecha} a las ${hora}. Será un honor recibirle en Local 3.`,
    `¡Ya está, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} está asegurada. ¡Local 3 te va a encantar!`,
    `¡Confirmado, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} ya está reservada. En Local 3, cada detalle está pensado para sorprenderte.`,
    `Gracias, ${nombre}. Tu experiencia en Local 3 comienza el ${fecha} a las ${hora}. Mesa reservada para ${personas} personas. Prepárate para una noche sin precedentes.`,
    `Tu mesa está lista, ${nombre}. Te esperamos el ${fecha} a las ${hora}, con ${personas} personas. ¡Local 3 será tu lugar favorito!`,
  ];
  return frases[Math.floor(Math.random() * frases.length)];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    const body = req.body;

    // Validación de parámetros
    const nombre = capitalizar(body?.queryResult?.parameters?.nombre);
    const personas = body?.queryResult?.parameters?.personas;
    const rawFecha = body?.queryResult?.parameters?.fecha;
    const rawHora = body?.queryResult?.parameters?.hora;

    if (!nombre || !personas || !rawFecha || !rawHora) {
      return res.status(400).json({
        fulfillmentText:
          'Por favor, proporciona todos los datos necesarios para reservar: nombre, fecha, hora y número de personas.',
      });
    }

    // Procesar fecha y hora lo antes posible
    const fechaFormateada = new Date(rawFecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const horaFormateada = new Date(rawHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const fraseElegida = generarFrase(nombre, personas, fechaFormateada, horaFormateada);

    // Enviar respuesta al usuario INMEDIATAMENTE
    res.status(200).json({ fulfillmentText: fraseElegida });

    // Intentar registrar en Google Sheets de manera asíncrona
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              new Date().toLocaleString('es-ES'),
              nombre,
              personas,
              fechaFormateada,
              horaFormateada,
              fraseElegida,
              'Reserva confirmada',
            ],
          ],
        },
      });
      console.log(`Reserva registrada en Sheets: ${nombre}, ${personas} personas, ${fechaFormateada} a las ${horaFormateada}`);
    } catch (errorSheets) {
      console.error('Error al registrar en Google Sheets:', errorSheets.message);
    }

  } catch (error) {
    console.error('Error general en webhook:', error.message);
    return res.status(500).json({
      fulfillmentText:
        'Lo siento, hubo un problema al procesar tu reserva. Por favor, intenta de nuevo más tarde.',
    });
  }
}
