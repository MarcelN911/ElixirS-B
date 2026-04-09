// ============================================
// FORMULARIO.JS — Perfil Olfativo
// Valida el formulario y genera el mensaje
// de WhatsApp al enviar.
// ============================================

function enviarPerfilWhatsApp(event) {
    event.preventDefault();

    const grupos = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];
    const respuestas = {};

    for (const grupo of grupos) {
        const seleccionado = document.querySelector(`input[name="${grupo}"]:checked`);
        if (!seleccionado) {
            document.getElementById('pfError').textContent = 'Por favor responde todas las preguntas antes de enviar.';
            return;
        }
        respuestas[grupo] = seleccionado.value;
    }

    const nombre = document.getElementById('pfNombre').value.trim();

    if (!nombre) {
        document.getElementById('pfError').textContent = 'Por favor escribe tu nombre.';
        return;
    }

    document.getElementById('pfError').textContent = '';

    const mensaje =
`*Descubre tu Aroma Ideal — Perfil Olfativo*

Hola! Completé el test de perfil. Mis respuestas:

*Me defino como:* ${respuestas.q1}
*Ocasión:* ${respuestas.q2}
*Tipo de aroma:* ${respuestas.q3}
*Intensidad:* ${respuestas.q4}
*Clima:* ${respuestas.q5}
*Quiero transmitir:* ${respuestas.q6}
*Experiencia:* ${respuestas.q7}

*Mi nombre:* ${nombre}

¡Quedo atento/a a su recomendación!`;

    const phone = '573205826414';
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(mensaje)}`, '_blank');
}

document.getElementById('perfilForm').addEventListener('submit', enviarPerfilWhatsApp);
