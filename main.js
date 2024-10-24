import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import {Style, Fill, Stroke, Circle} from 'ol/style';
import {fromLonLat, transform} from 'ol/proj';
import Overlay from 'ol/Overlay';

// Example GeoJSON data
const geojsonData = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "name": "Polygon Example",
        "type": "area",
        "description": "This is a sample polygon area"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [16.37, 48.20],
          [16.38, 48.20],
          [16.38, 48.21],
          [16.37, 48.21],
          [16.37, 48.20]
        ]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "Point Example",
        "type": "location",
        "description": "This is a sample point location"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [16.372, 48.208]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "name": "LineString Example",
        "type": "route",
        "description": "This is a sample route line"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [16.37, 48.20],
          [16.375, 48.205],
          [16.38, 48.21]
        ]
      }
    }
  ]
};

// Create hover popup elements
const hoverPopupElement = document.createElement('div');
hoverPopupElement.className = 'ol-popup hover-popup';
hoverPopupElement.style.backgroundColor = 'white';
hoverPopupElement.style.padding = '10px';
hoverPopupElement.style.borderRadius = '5px';
hoverPopupElement.style.border = '1px solid #cccccc';
hoverPopupElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
hoverPopupElement.style.position = 'absolute';
hoverPopupElement.style.bottom = '12px';
hoverPopupElement.style.left = '-50px';
hoverPopupElement.style.minWidth = '150px';
hoverPopupElement.style.display = 'none';

// Create click popup elements
const clickPopupElement = document.createElement('div');
clickPopupElement.className = 'ol-popup click-popup';
clickPopupElement.style.backgroundColor = '#2196F3';
clickPopupElement.style.color = 'white';
clickPopupElement.style.padding = '15px';
clickPopupElement.style.borderRadius = '5px';
clickPopupElement.style.border = '1px solid #1976D2';
clickPopupElement.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
clickPopupElement.style.position = 'absolute';
clickPopupElement.style.bottom = '12px';
clickPopupElement.style.left = '-50px';
clickPopupElement.style.minWidth = '200px';
clickPopupElement.style.display = 'none';

// Create close button for click popup
const closeButton = document.createElement('button');
closeButton.innerHTML = '×';
closeButton.style.position = 'absolute';
closeButton.style.top = '5px';
closeButton.style.right = '5px';
closeButton.style.border = 'none';
closeButton.style.background = 'none';
closeButton.style.color = 'white';
closeButton.style.fontSize = '20px';
closeButton.style.cursor = 'pointer';
clickPopupElement.appendChild(closeButton);

// Create popups
const hoverPopup = new Overlay({
  element: hoverPopupElement,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -5]
});

const clickPopup = new Overlay({
  element: clickPopupElement,
  positioning: 'bottom-center',
  stopEvent: true,
  offset: [0, -5]
});

// Create vector source
const vectorSource = new VectorSource({
  features: new GeoJSON().readFeatures(geojsonData, {
    featureProjection: 'EPSG:3857'
  })
});

// Style function for features
function styleFunction(feature) {
  const type = feature.getProperties().type;
  
  switch(type) {
    case 'area':
      return new Style({
        fill: new Fill({
          color: 'rgba(255, 0, 0, 0.2)'
        }),
        stroke: new Stroke({
          color: '#ff0000',
          width: 2
        })
      });
    case 'location':
      return new Style({
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: '#0000ff'
          }),
          stroke: new Stroke({
            color: '#ffffff',
            width: 2
          })
        })
      });
    case 'route':
      return new Style({
        stroke: new Stroke({
          color: '#00ff00',
          width: 3,
          lineDash: [5, 5]
        })
      });
    default:
      return new Style({
        stroke: new Stroke({
          color: '#000000',
          width: 1
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.1)'
        })
      });
  }
}

// Create vector layer
const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: styleFunction
});

// Create map
const map = new Map({
  layers: [
    new TileLayer({source: new OSM()}),
    vectorLayer
  ],
  view: new View({
    center: fromLonLat([16.372, 48.208]),
    zoom: 14
  }),
  target: 'map',
  overlays: [hoverPopup, clickPopup]
});

