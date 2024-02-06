//Déclaration de valeurs
var circle;
let dynamicPositionEnabled = true;

mapboxgl.accessToken =
  "pk.eyJ1Ijoid2VtYWRleWEiLCJhIjoiY2xyeXZ5YTYwMW14OTJqbXgwZnp5Z3BpdSJ9.trZNiFTA3H8er9j1UIxKLw";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/wemadeya/clqcioya500b201qr8m6v1wsr",
  center: [2.339294, 48.963199],
  zoom: 5,
});

// Fonction pour récupérer les données de l'API
async function fetchStations() {
  try {
    const apiUrl = `https://fum7.egiteko.com/api/maps_website?token=wemadeya_token`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.atts[0].stations_all;
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
}

// Fonction pour initialiser la carte avec les données de l'API
async function initMap() {
  const stations = await fetchStations();

  const geojson = {
    features: stations.map((station) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [station.lng, station.lat] },
      properties: {
        icon: station.icon,
        idType: station.id_type,
        idObje: station.id_obje,
        titre: station.titre.replace(/<br>/g, " ").replace(/<[^>]+>/g, ""),
        iconSize: [20, 25],
        message: station.titre.replace(/<br>/g, " ").replace(/<[^>]+>/g, ""),
      },
    })),
  };

  // Ajouter des marqueurs à la carte
  for (const marker of geojson.features) {
    const el = document.createElement("div");
    el.className = "marker";
    el.style.backgroundImage = `url(https://fillupmedia.fr/wp-content/uploads/2024/01/icon_location-blue.svg)`;
    el.style.width = marker.properties.iconSize[0] + "px";
    el.style.height = marker.properties.iconSize[1] + "px";
    el.style.backgroundSize = "100%";

    el.addEventListener("click", () => {
      window.alert(marker.properties.message);
    });

    new mapboxgl.Marker(el).setLngLat(marker.geometry.coordinates).addTo(map);
  }
}

// Appeler la fonction pour initialiser la carte
initMap();

// Fonction pour mettre à jour le kilometrage
function updateDistanceValue(value) {
  document.getElementById("distanceValue").textContent = value;
}

window.onload = function () {
  updateDistanceValue(document.getElementById("distance").value);
};

//fonction pour chercher une adresse et mettre à jour la carte
function findLocationAndUpdateMap() {
  var address = document.getElementById("search").value;
  var radius = document.getElementById("distance").value;

  var geocodeUrl =
    "https://nominatim.openstreetmap.org/search.php?q=" +
    encodeURIComponent(address) +
    "&format=jsonv2";

  fetch(geocodeUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        var lat = parseFloat(data[0].lat);
        var lon = parseFloat(data[0].lon);

        updateMapWithStations(lat, lon, radius);
      } else {
        alert("Adresse introuvable");
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données:", error);
      alert("Erreur lors de la recherche de l'adresse");
    });
}

// Fonction pour convertir les mètres en pixels au niveau de zoom maximal
const metersToPixelsAtMaxZoom = (meters, latitude) =>
  meters / 0.075 / Math.cos((latitude * Math.PI) / 180);

// Fonction pour créer un cercle en fonction des coordonnées et du rayon
function updateMapWithStations(lat, lon, radius) {
  if (map.getLayer("circle")) {
    map.removeLayer("circle");
    map.removeSource("circle");
  }
  if (map.getSource("center-point")) {
    map.removeLayer("center-point");
    map.removeSource("center-point");
  }

  var radiusInMeters = radius * 1000;

  // Ajoutez une source et un layer pour le cercle
  map.addSource("circle", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
        },
      ],
    },
  });

  map.addLayer({
    id: "circle",
    type: "circle",
    source: "circle",
    paint: {
      "circle-radius": {
        stops: [
          [0, 0],
          [20, metersToPixelsAtMaxZoom(radiusInMeters, lat)],
        ],
        base: 2,
      },
      "circle-color": "#fff",
      "circle-opacity": 0.4,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 2,
    },
  });

  // Ajouter une source et une couche pour le point central
  map.addSource("center-point", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
    },
  });

  map.addLayer({
    id: "center-point",
    type: "circle",
    source: "center-point",
    paint: {
      "circle-radius": 6,
      "circle-color": "#fff",
      "circle-opacity": 0.8,
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 3,
    },
  });

  // Ajuster le zoom et le centre de la carte pour inclure le cercle entièrement
  var bounds = calculateBounds([lon, lat], radiusInMeters);
  map.fitBounds(bounds, { padding: 50 });
}

