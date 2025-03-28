//Déclaration de valeurs
let circle;

mapboxgl.accessToken =
  "pk.eyJ1Ijoid2VtYWRleWEiLCJhIjoiY2xzYzI2cXJwMDg2eTJtbWhnZGt0NHEwMiJ9.wa4jCE_DBLiNKSuNUTOpHQ";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/wemadeya/clqcioya500b201qr8m6v1wsr",
  center: [2.339294, 46.8],
  zoom: 5,
});

// Gestion des cookies
document.addEventListener('DOMContentLoaded', function() {
  const cookieSettingsButton = document.getElementById("cookie-settings-button");

  if (cookieSettingsButton) {
    cookieSettingsButton.style.display = "none";
  }

  if (localStorage.getItem("cookiesChoice") === null) {
    createConsentUI();
  } else {
    initMap();
    applyUserPreferences();
  }

  cookieSettingsButton?.addEventListener("click", openCookiePreferences);
});

function createConsentUI() {
  const overlay = document.createElement("div");
  overlay.className = "cookie-consent-overlay";

  const consentPopup = document.createElement("div");
  consentPopup.id = "cookie-consent-popup";
  consentPopup.innerHTML = `
    <div class="cookie-consent-content">
      <h2>Bienvenue sur notre carte interactive</h2>
      <p>Ce site utilise des cookies pour améliorer votre expérience et nous permettre d'analyser son utilisation.</p>
      <p>Vous pouvez personnaliser vos préférences ou accepter tous les cookies pour une expérience optimale.</p>
      <div class="cookie-consent-buttons">
        <button id="customize-cookies" class="btn-outline">Personnaliser mes préférences</button>
        <button id="accept-cookies" class="btn-primary">Tout accepter</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.appendChild(consentPopup);

  document.getElementById("accept-cookies").addEventListener("click", () => {
    saveUserChoice({essential: true, analytics: true, marketing: true});
  });

  document.getElementById("customize-cookies").addEventListener("click", () => {
    removeConsentUI();
    openCookiePreferences();
  });
}

function removeConsentUI() {
  const overlay = document.querySelector(".cookie-consent-overlay");
  if (overlay) {
    overlay.remove();
  }
}

function saveUserChoice(preferences) {
  localStorage.setItem("cookiePreferences", JSON.stringify(preferences));
  localStorage.setItem("cookiesChoice", "made");

  removeConsentUI();

  initMap();
  applyUserPreferences();
}

function applyUserPreferences() {
  const cookiePreferences = getUserPreferences();

  const cookieSettingsButton = document.getElementById("cookie-settings-button");
  if (cookieSettingsButton) {
    cookieSettingsButton.style.display = "flex";
  }

  if (cookiePreferences.analytics || cookiePreferences.marketing) {
    updateGoogleConsent(cookiePreferences);
    loadGoogleTags();
  }
}

function getUserPreferences() {
  return JSON.parse(localStorage.getItem("cookiePreferences")) || {
    essential: true,
    analytics: false,
    marketing: false
  };
}

function openCookiePreferences() {
  const modal = document.getElementById("cookie-preferences-modal");
  if (!modal) return;

  modal.style.display = "flex";

  const preferences = getUserPreferences();

  if (document.getElementById("cookie-essential")) {
    document.getElementById("cookie-essential").checked = preferences.essential;
  }
  if (document.getElementById("cookie-analytics")) {
    document.getElementById("cookie-analytics").checked = preferences.analytics;
  }
  if (document.getElementById("cookie-marketing")) {
    document.getElementById("cookie-marketing").checked = preferences.marketing;
  }
}

function closeCookiePreferences() {
  const modal = document.getElementById("cookie-preferences-modal");
  if (modal) {
    modal.style.display = "none";
  }
}

function saveCookiePreferences() {
  const preferences = {
    essential: true,
    analytics: document.getElementById("cookie-analytics")?.checked || false,
    marketing: document.getElementById("cookie-marketing")?.checked || false
  };

  saveUserChoice(preferences);
  closeCookiePreferences();
}

function updateGoogleConsent(preferences) {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'update', {
    'ad_storage': preferences.marketing ? 'granted' : 'denied',
    'analytics_storage': preferences.analytics ? 'granted' : 'denied',
    'ad_user_data': preferences.marketing ? 'granted' : 'denied',
    'ad_personalization': preferences.marketing ? 'granted' : 'denied'
  });
}

function loadGoogleTags() {
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    const gtmScript = document.createElement("script");
    gtmScript.src = "https://www.googletagmanager.com/gtag/js?id=G-VLY31TFTPC";
    gtmScript.async = true;
    document.head.appendChild(gtmScript);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-VLY31TFTPC');
  }
}

// Si l'utilisateur est sur un appareil mobile, ajuster le zoom
if (isMobileDevice()) {
  map.setZoom(4); 
}

// Fonction pour récupérer les données de l'API
async function fetchStations() {
  try {
    const apiUrl = `https://plateforme.wemadeya.fr/api/stations`; 
    const response = await fetch(apiUrl);
    return await response.json();
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
    if (marker.properties.status === "Active") {
      el.style.backgroundImage = "url(https://fillupmedia.fr/wp-content/uploads/2024/01/icon_location-blue.svg)";
      
    } else {
      el.style.backgroundImage = "url(https://fillupmedia.fr/wp-content/uploads/2024/06/icon-orange.svg)";
    }
    el.className = "marker";

    new mapboxgl.Marker(el).setLngLat(marker.geometry.coordinates).addTo(map);

    // Créer une card
    const statusColor = marker.properties.status === "Active" ? "color: #4DBDC6; background: rgba(77, 189, 198, 0.20);" : " color: #BD9700; background: rgba(252, 212, 52, 0.20);";
    const regex = /65/;
    const serviceTitle = regex.test(marker.properties.tailleEcran) ? "Galerie marchande" : "Station-service";

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
                              <h3 class="service">${serviceTitle}</h3>
                              <p class="statut" style="${statusColor}">${marker.properties.status}</p>
                          </div>
                          <div class="card_content_wrapper">                              
                              <div class="card_content">
                                  <div>
                                      <p class="text-grey">Enseigne</p>
                                      <p>${marker.properties.enseigne}</p>
                                  </div>
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
                                          <p class="text-grey">Nombre d'écrans</p>
                                          <p>${marker.properties.nombreEcran}</p>
                                      </div>
                                      <div>
                                          <p class="text-grey">Taille</p>
                                          <p>${marker.properties.tailleEcran}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          <button class="devis-card" onclick="showDevisMarker()">Demander un devis</button>
                      </div>
                  </div>
                  `;

    // Gérer l'événement de clic sur le marqueur
    el.addEventListener("click", () => {
      const [longitude, latitude] = marker.geometry.coordinates;
      const adjustedLatitude = latitude - 0.005; 
      map.flyTo({
        center: [longitude, adjustedLatitude],
        zoom: 14,
        speed: 1.2,
        curve: 1.4,
        essential: true 
      });

      if (window.innerWidth <= 768) {
        const mobileCard = document.querySelector(".mobile_card");
        const maskMap = document.querySelector(".mask_map");
        const settings = document.querySelector(".settings");
        const form = document.querySelector(".settings.formulaire");

        mobileCard.innerHTML = card;
        mobileCard.style.display = "block";
        settings.style.display = "none";
        form.style.display = "none"; 
        maskMap.classList.add("anim-mask_map");

        // Écouter les événements mousedown
        document.addEventListener("mousedown", (event) => {
          // Si le clic a été effectué sur .close ou .mask_map
          if (
            event.target.closest(".close_wrapper") ||
            event.target.closest(".mask_map")
          ) {
            mobileCard.classList.remove("anim-y");
            mobileCard.style.display = "none";
            settings.style.display = "block";
            maskMap.classList.remove("anim-mask_map");
          }
        });
      } else {
        const allMarkers = document.querySelectorAll(".marker");
        allMarkers.forEach(function (marker) {
          marker.style.zIndex = "0";
          marker.innerHTML = "";
        });

        el.style.zIndex = "800";
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
  const address = document.getElementById("search").value;
  const radius = document.getElementById("distance").value;

  const geocodeUrl =
      "https://nominatim.openstreetmap.org/search.php?q=" +
      encodeURIComponent(address) +
      "&format=jsonv2";

  fetch(geocodeUrl)
    .then((response) => response.json())
    .then((data) => {
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

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

function isMobileDevice() {
  return /Mobi|Android/i.test(navigator.userAgent);
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

  const radiusInMeters = radius * 1000;

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
  const bounds = calculateBounds([lon, lat], radiusInMeters);
  const fitOptions = {padding: 50};

  if (isMobileDevice()) {
    fitOptions.padding = 100;
    fitOptions.maxZoom = 10;
}

map.fitBounds(bounds, fitOptions);
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
  const query = document.getElementById("search").value;
  if (query.length < 3) {
    // Déclecher la recherche uniquement si l'utilisateur a saisi au moins 3 caractères
    document.getElementById("addressSuggestions").style.display = "none";
    return;
  }

  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
      query
  )}&limit=5&autocomplete=1`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      const suggestions = data.features;
      const suggestionsContainer = document.getElementById("addressSuggestions");
      suggestionsContainer.innerHTML = "";
      suggestions.forEach((suggestion) => {
        const div = document.createElement("div");
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
  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = "<span class='popup'>Vous êtes ici</span>";

  new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
});

// Gestion du hover du point central
map.on("mouseenter", "center-point", function () {
  map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "center-point", function () {
  map.getCanvas().style.cursor = "";
});

// Fonction qui affiche le formulaire au clic sur le bouton "Rechercher" en desktop
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

// Fonction qui cache le formulaire au clic sur la croix en desktop
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

//Fonction qui affiche le bouton devis en desktop
function showDevisBtn() {
  const element = document.getElementById("searchAdress-mobile");
  const searchvalue = document.getElementById("search");

  if (element && searchvalue && searchvalue.value !== "") {
    element.style.width = "49%";
  }
}

//Fonction qui affiche le formulaire en mobile
function showDevis() {
  const element = document.querySelector(".settings.formulaire");
  const settings = document.querySelector(".settings");
  const searchvalue = document.getElementById("search");

  if (element && searchvalue && searchvalue.value !== "") {
    element.style.display = "block";
    settings.style.display = "none";
  }
}

//Fonction qui cache le formulaire en mobile avec le bouton dans le marqueur
function showDevisMarker() {
  const element = document.querySelector(".settings.formulaire");
  const settings = document.querySelector(".settings");
  const mobileCard = document.querySelector(".mobile_card");
  const maskMap = document.querySelector(".mask_map");

  if (element) {
    settings.style.display = "none";
    mobileCard.style.display = "none";
    maskMap.classList.remove("anim-mask_map");
    element.style.display = "block";
  }
}

function hideFormMobile() {
  const element = document.querySelector(".settings.formulaire");
  const settings = document.querySelector(".settings");

  if (element) {
    element.style.display = "none";
    settings.style.display = "block";
  }
}

const message = {
  name: "Le champ doit contenir au moins 2 caractères.",
  name2: "Le champ contient des caractères non valides.",
  email: "L'email est requis.",
  email2: "L'email n'est pas valide.",
  quantity: "Le nombre doit être compris entre 1 et 99.",
  conditions: "Vous devez accepter les conditions.",
  enseigne: "L'enseigne est requise.",
  zip: "Le code postal est requis et doit être valide.",
  phone: "Le numéro de téléphone est requis et doit être valide.",
  consentement: "Vous devez accepter la politique de confidentialité."
};

// Regex pour la validation
const regexName = /^[a-zA-Z\s]+$/;
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const regexZip = /^\d{5}$/;
const regexPhone = /^\d{10}$/;

// Ajoute l'erreur
function addError(element, message) {
  const errorElement = document.getElementById(`error-${element.id}`);
  errorElement.textContent = message;
}

// Enlève l'erreur
function removeError(element) {
  const errorElement = document.getElementById(`error-${element.id}`);
  errorElement.textContent = "";
}

// Vérifie lastname
function checkLastName(lastname, message) {
  if (lastname.value.length < 2 || !lastname.value.match(regexName)) {
    addError(lastname, message.name);
    return false;
  } else {
    removeError(lastname);
  }
  return true;
}

// Vérifie firstname
function checkFirstName(firstname, message) {
  if (firstname.value.length < 2 || !firstname.value.match(regexName)) {
    addError(firstname, message.name);
    return false;
  } else {
    removeError(firstname);
  }
  return true;
}

// Vérifie email
function checkEmail(email, message) {
  if (!email.value || !email.value.match(regexEmail)) {
    addError(email, message.email2);
    return false;
  } else {
    removeError(email);
  }
  return true;
}

// Vérifie company
function checkCompany(company, message) {
  if (company.value.trim() === "") {
    addError(company, message.enseigne);
    return false;
  } else {
    removeError(company);
  }
  return true;
}

// Vérifie zip
function checkZip(zip, message) {
  if (!zip.value.match(regexZip)) {
    addError(zip, message.zip);
    return false;
  } else {
    removeError(zip);
  }
  return true;
}

// Vérifie phone
function checkPhone(phone, message) {
  if (!phone.value.match(regexPhone)) {
    addError(phone, message.phone);
    return false;
  } else {
    removeError(phone);
  }
  return true;
}

// Vérifie consentement
function checkConsentement(consentement, message) {
  if (!consentement.checked) {
    addError(consentement, message.consentement);
    return false;
  } else {
    removeError(consentement);
  }
  return true;
}

// Ajoute un événement aux inputs du formulaire
document.getElementById("lastname").addEventListener('change', () => { checkLastName(document.getElementById("lastname"), message) });
document.getElementById("firstname").addEventListener('change', () => { checkFirstName(document.getElementById("firstname"), message) });
document.getElementById("email").addEventListener('change', () => { checkEmail(document.getElementById("email"), message) });
document.getElementById("company").addEventListener('change', () => { checkCompany(document.getElementById("company"), message) });
document.getElementById("zip").addEventListener('change', () => { checkZip(document.getElementById("zip"), message) });
document.getElementById("phone").addEventListener('change', () => { checkPhone(document.getElementById("phone"), message) });
document.getElementById("consentement").addEventListener('change', () => { checkConsentement(document.getElementById("consentement"), message) });

// Ajoute un événement au submit du formulaire
document.getElementById("formulaire").addEventListener("submit", function (event) {
  event.preventDefault();

  const lastname = document.getElementById("lastname");
  const firstname = document.getElementById("firstname");
  const company = document.getElementById("company");
  const zip = document.getElementById("zip");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const consentement = document.getElementById("consentement");

  const isCheckedLastName = checkLastName(lastname, message);
  const isCheckedFirstName = checkFirstName(firstname, message);
  const isCheckedEmail = checkEmail(email, message);
  const isCheckedCompany = checkCompany(company, message);
  const isCheckedZip = checkZip(zip, message);
  const isCheckedPhone = checkPhone(phone, message);
  const isCheckedConsentement = checkConsentement(consentement, message);

  if (isCheckedLastName && isCheckedFirstName && isCheckedEmail && isCheckedCompany && isCheckedZip && isCheckedPhone && isCheckedConsentement) {
    const url = `https://plateforme.wemadeya.fr/api/submit-form`;

    const formData = {
      lastname: lastname.value,
      firstname: firstname.value,
      company: company.value,
      zip: zip.value,
      email: email.value,
      phone: phone.value,
      consentement: consentement.checked ? "true" : "false"
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
      console.log("Success:", data);
      showPopup("Merci de l’intérêt que vous portez pour nos services ! Nous avons bien reçu votre demande de devis et reviendrons vers vous dans les plus brefs délais.");
      hideForm();
      mainBlock();
      document.getElementById("formulaire").reset();
    })
    .catch((error) => {
      console.error("Erreur:", error);
    });
  } else {
    document.getElementById("error-message").style.display = "block";
  }
});

function showPopup(message) {
  document.getElementById("popupContent").innerText = message;
  document.getElementById("popupOverlay").style.display = "block";
  document.getElementById("popupMessage").style.display = "block";
}

function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
  document.getElementById("popupMessage").style.display = "none";
}

function mainBlock() {
  document.querySelector(".settings").style.display = "block";
}