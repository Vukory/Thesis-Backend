/**
 * @param {import('./config').Config} config
 */
export function getRoutes(config) {
  return {
    HOME: config.baseUrl,
    THANK_YOU: `${config.baseUrl}/thank-you`,
  };
}
