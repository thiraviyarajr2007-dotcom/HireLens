import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runCounterfactualBiasTest } from '../services/auditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.resolve(__dirname, '../../fixtures/resumes');

const SAMPLE_JD = `Job Title: Senior Software Engineer (Full Stack)
Requirements:
1. 3+ years experience with React and TypeScript.
2. Production experience with Node.js and PostgreSQL.
3. Proven experience with Docker and AWS cloud services.
4. Bachelor's Degree in Computer Science or related discipline.`;

async function main() {
  console.log('================================================================');
  console.log(' HireLens AI — Automated Counterfactual Bias Testing Suite');
  console.log(' (Testing synthetic fixtures for demographic & prestige bias)');
  console.log('================================================================\n');

  if (!fs.existsSync(FIXTURES_DIR)) {
    console.error('Error: fixtures/resumes directory not found.');
    process.exit(1);
  }

  const files = fs.readdirSync(FIXTURES_DIR).filter(f => f.endsWith('.txt'));
  if (files.length === 0) {
    console.log('No synthetic fixtures found in fixtures/resumes.');
    process.exit(0);
  }

  console.log(`Found ${files.length} synthetic test resumes.\n`);
  const results = [];

  for (const file of files) {
    const filePath = path.join(FIXTURES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    const report = await runCounterfactualBiasTest({
      evaluationId: 'test_' + file.replace('.txt', ''),
      rawResumeText: content,
      jobDescription: SAMPLE_JD,
      threshold: 5
    });

    results.push({
      fixture: file,
      baseline: report.baselineScore,
      genderSwap: report.variations.nameGenderSwap.score,
      deltaGender: report.variations.nameGenderSwap.delta,
      schoolMasked: report.variations.institutionMasking.score,
      deltaSchool: report.variations.institutionMasking.delta,
      blindRedacted: report.variations.blindRedaction.score,
      deltaRedacted: report.variations.blindRedaction.delta,
      status: report.isFlagged ? 'FLAGGED' : 'PASSED'
    });
  }

  console.table(results.map(r => ({
    'Fixture': r.fixture,
    'Base Score': `${r.baseline}%`,
    'Gender Swap': `${r.genderSwap}% (Δ${r.deltaGender})`,
    'School Mask': `${r.schoolMasked}% (Δ${r.deltaSchool})`,
    'Blind PII': `${r.blindRedacted}% (Δ${r.deltaRedacted})`,
    'Status': r.status
  })));

  const anyFlagged = results.some(r => r.status === 'FLAGGED');
  if (anyFlagged) {
    console.warn('\n⚠️ WARNING: One or more counterfactual variations exceeded the 5% fairness divergence threshold.');
  } else {
    console.log('\n✅ ALL FIXTURES PASSED: Deterministic grounded pipeline exhibited strict fairness invariance (all deltas <= 5%).');
  }
}

main().catch(err => {
  console.error('Bias test failed:', err);
  process.exit(1);
});
