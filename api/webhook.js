import { google } from 'googleapis';

// Variables de entorno para credenciales (debes subir estas en Vercel)
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'); // clave privada suele tener saltos de línea

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Autenticación
const auth = new google.auth.JWT(
  CLIENT_EMAIL,
  null,
  PRIVATE_KEY,
  SCOPES
);

const sheets = google.sheets({ version: 'v4', auth });

// Función para capitalizar solo la primera letra
function capitalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

export default async function handler(req, res) {
  try {
    // Validar método POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
    }

    const body = req.body;

    // Validación básica de parámetros
    const nombre = capitalizar(body.queryResult?.parameters?.nombre);
    const personas = body.queryResult?.parameters?.personas;
    const rawFecha = body.queryResult?.parameters?.fecha;
    const rawHora = body.queryResult?.parameters?.hora;

    if (!nombre || !personas || !rawFecha || !rawHora) {
      return res.status(400).json({
        fulfillmentText:
          'Por favor, proporciona todos los datos necesarios para reservar: nombre, fecha, hora y número de personas.',
      });
    }

    // Procesar fecha y hora con zona horaria 'es-ES'
    const fecha = new Date(rawFecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const hora = new Date(rawHora).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const frases = [
      `¡Perfecto, ${nombre}! Tu reserva para ${personas} personas el ${fecha} a las ${hora} está lista. ¡Gracias por elegir Local 3!`,
      `¡Reserva lista! Te apuntamos, ${nombre}, con ${personas} personas para el ${fecha} a las ${hora}. ¡Prepárate para pasarla increíble en Local 3!`,
      `Estimado/a ${nombre}, su reserva ha sido confirmada para ${personas} personas el ${fecha} a las ${hora}. Será un honor recibirle en Local 3.`,
      `¡Ya está, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} está asegurada. ¡Local 3 te va a encantar!`,
      `¡Confirmado, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} ya está reservada. En Local 3, cada detalle está pensado para sorprenderte.`,
      `Gracias, ${nombre}. Tu experiencia en Local 3 comienza el ${fecha} a las ${hora}. Mesa reservada para ${personas} personas. Prepárate para una noche sin precedentes.`,
      `Tu mesa está lista, ${nombre}. Te esperamos el ${fecha} a las ${hora}, con ${personas} personas. ¡Local 3 será tu lugar favorito!`,
    ];

    const fraseElegida = frases[Math.floor(Math.random() * frases.length)];

    // Registro en Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID, // mejor que ponerlo fijo en el código
      range: 'A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            new Date().toLocaleString('es-ES'),
            nombre,
            personas,
            fecha,
            hora,
            fraseElegida,
            'Reserva confirmada',
          ],
        ],
      },
    });

    console.log(`Reserva registrada: ${nombre}, ${personas} personas, ${fecha} a las ${hora}`);

    // Respuesta al usuario
    return res.status(200).json({ fulfillmentText: fraseElegida });
  } catch (error) {
    console.error('Error en webhook:', error);

    // Mensaje amable para el usuario si falla algo
    return res.status(500).json({
      fulfillmentText:
        'Lo siento, hubo un problema al procesar tu reserva. Por favor, intenta de nuevo más tarde.',
    });
  }
}
