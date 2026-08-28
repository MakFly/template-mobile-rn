import { ApiError } from '@/core/api';

import type { Post } from './api';

/** Simulated network latency so loading states stay visible in dev. */
const MOCK_LATENCY_MS = 300;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Shipping the first build to TestFlight',
    body: 'From `eas build` to a link on a tester’s phone: signing, provisioning profiles and the two gotchas that block most first submissions.',
  },
  {
    id: 2,
    title: 'Feature-based architecture, six months later',
    body: 'What held up (strict app → features → shared → core layering) and what we would do differently, with concrete examples from the posts feature.',
  },
  {
    id: 3,
    title: 'Server state is not client state',
    body: 'Why the cache belongs to TanStack Query and the theme toggle belongs to Zustand — and what went wrong when we mixed the two.',
  },
  {
    id: 4,
    title: 'Designing dark mode with tokens only',
    body: 'One ThemeColors interface, two palettes, zero hardcoded hex in components. How the pressed states and elevation read in both schemes.',
  },
  {
    id: 5,
    title: 'A fetch wrapper in 100 lines',
    body: 'Timeouts with AbortController, one normalized ApiError, and zod parsing at the boundary: everything axios gave us, without the dependency.',
  },
  {
    id: 6,
    title: 'i18n from day one, not as a retrofit',
    body: 'Bundled en/fr resources, sync init, device-language detection. Retrofit projects taught us that hardcoded strings never stay temporary.',
  },
  {
    id: 7,
    title: 'MMKV behind a three-method facade',
    body: 'get/set/delete is all the app sees. Swapping the engine, mocking in Jest and wiring zustand/persist all became one-file changes.',
  },
  {
    id: 8,
    title: 'Typed routes saved us twice this week',
    body: 'expo-router’s generated route types caught a renamed screen and a missing param at compile time. Run typegen before typecheck, always.',
  },
  {
    id: 9,
    title: 'Accessibility is part of done',
    body: '48pt touch targets, accessibilityRole on every control, and testing with VoiceOver on the tab bar. Cheap now, expensive later.',
  },
];

export async function getMockPosts(): Promise<Post[]> {
  await delay(MOCK_LATENCY_MS);
  return mockPosts;
}

export async function getMockPost(id: string): Promise<Post> {
  await delay(MOCK_LATENCY_MS);
  const post = mockPosts.find((candidate) => String(candidate.id) === id);
  if (!post) {
    // Same failure shape as the real API so screens handle one error type.
    throw new ApiError('http', `Mock post ${id} not found`, { status: 404 });
  }
  return post;
}
