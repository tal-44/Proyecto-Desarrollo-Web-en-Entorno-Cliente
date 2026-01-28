/*
 * PARTE DE IVÁN PARA EL HITO 2 (CATÁLOGO ENTERO) DINAMICAMENTE, FILTROS, RENDERIZADO mejorado del Hito11
 *
 * CATÁLOGO DE PRODUCTOS - Lógica principal de index.html
 * 
 * Este script implementa la funcionalidad completa del catálogo de productos:
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * 1. CARGA: Lee todos los productos desde product_data.json
 * 2. RENDERIZADO: Crea dinámicamente tarjetas de producto en el grid
 * 3. FILTRADO: Implementa sistema de filtros por:
 *    - Ramos pre-hechos vs plantas individuales
 *    - Temporada (primavera, verano, otoño, invierno, todo año)
 *    - Dificultad (fácil, media, difícil)
 *    - Búsqueda por nombre (buscador de texto)
 * 4. CARRITO: Integración con cart.js para añadir productos
 * 5. NAVEGACIÓN: Al hacer clic en una tarjeta, va a la página de detalle (product.html)
 * 
 * ESTRUCTURA:
 * - Barra lateral con grupos de filtros expandibles
 * - Grid de productos con tarjetas dinámicas
 * - Buscador de texto integrado
 * - Contador de resultados
 * 
 * ALMACENAMIENTO:
 * - sessionStorage['productoActual']: datos del producto seleccionado (para product.html)
 * - localStorage['cart']: carrito de compras (gestionado por cart.js)
 * 
 * EVENTOS:
 * - Filtro-toggle: expandir/contraer grupos de filtros
 * - Filtro-opcion: seleccionar un valor de filtro y aplicarlo
 * - Botón limpiar: resetear todos los filtros
 * - Buscador (input): filtrar en tiempo real por nombre
 * - Botón añadir carrito: llamar a window.addItemToCart()
 * - Click tarjeta: navegar a página de detalle
 */