// Fonction simplifiée pour calculer les limites d'un cercle sans Turf.js
function calculateBounds(center, radius) {
  const lat = center[1];
  const lon = center[0];
  const radiusInDegrees = radius / 111320;

  const southWest = [lon - radiusInDegrees, lat - radiusInDegrees];
  const northEast = [lon + radiusInDegrees, lat + radiusInDegrees * 1.2];

  return [southWest, northEast];
}

// Fonction pour afficher une suggestion d'adresses
function suggestAddress() {
  var query = document.getElementById("search").value;
  if (query.length < 3) {
    // Déclecher la recherche uniquement si l'utilisateur a saisi au moins 3 caractères
    document.getElementById("addressSuggestions").style.display = "none";
    return;
  }

  var url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
    query
  )}&limit=5&autocomplete=1`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      var suggestions = data.features;
      var suggestionsContainer = document.getElementById("addressSuggestions");
      suggestionsContainer.innerHTML = "";
      suggestions.forEach((suggestion) => {
        var div = document.createElement("div");
        div.innerHTML = suggestion.properties.label;
        div.className = "suggestion-item";
        div.onclick = function () {
          document.getElementById("search").value = suggestion.properties.label;
          suggestionsContainer.style.display = "none";
        };
        suggestionsContainer.appendChild(div);
      });
      if (suggestions.length > 0) {
        suggestionsContainer.style.display = "block";
      } else {
        suggestionsContainer.style.display = "none";
      }
    })
    .catch((error) => {
      console.error("Error fetching the address suggestions:", error);
    });
}

// Cacher les suggestions d'adresses lorsqu'on clique en dehors de la zone de recherche
document.onclick = function (e) {
  if (!e.target.matches("#search")) {
    document.getElementById("addressSuggestions").style.display = "none";
  }
};

// afficher une popup lorsqu'on clique sur le point central
map.on("click", "center-point", function (e) {
  var coordinates = e.features[0].geometry.coordinates.slice();
  var description = "<span class='popup'>Vous êtes ici</span>";

  new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
});

// Gestion du hover du point central
map.on("mouseenter", "center-point", function () {
  map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "center-point", function () {
  map.getCanvas().style.cursor = "";
});

// Fonction qui ajuste le `top` de .settings.formulaire dynamiquement
function adjustFormPosition() {
  const element = document.querySelector(".settings.formulaire");
  if (!element || !dynamicPositionEnabled) return;

  if (window.innerWidth <= 550) {
    element.style.top = "-33%";
  } else if (window.innerWidth <= 768) {
    element.style.top = "0";
  } else {
    element.style.top = "105%";
  }
}

// Fonction qui affiche le formulaire au clic sur le bouton "Rechercher"
function showForm() {
  const element = document.querySelector(".settings.formulaire");
  const searchvalue = document.getElementById("search");

  if (element && searchvalue && searchvalue.value !== "") {
    element.style.opacity = "1";
    element.style.top = "105%";
  }
}

// Fonction qui cache le formulaire au clic sur la croix
function hideForm() {
  const element = document.querySelector(".settings.formulaire");

  if (element) {
    element.style.opacity = "0";
    element.style.top = "0";
  }
}

//Fonction qui affiche le bouton devis
function showDevisBtn() {
  const element = document.getElementById("button-mobile");
  const searchvalue = document.getElementById("search");

  if (element && searchvalue && searchvalue.value !== "") {
    element.style.width = "49%";
  }
}

//Fonction qui affiche le formulaire en mobile
function showDevis() {
  const element = document.querySelector(".settings.formulaire");
  const searchvalue = document.getElementById("search");

  if (element && searchvalue && searchvalue.value !== "") {
    element.style.opacity = "1";
    enableDynamicPosition();
  }
}

function hideFormMobile() {
  const element = document.querySelector(".settings.formulaire");

  if (element) {
    element.style.top = "105%";
    element.style.opacity = "0";
    dynamicPositionEnabled = false;
  }
}

// Réactiver le comportement dynamique lors de l'ouverture à nouveau
function enableDynamicPosition() {
  dynamicPositionEnabled = true;
  adjustFormPosition();
}

window.addEventListener("resize", adjustFormPosition);
