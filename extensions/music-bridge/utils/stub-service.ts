/**
 * The stand-in of the redirect service that the Firefox smoke tests (scripts/firefox.ts) run on this computer: a build in
 * the "stub" mode (`wxt zip -b firefox --mode stub`) asks it instead of the real service, which the tests never call
 */
export const STUB_SERVICE_URL = 'http://127.0.0.1:8787/';
