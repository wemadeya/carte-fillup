//Déclaration de valeurs
var circle;
let dynamicPositionEnabled = true;

mapboxgl.accessToken =
  "pk.eyJ1Ijoid2VtYWRleWEiLCJhIjoiY2xzYzI2cXJwMDg2eTJtbWhnZGt0NHEwMiJ9.wa4jCE_DBLiNKSuNUTOpHQ";

var map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/wemadeya/clqcioya500b201qr8m6v1wsr",
  center: [2.339294, 48.963199],
  zoom: 5,
});

// Fonction pour récupérer les données de l'API
async function fetchStations() {
  try {
    const apiUrl = `https://plateforme.wemadeya.fr/api/stations`; 
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data;
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
        enseigne: station.enseigne,
        codePostal: station.CP,
        adresse: station.Adr,
        tailleEcran: station.taille_ecran,
        nombreEcran: station.nombre_ecran,
        status: station.statut_nom,
        iconSize: [20, 25],
      },
    })),
  };

  // Ajouter les marqueurs à la carte
  geojson.features.forEach((marker) => {
    // Créer un élément DOM pour chaque marqueur
    const el = document.createElement("div");
    // Ajoutez la class marker
    el.className = "marker";

    new mapboxgl.Marker(el).setLngLat(marker.geometry.coordinates).addTo(map);

    // Créer une card
    const card = `
                  <div class="card">
                      <div class="triangle_wrapper">
                          <img class="triangle" src="https://fillupmedia.fr/wp-content/uploads/2024/01/triangle.svg" alt="">
                      </div>                                                                   
                      <div class="card_wrapper">
                          <div class="close_wrapper">
                              <p>Fermer</p> 
                              <img class="close" src="https://fillupmedia.fr/wp-content/uploads/2024/02/Close.svg" alt="icon close">
                          </div>
                          <div class="service_wrapper">
                              <h3 class="service">Station service</h3>
                              <p class="statut">${marker.properties.status}</p>
                          </div>
                          <div class="ecran_wrapper">
                              <img class="ecran" src="https://fillupmedia.fr/wp-content/uploads/2024/01/large-ecran.png" alt="photo ecran">
                              <img class="ecran" src="https://fillupmedia.fr/wp-content/uploads/2024/01/small-ecran.png" alt="photo ecran">
                          </div>
                          <div class="card_content_wrapper">                              
                              <div class="card_content">
                                  <div>
                                      <p class="text-grey">Adresse</p>
                                      <p>${marker.properties.adresse}</p>
                                  </div>
                                  <div>
                                      <p class="text-grey">Code postal</p>
                                      <p>${marker.properties.codePostal}</p>
                                  </div>
                              </div>
                              <div class="card_content">
                                  <div class="flex">                               
                                      <div>
                                          <p class="text-grey">Nombre écran</p>
                                          <p>${marker.properties.nombreEcran}</p>
                                      </div>
                                      <div>
                                          <p class="text-grey">Taille</p>
                                          <p>${marker.properties.tailleEcran}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <a class="devis-card" href="">Demander un devis</a>
                      </div>
                  </div>
                  `;

    // Gérer l'événement de clic sur le marqueur
    el.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        const mobileCard = document.querySelector(".mobile_card");
        const maskMap = document.querySelector(".mask_map");

        mobileCard.innerHTML = card;
        mobileCard.classList.add("anim-y");
        maskMap.classList.add("anim-mask_map");

        // Écouter les événements mousedown
        document.addEventListener("mousedown", (event) => {
          // Si le clic a été effectué sur .close ou .mask_map
          if (
            event.target.closest(".close_wrapper") ||
            event.target.closest(".mask_map")
          ) {
            mobileCard.classList.remove("anim-y");
            maskMap.classList.remove("anim-mask_map");
          }
        });
      } else {
        const allMarkers = document.querySelectorAll(".marker");
        allMarkers.forEach(function (marker) {
          marker.style.zIndex = "0";
          marker.innerHTML = "";
        });

        el.style.zIndex = "999";
        el.innerHTML = card;

        // Écouter les événements mousedown sur le document entier
        document.addEventListener("mousedown", (event) => {
          // Vérifier si le clic a été effectué en dehors du marqueur
          if (
            !event.target.closest(".marker") ||
            event.target.closest(".close_wrapper")
          ) {
            // Supprimer la classe 'block' de l'élément actuel s'il existe
            event.stopPropagation();
            // Efface le contenu de `el`
            el.innerHTML = "";
          }
        });
      }
    });
  });
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
    setTimeout(() => {
      element.style.top = "105%";
      element.style.opacity = "1";
    }, 200);
    element.style.opacity = "0";
    element.style.display = "block";
  }
}

// Fonction qui cache le formulaire au clic sur la croix
function hideForm() {
  const element = document.querySelector(".settings.formulaire");

  if (element) {
    element.style.opacity = "0";
    element.style.top = "0";
    setTimeout(() => {
      element.style.display = "none";
    }, 200);
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


// Formulaire de demande de devis
document
  .getElementById("formulaire")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    var url = `https://plateforme.wemadeya.fr/api/submit-form`;

    const formData = {
      lastname: document.getElementById("lastname").value,
      firstname: document.getElementById("firstname").value,
      company: document.getElementById("company").value,
      zip: document.getElementById("zip").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      consent: document.getElementById("consent").checked ? "true" : "false"
    };

    fetch(url, {
      method: "POST",
      body: JSON.stringify(formData),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
      })
      .catch((error) => {
        console.error("Erreur:", error);
      });
  });
