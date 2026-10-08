import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCandidateFields } from '../services/fieldExtractor.js';
import { segmentResumeSections } from '../services/segmenter.js';
import { verifyVerbatimGrounding, calculateDeterministicScore } from '../services/aiService.js';
import { extractTextFromFile } from '../services/extractor.js';

test('B1 & Phase 1: Resume with missing contact info returns NOT_FOUND (never fabricated defaults)', () => {
  const minimalResume = `Developer Profile\nSome introductory bio without contact numbers or email.\nWorked on internal databases.`;
  const result = extractCandidateFields(minimalResume, 'random_file.pdf');

  assert.equal(result.fullName, null, 'Name should not fall back to filename or John Mathew');
  assert.equal(result.email, null, 'Email should not fall back to fake name@example.com');
  assert.equal(result.phone, null, 'Phone should not fall back to fake +1-555 number');
  assert.equal(result.linkedin, null, 'LinkedIn should not be invented');
  assert.equal(result.location, null, 'Location should not default to San Francisco, CA');
  assert.equal(result.education, null, 'Education should not default to Stanford or State University');
  assert.equal(result.evidenceFields['CONTACT-EMAIL'].status, 'NOT_FOUND');
  assert.equal(result.evidenceFields['CONTACT-PHONE'].status, 'NOT_FOUND');
  assert.equal(result.evidenceFields['EDU-DEGREE'].status, 'NOT_FOUND');
  assert.equal(result.extractedProfile.skills.length, 0, 'Should not inject JavaScript, React, Node.js when none exist');
});

test('B1 & Phase 1: Real candidate info extracted with computed confidence', () => {
  const resume = `Alex Rivera\nalex.rivera@example.org | (415) 555-8921 | linkedin.com/in/alexrivera\nSan Francisco, CA\n\nTECHNICAL SKILLS\nReact, TypeScript, Node.js, PostgreSQL, Docker\n\nEDUCATION\nB.S. in Computer Science\nUniversity of California, Berkeley\n\nEXPERIENCE\nSoftware Engineer — Acme Corp (2021 - Present)\nBuilt microservices handling 25% throughput increase.`;

  const result = extractCandidateFields(resume, 'resume.pdf');
  assert.equal(result.fullName, 'Alex Rivera');
  assert.equal(result.email, 'alex.rivera@example.org');
  assert.equal(result.linkedin, 'linkedin.com/in/alexrivera');
  assert.ok(result.phone.includes('555-8921'));
  assert.equal(result.location, 'San Francisco, CA');
  assert.ok(result.education.includes('B.S. in Computer Science'));
  assert.equal(result.evidenceFields['CONTACT-NAME'].status, 'FOUND');
  assert.ok(result.evidenceFields['CONTACT-NAME'].confidence >= 80);
  assert.ok(result.extractedProfile.skills.some(s => s.name === 'React'));
  assert.ok(result.extractedProfile.skills.some(s => s.name === 'TypeScript'));
});

test('B11: Segmenter does not mis-split sections on tools, languages, degree, university, college', () => {
  const text = `EXPERIENCE\nSenior Developer at Tech Co\nUsed various tools and languages on the job\nEarned degree from top university or college while working\n\nEDUCATION\nB.S. Software Engineering`;
  const segmented = segmentResumeSections(text);

  assert.ok(segmented.EXPERIENCE.includes('Used various tools and languages on the job'), 'Tools/languages should stay inside EXPERIENCE section');
  assert.ok(segmented.EXPERIENCE.includes('Earned degree from top university or college while working'), 'Degree/university/college should not prematurely start education');
  assert.ok(segmented.EDUCATION.includes('B.S. Software Engineering'));
});

test('B4: Verbatim grounding verifies whole quote and rejects hallucinated quotes', () => {
  const resumeText = 'Spearheaded migration of core microservice from REST to gRPC, reducing p99 latency by 45ms.';
  const requirements = [
    {
      id: 'req-1',
      title: 'gRPC migration',
      evidence: 'reducing p99 latency by 45ms'
    },
    {
      id: 'req-2',
      title: 'Invented Kubernetes claim',
      evidence: 'Managed 50-node Kubernetes cluster across AWS regions'
    }
  ];

  const verified = verifyVerbatimGrounding(requirements, resumeText);
  assert.equal(verified[0].isVerbatimVerified, true);
  assert.equal(verified[0].groundingStatus, 'VERIFIED_EXACT');
  assert.equal(verified[1].isVerbatimVerified, false);
  assert.equal(verified[1].groundingStatus, 'UNVERIFIED');
});

test('B3: Deterministic score calculation with score 0 handles edge case', () => {
  const scoreZero = calculateDeterministicScore(0, 0, 0);
  assert.equal(scoreZero, 0, 'Zero scores must compute to 0, not fall back to 70');
  
  const normalScore = calculateDeterministicScore(100, 100, 100);
  assert.equal(normalScore, 100);
});

test('B19: Text extractor rejects legacy .doc with clear error message', async () => {
  const dummyBuffer = Buffer.from('D0CF11E0A1B11AE1', 'hex'); // OLE header
  await assert.rejects(
    async () => {
      await extractTextFromFile(dummyBuffer, 'resume.doc', 'application/msword');
    },
    (err) => {
      assert.ok(err.message.includes('UNSUPPORTED_LEGACY_DOC'));
      return true;
    }
  );
});
