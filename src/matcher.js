/**
 * 24/7 Cloud LinkedIn Bot - Role Matcher & Template Compiler
 */

const DEFAULT_KEYWORDS = [
  "software engineer", "software development engineer", "sde", "swe",
  "engineering", "software", "developer", "mts", "member of technical staff",
  "frontend", "backend", "full stack", "fullstack", "devops",
  "data engineer", "tech lead", "engineering manager", "sre", "cse"
];

function isTechRole(headline, customKeywords = []) {
  if (!headline || typeof headline !== 'string') return false;

  const normalizedHeadline = headline.toLowerCase();
  const keywords = (customKeywords && customKeywords.length > 0)
    ? customKeywords
    : DEFAULT_KEYWORDS;

  return keywords.some(keyword => {
    if (keyword.length <= 4) {
      const regex = new RegExp(`\\b${keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      return regex.test(normalizedHeadline);
    }
    return normalizedHeadline.includes(keyword);
  });
}

function compileTemplate(template, data = {}) {
  if (!template) return '';

  const fullName = data.name || 'there';
  const firstName = fullName.split(' ')[0] || 'there';
  const company = data.company || 'your company';
  const title = data.title || 'Software Engineer';

  return template
    .replace(/\\n/g, '\n')
    .replace(/\{firstName\}/gi, firstName)
    .replace(/\{fullName\}/gi, fullName)
    .replace(/\{company\}/gi, company)
    .replace(/\{title\}/gi, title);
}

module.exports = {
  DEFAULT_KEYWORDS,
  isTechRole,
  compileTemplate
};
