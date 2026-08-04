import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  RESEND_API_KEY,
} from "astro:env/server";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// workerd no permite abrir sockets TCP, así que SMTP (nodemailer y compañía)
// está descartado: el envío sale sí o sí por HTTP.
const TIMEOUT_MS = 10_000;

export interface ContactMessage {
  nombre: string;
  apellido: string;
  email: string;
  mensaje: string;
}

// El subject es una cabecera del mail: un salto de línea en el nombre podría
// partirla en dos. Resend arma el mensaje del lado del servidor, pero
// normalizar los espacios es barato y cierra la puerta.
function singleLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export async function sendContactEmail(message: ContactMessage): Promise<void> {
  const from = singleLine(`${message.nombre} ${message.apellido}`);

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      // Con esto respondés desde tu bandeja y le llega al visitante. El "from"
      // no puede ser su dirección: el dominio no es nuestro y SPF lo rebota.
      reply_to: message.email,
      subject: `Consulta de ${from}`,
      // Solo texto plano. En HTML habría que escapar el mensaje del visitante
      // para que no inyecte markup en nuestra bandeja; no vale la pena.
      text: [
        `Nombre: ${from}`,
        `Email: ${message.email}`,
        "",
        message.mensaje,
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    // El cuerpo trae el detalle real (dominio sin verificar, key vencida).
    // Va al log del Worker; al navegador nunca, para no filtrar nada.
    throw new Error(
      `Resend respondió ${response.status}: ${await response.text()}`,
    );
  }
}
