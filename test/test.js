/**
 * test.js
 * Gestiona el test interactivo de recomendación de plantas
 * 
 *  ESTO LO HIZO JUAN, COMENTÓ SU FUNCIONES PRINCIPALES
 * 
 */

document.addEventListener('DOMContentLoaded', async () => {
    // =============================================================
    // Elementos del DOM
    // ============================================================= 
    const form = document.getElementById('form-test');
    const resultadoContainer = document.getElementById('resultado-test');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnResultado = document.getElementById('btn-resultado');
    const btnVolver = document.getElementById('volver-test');
    const btnAddRecomendacion = document.getElementById('add-recomendacion');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    // Elementos de resultado
    const resultadoImg = document.getElementById('resultado-img');
    const resultadoNombre = document.getElementById('resultado-nombre');
    const resultadoCientifico = document.getElementById('resultado-cientifico');
    const resultadoDescripcion = document.getElementById('resultado-descripcion');
    const resultadoDificultad = document.getElementById('resultado-dificultad');
    const resultadoPrecio = document.getElementById('resultado-precio');

    let preguntaActual = 1;
    const totalPreguntas = 4;
    let productos = [];
    let plantaRecomendada = null;

    const cargarProductos = async () => {
        try {
            const response = await fetch('../product_data.json');
            if (!response.ok) throw new Error('Error al cargar productos');
            const data = await response.json();
            // Filtrar solo plantas (no ramos)
            productos = (data.productos || []).filter(p => !p.es_ramo);
        } catch (error) {
            console.error('Error cargando productos:', error);
            productos = [];
        }
    };

    const actualizarProgreso = () => {
        const porcentaje = (preguntaActual / totalPreguntas) * 100;
        progressFill.style.width = `${porcentaje}%`;
        progressText.textContent = `Pregunta ${preguntaActual} de ${totalPreguntas}`;
    };

    const mostrarPregunta = (numero) => {
        const fieldsets = document.querySelectorAll('.pregunta-fieldset');
        fieldsets.forEach(f => f.classList.remove('active'));

        const preguntaActiva = document.querySelector(`[data-pregunta="${numero}"]`);
        if (preguntaActiva) {
            preguntaActiva.classList.add('active');
        }

        // Actualizar estado de botones
        btnAnterior.disabled = numero === 1;

        if (numero === totalPreguntas) {
            btnSiguiente.classList.add('hidden');
            btnResultado.classList.remove('hidden');
        } else {
            btnSiguiente.classList.remove('hidden');
            btnResultado.classList.add('hidden');
        }

        actualizarProgreso();
    };

    const validarPreguntaActual = () => {
        const fieldset = document.querySelector(`[data-pregunta="${preguntaActual}"]`);
        const radios = fieldset.querySelectorAll('input[type="radio"]');
        return Array.from(radios).some(r => r.checked);
    };

    const obtenerRespuestas = () => {
        return {
            luz: form.querySelector('input[name="luz"]:checked')?.value,
            tiempo: form.querySelector('input[name="tiempo"]:checked')?.value,
            presupuesto: form.querySelector('input[name="presupuesto"]:checked')?.value,
            espacio: form.querySelector('input[name="espacio"]:checked')?.value
        };
    };

    // Algoritmo de recomendación
    // Asigna una puntuación a cada planta basándose en las respuestas

    const calcularRecomendacion = (respuestas) => {
        if (productos.length === 0) {
            return null;
        }

        // Calcular puntuación para cada producto
        const puntuaciones = productos.map(producto => {
            let puntos = 0;
            const dificultad = producto.dificultad?.toLowerCase() || '';
            const precio = producto.precio || 0;

            // Criterio: Luz
            if (respuestas.luz === 'mucha') {
                // Plantas de mucha luz: suculentas, cactus
                if (producto.categoria_id === 2) puntos += 3;
                if (dificultad.includes('fácil')) puntos += 1;
            } else if (respuestas.luz === 'poca') {
                // Plantas tolerantes a sombra: pothos, sansevieria, zamioculca
                const toleraSombra = ['pothos', 'sansevieria', 'zamioculca', 'filodendro', 'bambú', 'schefflera'];
                if (toleraSombra.some(p => producto.nombre.toLowerCase().includes(p))) {
                    puntos += 3;
                }
                if (producto.categoria_id === 3 || producto.categoria_id === 4) puntos += 2;
      } else {
            // Luz media: la mayoría de plantas de interior
            if (producto.categoria_id === 1) puntos += 2;
        }

        // Criterio: Tiempo disponible
        if (respuestas.tiempo === 'poco') {
            // Plantas de bajo mantenimiento
            if (dificultad.includes('muy fácil')) puntos += 4;
            else if (dificultad.includes('fácil')) puntos += 2;
            if (producto.categoria_id === 2) puntos += 2; // Suculentas
        } else if (respuestas.tiempo === 'mucho') {
            // Plantas que recompensan cuidado
            if (dificultad.includes('media') || dificultad.includes('difícil')) puntos += 2;
            if (producto.categoria_id === 5) puntos += 2; // Con flores
      } else {
            // Tiempo moderado
            if (dificultad.includes('fácil') || dificultad.includes('media')) puntos += 2;
        }

        // Criterio: Presupuesto
        if (respuestas.presupuesto === 'bajo' && precio < 20) {
            puntos += 3;
        } else if (respuestas.presupuesto === 'medio' && precio >= 20 && precio <= 35) {
            puntos += 3;
        } else if (respuestas.presupuesto === 'alto' && precio > 35) {
            puntos += 3;
        }

        // Criterio: Espacio
        if (respuestas.espacio === 'pequeno') {
            // Plantas compactas
            const compactas = ['peperomia', 'suculenta', 'haworthia', 'echeveria', 'jade', 'tradescantia'];
            if (compactas.some(p => producto.nombre.toLowerCase().includes(p))) {
                puntos += 3;
            }
            if (precio < 20) puntos += 1;
        } else if (respuestas.espacio === 'grande') {
            // Plantas grandes o de crecimiento rápido
            const grandes = ['monstera', 'ficus', 'drácena', 'alocasia', 'schefflera'];
            if (grandes.some(p => producto.nombre.toLowerCase().includes(p))) {
                puntos += 3;
            }
        } else {
            // Espacio mediano: plantas de tamaño medio
            puntos += 1;
        }

        return { producto, puntos };
    });

        // Ordenar por puntuación y devolver la mejor
        puntuaciones.sort((a, b) => b.puntos - a.puntos);

        // Si hay empate, elegir aleatoriamente entre las mejores
        const mejorPuntuacion = puntuaciones[0].puntos;
        const mejores = puntuaciones.filter(p => p.puntos === mejorPuntuacion);
        const elegida = mejores[Math.floor(Math.random() * mejores.length)];

        return elegida.producto;
    };

    const mostrarResultado = (planta) => {
        if (!planta) {
            // Recomendación por defecto si no hay productos
            resultadoNombre.textContent = 'Pothos Dorado';
            resultadoCientifico.textContent = 'Epipremnum aureum';
            resultadoDescripcion.textContent = 'Una planta indestructible perfecta para principiantes. Purifica el aire y crece en casi cualquier condición.';
            resultadoDificultad.textContent = '🌿 Muy fácil';
            resultadoPrecio.textContent = '€12.99';
            resultadoImg.src = '../img/plantas/pothos.jpg';
            resultadoImg.alt = 'Pothos Dorado';
            return;
        }

        resultadoNombre.textContent = planta.nombre;
        resultadoCientifico.textContent = planta.nombre_cientifico || '';
        resultadoDescripcion.textContent = planta.descripcion || '';
        resultadoDificultad.textContent = `🌿 ${planta.dificultad || 'Fácil'}`;
        resultadoPrecio.textContent = `€${parseFloat(planta.precio).toFixed(2)}`;
        resultadoImg.src = `../img/plantas/${planta.imagen}`;
        resultadoImg.alt = planta.nombre;

        // Guardar para añadir al carrito
        plantaRecomendada = planta;
    };

    // ============================================================= 
    // Event Listeners
    // ============================================================= 

    // Botón Anterior
    btnAnterior.addEventListener('click', () => {
        if (preguntaActual > 1) {
            preguntaActual--;
            mostrarPregunta(preguntaActual);
    }
  });

    // Botón Siguiente
    btnSiguiente.addEventListener('click', () => {
        if (!validarPreguntaActual()) {
            mostrarAlerta('warning', 'Por favor, selecciona una opción antes de continuar.');
            return;
    }

      if (preguntaActual < totalPreguntas) {
          preguntaActual++;
          mostrarPregunta(preguntaActual);
      }
  });

    // Envío del formulario (ver resultado)
  form.addEventListener('submit', (e) => {
    e.preventDefault();

      if (!validarPreguntaActual()) {
          mostrarAlerta('warning', 'Por favor, responde todas las preguntas.');
      return;
    }

      const respuestas = obtenerRespuestas();

      // Verificar que todas las respuestas están
      if (!respuestas.luz || !respuestas.tiempo || !respuestas.presupuesto || !respuestas.espacio) {
          mostrarAlerta('error', 'Por favor, responde todas las preguntas.');
          return;
      }

      // Calcular recomendación
      const recomendacion = calcularRecomendacion(respuestas);
      mostrarResultado(recomendacion);

      // Mostrar resultado y ocultar formulario
      form.classList.add('hidden');
      resultadoContainer.classList.remove('hidden');

      // Scroll suave al resultado
      resultadoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

    // Botón volver al test
  btnVolver.addEventListener('click', () => {
      // Reiniciar
      preguntaActual = 1;
    form.reset();
      mostrarPregunta(1);

      // Mostrar formulario y ocultar resultado
      resultadoContainer.classList.add('hidden');
      form.classList.remove('hidden');

      // Scroll al inicio
      document.querySelector('.test-header').scrollIntoView({ behavior: 'smooth' });
  });

    // Botón añadir recomendación al carrito
    btnAddRecomendacion.addEventListener('click', () => {
        if (!plantaRecomendada) {
            mostrarAlerta('error', 'No hay planta seleccionada.');
            return;
        }

        if (typeof window.addItemToCart === 'function') {
            window.addItemToCart(
                plantaRecomendada.nombre,
                plantaRecomendada.precio,
                `../img/plantas/${plantaRecomendada.imagen}`
            );
            mostrarAlerta('success', `¡${plantaRecomendada.nombre} añadido a la cesta!`);
        } else {
            mostrarAlerta('error', 'Error al añadir al carrito. Recarga la página.');
        }
    });

    // Auto-avanzar al seleccionar opción
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', () => {
            // Pequeño delay para feedback visual
            setTimeout(() => {
                if (preguntaActual < totalPreguntas) {
                    preguntaActual++;
                    mostrarPregunta(preguntaActual);
                }
            }, 300);
        });
    });

    // ============================================================= 
    // Función auxiliar para alertas
    // ============================================================= 
    const mostrarAlerta = (tipo, mensaje) => {
        const isDarkMode = document.body.classList.contains('dark-mode');

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: tipo,
                title: tipo === 'success' ? '¡Éxito!' : tipo === 'warning' ? 'Atención' : 'Error',
                text: mensaje,
                toast: tipo === 'success',
                position: tipo === 'success' ? 'bottom-end' : 'center',
                showConfirmButton: tipo !== 'success',
                timer: tipo === 'success' ? 2500 : undefined,
                timerProgressBar: tipo === 'success',
                background: isDarkMode ? '#2d2d2d' : '#ffffff',
                color: isDarkMode ? '#e8e8e8' : '#333333',
                confirmButtonColor: isDarkMode ? '#a8d5a8' : '#2c662d'
      });
        } else {
            alert(mensaje);
        }
    };

    // ============================================================= 
    // Inicialización
    // ============================================================= 
    await cargarProductos();
    mostrarPregunta(1);
});
