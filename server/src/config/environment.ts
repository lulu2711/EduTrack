const PLACEHOLDER_VALUES = new Set([
  '',
  'change-this-admin-password',
  'change-this-student-demo-password',
  'your-super-secret-jwt-key-change-this-in-production',
  'your-secret-key',
]);

// Matches unresolved template tokens such as <REPLACE_WITH_...> or {TOKEN}.
const TEMPLATE_TOKEN_PATTERN = /<[^>]+>|\{[^{}]+\}/;

const required = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const isProduction = () => process.env.NODE_ENV === 'production';

export function validateEnvironment(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const mode = process.env.DATA_SOURCE_MODE || 'fallback';
  if (mode !== 'fallback' && mode !== 'mongodb') {
    throw new Error('DATA_SOURCE_MODE must be fallback or mongodb');
  }
  if (isProduction() && mode !== 'mongodb') {
    throw new Error('Production requires DATA_SOURCE_MODE=mongodb');
  }

  const jwtSecret = required('JWT_SECRET');
  if (jwtSecret.length < 32 || (isProduction() && PLACEHOLDER_VALUES.has(jwtSecret))) {
    throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters');
  }

  if (isProduction() && mode === 'mongodb') required('MONGODB_URI');

  const corsOrigin = required('CORS_ORIGIN');
  if (isProduction() && /localhost|127\.0\.0\.1/i.test(corsOrigin)) {
    throw new Error('Production CORS_ORIGIN must not point to localhost');
  }

  if (isProduction()) {
    const adminPassword = required('ADMIN_PASSWORD');
    if (adminPassword.length < 12 || PLACEHOLDER_VALUES.has(adminPassword)) {
      throw new Error('Production ADMIN_PASSWORD must be at least 12 characters and must be changed');
    }
  }

  const llmValues = ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL'].map(name => process.env[name]?.trim());
  if (llmValues.some(Boolean) && llmValues.some(value => !value)) {
    throw new Error('LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL must be configured together');
  }

  // Fail fast when a deployment shipped with unresolved template placeholders.
  // Only the variable name is reported, never its value.
  if (isProduction()) {
    const mustBeResolved = [
      'MONGODB_URI',
      'JWT_SECRET',
      'CORS_ORIGIN',
      'ADMIN_PASSWORD',
      'STUDENT_DEMO_PASSWORD',
    ];
    for (const name of mustBeResolved) {
      const value = process.env[name]?.trim();
      if (value && TEMPLATE_TOKEN_PATTERN.test(value)) {
        throw new Error(`${name} still contains an unresolved placeholder and must be set to a real production value`);
      }
    }
  }
}
