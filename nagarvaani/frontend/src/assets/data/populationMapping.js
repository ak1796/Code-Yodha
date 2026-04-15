/**
 * Census-linked population mapping for NagarVaani
 * Data source: Synthesized from Census 2011 Primary Census Abstract
 * and 2024 urban growth projections.
 */

export const populationMapping = {
  "Mumbai": {
    "growthFactor": 1.12, // 12% growth since 2011
    "wards": {
      "A": 185014,
      "B": 127290,
      "C": 166115,
      "D": 346081,
      "E": 393286,
      "F/S": 360972,
      "G/S": 622249,
      "F/N": 529303,
      "G/N": 599303, // Dharavi Area
      "N": 619556,
      "R/C": 563226,
      "S": 743783,
      "T": 341134,
      "K/W": 748688,
      "R/N": 430353,
      "M/E": 807720, // Govandi Area
      "M/W": 411983,
      "H/E": 580835,
      "K/E": 823136,
      "P/S": 463507,
      "P/N": 941366,
      "R/S": 691227,
      "H/W": 307581,
      "L": 902227
    }
  },
  "Delhi": {
    "growthFactor": 1.25, // Rapid growth in periphery
    "avgPerWard": 75000,
    "wards": {
      // Sample specific high-density wards
      "Najafgarh": 85000,
      "Rohini": 92000,
      "Dwarka": 88000
    }
  },
  "Bangalore": {
    "growthFactor": 1.45, // Extreme growth
    "avgPerWard": 55000,
    "wards": {
      "Arakere": 62000,
      "Bellandur": 85000,
      "HSR Layout": 58000
    }
  },
  "Chennai": {
    "growthFactor": 1.18,
    "avgPerWard": 45000,
    "wards": {}
  }
};

/**
 * Calculates current estimated population for a ward
 */
export const getEstimatedPopulation = (cityName, wardName) => {
  const city = populationMapping[cityName];
  if (!city) return 50000; // Default estimate

  const baseline = city.wards[wardName] || city.avgPerWard || 50000;
  return Math.round(baseline * city.growthFactor);
};
