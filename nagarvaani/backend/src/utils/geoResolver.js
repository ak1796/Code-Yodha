const { citiesConfig } = require('../lib/citiesConfig');

/**
 * Normalizes ward names for matching
 */
const normalizeWard = (v) => {
    if (!v) return "";
    let s = String(v).trim().toLowerCase();
    s = s.replace(/^ward\s*[- ]*/, "");
    if (s.includes('/')) return s;
    return s.split(/[ \((]/)[0];
};

/**
 * Haversine distance function (km)
 */
function haversineKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Resolves City and Ward based on precise GPS coordinates
 * Uses proximity to known city centers from citiesConfig
 */
exports.resolveJurisdiction = (lat, lng, providedCity, providedWard) => {
    let resolvedCity = providedCity;
    let resolvedWard = providedWard;

    // 1. Resolve City via Proximity (Max 100km radius)
    if (!resolvedCity && lat && lng) {
        let bestCity = null;
        let minDistance = 100; // Max 100km

        for (const [cityName, config] of Object.entries(citiesConfig)) {
            const dist = haversineKm(lat, lng, config.center[0], config.center[1]);
            if (dist < minDistance) {
                minDistance = dist;
                bestCity = cityName;
            }
        }
        
        if (bestCity) {
            resolvedCity = bestCity;
            console.log(`📍 GPS Proximity Match: Resolved to ${resolvedCity} (${minDistance.toFixed(1)}km from center)`);
        }
    }

    // 2. Resolve Ward via Proximity to Ward Offices (if ward is unknown)
    if (resolvedCity && !resolvedWard && lat && lng) {
        const cityConfig = citiesConfig[resolvedCity];
        if (cityConfig && cityConfig.offices) {
            let bestWard = null;
            let minWardDist = 5; // Max 5km from a ward office to auto-assign that ward

            for (const [wardName, office] of Object.entries(cityConfig.offices)) {
                const dist = haversineKm(lat, lng, office.lat, office.lng);
                if (dist < minWardDist) {
                    minWardDist = dist;
                    bestWard = wardName;
                }
            }
            
            if (bestWard) {
                resolvedWard = bestWard;
                console.log(`🏢 Ward Office Proximity: Resolved to ${resolvedWard} (${minWardDist.toFixed(1)}km from office)`);
            }
        }
    }

    return {
        city: resolvedCity || "Universal Node",
        ward: resolvedWard || "Unmapped Sector"
    };
};
