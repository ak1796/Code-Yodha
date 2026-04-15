// urgencyScorer.js

function computeLocationImpact(lat, lng) {
  // Mock logic: Check if location is in known dense "hotspot" zones
  // For demo, return a random score between 0.1 and 1.0
  return Math.random() * 0.9 + 0.1;
}

exports.computePriorityScore = async function({ keywordScore, sentimentScore, clusterSize, lat, lng }) {
  const clusterSizeScore = Math.min(clusterSize / 50, 1.0); // Normalize: 50+ = max
  const locationImpactScore = computeLocationImpact(lat, lng); 

  const raw = (keywordScore * 0.3) + (sentimentScore * 0.2) +
              (clusterSizeScore * 0.3) + (locationImpactScore * 0.2);

  return Math.min(5, Math.max(1, Math.round(raw * 5)));
};
