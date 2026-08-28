import { z } from 'zod';

import { apiFetch } from '@/core/api';
import { env } from '@/core/env';

import { getMockPost, getMockPosts } from './mocks';

export const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  body: z.string(),
});

export type Post = z.infer<typeof PostSchema>;

const PostListSchema = z.array(PostSchema);

// No API URL configured => the whole feature runs on local mocks.
const useMocks = env.EXPO_PUBLIC_API_URL === undefined;

export async function getPosts(): Promise<Post[]> {
  if (useMocks) return getMockPosts();
  return apiFetch('/posts', PostListSchema);
}

export async function getPost(id: string): Promise<Post> {
  if (useMocks) return getMockPost(id);
  return apiFetch(`/posts/${encodeURIComponent(id)}`, PostSchema);
}
