import { assistantTransportFetch, getAssistantApiUrl } from '@/features/assistant/api';

describe('assistant API boundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the dedicated Hono development port', () => {
    expect(getAssistantApiUrl()).toMatch(/:3333$/);
  });

  it.each([
    [404, 'make api (port 3333)'],
    [503, 'OPENAI_API_KEY'],
  ])('turns status %i into an actionable chat error', async (status, expected) => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status }));

    const response = await assistantTransportFetch('http://localhost:3333/v1/chat');

    expect(response.status).toBe(502);
    await expect(response.text()).resolves.toContain(expected);
  });
});
