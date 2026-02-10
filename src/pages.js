/**
 * @param {import('./config').Config} config
 */
export function getPages(config) {
  return {
    HOME: config.baseUrl,
    THANK_YOU: `${config.baseUrl}/thank-you`,
  };
}