document.addEventListener('DOMContentLoaded', async () => {
  /*
   * Cuando el documento HTML termina de cargarse, cargamos los productos
   * desde el JSON y ejecutamos la lógica de interacción del catálogo.
   */

  // ===== VARIABLES GLOBALES =====
  let todosLosProductos = [];

  /**
   * OBJETO DE ESTADO DE FILTROS
   * Almacena el estado actual de los filtros seleccionados
   * 
   * PROPIEDADES:
   * - ramos: 'todos' (ambos) | 'si' (solo ramos) | 'no' (solo plantas)
   * - temporada: 'todas' (sin filtro) | 'primavera', 'verano', 'otoño', 'invierno'
   * - dificultad: 'todas' (sin filtro) | 'facil', 'media', 'dificil'
   * 
   * 
   * - Se actualiza cuando el usuario selecciona opciones en los filtros
   * - Cada cambio dispara filtrarProductos() para mostrar/ocultar tarjetas
   * 
   * INICIAL: Todos los valores están en modo "sin filtro" (mostrar todo)
   */
  const filtros = {
    ramos: 'todos',       // valores posibles: 'todos', 'si', 'no'
    temporada: 'todas',   // valores posibles: 'todas', 'primavera', 'verano', 'otoño', 'invierno'
    dificultad: 'todas'   // valores posibles: 'todas', 'facil', 'media', 'dificil'
  };

  // ===== INICIALIZACIÓN =====
  // Cargar productos desde JSON y renderizar en catálogo
  (async () => {
    await cargarProductos();
    await renderizarProductos(todosLosProductos);
    filtrarProductos();
  })();

  // ===== FUNCIONES PRINCIPALES (ORDEN DE EJECUCIÓN) =====

  /**
   * CARGAR PRODUCTOS DESDE JSON
   * Realiza una petición HTTP (fetch) para obtener todos los productos
   * 
   * FUENTE: product_data.json (archivo estático en la raíz)
   * ESTRUCTURA JSON: { productos: [ { nombre, precio, imagen, temporada, dificultad, ... }, ... ] }
   * 
   * ALMACENAMIENTO:
   * - Los datos se guardan en la variable local todosLosProductos
   * - Se mantienen en memoria durante toda la sesión de usuario
   * - Se reutilizan para filtrado y renderizado sin hacer nuevas peticiones
   * 
   * ERROR HANDLING:
   * - Si la petición falla: captura el error, lo registra en consola
   * - Establece todosLosProductos = [] para evitar errores posteriores
   * 
   * Se ejecuta una única vez al cargar la página (en la inicialización)
   */
  async function cargarProductos() {
    try {
      const response = await fetch('product_data.json');
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      todosLosProductos = data.productos || [];
    } catch (err) {
      console.error('Error cargando productos:', err);
      todosLosProductos = [];
    }
  }

  /**
   * RENDERIZAR PRODUCTOS EN GRID
   * Crea dinámicamente las tarjetas HTML de productos en el catálogo
   * 
   * PROCESO:
   * 1. Limpia el grid anterior (grid.innerHTML = '')
   * 2. Para cada producto:
   *    - Obtiene la ruta de imagen verificada (puede ser default.jpg)
   *    - Crea un elemento <article> con clase 'producto-card'
   *    - Establece atributos data-* para filtrado:
   *      * data-ramos: 'si' o 'no'
   *      * data-temporada: 'verano', 'invierno', etc.
   *      * data-dificultad: 'facil', 'media', 'dificil'
   *      * data-nombre: nombre del producto (para búsqueda)
   *    - Inserta HTML con imagen, nombre, precio y botón
   * 3. Añade la tarjeta al DOM
   * 4. Una vez renderizadas todas: llama a asignarEventosTarjetas()
   * 
   * @param {Array} productos Array de productos a renderizar
   */
  async function renderizarProductos(productos) {
    const grid = document.getElementById('productos-grid');
    if (!grid) return;
    
    // Limpiamos las tarjetas estáticas del HTML
    grid.innerHTML = '';
    
    for (const prod of productos) {
      const article = document.createElement('article');
      article.className = 'producto-card';
      article.setAttribute('data-ramos', prod.es_para_ramo ? 'si' : 'no');
      article.setAttribute('data-temporada', prod.temporada);
      article.setAttribute('data-dificultad', prod.dificultad.toLowerCase());
      article.setAttribute('data-nombre', prod.nombre);
      article.style.cursor = 'pointer';
      
      // Obtener ruta de imagen verificada
      const imagenRuta = await obtenerImagenRuta(prod.imagen);
      
      // HTML de la tarjeta
      article.innerHTML = `
        <div class="producto-imagen">
          <span class="badge badge-dificultad ${prod.dificultad.toLowerCase()}">${capitalizar(prod.dificultad)}</span>
          <span class="badge badge-temporada ${prod.temporada}">${capitalizar(prod.temporada)}</span>
          <img src="${imagenRuta}" alt="${prod.nombre}">
        </div>
        <div class="producto-info">
          <h3>${prod.nombre}</h3>
          <p class="nombre-cientifico">${prod.nombre_cientifico || ''}</p>
          <p class="precio">€${parseFloat(prod.precio).toFixed(2)}</p>
          <button class="add-to-cart">Añadir a la cesta</button>
        </div>
      `;
      
      grid.appendChild(article);
    }
    
    // Reasignar event listeners a las nuevas tarjetas
    asignarEventosTarjetas();
  }

  /**
   * Buscador de texto.  Si existe un input con id "search-input",
   * escuchamos el evento `input` para filtrar por nombre.  El término
   * introducido se tendrá en cuenta en filtrarProductos() junto con
   * los demás filtros.  Este código no afectará a páginas que no
   * tengan dicho elemento.
   */
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filtrarProductos();
    });
  }

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
   * APLICAR FILTROS Y MOSTRAR/OCULTAR TARJETAS
   * Itera todas las tarjetas y las muestra/oculta según los filtros activos
   * 
   * LÓGICA DE FILTRADO:
   * Una tarjeta se MUESTRA solo si cumple TODOS estos criterios:
   * 1. Ramos: si filtro !== 'todos' y data-ramos !== filtro -> OCULTAR
   * 2. Temporada: si filtro !== 'todas' y data-temporada !== filtro y !== 'todo_año' -> OCULTAR
   * 3. Dificultad: si filtro !== 'todas' y data-dificultad !== filtro -> OCULTAR
   * 4. Búsqueda: si hay texto en search-input, comprueba que el nombre lo contenga
   * 
   * VISUALIZACIÓN:
   * - Tarjeta cumple filtros: card.style.display = '' (muestra con CSS default)
   * - Tarjeta no cumple: card.style.display = 'none' (oculta)
   * 
   * MENSAJES:
   * - Si visibles === 0: muestra elemento #sin-resultados
   * - Si visibles > 0: oculta elemento #sin-resultados
   * 
   * Se llama cada vez que:
   * - Usuario selecciona una opción de filtro
   * - Usuario escribe en el buscador
   * - Usuario limpia los filtros
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

      // 4) Filtro por nombre (buscador).  Si hay un input de búsqueda
      // visible en la página, comprobamos que el nombre de la tarjeta
      // incluya el término introducido (ignorando mayúsculas/minúsculas).
      if (searchInput && searchInput.value.trim() !== '') {
        const termino = searchInput.value.trim().toLowerCase();
        const nombreProducto = (card.dataset.nombre || '').toLowerCase();
        if (!nombreProducto.includes(termino)) {
          mostrar = false;
        }
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

  /**
   * Hacemos que toda la tarjeta de producto sea clicable para ir a la vista
   * detallada. Si el usuario hace clic en el botón "Añadir a la cesta",
   * agregamos el producto al carrito.
   */
  async function asignarEventosTarjetas() {
    document.querySelectorAll('.producto-card').forEach(card => {
      // Agregar evento al botón de "Añadir a la cesta"
      const addCartBtn = card.querySelector('.add-to-cart');
      if (addCartBtn) {
        addCartBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const nombre = card.dataset.nombre;
          const producto = todosLosProductos.find(p => p.nombre === nombre);
          if (producto && typeof window.addItemToCart === 'function') {
            const imagenRuta = await obtenerImagenRuta(producto.imagen);
            window.addItemToCart(producto.nombre, producto.precio, imagenRuta);
            // Mostrar notificación de confirmación
            Swal.fire({
              icon: 'success',
              title: '¡Añadido!',
              text: `${producto.nombre} ha sido añadido a la cesta.`,
              toast: true,
              position: 'bottom-end',
              timer: 2000,
              showConfirmButton: false,
              background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#ffffff',
              color: document.body.classList.contains('dark-mode') ? '#e8e8e8' : '#333333'
            });
          }
        });
      }
      
      // Click en la tarjeta para ir al detalle
      card.addEventListener('click', (e) => {
        // Si el clic proviene del botón de añadir al carrito, no hacemos nada
        if (e.target.closest('.add-to-cart')) return;
        const nombre = card.dataset.nombre;
        if (nombre) {
          // Almacenamos el producto actual en sessionStorage
          const producto = todosLosProductos.find(p => p.nombre === nombre);
          if (producto) {
            const prodData = {
              nombre: producto.nombre,
              precio: producto.precio,
              imagen: producto.imagen,
              temporada: producto.temporada,
              dificultad: producto.dificultad.toLowerCase(),
              es_ramo: producto.es_para_ramo,
              nombre_cientifico: producto.nombre_cientifico || '',
              descripcion: producto.descripcion || ''
            };
            sessionStorage.setItem('productoActual', JSON.stringify(prodData));
          }
          // Codificamos el nombre para pasarlo como parámetro en la URL
          const param = encodeURIComponent(nombre);
          window.location.href = `productos/product.html?nombre=${param}`;
        }
      });
    });
  }

  /**
   * OBTENER RUTA DE IMAGEN VERIFICADA
   * Verifica si la imagen de un producto existe. Si no existe, retorna default.jpg
   * 
   * PROCESO:
   * 1. Si imagen está vacía: retorna directamente 'img/plantas/default.jpg'
   * 2. Si la imagen no comienza con 'img/': añade prefijo 'img/plantas/'
   * 3. Crea una imagen temporal y verifica si carga (img.onload/img.onerror)
   * 4. Retorna la ruta verificada o default.jpg si falla
   * 
   * IMPORTANCIA:
   * - Previene errores de imágenes rotas en el catálogo
   * - Asegura que todas las imágenes enviadas al carrito existan
   * - Se usa en renderizarProductos() para mostrar las tarjetas
   * - Se usa en asignarEventosTarjetas() al añadir al carrito
   * 
   * @param {string} imagen Nombre o ruta relativa de la imagen
   * @returns {Promise<string>} Promesa que resuelve a la ruta verificada
   */
  function obtenerImagenRuta(imagen) {
    if (!imagen) return Promise.resolve('img/plantas/default.jpg');
    const ruta = imagen.startsWith('img/') ? imagen : `img/plantas/${imagen}`;
    // Creamos una imagen temporal para verificar si existe
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(ruta);
      img.onerror = () => resolve('img/plantas/default.jpg');
      img.src = ruta;
    });
  }

  /**
   * UTILIDAD: Capitalizar texto
   * Convierte el primer carácter a mayúscula y el resto a minúscula
   * Ejemplo: 'VERANO' -> 'Verano', 'facil' -> 'Facil'
   * 
   * @param {string} texto Texto a capitalizar
   * @returns {string} Texto capitalizado
   */
  function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }
});