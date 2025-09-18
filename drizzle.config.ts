import type { Config } from 'drizzle-kit';

export default {
  schema: './server/db/schema.js',
  out: './server/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './server/db/healthcare.db',
  },
} satisfies Config;
