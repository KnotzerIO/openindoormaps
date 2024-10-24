import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import {Style, Fill, Stroke, Circle} from 'ol/style';
import {fromLonLat} from 'ol/proj';
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

// Create popup elements
const popupElement = document.createElement('div');
popupElement.className = 'ol-popup';
popupElement.style.backgroundColor = 'white';
popupElement.style.padding = '10px';
popupElement.style.borderRadius = '5px';
popupElement.style.border = '1px solid #cccccc';
popupElement.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
popupElement.style.position = 'absolute';
popupElement.style.bottom = '12px';
popupElement.style.left = '-50px';
popupElement.style.minWidth = '150px';
popupElement.style.display = 'none';

// Create popup overlay
const popup = new Overlay({
  element: popupElement,
  positioning: 'bottom-center',
  stopEvent: false,
  offset: [0, -5]
});

// Create a vector source with GeoJSON data
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
  overlays: [popup]
});

// Fit view to features
map.getView().fit(vectorSource.getExtent(), {
  padding: [50, 50, 50, 50]
});

// Handle pointer movement
map.on('pointermove', function(evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
    return feature;
  });

  if (feature) {
    // Get feature properties
    const props = feature.getProperties();
    
    // Create popup content
    const content = `
      <strong>${props.name}</strong><br>
      <em>${props.type}</em><br>
      ${props.description}
    `;
    
    popupElement.innerHTML = content;
    popupElement.style.display = 'block';
    popup.setPosition(evt.coordinate);
    
    // Change cursor to indicate hoverable
    map.getTargetElement().style.cursor = 'pointer';
  } else {
    // Hide popup when not over feature
    popupElement.style.display = 'none';
    map.getTargetElement().style.cursor = '';
  }
});

// Handle mouse leave from map
map.getViewport().addEventListener('mouseout', function() {
  popupElement.style.display = 'none';
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