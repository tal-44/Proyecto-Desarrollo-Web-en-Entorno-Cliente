/*
 * PARTE DE IVÁN PARA EL HITO 2 (PRODUCTO ENTERO), cargar datos dinámicamente, sistema de comentarios
 *
 * PÁGINA DE DETALLE DE PRODUCTO - Vista detallada de plantas individuales
 * 
 * Este script ejecuta la lógica de product.html y proporciona:
 * 
 * FUNCIONALIDAD PRINCIPAL:
 * 1. CARGA: Lee los datos del producto desde:
 *    - sessionStorage['productoActual'] (enviado por script.js al hacer clic)
 *    - O desde product_data.json + parámetro URL ?nombre=...
 * 2. RENDERIZADO: Muestra detalles completos:
 *    - Imagen (con verificación de existencia)
 *    - Nombre, descripción, precio
 *    - Badges de temporada y dificultad
 *    - Características principales
 * 3. CARRITO: Botón "Añadir a la cesta" integrado con cart.js
 * 4. PRODUCTOS RELACIONADOS: Genera grid con productos de la misma temporada
 * 5. COMENTARIOS: Sistema de opiniones para usuarios autenticados
 * 
 * ALMACENAMIENTO:
 * - sessionStorage['productoActual']: datos del producto actual (temporal)
 * - localStorage['comments']: array de comentarios (persistente)
 * - localStorage['currentUser']: usuario autenticado (para comentarios)
 * 
 * COMENTARIOS:
 * - Solo disponibles para usuarios autenticados (requiere login)
 * - Cada comentario tiene: producto, usuario, rating (1-5), texto, fecha
 * - Se renderizan dinámicamente al cargar la página
 * - Se persisten en localStorage para todas las páginas
 * 
 * NAVEGACIÓN:
 * - Productos relacionados son clickeables para cambiar de detalle
 * - Botón "Volver al catálogo" regresa a index.html
 */

