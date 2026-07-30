import '@testing-library/jest-dom/vitest';

import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  document.body.innerHTML = '';
});

afterAll(() => server.close());