// Fit view to features
map.getView().fit(vectorSource.getExtent(), {
  padding: [50, 50, 50, 50]
});

// Function to format coordinates
function formatCoordinates(coords) {
  if (!coords) return '';
  
  // Transform coordinates from EPSG:3857 to EPSG:4326 (lat/lon)
  const transformedCoords = transform(coords, 'EPSG:3857', 'EPSG:4326');
  return `
    <div style="margin-bottom: 5px;">
      <strong>Longitude:</strong> ${transformedCoords[0].toFixed(6)}°
    </div>
    <div>
      <strong>Latitude:</strong> ${transformedCoords[1].toFixed(6)}°
    </div>
  `;
}

// Function to format feature coordinates based on geometry type
function getFeatureCoordinates(feature) {
  const geometry = feature.getGeometry();
  const type = geometry.getType();
  
  switch(type) {
    case 'Point':
      return formatCoordinates(geometry.getCoordinates());
    case 'LineString':
      const points = geometry.getCoordinates();
      return `
        <div style="margin-bottom: 10px;"><strong>Line Coordinates:</strong></div>
        ${points.map((point, index) => `
          <div style="margin-bottom: 5px;">
            <strong>Point ${index + 1}:</strong>
            ${formatCoordinates(point)}
          </div>
        `).join('')}
      `;
    case 'Polygon':
      const vertices = geometry.getCoordinates()[0];
      return `
        <div style="margin-bottom: 10px;"><strong>Polygon Vertices:</strong></div>
        ${vertices.map((vertex, index) => `
          <div style="margin-bottom: 5px;">
            <strong>Vertex ${index + 1}:</strong>
            ${formatCoordinates(vertex)}
          </div>
        `).join('')}
      `;
    default:
      return 'Coordinates not available for this geometry type';
  }
}

// Handle pointer movement (hover)
map.on('pointermove', function(evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
    return feature;
  });

  if (feature) {
    const props = feature.getProperties();
    hoverPopupElement.innerHTML = `
      <strong>${props.name}</strong><br>
      <em>${props.type}</em><br>
      ${props.description}
    `;
    hoverPopupElement.style.display = 'block';
    hoverPopup.setPosition(evt.coordinate);
    map.getTargetElement().style.cursor = 'pointer';
  } else {
    hoverPopupElement.style.display = 'none';
    map.getTargetElement().style.cursor = '';
  }
});

// Handle click events
map.on('click', function(evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
    return feature;
  });

  if (feature) {
    const props = feature.getProperties();
    clickPopupElement.innerHTML = `
      <div style="margin-right: 20px;">
        <strong style="font-size: 16px;">${props.name}</strong>
        <div style="margin: 10px 0;">
          ${getFeatureCoordinates(feature)}
        </div>
      </div>
    `;
    closeButton.style.display = 'block';
    clickPopupElement.appendChild(closeButton);
    clickPopupElement.style.display = 'block';
    clickPopup.setPosition(evt.coordinate);
  }
});

// Close button handler
closeButton.addEventListener('click', function() {
  clickPopupElement.style.display = 'none';
});

// Handle mouse leave
map.getViewport().addEventListener('mouseout', function() {
  hoverPopupElement.style.display = 'none';
  map.getTargetElement().style.cursor = '';
});


// Function to load external GeoJSON
function loadGeoJSON(url) {
  fetch(url)
    .then(response => response.json())
    .then(data => {
      vectorSource.clear();
      vectorSource.addFeatures(
        new GeoJSON().readFeatures(data, {
          featureProjection: 'EPSG:3857'
        })
      );
      map.getView().fit(vectorSource.getExtent(), {
        padding: [50, 50, 50, 50]
      });
    })
    .catch(error => console.error('Error loading GeoJSON:', error));
}

// Example usage of loading external GeoJSON:
loadGeoJSON('https://raw.githubusercontent.com/open-indoor/openindoor6/refs/heads/main/examples/autocad/plan.geojson');