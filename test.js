/*
 * test.js
 * Este script se ejecuta en la página de test (test.html). Contiene la
 * lógica para gestionar el formulario de preguntas y generar una
 * recomendación basada en las respuestas del usuario. Está escrito
 * deliberadamente de manera clara y comentada para estudiantes que
 * empiezan con JavaScript.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Seleccionamos el formulario y los contenedores de resultado
  const form = document.getElementById('form-test');
  const resultadoDiv = document.getElementById('resultado-test');
  const textoResultado = document.getElementById('recomendacion-texto');
  const btnVolver = document.getElementById('volver-test');

  /**
   * Función auxiliar que genera una recomendación textual en base a las
   * respuestas proporcionadas. Se basa en una serie de condiciones
   * anidadas para decidir qué tipo de planta es adecuada.
   * @param {string} luz Cantidad de luz en el hogar (mucha, media, poca)
   * @param {string} tiempo Cantidad de tiempo disponible (mucho, poco)
   * @param {string} presupuesto Presupuesto aproximado (bajo, medio, alto)
   * @returns {string} Texto con la recomendación
   */
  function obtenerRecomendacion(luz, tiempo, presupuesto) {
    let recomendacion = '';
    // Si el usuario tiene poco tiempo para cuidar plantas
    if (tiempo === 'poco') {
      if (luz === 'mucha') {
        recomendacion = '🌵 **Cactus o Suculentas** - No necesitan mucho cuidado y aman el sol.';
      } else if (luz === 'poca') {
        recomendacion = '🍃 **Pothos o Filodendro** - Muy resistentes y toleran la sombra.';
      } else {
        recomendacion = '🌱 **Sansevieria (Lengua de Suegra)** - Ideal para personas ocupadas.';
      }
    } else {
      // El usuario dispone de tiempo para cuidar plantas
      if (luz === 'mucha') {
        recomendacion = '🌸 **Orquídeas** - Bellas y recompensan el cuidado constante.';
      } else if (luz === 'poca') {
        recomendacion = '🎋 **Bambú de la Suerte** - Elegante y tolerante a la luz media.';
      } else {
        recomendacion = '🌻 **Azaleas** - Hermosas flores y requieren dedicación moderada.';
      }
    }
    // Ajustamos la recomendación según el presupuesto
    if (presupuesto === 'bajo') {
      recomendacion += ' ✨ Además, ¡es económica!';
    }
    return recomendacion;
  }

  // Manejador de envío del formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Obtenemos las respuestas seleccionadas
    const luz = form.querySelector('input[name="luz"]:checked')?.value;
    const tiempo = form.querySelector('input[name="tiempo"]:checked')?.value;
    const presupuesto = form.querySelector('input[name="presupuesto"]:checked')?.value;
    // Comprobamos que todas las preguntas estén respondidas
    if (!luz || !tiempo || !presupuesto) {
      alert('Por favor, responde todas las preguntas');
      return;
    }
    // Generamos y mostramos la recomendación
    const recomendacion = obtenerRecomendacion(luz, tiempo, presupuesto);
    textoResultado.textContent = recomendacion;
    // Mostramos la sección de resultado y ocultamos el formulario
    resultadoDiv.style.display = 'block';
    form.style.display = 'none';
  });

  // Manejador del botón de volver al test
  btnVolver.addEventListener('click', () => {
    // Ocultamos el resultado y mostramos el formulario de nuevo
    resultadoDiv.style.display = 'none';
    form.style.display = 'block';
    // Reiniciamos el formulario para que el usuario pueda volver a rellenarlo
    form.reset();
  });
});