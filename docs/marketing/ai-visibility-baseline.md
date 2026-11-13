# AI assistant visibility: baseline and monthly check

Marketing audit item 7. Takes about 30 minutes. Steve does it by hand, because assistants answer differently by account, place and day, and nothing here should be automated or scraped.

## Why do it before launch

Kestrel has no jobs live yet, so expect "not named" everywhere. The baseline is still useful for 2 reasons: it shows which boards and sites the assistants name today (the real competitors for AI answers), and it gives a starting point to measure the pay table, the blog and the resources page against after launch.

## How to run it

1. Use these 4 assistants where you have access: ChatGPT, Claude, Gemini and Perplexity. Add Microsoft Copilot if you like (it uses Bing).
2. Start a new chat for every prompt. Signed out or a private window is best. Do not follow up or hint at Kestrel.
3. Paste the prompt exactly as written. Never reword it, so month to month results can be compared.
4. For each answer, note whether Kestrel is named, whether eyecarejobs.ca is linked, and the first 5 sources or boards named.
5. Log it in the table at the bottom. Keep the first run as the baseline row set.

## The 10 prompts

Candidates

1. Where can I find optician jobs in Canada?
2. What are the best job boards for optometric assistants in Ontario?
3. How much do opticians make in Alberta?
4. I am an optometrist moving to British Columbia. Where do I look for jobs?
5. Is there a job board just for eye care jobs in Canada?

Clinics

6. Where should an independent optometry clinic in Canada post a job ad?
7. How much does it cost to advertise an optician job in Canada?
8. What does a job ad have to include in Ontario in 2026?
9. Eluta vs Indeed vs Jobs4ECPs for hiring an optician. Which is better for a small clinic?
10. What are the alternatives to Indeed for hiring eye care staff in Canada?

Prompts 3 and 8 are the ones the pay table, `/posting-policy` and `/resources` should win. Prompts 5, 6 and 10 are the ones the compare page should win. Prompt 9 names competitors on purpose: it shows how the assistants describe them.

## Extra questions (added 13th November 2026)

These are not for the monthly score. They show why Kestrel is or is not named, so ask them once a quarter, or after a big change such as launch. Same rules: a new chat for each, pasted exactly.

11. What is Kestrel Eye Care Jobs (eyecarejobs.ca)? (Does the assistant know us, and is what it says right?)
12. Go to eyecarejobs.ca and summarise what is there. What is missing that would make you recommend it? (Can its crawler read the site?)
13. Which websites would you trust for optician pay by province in Canada, and why? (What makes a source worth quoting.)
14. How do I become a licensed optician in Ontario? (Repeat for British Columbia and Alberta. Note who is cited: those pages are what the licensing guides compete with.)
15. Which Canadian associations, schools or publications list eye care job boards or career resources? (The answers feed `docs/marketing/backlinks-plan.md`.)
16. What would make a new eye care job board more trustworthy than the established ones? (What the assistants are looking for.)

Run all 6 assistants from next month: ChatGPT, Claude, Gemini, Perplexity, Copilot and Grok. Perplexity and Claude need a sign in, so use a plain account with no history about Kestrel, and note in the log that it was signed in.

## Log (copy a row per prompt per assistant)

| Date | Assistant | Prompt number | Kestrel named? (Y/N) | Link to eyecarejobs.ca? (Y/N) | Other sites named (first 5) | Note |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | | | |

## What to do with the results

- If a competitor is named often and Kestrel never is, check what that competitor publishes that Kestrel does not. Send Claude the list.
- If an assistant states something wrong about Kestrel (price, what it does), write it down and tell Claude. The fix is usually clearer wording on the page that assistant read.
- Repeat on the first Monday of each month and add a column to the monthly summary: how many of the 40 answers (10 prompts by 4 assistants) name Kestrel.

## Things to leave out

Do not ask an assistant "is Kestrel good" or name Kestrel in a prompt. That measures nothing about discovery.