document.addEventListener('DOMContentLoaded', async () => {
  let productos = [];
  let productoActual = null;

  /**
   * OBTENER RUTA DE IMAGEN VERIFICADA
   * Verifica si la imagen de un producto existe en el servidor
   * 
   * PROCESO:
   * 1. Si imagen está vacía: retorna 'img/plantas/default.jpg'
   * 2. Si no comienza con 'img/': prefija con 'img/plantas/'
   * 3. Crea elemento <img> temporal y espera a onload/onerror
   * 4. Si carga correctamente: retorna la ruta
   * 5. Si falla: retorna 'img/plantas/default.jpg'
   * 
   * RETORNO: Promesa que resuelve a la ruta (permite await)
   * 
   * USADO EN:
   * - mostrarDetalle(): para mostrar la imagen principal del producto
   * - mostrarRelacionados(): para mostrar imágenes de productos relacionados
   * - crearTarjetaProducto(): para mostrar imágenes en el grid de relacionados
   * 
   * @param {string} imagen Nombre o ruta relativa de la imagen
   * @returns {Promise<string>} Promesa que resuelve a la ruta verificada
   */
  function obtenerImagenRuta(imagen) {
    if (!imagen) return '../img/plantas/default.jpg';
    const ruta = imagen.startsWith('../img/') ? imagen : `../img/plantas/${imagen}`;
    // Creamos una imagen temporal para verificar si existe
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(ruta);
      img.onerror = () => resolve('../img/plantas/default.jpg');
      img.src = ruta;
    });
  }

  /**
   * CARGAR TODOS LOS PRODUCTOS DESDE JSON
   * Realiza fetch a product_data.json para obtener el catálogo completo
   * 
   * NECESIDAD:
   * - Si el usuario accede directamente vía URL (?nombre=...),
   *   necesitamos el JSON para buscar el producto
   * - Los datos se usan también para productos relacionados
   * 
   * ERROR HANDLING:
   * - Si falla el fetch: captura excepción y establece productos = []
   * - Los datos se guardan en la variable local productos (scope de función)
   */
  async function cargarProductos() {
    try {
      const response = await fetch('../product_data.json');
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      productos = data.productos || [];
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * OBTENER PRODUCTO ACTUAL
   * Recupera los datos del producto a mostrar de varias fuentes posibles
   * 
   * ORDEN DE BÚSQUEDA:
   * 1. sessionStorage['productoActual']: datos enviados por script.js (más rápido)
   * 2. URL parámetro ?nombre=...: búsqueda en el JSON cargado
   * 
   * VALIDACIÓN:
   * - Si encuentra datos en ambas fuentes, verifica que coincidan los nombres
   * - Si están inconsistentes, prefiere sessionStorage
   * - Si no encuentra nada: retorna null (se muestra página de error)
   * 
   * RETORNO: Objeto producto con estructura { nombre, precio, imagen, ... } o null
   */
  function obtenerProductoActual() {
    const params = new URLSearchParams(window.location.search);
    const nombreParam = params.get('nombre');
    const almacenado = sessionStorage.getItem('productoActual');
    if (almacenado) {
      const obj = JSON.parse(almacenado);
      if (!nombreParam || obj.nombre === decodeURIComponent(nombreParam)) {
        return obj;
      }
    }
    if (nombreParam) {
      const nombreDec = decodeURIComponent(nombreParam);
      const encontrado = productos.find(p => p.nombre === nombreDec && !p.es_ramo);
      if (encontrado) {
        return {
          ...encontrado,
          dificultad: encontrado.dificultad.toLowerCase()
        };
      }
    }
    return null;
  }

  /**
   * Capitaliza la primera letra de una cadena
   */
  function capitalizar(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  /**
   * RENDERIZAR DETALLES DEL PRODUCTO
   * Rellena todos los elementos HTML con los datos del producto
   * 
   * PROCESO:
   * 1. Obtiene y verifica la imagen (puede ser default.jpg)
   * 2. Rellena elementos HTML:
   *    - #producto-img: imagen verificada
   *    - #producto-nombre: nombre del producto
   *    - #producto-descripcion: descripción o nombre científico
   *    - Badges de dificultad y temporada
   *    - Características (temporada, dificultad, precio)
   *    - Título de página (para pestañas del navegador)
   * 3. Vincula evento al botón "Añadir a la cesta"
   *    - Llama a window.addItemToCart() con imagenRuta verificada
   *    - Muestra alerta de éxito con SweetAlert2
   * 
   * @param {Object} prod Objeto producto con { nombre, precio, imagen, ... }
   */
  async function mostrarDetalle(prod) {
    if (!prod) {
      mostrarError('El producto no existe o no se pudo cargar.');
      return;
    }
    productoActual = prod;
    // Obtener ruta de imagen verificada
    const imagenRuta = await obtenerImagenRuta(prod.imagen);
    document.getElementById('producto-img').src = imagenRuta;
    document.getElementById('producto-img').alt = prod.nombre;
    document.getElementById('producto-nombre').textContent = prod.nombre;
    const desc = prod.descripcion || prod.nombre_cientifico || '';
    document.getElementById('producto-descripcion').textContent = desc;
    // Badges
    const badgeDif = document.getElementById('producto-badge-dificultad');
    badgeDif.className = `badge badge-dificultad ${prod.dificultad}`;
    badgeDif.textContent = capitalizar(prod.dificultad);
    const badgeTem = document.getElementById('producto-badge-temporada');
    badgeTem.className = `badge badge-temporada ${prod.temporada}`;
    badgeTem.textContent = capitalizar(prod.temporada);
    // Características
    document.getElementById('producto-temporada').textContent = capitalizar(prod.temporada);
    document.getElementById('producto-dificultad').textContent = capitalizar(prod.dificultad);
    document.getElementById('producto-precio').textContent = `€${parseFloat(prod.precio).toFixed(2)}`;
    // Botón añadir al carrito
    const btnAdd = document.getElementById('producto-add-cart-btn');
    btnAdd.addEventListener('click', () => {
      if (typeof window.addItemToCart === 'function') {
        window.addItemToCart(prod.nombre, prod.precio, imagenRuta);
        const isDark = document.body.classList.contains('dark-mode');
        Swal.fire({
          icon: 'success',
          title: '¡Añadido!',
          text: `${prod.nombre} agregado a la cesta`,
          toast: true,
          position: 'bottom-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: isDark ? '#2d2d2d' : '#ffffff',
          color: isDark ? '#e8e8e8' : '#333333'
        });
      }
    });
    document.title = `${prod.nombre} - Rincón Verde`;
  }

  /**
   * OBTENER PRODUCTOS RELACIONADOS
   * Busca productos similares al actual basándose en la temporada
   * 
   * CRITERIOS:
   * - No deben ser ramos (es_ramo === false)
   * - Deben tener la misma temporada que el producto actual
   * - No incluye el producto actual
   * 
   * RESULTADO:
   * - Retorna array (máximo 'cantidad' elementos, default 3)
   * - Normaliza los datos: convierte dificultad a minúsculas
   * 
   * USO: Para mostrar sugerencias de productos similares en la misma página
   * 
   * @param {Object} prod Producto actual
   * @param {number} cantidad Número máximo de productos a retornar (default 3)
   * @returns {Array} Array de productos relacionados
   */
  function obtenerRelacionados(prod, cantidad = 3) {
    return productos.filter(p => !p.es_ramo && p.nombre !== prod.nombre && p.temporada === prod.temporada)
                    .map(p => ({
                      ...p,
                      dificultad: p.dificultad.toLowerCase()
                    }))
                    .slice(0, cantidad);
  }

  /**
   * RENDERIZAR GRID DE PRODUCTOS RELACIONADOS
   * Crea dinámicamente tarjetas de productos en la sección de relacionados
   * 
   * PROCESO:
   * 1. Limpia el grid anterior
   * 2. Si no hay productos relacionados:
   *    - Muestra mensaje "No hay productos relacionados disponibles"
   * 3. Si hay productos:
   *    - Para cada producto: obtiene imagen verificada
   *    - Crea tarjeta con crearTarjetaProducto()
   *    - Añade al grid
   * 
   * NOTAS:
   * - Verifica cada imagen antes de crear la tarjeta (usa default.jpg si falta)
   * - Las tarjetas son clicables para cambiar al detalle de ese producto
   * 
   * @param {Array} lista Array de productos a mostrar
   */
  async function mostrarRelacionados(lista) {
    const grid = document.getElementById('productos-relacionados-grid');
    grid.innerHTML = '';
    if (!lista || lista.length === 0) {
      const p = document.createElement('p');
      p.className = 'sin-resultados';
      p.textContent = 'No hay productos relacionados disponibles.';
      grid.appendChild(p);
      return;
    }
    for (const item of lista) {
      const imagenRuta = await obtenerImagenRuta(item.imagen);
      const card = await crearTarjetaProducto(item, imagenRuta);
      grid.appendChild(card);
    }
  }

  /**
   * CREAR TARJETA DE PRODUCTO
   * Construye una tarjeta HTML individual de producto (para relacionados)
   * 
   * CONTENIDO:
   * - Imagen (con badges de temporada y dificultad)
   * - Nombre, descripción científica, precio
   * - Botón "Añadir a la cesta" (llama a window.addItemToCart)
   * - Evento click en la tarjeta (navega al detalle del producto)
   * 
   * PARÁMETRO imagenRutaVerificada:
   * - Si se proporciona: usa esa ruta (ya verificada)
   * - Si es null: verifica la imagen nuevamente
   * - Optimización: évita verificar la misma imagen dos veces
   * 
   * EVENTO DE CLICK:
   * - Guarda los datos del producto en sessionStorage['productoActual']
   * - Codifica el nombre en la URL (?nombre=encodeURIComponent(...))
   * - Redirige a product.html?nombre=...
   * 
   * @param {Object} prod Datos del producto
   * @param {string|null} imagenRutaVerificada Ruta de imagen ya verificada (opcional)
   * @returns {HTMLElement} Elemento <article> de la tarjeta
   */
  async function crearTarjetaProducto(prod, imagenRutaVerificada = null) {
    const article = document.createElement('article');
    article.className = 'producto-card';
    article.setAttribute('data-temporada', prod.temporada);
    article.setAttribute('data-dificultad', prod.dificultad);
    article.setAttribute('data-nombre', prod.nombre);
    article.style.cursor = 'pointer';
    // Imagen
    const imgDiv = document.createElement('div');
    imgDiv.className = 'producto-imagen';
    const badgeDif = document.createElement('span');
    badgeDif.className = `badge badge-dificultad ${prod.dificultad}`;
    badgeDif.textContent = capitalizar(prod.dificultad);
    const badgeTem = document.createElement('span');
    badgeTem.className = `badge badge-temporada ${prod.temporada}`;
    badgeTem.textContent = capitalizar(prod.temporada);
    const img = document.createElement('img');
    // Obtener ruta de imagen verificada
    const imagenRuta = imagenRutaVerificada || await obtenerImagenRuta(prod.imagen);
    img.src = imagenRuta;
    img.alt = prod.nombre;
    imgDiv.appendChild(badgeDif);
    imgDiv.appendChild(badgeTem);
    imgDiv.appendChild(img);
    // Info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'producto-info';
    const h3 = document.createElement('h3');
    h3.textContent = prod.nombre;
    const nc = document.createElement('p');
    nc.className = 'nombre-cientifico';
    nc.textContent = prod.nombre_cientifico || '';
    const price = document.createElement('p');
    price.className = 'precio';
    price.textContent = `€${parseFloat(prod.precio).toFixed(2)}`;
    const btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.textContent = 'Añadir a la cesta';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (typeof window.addItemToCart === 'function') {
        window.addItemToCart(prod.nombre, prod.precio, imagenRuta);
        const isDark = document.body.classList.contains('dark-mode');
        Swal.fire({
          icon: 'success',
          title: '¡Añadido!',
          text: `${prod.nombre} agregado a la cesta`,
          toast: true,
          position: 'bottom-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: isDark ? '#2d2d2d' : '#ffffff',
          color: isDark ? '#e8e8e8' : '#333333'
        });
      }
    });
    infoDiv.appendChild(h3);
    infoDiv.appendChild(nc);
    infoDiv.appendChild(price);
    infoDiv.appendChild(btn);
    article.appendChild(imgDiv);
    article.appendChild(infoDiv);
    // Navegación al hacer clic
    article.addEventListener('click', () => {
      const prodData = {
        nombre: prod.nombre,
        precio: prod.precio,
        imagen: prod.imagen,
        temporada: prod.temporada,
        dificultad: prod.dificultad,
        es_ramo: false,
        nombre_cientifico: prod.nombre_cientifico || '',
        descripcion: prod.descripcion || ''
      };
      sessionStorage.setItem('productoActual', JSON.stringify(prodData));
      const encoded = encodeURIComponent(prod.nombre);
      window.location.href = `product.html?nombre=${encoded}`;
    });
    return article;
  }

  /**
   * Muestra un mensaje de error y ofrece volver al catálogo
   */
  function mostrarError(mensaje) {
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar el producto',
      text: mensaje,
      confirmButtonText: 'Volver al catálogo',
      background: document.body.classList.contains('dark-mode') ? '#2d2d2d' : '#ffffff',
      color: document.body.classList.contains('dark-mode') ? '#e8e8e8' : '#333333'
    }).then(() => {
      window.location.href = 'index.html';
    });
  }

  // Inicialización
  await cargarProductos();
  const prod = obtenerProductoActual();
  if (prod) {
    mostrarDetalle(prod);
    const relacionados = obtenerRelacionados(prod);
    mostrarRelacionados(relacionados);
    // Configurar comentarios para el producto
    setupComments(prod.nombre);
  } else {
    mostrarError('Producto no encontrado.');
  }
});

