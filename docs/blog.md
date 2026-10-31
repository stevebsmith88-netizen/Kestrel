# The blog

Why: helpful articles bring in people who search for things like "optician cover letter" or "how to post an eye care job", and they link to the job board. It is also where we explain the pay range, AI and vacancy rules, which helps clinics post correctly.

How it works: the posts are written in `content/posts.ts`. There is no editor and no database. To add a post, copy one of the blocks in that file, change the text, and run `npm test`, which checks the title and description length, the writing style and that there is no dash used as punctuation. Claude writes and adds posts; Steve reads the preview and approves.

What each page gets for search engines: its own title, description and address, an article structured data block, and an entry in the sitemap. The blog index is `/blog`, and posts are at `/blog/<slug>`.

Writing text: a blank line between paragraphs, `## ` for a heading, `- ` for a bullet list, `**bold**`, and `[text](/jobs)` for links (an address on the site, or one starting with https://).

## What to write next (about 1 post a fortnight)

Good topics, each aimed at a real search:

1. How to become an optician in Canada, by province (check each college's current rules before publishing)
2. ~~Optometric assistant jobs in Canada: what the work is and what it pays~~ (published 31st October 2026)
3. ~~Questions to ask in an optician job interview~~ (published 31st October 2026)
4. A guide to pay ranges and pay transparency for clinics, province by province
5. Locum optometrist work in Canada: how it works
6. What an optical lab technician does
7. How to write an optometric assistant job ad
8. Working at an independent practice or a corporate group: what is different
9. How to onboard a new optician in the first 30 days
10. Moving from clinic work to a supplier or lens rep role
11. Remote and hybrid roles in eye care
12. Quebec: hiring in French in an eye care practice (when French is built)

Rules for every post: only say what is true and current, name no real clinic without asking, include no Eye Recommend material, and link to the job board or the clinic page near the end.
