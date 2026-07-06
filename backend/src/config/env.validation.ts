import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),

  DB_TYPE: Joi.string().valid('sqlite', 'postgres').default('sqlite'),
  DB_DATABASE: Joi.string().when('DB_TYPE', {
    is: 'sqlite',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
  DATABASE_URL: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  SUPABASE_URL: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
  SUPABASE_KEY: Joi.string().when('DB_TYPE', {
    is: 'postgres',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  ADMIN_EMAIL: Joi.string().email().required(),
  ADMIN_PASSWORD: Joi.string().required(),

  API_PREFIX: Joi.string().default('api/v1'),
  CORS_ORIGIN: Joi.string().required(),

  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),

  VERCEL: Joi.optional(),
});