/**
 * CONFIGURAR SISTEMA DE COMENTARIOS
 * Inicializa el formulario y renderiza comentarios para el producto
 * 
 * LÓGICA DE AUTENTICACIÓN:
 * - Si usuario NO autenticado:
 *   * Oculta el formulario de comentarios
 *   * Muestra mensaje "Debes iniciar sesión para comentar"
 * - Si usuario SÍ autenticado:
 *   * Muestra el formulario de comentarios
 *   * Oculta el mensaje de login
 *   * Vincula el evento submit del formulario
 * 
 * FLUJO DE COMENTARIO (si autenticado):
 * 1. Usuario completa el formulario (rating 1-5, texto)
 * 2. Al enviar: obtiene el comentario con datos del usuario (usuario, timestamp)
 * 3. Se carga el array de comentarios desde localStorage['comments']
 * 4. Se añade el nuevo comentario
 * 5. Se guarda en localStorage
 * 6. Se limpian los campos del formulario
 * 7. Se renderiza la lista de comentarios actualizada
 * 
 * Se llama una única vez al cargar la página (en la inicialización)
 * 
 * @param {string} nombreProducto Nombre del producto (para asociar comentarios)
 */
function setupComments(nombreProducto) {
  const form = document.getElementById('comment-form');
  const loginMsg = document.getElementById('comment-login-msg');
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    // Usuario no autenticado: ocultamos el formulario y mostramos mensaje
    form.style.display = 'none';
    loginMsg.style.display = 'block';
  } else {
    form.style.display = 'flex';
    loginMsg.style.display = 'none';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const rating = parseInt(document.getElementById('comment-rating').value);
      const text = document.getElementById('comment-text').value.trim();
      if (!text) return;
      // Cargamos comentarios existentes
      const comments = loadComments();
      comments.push({ 
        producto: nombreProducto, 
        usuario: currentUser.username, 
        rating, 
        texto: text, 
        fecha: new Date().toISOString() 
      });
      saveComments(comments);
      // Limpiamos el formulario
      document.getElementById('comment-text').value = '';
      document.getElementById('comment-rating').value = '5';
      // Volvemos a renderizar
      renderComments(nombreProducto);
    });
  }
  // Renderizamos los comentarios al cargar la página
  renderComments(nombreProducto);
}

