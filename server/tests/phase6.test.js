import test from 'node:test';
import assert from 'node:assert/strict';
import { runCounterfactualBiasTest } from '../services/auditService.js';
import { explainSkillGaps } from '../services/skillGapService.js';
import { calculateDeterministicScore } from '../services/pipeline/scorer.js';
import { requireAuth } from '../middleware/auth.js';

test('Phase 6 & B12: Auth middleware rejects unauthenticated requests with 401', async () => {
  let statusCode = null;
  let jsonResponse = null;

  const req = {
    headers: {}
  };
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (data) => { jsonResponse = data; }
      };
    }
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await requireAuth(req, res, next);

  assert.equal(statusCode, 401);
  assert.equal(jsonResponse.error, 'UNAUTHORIZED');
  assert.equal(nextCalled, false);
});

test('Phase 6 & B12: Auth middleware accepts test-token in test/demo mode', async () => {
  const req = {
    headers: {
      authorization: 'Bearer test-token'
    }
  };
  const res = {
    status: () => ({ json: () => {} })
  };
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  await requireAuth(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(req.user.isDemo, true);
  assert.equal(req.ownerUid, 'demo_user_recruiter_001');
});

test('Phase 6: Counterfactual Bias Test runs over text and outputs valid deltas', async () => {
  const resumeText = `Alice Johnson
Software Engineer
alice@example.com
Experience:
- 4 years building React web applications with TypeScript.
- Worked with Node.js and PostgreSQL.
Education:
Bachelor of Science from Stanford University`;

  const report = await runCounterfactualBiasTest({
    evaluationId: 'test_eval_123',
    rawResumeText: resumeText,
    jobDescription: 'Seeking React and TypeScript engineer with 3+ years experience.',
    threshold: 5
  });

  assert.ok(report);
  assert.equal(typeof report.baselineScore, 'number');
  assert.ok(report.variations.nameGenderSwap);
  assert.ok(report.variations.institutionMasking);
  assert.ok(report.variations.blindRedaction);
  assert.equal(typeof report.maxDelta, 'number');
  assert.equal(typeof report.isFlagged, 'boolean');
});

test('Phase 6 & Skill Gap: Adjacent skills are labelled TRANSFERABLE, never MATCHED', () => {
  const requirements = [
    { id: 'r1', skill: 'Vue', title: 'Vue.js Experience', finalStatus: 'NOT_FOUND' },
    { id: 'r2', skill: 'Go', title: 'Golang Microservices', finalStatus: 'NOT_FOUND' }
  ];
  const candidateSkills = ['React', 'TypeScript', 'Node.js'];

  const results = explainSkillGaps(requirements, candidateSkills);

  const vueResult = results.find(r => r.requirementId === 'r1');
  assert.ok(vueResult);
  assert.equal(vueResult.status, 'TRANSFERABLE');
  assert.equal(vueResult.transferableSkill, 'react');

  const goResult = results.find(r => r.requirementId === 'r2');
  assert.ok(goResult);
  assert.equal(goResult.status, 'NOT_FOUND');
});

test('Phase 6: Deterministic Scorer respects customized weights', () => {
  const requirements = [
    { id: 'r1', isMandatory: true, isGrounded: true, finalStatus: 'MATCHED' },
    { id: 'r2', isMandatory: false, isGrounded: true, finalStatus: 'MATCHED' }
  ];

  const scoreA = calculateDeterministicScore({
    verifiedRequirements: requirements,
    detectedYears: 5,
    requiredYears: 3,
    resumeText: 'Increased performance by 40% and reduced latency by 150ms.',
    hasEducation: true,
    weights: { skills: 0.8, experience: 0.1, impact: 0.1, education: 0.0 }
  });

  const scoreB = calculateDeterministicScore({
    verifiedRequirements: requirements,
    detectedYears: 5,
    requiredYears: 3,
    resumeText: 'Increased performance by 40% and reduced latency by 150ms.',
    hasEducation: true,
    weights: { skills: 0.2, experience: 0.6, impact: 0.1, education: 0.1 }
  });

  assert.equal(typeof scoreA.finalScore, 'number');
  assert.equal(typeof scoreB.finalScore, 'number');
  assert.ok(scoreA.finalScore >= 0 && scoreA.finalScore <= 100);
});
