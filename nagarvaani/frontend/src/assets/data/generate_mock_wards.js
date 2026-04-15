const fs = require('fs');

const cities = {
  Delhi: { center: [28.6139, 77.2090], name: 'Delhi', prefix: 'Ward' },
  Chennai: { center: [13.0827, 80.2707], name: 'Tamil Nadu', prefix: 'Zone' },
  Jaipur: { center: [26.9124, 75.7873], name: 'Jaipur', prefix: 'Ward' },
  Bangalore: { center: [12.9716, 77.5946], name: 'Bangalore', prefix: 'Ward' },
};

function generateWards(cityKey, config) {
  const features = [];
  const [lat, lng] = config.center;
  const numWards = 6;
  const radius = 0.05; // rough degree size

  for (let i = 0; i < numWards; i++) {
    const angle = (i * 2 * Math.PI) / numWards;
    const nextAngle = ((i + 1) * 2 * Math.PI) / numWards;

    // Create a polygon slice (wedge)
    const coordinates = [[
      [lng, lat],
      [lng + radius * Math.cos(angle), lat + radius * Math.sin(angle)],
      [lng + radius * Math.cos((angle + nextAngle)/2) * 1.1, lat + radius * Math.sin((angle + nextAngle)/2) * 1.1],
      [lng + radius * Math.cos(nextAngle), lat + radius * Math.sin(nextAngle)],
      [lng, lat]
    ]];

    features.push({
      type: "Feature",
      properties: {
        name: `${config.prefix} ${i + 1}`
      },
      geometry: {
        type: "Polygon",
        coordinates: coordinates
      }
    });
  }

  const geojson = {
    type: "FeatureCollection",
    features: features
  };

  fs.writeFileSync(
    `c:/Users/awwab/Desktop/NagarVaani/nagarvaani/frontend/src/assets/data/${cityKey.toLowerCase()}_wards.json`,
    JSON.stringify(geojson, null, 2)
  );
  console.log(`Generated ${cityKey.toLowerCase()}_wards.json`);
}

Object.keys(cities).forEach(key => {
  generateWards(key, cities[key]);
});
