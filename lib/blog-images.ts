// Every image a blog post may use, with its size, so pages reserve the right space and never jump as they load.
// The files are in public/images/blog. The guide cards are the Instagram posts at half size (design/social-and-merch/instagram-guides),
// so the blog and the Instagram grid look the same. lib/blog.test.ts checks every image a post uses is listed here and exists.
export const BLOG_IMAGES: Record<string, { width: number; height: number }> = {
  "/images/blog/fall-into-optics.png": { width: 1080, height: 1350 },
  "/images/blog/job-ad-checklist.png": { width: 1080, height: 1350 },
  "/images/blog/cover-letter.png": { width: 1080, height: 1350 },
  "/images/blog/optometric-assistant-jobs.png": { width: 1080, height: 1350 },
  "/images/blog/questions-before-you-say-yes.png": { width: 1080, height: 1350 },
  "/images/blog/hire-for-attitude.png": { width: 1080, height: 1350 },
  "/images/blog/who-does-what.png": { width: 1080, height: 1350 },
  "/images/blog/resume-tips.png": { width: 1080, height: 1350 },
  "/images/blog/attract-the-right-people.png": { width: 1080, height: 1350 },
  "/images/blog/field-based-jobs.png": { width: 1080, height: 1350 },
  "/images/blog/optician-pay.png": { width: 1080, height: 1350 },
  "/images/blog/ai-chatbots.png": { width: 1080, height: 1350 },
};
