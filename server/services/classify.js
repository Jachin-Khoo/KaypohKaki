// Shared keyword classifier used by every news source we pull in, so
// articles from different feeds land in the same category taxonomy the
// frontend already understands. Swap for a real LLM call later.

const KEYWORD_RULES = [
  { category: 'housing', label: 'HOUSING', keywords: ['hdb', 'bto', 'flat', 'resale flat', 'condo', 'mnd'] },
  { category: 'cpf', label: 'CPF', keywords: ['cpf', 'medisave', 'retirement sum', 'srs'] },
  { category: 'col', label: 'COST OF LIVING', keywords: ['cost of living', 'subsidy', 'subsidies', 'voucher', 'rebate', 'payout', 'cdc voucher'] },
  { category: 'general', label: 'TAX', keywords: ['iras', 'income tax', 'gst'] },
  { category: 'general', label: 'PARENTING', keywords: ['baby bonus', 'childcare', 'preschool', 'moe'] },
  { category: 'general', label: 'HEALTHCARE', keywords: ['medishield', 'moh', 'hospital subsidy'] },
];

function classify(text) {
  const lower = (text || '').toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { category: rule.category, label: rule.label };
    }
  }
  return { category: 'general', label: 'SINGAPORE' };
}

function stripHtml(str) {
  return (str || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

module.exports = { classify, stripHtml };
