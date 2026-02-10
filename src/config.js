/**
 * @fileoverview
 *   We need to use different settings between development and production.
 *   NODE_ENV is a common environment variable that is used for this purpose.
 *   During development while the website is being worked on offline, we need to
 *   use localhost. However, online we want to use the public URL available over
 *   the internet with DNS etc.
 */

/**
 * @typedef {'production'|'development'} Environment
 * 
 * @typedef {object} Config
 * @property {number} port Which port to run the webserver on.
 * @property {string} baseUrl
 * @property {string} secret
 *   Arbitrary string, it can literally be anything, but treat it like a
 *   password. Used by the captcha library to generate unpredictable challenges.
 * @property {Environment} env Which environment/stage we're running on.
 */

const NODE_ENV = /** @type {Environment} */ (process.env.NODE_ENV);
const PORT = 8081;

/**
 * @returns {Config}
 */
export function getConfig() {
  const SECRET = process.env.VUKORY_SECRET;

  if (!SECRET) {
    throw new Error('VUKORY_SECRET environment variable is not defined');
  }

  const shared = {
    port: PORT,
    secret: SECRET,
    env: NODE_ENV,
  };

  switch (NODE_ENV) {
    case 'production':
      return {
        ...shared,
        baseUrl: 'https://survey.vukory.art',
      }
    case 'development':
      return {
        ...shared,
        baseUrl: 'http://localhost:8080',
      }
    default:
      throw Error('NODE_ENV must be one of: "production", "development"');
  }
}
