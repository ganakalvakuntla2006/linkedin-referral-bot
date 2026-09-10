/**
 * Automated Unit Tests for 24/7 Cloud LinkedIn Bot
 */

const assert = require('assert');
const { isTechRole, compileTemplate } = require('../src/matcher');
const DB = require('../src/db');
const config = require('../src/config');

console.log('--- Running 24/7 Cloud Bot Unit Tests ---');

// Test 1: Matcher Tech Roles
const positiveTitles = [
  'Engineering @Zomato | ACM-ICPC Asia West Continent Finalist’23 | Candidate Master on Codeforces | IIT Indore | CSE',
  'Senior Software Engineer at Amazon',
  'Frontend Developer | React & TypeScript',
  'Software Development Engineer II (SDE 2)',
  'Backend Engineer @ Stripe',
  'Full Stack Software Engineer',
  'DevOps & Infrastructure Lead',
  'Data Engineer at Meta',
  'Engineering Manager - Core Platform'
];

positiveTitles.forEach(title => {
  const result = isTechRole(title);
  assert.strictEqual(result, true, `Expected true for "${title}"`);
  console.log(`[PASS] Tech role detected: "${title}"`);
});

// Test 2: Non-Tech Roles Rejection
const negativeTitles = [
  'HR Business Partner',
  'Recruiter at Google',
  'Account Manager',
  'Financial Analyst',
  'Marketing Specialist'
];

negativeTitles.forEach(title => {
  const result = isTechRole(title);
  assert.strictEqual(result, false, `Expected false for "${title}"`);
  console.log(`[PASS] Non-tech role rejected: "${title}"`);
});

// Test 3: User Custom Template Compiler Test
const candidate = {
  name: 'vedant',
  title: 'Engineering @Zomato',
  company: 'zomato'
};

const output = compileTemplate(config.messageTemplate, candidate);
console.log('[PASS] User Template compilation output:\n' + output);
assert.ok(output.includes('Hi vedant, I’m Gana, a fourth-year student at IIITL'));
assert.ok(output.includes('refer me internally at zomato'));

// Test 4: Database Storage Test
const testProfile = `https://www.linkedin.com/in/test-engineer-${Date.now()}/`;
assert.strictEqual(DB.isProfileProcessed(testProfile), false);

DB.markProfileProcessed(testProfile, { name: 'Test Engineer', status: 'SENT' });
assert.strictEqual(DB.isProfileProcessed(testProfile), true);
console.log('[PASS] Database profile tracking test passed.');

console.log('\nAll 24/7 Cloud Bot tests passed successfully!');
