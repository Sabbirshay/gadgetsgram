import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),
  
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  // DB_TYPE defaults to 'postgres' when DATABASE_URL is present, otherwise 'sqlite'
  DB_TYPE: Joi.string().valid('sqlite', 'postgres').default(
    process.env.DATABASE_URL ? 'postgres' : 'sqlite'
  ),
  DB_DATABASE: Joi.string().when('DB_TYPE', {
    is: 'sqlite',
    then: Joi.string().default('./data/gadgets-gram.db'),
    otherwise: Joi.optional(),
  }),
  DATABASE_URL: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  SUPABASE_URL: Joi.string().optional(),
  SUPABASE_KEY: Joi.string().optional(),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().required(),

  API_PREFIX: Joi.string().default('api/v1'),
  // Default to wildcard so cold starts on Vercel don't crash when CORS_ORIGIN is missing
  CORS_ORIGIN: Joi.string().default('*'),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  
  VERCEL: Joi.optional(),

  // Allow Vercel-injected Postgres vars to pass through without errors
  POSTGRES_URL: Joi.string().optional(),
  POSTGRES_PRISMA_URL: Joi.string().optional(),
  POSTGRES_URL_NON_POOLING: Joi.string().optional(),
  POSTGRES_URL_NO_SSL: Joi.string().optional(),
  POSTGRES_PASSWORD: Joi.string().optional(),
  POSTGRES_HOST: Joi.string().optional(),
  POSTGRES_USER: Joi.string().optional(),
  POSTGRES_DATABASE: Joi.string().optional(),
  DATABASE_URL_UNPOOLED: Joi.string().optional(),

  // Allow Cloudinary vars to pass through
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),
});
