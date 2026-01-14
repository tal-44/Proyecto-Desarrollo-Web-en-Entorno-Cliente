/*
 * script.js
 * Este archivo implementa la lógica básica de interacción para el Hito 1.
 * Controla la apertura y cierre de los menús desplegables de filtros,
 * selecciona opciones y filtra las tarjetas de productos según los
 * criterios elegidos. El objetivo es practicar la manipulación del DOM
 * utilizando solamente JavaScript básico.
 */

document.addEventListener('DOMContentLoaded', () => {
  /*
   * Cuando el documento HTML termina de cargarse, ejecutamos esta función.
   * Aquí centralizamos toda la lógica de interacción del catálogo.
   */

  /**
   * Objeto que almacena el estado actual de los filtros. Cada propiedad
   * corresponde a un grupo de filtros (ramos, temporada o dificultad)
   * y su valor indica la opción seleccionada. Los valores iniciales
   * representan la ausencia de filtro (por ejemplo, 'todos' significa
   * que mostramos tanto ramos como plantas).
   */
  const filtros = {
    ramos: 'todos',       // valores posibles: 'todos', 'si', 'no'
    temporada: 'todas',   // valores posibles: 'todas', 'primavera', 'verano', 'otoño', 'invierno'
    dificultad: 'todas'   // valores posibles: 'todas', 'facil', 'media', 'dificil'
  };

  /**
   * Asignamos un manejador de eventos a cada botón de "filtro-toggle".
   * Estos botones representan los títulos de los grupos de filtros
   * (Ramos, Temporada y Dificultad). Al hacer click sobre ellos,
   * alternamos la clase "visible" en el contenedor de opciones
   * correspondiente para mostrar u ocultar dicho grupo de opciones.
   */
  document.querySelectorAll('.filtro-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      // El atributo data-target contiene el id del contenedor de opciones
      const target = btn.dataset.target;
      const opciones = document.getElementById(target);
      if (opciones) {
        // toggle(): si la clase existe la elimina, si no, la añade
        opciones.classList.toggle('visible');
      }
    });
  });

  /**
   * Asignamos un manejador a cada "filtro-opcion". Estas son las
   * opciones individuales dentro de cada grupo de filtros. Al
   * seleccionar una opción:
   *   1. Recuperamos el grupo al que pertenece (ramos, temporada o dificultad)
   *      y el valor que representa.
   *   2. Actualizamos el objeto de filtros para ese grupo.
   *   3. Marcamos visualmente la opción seleccionada y desmarcamos las demás.
   *   4. Actualizamos los textos de encabezado para reflejar la selección.
   *   5. Llamamos a filtrarProductos() para ocultar o mostrar las tarjetas
   *      en función de los filtros activos.
   */
  document.querySelectorAll('.filtro-opcion').forEach(op => {
    op.addEventListener('click', () => {
      const grupo = op.dataset.grupo;   // e.g., "temporada"
      const valor = op.dataset.valor;   // e.g., "verano"
      // Actualizamos el valor del filtro correspondiente
      filtros[grupo] = valor;
      // Eliminar la clase 'selected' de todas las opciones del mismo grupo
      document.querySelectorAll(`.filtro-opcion[data-grupo="${grupo}"]`).forEach(b => b.classList.remove('selected'));
      // Añadir la clase 'selected' a la opción pulsada para resaltarla
      op.classList.add('selected');
      // Actualizar interfaz y filtrar
      actualizarInterfaz(grupo, valor);
      filtrarProductos();
    });
  });

  /**
   * Asignamos un manejador al botón de "Limpiar filtros". Al pulsarlo:
   *   - Restablece todas las propiedades de filtros a su estado inicial.
   *   - Elimina cualquier selección visual en las opciones.
   *   - Restituye los textos del catálogo a su estado por defecto.
   *   - Muestra todas las tarjetas de productos eliminando cualquier filtrado.
   */
  const limpiarBtn = document.getElementById('limpiarFiltros');
  if (limpiarBtn) {
    limpiarBtn.addEventListener('click', () => {
      // Reiniciar filtros a valores por defecto
      filtros.ramos = 'todos';
      filtros.temporada = 'todas';
      filtros.dificultad = 'todas';
      // Quitar la clase 'selected' de todas las opciones
      document.querySelectorAll('.filtro-opcion.selected').forEach(el => el.classList.remove('selected'));
      // Restaurar encabezados a sus textos originales
      document.getElementById('titulo-catalogo').textContent = 'Todas las Plantas';
      document.getElementById('texto-filtro-actual').textContent = 'Mostrando: Todas las plantas';
      // Forzar a que todas las tarjetas se muestren
      filtrarProductos();
    });
  }

  /**
   * Actualiza el título y el texto que describe el filtro seleccionado.
   * @param {string} grupo Grupo de filtro modificado (ramos, temporada, dificultad)
   * @param {string} valor Valor seleccionado dentro del grupo
   */
  function actualizarInterfaz(grupo, valor) {
    /**
     * Diccionarios que mapean el valor seleccionado a un texto legible.
     * Cada grupo tiene su propio conjunto de traducciones.
     */
    const textos = {
      ramos: {
        todos: 'Todas las plantas',
        si: 'Solo ramos pre-hechos',
        no: 'Solo plantas individuales'
      },
      temporada: {
        todas: 'Todas las temporadas',
        primavera: 'Primavera',
        verano: 'Verano',
        otoño: 'Otoño',
        invierno: 'Invierno'
      },
      dificultad: {
        todas: 'Todas las dificultades',
        facil: 'Fácil',
        media: 'Media',
        dificil: 'Difícil'
      }
    };
    // Elegimos el texto correspondiente según el grupo y el valor
    const texto = textos[grupo] && textos[grupo][valor] ? textos[grupo][valor] : 'Filtro aplicado';
    // Actualizamos el párrafo que indica qué se está mostrando
    document.getElementById('texto-filtro-actual').textContent = 'Mostrando: ' + texto;
    // Si el filtro modificado es el de ramos, también actualizamos el título principal
    if (grupo === 'ramos') {
      let titulo;
      if (valor === 'si') titulo = 'Ramos Pre-hechos';
      else if (valor === 'no') titulo = 'Plantas Individuales';
      else titulo = 'Todas las Plantas';
      document.getElementById('titulo-catalogo').textContent = titulo;
    }
  }

  /**
   * Muestra u oculta las tarjetas de producto según los filtros activos.
   */
  function filtrarProductos() {
    // Seleccionamos todas las tarjetas de productos del catálogo
    const cards = document.querySelectorAll('.producto-card');
    let visibles = 0; // contador de tarjetas que cumplen los filtros
    cards.forEach(card => {
      // Recuperamos los valores de los atributos data-* de la tarjeta
      const esRamo = card.dataset.ramos;       // "si" o "no"
      const temporada = card.dataset.temporada; // "verano", "otoño", etc.
      const dificultad = card.dataset.dificultad; // "facil", "media", "dificil"
      let mostrar = true;
      // Comprobamos cada filtro y establecemos 'mostrar' a false si no coincide
      // 1) Filtro por ramos: si el filtro no está en 'todos' y no coincide con el valor de la tarjeta
      if (filtros.ramos !== 'todos' && esRamo !== filtros.ramos) {
        mostrar = false;
      }
      // 2) Filtro por temporada: permitimos que las tarjetas con temporada 'todo_año'
      //    pasen siempre, pues representan disponibilidad durante todo el año. De lo contrario,
      //    si el filtro de temporada no es 'todas' y la tarjeta no coincide con el filtro,
      //    se oculta.
      if (filtros.temporada !== 'todas' && temporada !== filtros.temporada && temporada !== 'todo_año') {
        mostrar = false;
      }
      // 3) Filtro por dificultad: comportamiento similar al anterior
      if (filtros.dificultad !== 'todas' && dificultad !== filtros.dificultad) {
        mostrar = false;
      }
      // Si todos los filtros se cumplen, mostramos la tarjeta; de lo contrario, la ocultamos
      // Cuando se oculta, establecemos display en 'none'. Cuando se muestra,
      // utilizamos una cadena vacía para que se apliquen los estilos CSS por
      // defecto (flex dentro del grid). Utilizar 'block' podría romper el
      // diseño flex de las tarjetas.
      card.style.display = mostrar ? '' : 'none';
      if (mostrar) visibles++; // incrementamos el contador de tarjetas visibles
    });
    // Si ninguna tarjeta cumple los filtros, mostramos un mensaje de "sin resultados"
    const mensaje = document.getElementById('sin-resultados');
    if (mensaje) {
      mensaje.style.display = visibles === 0 ? 'block' : 'none';
    }
  }
});