import { getCollection } from 'astro:content';

// Drafts are hidden only in the real production build on Vercel.
// Preview deploys (VERCEL_ENV=preview) and local dev/builds include them,
// so drafts can be reviewed at their real URLs before being published.
export const includeDrafts = process.env.VERCEL_ENV !== 'production';

export async function getPosts() {
  const posts = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
