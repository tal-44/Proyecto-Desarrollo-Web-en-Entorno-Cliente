/*
 * MAPA DE TIENDAS - Integración con Leaflet.js
 *
 * Este script implementa un mapa interactivo que muestra las ubicaciones
 * de las tiendas físicas de Rincón Verde usando Leaflet.js
 *
 * CARACTERÍSTICAS:
 * - Popups informativos con dirección y horario
 * - Carga diferid
 * - Compatible con modo oscuro
 */

document.addEventListener('DOMContentLoaded', () => {
  const mapContainer = document.getElementById('map');
  if (!mapContainer) {

    return;
  }

  // Usar IntersectionObserver para carga diferida (lazy loading)
  // El mapa solo se inicializa cuando el usuario hace scroll hasta la sección
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initializeMap();
        observer.disconnect();
      }
    });
  }, {
    rootMargin: '100px'
  });

  observer.observe(mapContainer);
});

function initializeMap() {
  const tresCantosCentro = [40.6010, -3.7076];
  
  const tiendas = [
    {
      nombre: 'Rincón Verde Centro',
      coords: [40.6020, -3.7100], // Zona Centro Tres Cantos
      direccion: 'Avenida de los Encuartes 21, Tres Cantos',
      horario: 'Lun-Sáb: 10:00 - 20:00',
      telefono: '+34 912 345 678'
    },
    {
      nombre: 'Rincón Verde Nuevo Tres Cantos',
      coords: [40.5980, -3.7040], // Zona Nuevo Tres Cantos
      direccion: 'Calle Sector Oficios 14, Tres Cantos',
      horario: 'Lun-Sáb: 09:30 - 21:00',
      telefono: '+34 915 678 901'
    }
  ];

  // Crear el mapa
  const map = L.map('map', {
    center: tresCantosCentro,
    zoom: 14,
    scrollWheelZoom: false,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  const plantIcon = L.divIcon({
    className: 'custom-plant-marker',
    html: `
      <div class="marker-pin">
        <span class="marker-icon">🌱</span>
      </div>
    `,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -45]
  });

  tiendas.forEach(tienda => {
    const marker = L.marker(tienda.coords, { icon: plantIcon }).addTo(map);
    
    const popupContent = `
      <div class="tienda-popup">
        <h4>${tienda.nombre}</h4>
        <p><strong>Dirección:</strong><br>${tienda.direccion}</p>
        <p><strong>Horario:</strong><br>${tienda.horario}</p>
        <p><strong>Teléfono:</strong><br>${tienda.telefono}</p>
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      maxWidth: 250,
      className: 'custom-popup'
    });
  });

  const group = L.featureGroup(tiendas.map(t => L.marker(t.coords)));
  map.fitBounds(group.getBounds().pad(0.2));

  // Habilitar zoom con scroll cuando el usuario hace clic en el mapa
  map.on('click', () => {
    map.scrollWheelZoom.enable();
  });

  // Deshabilitar zoom con scroll cuando el mouse sale del mapa
  map.on('mouseout', () => {
    map.scrollWheelZoom.disable();
  });

  setTimeout(() => {
    map.invalidateSize();
  }, 100);
}
