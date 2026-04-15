const { supabase } = require('../lib/supabase');

exports.recomputeSilenceRatios = async function() {
  try {
    // 1. Get all wards
    const { data: wards, error: wardError } = await supabase.from('wards').select('*');
    if (wardError) throw wardError;

    for (const ward of wards) {
      // 2. Count complaints in this ward from the last 30 days
      const { count, error: countError } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .eq('ward_id', ward.id)
        .gt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (countError) {
        console.error(`Count Error for ward ${ward.name}:`, countError);
        continue;
      }

      // 3. Update ward_stats (Gap 3 logic)
      const silenceRatio = ward.population / (count || 1);
      
      let riskLevel = 'Low';
      let recommendedAction = 'Maintain baseline monitoring';
      
      if (silenceRatio > 2000) {
        riskLevel = 'Critical';
        recommendedAction = 'Deploy field team immediately, coordinate with local NGOs, enable high-priority IVR survey.';
      } else if (silenceRatio > 1000) {
        riskLevel = 'High';
        recommendedAction = 'Schedule community outreach, partner with local ward councilors.';
      } else if (silenceRatio > 500) {
        riskLevel = 'Medium';
        recommendedAction = 'Increase social signal polling frequency.';
      }
      
      const { error: upsertError } = await supabase.from('ward_stats').upsert({
        ward_id: ward.id,
        ward_name: ward.name,
        complaint_count: count,
        population: ward.population,
        silence_ratio: silenceRatio,
        risk_level: riskLevel,
        recommended_actions: recommendedAction,
        updated_at: new Date().toISOString()
      }, { onConflict: 'ward_id' });

      if (upsertError) {
        console.error(`Upsert Error for ward ${ward.name}:`, upsertError);
      }
    }
  } catch (error) {
    console.error("Silence Crisis Service Error:", error);
  }
};
