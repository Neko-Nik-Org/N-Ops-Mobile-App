import { parseLinkPayload } from '../src/lib/linkPayload';

const qr = { type: 'n-ops-device-link', version: 1, api: 'https://main-api.test.nops.app/', user_id: 12, device_token: 'abcDEF1234567890' };

test('parses the Admin UI QR payload', () => {
  expect(parseLinkPayload(JSON.stringify(qr))).toEqual({ userId: 12, code: 'abcDEF1234567890', server: 'https://main-api.test.nops.app' });
});

test('parses the nops:// deep link and rejects other QR codes', () => {
  expect(parseLinkPayload('nops://link?user_id=7&code=abcDEF1234567890')).toEqual({ userId: 7, code: 'abcDEF1234567890' });
  expect(parseLinkPayload('hello')).toBeNull();
  expect(parseLinkPayload(JSON.stringify({ ...qr, type: 'other' }))).toBeNull();
});
