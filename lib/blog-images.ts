// Every image a blog post may use, with its size, so pages reserve the right space and never jump as they load.
// The files are in public/images/blog. lib/blog.test.ts checks every image a post uses is listed here and exists.
export const BLOG_IMAGES: Record<string, { width: number; height: number }> = {
  // Stock photos chosen by Steve in Canva (design "Kestrel Blog Post Photos", 13th November 2026), exported, white edges trimmed and
  // cropped to 16:9. Canva's licence covers them as part of Kestrel's own design; they are never offered for download on their own.
  // To replace one, change the page in that design and export it again with the same file name.
  "/images/blog/eye-care-job-ad-checklist.jpg": { width: 1344, height: 756 },
  "/images/blog/cover-letter-optical-job.jpg": { width: 1354, height: 762 },
  "/images/blog/field-based-eye-care-jobs.jpg": { width: 1354, height: 762 },
  "/images/blog/choosing-an-optical-buying-group.jpg": { width: 1594, height: 897 },
  "/images/blog/optometric-assistant-jobs-canada.jpg": { width: 1464, height: 824 },
  "/images/blog/how-people-fall-into-optics.jpg": { width: 1354, height: 762 },
  "/images/blog/optician-pay-canada.jpg": { width: 1354, height: 762 },
  "/images/blog/working-in-eye-care.jpg": { width: 1354, height: 762 },
  "/images/blog/ai-job-search-eye-care-canada.jpg": { width: 1354, height: 762 },
  "/images/blog/optician-interview-questions.jpg": { width: 1354, height: 762 },
  "/images/blog/star-interview-method.jpg": { width: 1354, height: 762 },
  "/images/blog/optometric-assistant-job-ad.jpg": { width: 1354, height: 762 },
  "/images/blog/start-a-career-in-optics.jpg": { width: 1354, height: 762 },
  "/images/blog/eye-care-resume.jpg": { width: 1354, height: 762 },
  "/images/blog/hire-for-attitude-train-for-skills.jpg": { width: 1354, height: 762 },
  "/images/blog/attract-right-candidates.jpg": { width: 1354, height: 762 },
  "/images/blog/phone-screening-tips.jpg": { width: 1354, height: 762 },
  "/images/blog/stand-out-in-interview.jpg": { width: 1354, height: 762 },
  "/images/blog/independent-or-corporate-eye-care.jpg": { width: 1566, height: 881 },
  "/images/blog/eye-care-moving-to-canada.jpg": { width: 1354, height: 762 },
  "/images/blog/ask-for-a-raise.jpg": { width: 1354, height: 762 },
  "/images/blog/optical-lab-technician.jpg": { width: 1354, height: 762 },
  "/images/blog/why-people-leave-jobs.jpg": { width: 1354, height: 762 },
  "/images/blog/onboarding-first-30-days.jpg": { width: 1354, height: 762 },
  "/images/blog/reference-checks-eye-care.jpg": { width: 1354, height: 762 },
  "/images/blog/hiring-seasonal-workers.jpg": { width: 1354, height: 762 },
  "/images/blog/empty-optician-chair-cost.jpg": { width: 1354, height: 762 },
};
