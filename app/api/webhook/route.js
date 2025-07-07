import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validación temprana de variables de entorno
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Variables de entorno SUPABASE_URL o SUPABASE_ANON_KEY no configuradas.');
  // Esto no puede estar en runtime porque Next.js no permite exportar el handler si esto falla,
  // pero se deja aquí para recordatorio.
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function capitalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

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

export async function POST(request) {
  try {
    // Validación adicional de variables de entorno en runtime
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Variables de entorno faltantes en runtime.');
      return NextResponse.json({
        fulfillmentText: 'Error de configuración interna. Contacta al administrador.',
      }, { status: 500 });
    }

    const body = await request.json();

    // Validar que body.queryResult.parameters exista y tenga los datos
    const params = body?.queryResult?.parameters;
    if (!params) {
      console.warn('No se recibieron parámetros en body.queryResult.parameters.');
      return NextResponse.json({
        fulfillmentText: 'No se recibieron datos suficientes para procesar la reserva.',
      }, { status: 400 });
    }

    const nombre = capitalizar(params.nombre);
    const personas = params.personas;
    const rawFecha = params.fecha;
    const rawHora = params.hora;
    const contacto = params.contacto || '';
    const comentario = params.comentario || '';

    if (!nombre || !personas || !rawFecha || !rawHora) {
      return NextResponse.json({
        fulfillmentText:
          'Por favor, proporciona todos los datos necesarios para reservar: nombre, fecha, hora y número de personas.',
      }, { status: 400 });
    }

    // Validar que las fechas sean válidas
    const fechaObj = new Date(rawFecha);
    const horaObj = new Date(rawHora);

    if (isNaN(fechaObj.getTime()) || isNaN(horaObj.getTime())) {
      return NextResponse.json({
        fulfillmentText:
          'La fecha o la hora proporcionadas no son válidas. Por favor, verifica e intenta nuevamente.',
      }, { status: 400 });
    }

    // Formatear fecha y hora en español
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
      return NextResponse.json({
        fulfillmentText:
          'Lo siento, hubo un problema al registrar tu reserva. Intenta de nuevo más tarde.',
      }, { status: 500 });
    }

    return NextResponse.json({
      fulfillmentText: fraseElegida,
    });
  } catch (error) {
    console.error('Error general en webhook:', error.message);
    return NextResponse.json({
      fulfillmentText:
        'Lo siento, ocurrió un error procesando tu reserva. Por favor, intenta más tarde.',
    }, { status: 500 });
  }
}
