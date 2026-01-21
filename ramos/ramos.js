/**
 * ramos.js
 * Gestiona la funcionalidad de la página de ramos
 * - Carga los ramos desde product_data.json (es_ramo: true)
 * - Renderiza las tarjetas de producto dinámicamente
 * - Hace que las tarjetas sean clickeables para ir a vista_ramo.html
 * - Guarda el ramo seleccionado en sessionStorage para que vista_ramo.js lo recupere
 */

document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('productos-grid');

  /**
   * Obtiene la ruta de imagen correcta.
   * Verifica si la imagen existe, si no usa default.jpg
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
   * Carga los productos desde el JSON
   */
  const cargarProductos = async () => {
    try {
      const response = await fetch('../product_data.json');
      if (!response.ok) throw new Error('Error al cargar los productos');
      const data = await response.json();
      return data.productos || [];
    } catch (error) {
      console.error('Error cargando productos:', error);
      return [];
    }
  };

  /**
   * Filtra solo los ramos (es_ramo === true)
   */
  const filtrarRamos = (productos) => {
    return productos.filter(p => p.es_ramo === true);
  };

  /**
   * Capitaliza la primera letra
   */
  const capitalizar = (texto) => {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  };

  /**
   * Crea una tarjeta de producto HTML
   */
  const crearTarjetaProducto = async (ramo) => {
    const article = document.createElement('article');
    article.className = 'producto-card';
    article.setAttribute('data-es-ramo', 'true');
    article.setAttribute('data-temporada', ramo.temporada);
    article.setAttribute('data-dificultad', ramo.dificultad.toLowerCase());
    article.setAttribute('data-nombre', ramo.nombre);
    article.setAttribute('data-precio', ramo.precio);
    article.setAttribute('data-imagen', `../img/plantas/${ramo.imagen}`);
    article.style.cursor = 'pointer';

    // Contenedor de imagen
    const imagenDiv = document.createElement('div');
    imagenDiv.className = 'producto-imagen';

    // Badge de temporada
    const badgeTem = document.createElement('span');
    badgeTem.className = `badge badge-temporada ${ramo.temporada}`;
    badgeTem.textContent = capitalizar(ramo.temporada);

    // Imagen - obtener ruta verificada
    const imagenRuta = await obtenerImagenRuta(ramo.imagen);
    const img = document.createElement('img');
    img.src = imagenRuta;
    img.alt = ramo.nombre;

    imagenDiv.appendChild(badgeTem);
    imagenDiv.appendChild(img);

    // Info del producto
    const infoDiv = document.createElement('div');
    infoDiv.className = 'producto-info';

    const titulo = document.createElement('h3');
    titulo.textContent = ramo.nombre;

    const descripcion = document.createElement('p');
    descripcion.className = 'nombre-cientifico';
    descripcion.textContent = ramo.nombre_cientifico || '';

    const precio = document.createElement('p');
    precio.className = 'precio';
    precio.textContent = `€${parseFloat(ramo.precio).toFixed(2)}`;

    const btn = document.createElement('button');
    btn.className = 'add-to-cart';
    btn.textContent = 'Añadir a la cesta';

    // Event listener para añadir al carrito
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Evitar que se propague al click de la tarjeta

      console.log('Click en botón añadir al carrito:', ramo.nombre);
      console.log('window.addItemToCart está disponible:', typeof window.addItemToCart === 'function');

      // Usar la función global de cart.js
      if (typeof window.addItemToCart === 'function') {
        console.log('Llamando a addItemToCart con:', {
          nombre: ramo.nombre,
          precio: ramo.precio,
          imagen: `../img/plantas/${ramo.imagen}`
        });
        window.addItemToCart(ramo.nombre, ramo.precio, `../img/plantas/${ramo.imagen}`);
        console.log('addItemToCart ejecutado correctamente');

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

        // Mostrar error con SweetAlert2
        const isDarkMode = document.body.classList.contains('dark-mode');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo añadir al carrito. Por favor, recarga la página.',
          confirmButtonColor: isDarkMode ? '#a8d5a8' : '#2c662d',
          background: isDarkMode ? '#2d2d2d' : '#ffffff',
          color: isDarkMode ? '#e8e8e8' : '#333333'
        });
      }
    });

    infoDiv.appendChild(titulo);
    infoDiv.appendChild(descripcion);
    infoDiv.appendChild(precio);
    infoDiv.appendChild(btn);

    article.appendChild(imagenDiv);
    article.appendChild(infoDiv);

    // Event listener para hacer click en la tarjeta
    article.addEventListener('click', (e) => {
      // Si el click fue en el botón de añadir al carrito, no navegar
      if (e.target.classList.contains('add-to-cart')) {
        return;
      }
      
      // Preparar datos del ramo para vista_ramo.html
      // La imagen necesita ruta ajustada para vista_ramo/ (subir un nivel más)
      const ramoData = {
        nombre: ramo.nombre,
        precio: ramo.precio,
        imagen: `../../img/plantas/${ramo.imagen}`,
        temporada: ramo.temporada,
        dificultad: ramo.dificultad.toLowerCase(),
        es_ramo: true,
        nombre_cientifico: ramo.nombre_cientifico || '',
        descripcion: ramo.descripcion || ''
      };
      
      // Guardar en sessionStorage
      sessionStorage.setItem('ramoActual', JSON.stringify(ramoData));
      
      // Navegar a la página de detalle
      const nombreEncoded = encodeURIComponent(ramo.nombre);
      window.location.href = `vista_ramo/vista_ramo.html?nombre=${nombreEncoded}`;
    });

    return article;
  };

  /**
   * Renderiza los ramos en la cuadrícula
   */
  const renderizarRamos = async (ramos) => {
    grid.innerHTML = '';
    
    if (ramos.length === 0) {
      grid.innerHTML = '<p class="sin-resultados">No hay ramos disponibles en este momento.</p>';
      return;
    }

    for (const ramo of ramos) {
      const tarjeta = await crearTarjetaProducto(ramo);
      grid.appendChild(tarjeta);
    }
  };

  // Inicialización
  const productos = await cargarProductos();
  const ramos = filtrarRamos(productos);
  renderizarRamos(ramos);
});
