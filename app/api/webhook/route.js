import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Capitalizar solo la primera letra
function capitalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Frases aleatorias para confirmación
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

// Handler del webhook
export async function POST(request) {
  try {
    const body = await request.json();

    const nombre = capitalizar(body?.queryResult?.parameters?.nombre);
    const personas = body?.queryResult?.parameters?.personas;
    const rawFecha = body?.queryResult?.parameters?.fecha;
    const rawHora = body?.queryResult?.parameters?.hora;
    const contacto = body?.queryResult?.parameters?.contacto || '';
    const comentario = body?.queryResult?.parameters?.comentario || '';

    if (!nombre || !personas || !rawFecha || !rawHora) {
      return Response.json({
        fulfillmentText:
          'Por favor, proporciona todos los datos necesarios para reservar: nombre, fecha, hora y número de personas.',
      }, { status: 400 });
    }

    // Formatear fecha y hora en español
    const fechaObj = new Date(rawFecha);
    const horaObj = new Date(rawHora);

    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const horaFormateada = horaObj.toLocaleTimeString('es-ES', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const fraseElegida = generarFrase(nombre, personas, fechaFormateada, horaFormateada);

    // Guardar en Supabase
    const { error } = await supabase.from('reservas').insert([
      {
        nombre,
        personas,
        fecha: fechaFormateada,
        hora: horaFormateada,
        contacto,
        comentario,
        creado_en: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error registrando en Supabase:', error.message);
      return Response.json({
        fulfillmentText:
          'Lo siento, hubo un problema al registrar tu reserva. Intenta de nuevo más tarde.',
      }, { status: 500 });
    }

    // Respuesta a Dialogflow
    return Response.json({
      fulfillmentText: fraseElegida,
    });

  } catch (error) {
    console.error('Error general en webhook:', error.message);
    return Response.json({
      fulfillmentText:
        'Lo siento, ocurrió un error procesando tu reserva. Por favor, intenta más tarde.',
    }, { status: 500 });
  }
}