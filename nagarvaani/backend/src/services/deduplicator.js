const { supabase } = require('../lib/supabase');

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

  return R * c; // in meters
}

exports.deduplicateComplaint = async function(newComplaint, embedding) {
  try {
    const { data: similar, error } = await supabase.rpc('find_similar_complaints', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 10,
      days_back: 7
    });

    if (error) {
      console.error("Deduplication RPC Error:", error);
      return { merged: false };
    }

    for (const candidate of similar) {
      const textSim = candidate.similarity;
      let geoScore = 0;

      if (newComplaint.lat !== null && newComplaint.lng !== null && candidate.lat !== null && candidate.lng !== null) {
        const geoDist = haversineDistance(newComplaint.lat, newComplaint.lng, candidate.lat, candidate.lng);
        geoScore = Math.max(0, 1 - geoDist / 1000); // 0 at 1km+
      }

      const clusterScore = (textSim * 0.6) + (geoScore * 0.4);

      if (clusterScore > 0.8) {
        // Recalculate Priority based on new cluster size (Gap 2)
        const { computePriorityScore } = require('./urgencyScorer');
        const newClusterSize = (candidate.cluster_size || 1) + 1;
        
        // Use existing scores from candidate if available or mock
        const updatedPriority = await computePriorityScore({
          keywordScore: candidate.keyword_score || 0.5,
          sentimentScore: candidate.sentiment_score || 0.5,
          clusterSize: newClusterSize,
          lat: candidate.lat,
          lng: candidate.lng
        });

        // Merge into existing master ticket
        const { error: updateError } = await supabase.from('master_tickets').update({
          affected_count: (candidate.affected_count || 1) + 1,
          cluster_size: newClusterSize,
          priority_score: updatedPriority,
          updated_at: new Date().toISOString()
        }).eq('id', candidate.master_ticket_id);

        if (updateError) {
          console.error("Error merging into master ticket:", updateError);
          continue; // Try next candidate or fail
        }

        return { merged: true, master_ticket_id: candidate.master_ticket_id };
      }
    }
    return { merged: false };
  } catch (error) {
    console.error("Deduplication service error:", error);
    return { merged: false };
  }
};