/**
 * CARGAR COMENTARIOS DESDE LOCALSTORAGE
 * Lee el array de comentarios guardados en localStorage['comments']
 * 
 * ESTRUCTURA: Array de objetos { producto, usuario, rating, texto, fecha }
 * 
 * @returns {Array} Array de comentarios o [] si está vacío
 */
function loadComments() {
  const data = localStorage.getItem('comments');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error al leer comentarios:', e);
    return [];
  }
}

/**
 * GUARDAR COMENTARIOS EN LOCALSTORAGE
 * Persiste el array completo de comentarios en localStorage['comments']
 * 
 * @param {Array} comments Array de comentarios { producto, usuario, rating, texto, fecha }
 */
function saveComments(comments) {
  localStorage.setItem('comments', JSON.stringify(comments));
}

/**
 * RENDERIZAR COMENTARIOS DEL PRODUCTO
 * Crea dinámicamente elementos HTML para mostrar todos los comentarios del producto
 * 
 * PROCESO:
 * 1. Carga comentarios desde localStorage['comments']
 * 2. Filtra solo los comentarios del producto actual (por nombreProducto)
 * 3. Si no hay comentarios: muestra mensaje "No hay comentarios todavía..."
 * 4. Si hay comentarios: para cada uno:
   *    - Usuario (nombre)
   *    - Valoración en estrellas (★★★☆☆ formato)
   *    - Fecha formateada en español (ej: "21 ene 2026")
   *    - Texto del comentario
 * 
 * ACTUALIZACIÓN:
 * - Se llama cada vez que se añade un nuevo comentario
 * - También se llama al cargar la página para mostrar comentarios previos
 * 
 * @param {string} nombreProducto Nombre del producto cuyo comentarios filtrar
 */
function renderComments(nombreProducto) {
  const list = document.getElementById('comments-list');
  list.innerHTML = '';
  const comments = loadComments().filter(c => c.producto === nombreProducto);
  
  if (comments.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No hay comentarios todavía. ¡Sé el primero en opinar!';
    list.appendChild(p);
    return;
  }
  
  comments.forEach(comment => {
    const div = document.createElement('div');
    div.className = 'comment';
    // Creamos estrellas
    const stars = '★'.repeat(comment.rating) + '☆'.repeat(5 - comment.rating);
    // Formateamos la fecha a formato legible
    const fecha = new Date(comment.fecha);
    const fechaTexto = fecha.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    div.innerHTML = `
      <div class="comment-author">${comment.usuario}</div>
      <div class="comment-rating">${stars}</div>
      <div class="comment-date">${fechaTexto}</div>
      <p>${comment.texto}</p>
    `;
    list.appendChild(div);
  });
}