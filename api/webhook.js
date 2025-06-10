export default function handler(req, res) {
  const body = req.body;

  const nombre = body.queryResult?.parameters?.nombre || 'cliente';
  const personas = body.queryResult?.parameters?.personas || 'varias';
  const fecha = body.queryResult?.parameters?.fecha || 'una fecha';
  const hora = body.queryResult?.parameters?.hora || 'una hora';

  const frases = [
    `¡Perfecto, ${nombre}! Tu reserva para ${personas} personas el ${fecha} a las ${hora} está lista. ¡Gracias por elegir Local 3!`,
    `¡Reserva lista! Te apuntamos, ${nombre}, con ${personas} personas para el ${fecha} a las ${hora}. ¡Prepárate para pasarla increíble en Local 3!`,
    `Estimado/a ${nombre}, su reserva ha sido confirmada para ${personas} personas el ${fecha} a las ${hora}. Será un honor recibirle en Local 3.`,
    `¡Ya está, ${nombre}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} está asegurada. ¡Local 3 te va a encantar!`,
    `¡Confirmado, ${nombre}}! Tu mesa para ${personas} personas el ${fecha} a las ${hora} ya está reservada. En Local 3, cada detalle está pensado para sorprenderte.`,
    `Gracias, ${nombre}. Tu experiencia en Local 3 comienza el ${fecha} a las ${hora}. Mesa reservada para ${personas} personas. Prepárate para una noche sin precedentes.`,
    `Tu mesa está lista, ${nombre}. Te esperamos el ${fecha} a las ${hora}, con ${personas} personas. ¡Local 3 será tu lugar favorito!`
  ];

  const fraseElegida = frases[Math.floor(Math.random() * frases.length)];

  res.status(200).json({ fulfillmentText: fraseElegida });
}
// This code handles a webhook request to confirm a reservation at Local 3.