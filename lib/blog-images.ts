// Every image a blog post may use, with its size, so pages reserve the right space and never jump as they load.
// The files are in public/images/blog. lib/blog.test.ts checks every image a post uses is listed here and exists.
export const BLOG_IMAGES: Record<string, { width: number; height: number }> = {
  // Empty since 13th November 2026: Steve wants real photos here, not the Instagram cards. Add each photo with its size and source.
};
