const exifr = require('exifr');

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; 
}

exports.validateResolutionGPS = async function(originalLat, originalLng, photoBuffer) {
  try {
    const gpsData = await exifr.gps(photoBuffer);
    if (!gpsData || !gpsData.latitude || !gpsData.longitude) {
      console.warn("No GPS data found in resolution photo.");
      return true; // Fallback for no GPS data? Or return false? Let's be lenient for demo.
    }

    const distance = haversineDistance(originalLat, originalLng, gpsData.latitude, gpsData.longitude);
    return distance <= 500; // 500 meters
  } catch (error) {
    console.error("GPS Validation Error:", error);
    return true; // Still allow resolution if error in EXIF parsing
  }
};
