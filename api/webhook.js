import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Cargar credenciales del archivo JSON
const credentialsPath = path.join(process.cwd(), 'credentials.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Autenticación
const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  SCOPES
);

const sheets = google.sheets({ version: 'v4', auth });

export default async function handler(req, res) {
  const body = req.body;

  const nombre = body.queryResult?.parameters?.nombre || 'cliente';
  const personas = body.queryResult?.parameters?.personas || 'varias';

  // Recibe fecha y hora en formato ISO o string
  const rawFecha = body.queryResult?.parameters?.fecha || '';
  const rawHora = body.queryResult?.parameters?.hora || '';

  // Procesar la fecha para obtener solo la parte de la fecha
  const fecha = rawFecha ? new Date(rawFecha).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  }) : 'una fecha';

  // Procesar la hora para obtener solo la parte de la hora
  const hora = rawHora ? new Date(rawHora).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  }) : 'una hora';

  const frases = [
    `¡Perfecto, ${nombre}! Tu reserva para ${personas} personas el ${fecha} a las ${hora} está lista. ¡Gracias por elegir Local 3!`,
    `¡Reserva lista! Te apuntamos, ${nombre}, con ${personas} personas para el ${fecha} a las ${hora}. ¡Prepárate para pasarla increíble en Local 3!`,
    `Estimado/a ${nombre}, su reserva ha sido confirmada para ${personas} personas el ${fecha} a las ${hora}. Será un honor recibirle en Local 3.`,
    `¡Ya está, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} está asegurada. ¡Local 3 te va a encantar!`,
    `¡Confirmado, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} ya está reservada. En Local 3, cada detalle está pensado para sorprenderte.`,
    `Gracias, ${nombre}. Tu experiencia en Local 3 comienza el ${fecha} a las ${hora}. Mesa reservada para ${personas} personas. Prepárate para una noche sin precedentes.`,
    `Tu mesa está lista, ${nombre}. Te esperamos el ${fecha} a las ${hora}, con ${personas} personas. ¡Local 3 será tu lugar favorito!`
  ];

  const fraseElegida = frases[Math.floor(Math.random() * frases.length)];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: '1LiT845P-RzAAac0WLK390w9RP_OPt1OEe9SFVelmXKI',
      range: 'A:G',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            new Date().toLocaleString('es-ES'), // Timestamp
            nombre,
            personas,
            fecha,
            hora,
            fraseElegida,
            'Reserva confirmada'
          ]
        ]
      }
    });
  } catch (error) {
    console.error('Error al escribir en Google Sheets:', error);
  }

  res.status(200).json({ fulfillmentText: fraseElegida });
}
