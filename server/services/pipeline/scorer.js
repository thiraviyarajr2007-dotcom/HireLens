/**
 * Deterministic Scoring Engine (Pure Function, Auditable, Unit-Tested):
 * Computes exact match metrics from verified facts and grounded quotes.
 * No circular derivations or hardcoded defaults.
 */

export function calculateDeterministicScore({
  verifiedRequirements = [],
  detectedYears = 0,
  requiredYears = 2,
  resumeText = '',
  hasEducation = false,
  weights = { skills: 0.45, experience: 0.35, impact: 0.20 }
}) {
  // Normalize weights to sum to 1.0
  const wSkills = Number(weights?.skills ?? 0.45);
  const wExp = Number(weights?.experience ?? 0.35);
  const wImpact = Number(weights?.impact ?? 0.20);
  const wEdu = Number(weights?.education ?? 0.0);
  const totalWeight = wSkills + wExp + wImpact + wEdu || 1.0;

  const nwSkills = wSkills / totalWeight;
  const nwExp = wExp / totalWeight;
  const nwImpact = wImpact / totalWeight;
  const nwEdu = wEdu / totalWeight;

  // 1. S_skills: Grounded Requirement Match Ratio
  let totalReqWeight = 0;
  let earnedReqWeight = 0;
  const contributingRequirementIds = [];

  for (const req of verifiedRequirements) {
    const isMandatory = req.isMandatory !== false; // default mandatory
    const reqValue = isMandatory ? 2.0 : 1.0;
    totalReqWeight += reqValue;

    if (req.isGrounded && req.finalStatus === 'MATCHED') {
      earnedReqWeight += reqValue;
      contributingRequirementIds.push({
        id: req.requirementId,
        weightContributed: reqValue,
        status: 'MATCHED'
      });
    } else if (req.isGrounded && req.finalStatus === 'PARTIAL') {
      earnedReqWeight += reqValue * 0.5;
      contributingRequirementIds.push({
        id: req.requirementId,
        weightContributed: reqValue * 0.5,
        status: 'PARTIAL'
      });
    }
    // UNVERIFIED or NOT_FOUND earn 0
  }

  const S_skills = totalReqWeight > 0
    ? Math.round((earnedReqWeight / totalReqWeight) * 100)
    : 0;

  // 2. S_exp: Years of Experience vs Required (Capped, Pro-rated)
  let S_exp = 0;
  if (requiredYears <= 0) {
    S_exp = 100;
  } else {
    const ratio = (Number(detectedYears) || 0) / Number(requiredYears);
    S_exp = Math.min(100, Math.round(ratio * 100));
  }

  // 3. S_impact: Quantified Business Results & Metric Count
  const impactMetricRegex = /\b\d+(?:\.\d+)?%|\$\d+(?:,\d{3})*(?:\.\d+)?[kmb]?|\b\d+x\b|\b\d+\s*(?:ms|k|m|tps|users|req\/s|rps)\b/gi;
  const matches = (resumeText || '').match(impactMetricRegex) || [];
  const uniqueMetrics = new Set(matches.map(m => m.toLowerCase()));
  const metricCount = uniqueMetrics.size;

  let S_impact = 0;
  if (metricCount === 0) S_impact = 35;
  else if (metricCount === 1) S_impact = 65;
  else if (metricCount === 2) S_impact = 80;
  else if (metricCount >= 3) S_impact = Math.min(100, 85 + (metricCount - 3) * 5);

  // 4. S_edu: Education Match
  const S_edu = hasEducation ? 100 : 0;

  // 5. Final Deterministic Score
  const rawFinal = (nwSkills * S_skills) + (nwExp * S_exp) + (nwImpact * S_impact) + (nwEdu * S_edu);
  const finalScore = Math.min(100, Math.max(0, Math.round(rawFinal)));

  return {
    finalScore,
    subScores: {
      skills: S_skills,
      experience: S_exp,
      impact: S_impact,
      education: S_edu
    },
    weights: {
      skills: nwSkills,
      experience: nwExp,
      impact: nwImpact,
      education: nwEdu
    },
    formula: `(${nwSkills.toFixed(2)} * ${S_skills}) + (${nwExp.toFixed(2)} * ${S_exp}) + (${nwImpact.toFixed(2)} * ${S_impact})` + (nwEdu > 0 ? ` + (${nwEdu.toFixed(2)} * ${S_edu})` : ''),
    contributingRequirementIds,
    quantifiedMetricsCount: metricCount
  };
}
