/*
 * product.js
 *
 * Controla la funcionalidad de la página de detalle de un producto que
 * no es un ramo.  Carga los datos del producto desde `product_data.json`
 * o desde el sessionStorage (proporcionado por script.js) y muestra
 * información detallada.  También genera una sección de productos
 * relacionados basándose en la temporada o dificultad.
 */

document.addEventListener('DOMContentLoaded', async () => {
  let productos = [];
  let productoActual = null;

  /**
   * Obtiene la ruta de imagen correcta.
   * Verifica si la imagen existe, si no usa default.jpg
   */
  function obtenerImagenRuta(imagen) {
    if (!imagen) return 'img/plantas/default.jpg';
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
   * Cargar productos desde el JSON local.  Si ocurre algún error
   * se captura en consola.
   */
  async function cargarProductos() {
    try {
      const response = await fetch('product_data.json');
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      productos = data.productos || [];
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Obtiene el producto actual desde sessionStorage o por parámetro de URL.
   * Si no se encuentra nada retorna null.
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
   * Muestra los detalles del producto en el DOM
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
   * Obtiene productos relacionados (mismo temporada o dificultad) que no
   * sean ramos, excluyendo el actual.  Devuelve hasta `cantidad` elementos.
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
   * Muestra productos relacionados en la cuadrícula
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
   * Crea una tarjeta de producto para productos relacionados.  Se
   * comporta de forma similar a index.js.
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
 * Configura la sección de comentarios para un producto dado. Muestra el
 * formulario solo si el usuario está autenticado y renderiza los
 * comentarios existentes.
 * @param {string} nombreProducto Nombre del producto para asociar los comentarios
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
 * Recupera la lista de comentarios del almacenamiento local.
 * @returns {Array} Array de comentarios
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
 * Guarda la lista de comentarios en localStorage.
 * @param {Array} comments Array de comentarios a guardar
 */
function saveComments(comments) {
  localStorage.setItem('comments', JSON.stringify(comments));
}

/**
 * Renderiza los comentarios asociados a un producto. Muestra el nombre
 * del usuario, la valoración con estrellas, el texto y la fecha.
 * @param {string} nombreProducto Nombre del producto cuyos comentarios se van a mostrar
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