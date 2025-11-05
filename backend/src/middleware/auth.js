import { auth } from 'express-oauth2-jwt-bearer';
import { config } from '../config/env.js';

export function authMiddleware() {
  if (!config.auth0.audience || !config.auth0.issuerBaseURL) {
    console.warn('Auth0 configuration missing; authentication middleware is disabled.');
    return (req, _res, next) => next();
  }

  return auth({
    audience: config.auth0.audience,
    issuerBaseURL: config.auth0.issuerBaseURL,
    tokenSigningAlg: 'RS256'
  });
}
