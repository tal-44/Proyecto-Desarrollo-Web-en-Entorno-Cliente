/**
 * vista-ramo.js
 * Controla la funcionalidad de la página de detalle de un ramo individual
 * Carga los datos del ramo desde el localStorage y muestra ramos relacionados
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Variables globales
  let productoActual = null;
  let todosLosProductos = [];

  /**
   * Obtiene la ruta de imagen correcta.
   * Verifica si la imagen existe, si no usa default.jpg
   */
  function obtenerImagenRuta(imagen) {
    if (!imagen) return '../../img/plantas/default.jpg';
    const ruta = imagen.startsWith('../../img/') ? imagen : `../../img/plantas/${imagen}`;
    // Creamos una imagen temporal para verificar si existe
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(ruta);
      img.onerror = () => resolve('../../img/plantas/default.jpg');
      img.src = ruta;
    });
  }

  /**
   * Carga los datos del producto desde product_data.json
   */
  const cargarProductos = async () => {
    try {
      const response = await fetch('../../product_data.json');
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      return data.productos || [];
    } catch (error) {
      console.error('Error cargando productos:', error);
      mostrarError('No se pudieron cargar los datos del producto.');
      return [];
    }
  };

  /**
   * Obtiene el ramo actual desde los parámetros de URL, sessionStorage o buscándolo en el JSON
   */
  const obtenerRamoActual = () => {
    const params = new URLSearchParams(window.location.search);
    const nombre = params.get('nombre');
    
    // Primero intentar obtener de sessionStorage (desde ramos.js)
    const almacenado = sessionStorage.getItem('ramoActual');
    if (almacenado) {
      const ramoSession = JSON.parse(almacenado);
      // Verificar que el nombre coincide con el parámetro URL
      if (!nombre || ramoSession.nombre === decodeURIComponent(nombre)) {
        return ramoSession;
      }
    }
    
    // Si hay nombre en URL, buscar en el JSON
    if (nombre) {
      const nombreDecodificado = decodeURIComponent(nombre);
      const ramoEncontrado = todosLosProductos.find(p => 
        p.nombre === nombreDecodificado && p.es_ramo === true
      );
      if (ramoEncontrado) {
        // Ajustar la ruta de imagen para vista_ramo/
        return {
          ...ramoEncontrado,
          imagen: `../../img/plantas/${ramoEncontrado.imagen}`,
          dificultad: ramoEncontrado.dificultad.toLowerCase()
        };
      }
    }
    
    return null;
  };

  /**
   * Muestra los detalles del ramo en la página
   */
  const mostrarDetalleRamo = async (ramo) => {
    if (!ramo) {
      mostrarError('El ramo no encontrado.');
      return;
    }

    productoActual = ramo;

    // Obtener imagen verificada
    const imagenRuta = await obtenerImagenRuta(ramo.imagen);

    // Actualizar imagen y título
    document.getElementById('ramo-img').src = imagenRuta;
    document.getElementById('ramo-img').alt = ramo.nombre;
    document.getElementById('ramo-nombre').textContent = ramo.nombre;

    const descripcion = ramo.descripcion || ramo.nombre_cientifico || '[DEBUG] Descripcion generica (Ivan, tu q tienes mas mano para las palabras, pon algo mas adecuado aqui si quieres, pero en realidad es para debug, no deberai salir y seguramente se salga de la tarjeta).';
    document.getElementById('ramo-descripcion').textContent = descripcion;

    // Badges
    const badgeTemporada = document.getElementById('ramo-badge-temporada');

    badgeTemporada.className = `badge badge-temporada ${ramo.temporada}`;
    badgeTemporada.textContent = ramo.temporada.charAt(0).toUpperCase() + ramo.temporada.slice(1);

    // Características
    document.getElementById('ramo-temporada').textContent = capitalizar(ramo.temporada);
    document.getElementById('ramo-dificultad').textContent = capitalizar(ramo.dificultad);
    document.getElementById('ramo-precio').textContent = `€${parseFloat(ramo.precio).toFixed(2)}`;

    // Botón añadir al carrito
    const btnAddCart = document.getElementById('add-to-cart-btn');
    btnAddCart.addEventListener('click', () => {
      agregarAlCarrito(ramo);
    });

    // Actualizar título de la página
    document.title = `${ramo.nombre} - Rincón Verde`;
  };

  /**
   * Capitaliza la primera letra de un String
   */
  const capitalizar = (texto) => {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  /**
   * Obtiene ramos relacionados (misma temporada o dificultad)
   */
  const obtenerRamosRelacionados = (ramoActual, cantidad = 3) => {
    return todosLosProductos
      .filter(p => 
        p.es_ramo === true && 
        p.nombre !== ramoActual.nombre && 
        (p.temporada === ramoActual.temporada || p.dificultad.toLowerCase() === ramoActual.dificultad.toLowerCase())
      )
      .map(p => ({
        ...p,
        imagen: `../../img/plantas/${p.imagen}`,
        dificultad: p.dificultad.toLowerCase()
      }))
      .slice(0, cantidad);
  };

  /**
   * Muestra los ramos relacionados en la cuadrícula
   */
  const mostrarRamosRelacionados = async (ramos) => {
    const grid = document.getElementById('ramos-relacionados-grid');
    grid.innerHTML = '';

    if (ramos.length === 0) {
      grid.innerHTML = '<p class="sin-resultados">No hay otros ramos disponibles en este momento.</p>';
      return;
    }

    for (const ramo of ramos) {
      const card = await crearTarjetaProducto(ramo);
      grid.appendChild(card);
    }
  };

  /**
   * Crea una tarjeta de producto HTML
   */
  const crearTarjetaProducto = async (ramo) => {
    const article = document.createElement('article');
    article.className = 'producto-card';
    article.setAttribute('data-es-ramo', 'true');
    article.setAttribute('data-temporada', ramo.temporada);
    article.setAttribute('data-dificultad', ramo.dificultad);
    article.setAttribute('data-nombre', ramo.nombre);
    article.setAttribute('data-precio', ramo.precio);
    article.style.cursor = 'pointer';

    const imagenDiv = document.createElement('div');
    imagenDiv.className = 'producto-imagen';

    const badgeDif = document.createElement('span');

    const badgeTem = document.createElement('span');
    badgeTem.className = `badge badge-temporada ${ramo.temporada}`;
    badgeTem.textContent = capitalizar(ramo.temporada);

    // Obtener imagen verificada
    const imagenRuta = await obtenerImagenRuta(ramo.imagen);
    const img = document.createElement('img');
    img.src = imagenRuta;
    img.alt = ramo.nombre;

    imagenDiv.appendChild(badgeDif);
    imagenDiv.appendChild(badgeTem);
    imagenDiv.appendChild(img);

    const infoDiv = document.createElement('div');
    infoDiv.className = 'producto-info';

    const titulo = document.createElement('h3');
    titulo.textContent = ramo.nombre;

    const descripcion = document.createElement('p');
    descripcion.className = 'nombre-cientifico';
    descripcion.textContent = ramo.nombre_cientifico || 'Hermoso ramo';

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = `€${parseFloat(ramo.precio).toFixed(2)}`;

    const btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.setAttribute('type', 'button'); // Asegurar que no sea submit
    btn.textContent = 'Añadir a la cesta';

    // Event listener para añadir al carrito
    btn.addEventListener('click', function (e) {
      // Detener propagación Y prevenir default
      e.stopPropagation();
      e.preventDefault();
      e.stopImmediatePropagation(); // También detener otros listeners en el mismo elemento

      console.log('=== CLICK BOTÓN RELACIONADO ===');
      console.log('Producto:', ramo.nombre);

      // Usar la función de cart.js directamente
      if (typeof window.addItemToCart === 'function') {
        window.addItemToCart(ramo.nombre, ramo.precio, ramo.imagen);
        console.log('Producto añadido al carrito');

        // Mostrar confirmación con SweetAlert2
        const isDarkMode = document.body.classList.contains('dark-mode');
        Swal.fire({
          icon: 'success',
          title: '¡Añadido!',
          text: `${ramo.nombre} agregado a la cesta`,
          toast: true,
          position: 'bottom-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          background: isDarkMode ? '#2d2d2d' : '#ffffff',
          color: isDarkMode ? '#e8e8e8' : '#333333'
        });
      } else {
        console.error('ERROR: window.addItemToCart no está disponible');
      }

      return false;
    }, true);

    infoDiv.appendChild(titulo);
    infoDiv.appendChild(descripcion);
    infoDiv.appendChild(precio);
    infoDiv.appendChild(btn);

    article.appendChild(imagenDiv);
    article.appendChild(infoDiv);

    // Event listener para hacer click en la tarjeta (navegación)
    article.addEventListener('click', function (e) {
      console.log('=== CLICK EN TARJETA ===');
      console.log('e.target:', e.target.tagName, e.target.className);

      // Varias verificacones pues hasy que asegurarse de que se este clickando el boton
      const esBoton = e.target.classList.contains('add-to-cart');
      const esDentroBoton = e.target.closest('.add-to-cart') !== null;
      const esElementoButton = e.target.tagName === 'BUTTON';

      console.log('esBoton:', esBoton, 'esDentroBoton:', esDentroBoton, 'esElementoButton:', esElementoButton);

      if (esBoton || esDentroBoton || esElementoButton) {
        console.log('Click en botón detectado - NO navegar');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      console.log('Click en tarjeta - navegando a:', ramo.nombre);

      // Preparar datos del ramo para recargar la vista
      const ramoData = {
        nombre: ramo.nombre,
        precio: ramo.precio,
        imagen: ramo.imagen,
        temporada: ramo.temporada,
        dificultad: ramo.dificultad,
        es_ramo: true,
        nombre_cientifico: ramo.nombre_cientifico || '',
        descripcion: ramo.descripcion || ''
      };

      // Guardar en sessionStorage
      sessionStorage.setItem('ramoActual', JSON.stringify(ramoData));

      // Recargar la página con el nuevo ramo
      const nombreEncoded = encodeURIComponent(ramo.nombre);
      window.location.href = `vista_ramo.html?nombre=${nombreEncoded}`;
    });

    return article;
  };

  /**
   * Agrega un producto al carrito
   */
  const agregarAlCarrito = (ramo) => {
    // Usar la función global de cart.js
    if (typeof window.addItemToCart === 'function') {
      window.addItemToCart(ramo.nombre, ramo.precio, ramo.imagen);
      // Mostrar confirmación
      mostrarConfirmacion(`${ramo.nombre} agregado a la cesta`);
    } else {
      console.error('La función addItemToCart no está disponible');
      mostrarError('Error al añadir el ramo a la cesta');
    }
  };

  /**
   * Muestra una confirmación al usuario
   */
  const mostrarConfirmacion = (mensaje) => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    Swal.fire({
      icon: 'success',
      title: '¡Añadido!',
      text: mensaje,
      toast: true,
      position: 'bottom-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: isDarkMode ? '#2d2d2d' : '#ffffff',
      color: isDarkMode ? '#e8e8e8' : '#333333'
    });
  };

  /**
   * Muestra un mensaje de error
   */
  const mostrarError = (mensaje) => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar el ramo',
      text: mensaje,
      confirmButtonText: 'Volver a Ramos',
      confirmButtonColor: isDarkMode ? '#a8d5a8' : '#2c662d',
      background: isDarkMode ? '#2d2d2d' : '#ffffff',
      color: isDarkMode ? '#e8e8e8' : '#333333'
    }).then(() => {
      window.location.href = '../ramos.html';
    });
  };

  // Inicialización
  todosLosProductos = await cargarProductos();

  if (todosLosProductos.length > 0) {
    const ramo = obtenerRamoActual();
    if (ramo) {
      mostrarDetalleRamo(ramo);
      const relacionados = obtenerRamosRelacionados(ramo);
      mostrarRamosRelacionados(relacionados);
    } else {
      mostrarError('El ramo solicitado no existe.');
    }
  }
});
