const map = L.map('map').setView([47.47, -94.88], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

let parcelIndex = new rbush();
let parcels = [];
let publicLand = [];

async function loadData() {
  parcels = await fetch('parcels.geojson').then(r => r.json());
  publicLand = await fetch('public_land.geojson').then(r => r.json());

  parcels.features.forEach(feature => {
    const bbox = turf.bbox(feature);
    parcelIndex.insert({
      minX: bbox[0],
      minY: bbox[1],
      maxX: bbox[2],
      maxY: bbox[3],
      feature: feature
    });
  });
}

function updateStatus(text, color) {
  const banner = document.getElementById('statusBanner');
  banner.innerText = text;
  banner.style.background = color;
}

function checkLocation(lat, lng) {
  const point = turf.point([lng, lat]);

  for (let pub of publicLand.features) {
    if (turf.booleanPointInPolygon(point, pub)) {
      updateStatus("🟢 PUBLIC LAND", "green");
      navigator.vibrate?.(100);
      return;
    }
  }

  const results = parcelIndex.search({
    minX: lng,
    minY: lat,
    maxX: lng,
    maxY: lat
  });

  for (let r of results) {
    if (turf.booleanPointInPolygon(point, r.feature)) {
      const owner = r.feature.properties.OWNER_NAME || "Private";
      updateStatus("🔴 PRIVATE LAND\n" + owner, "red");
      navigator.vibrate?.(200);
      return;
    }
  }

  updateStatus("⚪ UNKNOWN LAND", "gray");
}

navigator.geolocation.watchPosition(pos => {
  const { latitude, longitude } = pos.coords;
  map.setView([latitude, longitude]);
  checkLocation(latitude, longitude);
}, err => alert(err.message), {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 5000
});

loadData();
