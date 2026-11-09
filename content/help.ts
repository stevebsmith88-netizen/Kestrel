import type { HelpSection } from "../lib/help.ts";

// The help centre. To add a topic, copy a block below, change it, then check with `npm test`.
// Write the way the rest of the site reads: warm and plain, numerals, British spelling with Canadian conventions, and no dashes as punctuation.
// Describe only what is built, say what to click in the order a person sees it, and give no prices (checkout is not built yet).
// Links to another topic look like [text](/help#topic-id) and the tests check that the topic exists.
export const HELP: HelpSection[] = [
  {
    id: "general",
    title: "General",
    intro: "About Kestrel, the rules every job follows, and what we do with your information.",
    topics: [
      {
        id: "what-is-kestrel",
        title: "What is Kestrel Eye Care Jobs?",
        answer: [
          "Kestrel is a job board for eye care across Canada. Optometrists, opticians, optometric assistants and technicians, practice managers and patient care teams look for work here, and independent and corporate practices post side by side. Suppliers and manufacturers that hire directly can post field based roles too, such as sales, training and service.",
          "Every job shows its pay, and a person on our team reads every post before it goes live. Candidates can apply through Kestrel with a saved CV, or on the clinic's own website when the clinic prefers that.",
        ],
        links: [{ label: "Find jobs", href: "/jobs" }],
      },
      {
        id: "is-it-free",
        title: "Is it free?",
        answer: [
          "Creating an account is free, and so is searching and applying.",
          "Posting a job is free during the free launch, which runs for the opening 30 to 60 days, and you do not need a credit card to post. When fees begin, we will say so on the site first. The For clinics page always shows the current plans.",
        ],
        links: [{ label: "For clinics", href: "/clinics" }],
      },
      {
        id: "sign-in-and-password",
        title: "Sign in, and what to do if you forget your password",
        answer: [
          "A new account needs its email address confirmed first. The confirmation link arrives in your inbox a minute or so after you sign up, so check your spam or junk folder if you do not see it.",
          "If you type the wrong password too many times, the form asks you to complete a quick security check, and then to wait a few minutes before trying again.",
        ],
        steps: [
          "Choose **Sign in** in the bar at the top of the page. On a phone, open **Menu** first.",
          "Type your email address and password, or choose **Continue with Google** if you see that button.",
          "Press **Sign in**.",
          "If you have forgotten your password, choose **Forgot your password?** under the Sign in button instead.",
          "Type your email address and press **Send me a link**.",
          "Open the email, follow the link and choose a new password.",
        ],
        links: [{ label: "Sign in", href: "/sign-in" }],
      },
      {
        id: "why-pay-is-shown",
        title: "Why does every job show its pay?",
        answer: [
          "A pay range is required on every post, so you can compare jobs before you spend time applying. Ontario has asked employers to show a pay range since 1st January 2026, and British Columbia has a pay range rule too. Kestrel asks every clinic in every province to follow the same rule, so you see pay on each job.",
          "The range has to be a real one: no more than $50,000 a year wide unless the top is over $200,000, and words such as \"negotiable\" are not accepted on their own. Some optometrist posts show a daily rate or a percentage of production, collections, billings or exam fees instead. Where a daily rate comes with the days a week, the job page also shows a yearly estimate, and it is labelled as our estimate.",
        ],
        links: [{ label: "Pay by province", href: "/resources" }],
      },
      {
        id: "existing-vacancy",
        title: "What does \"existing vacancy\" mean?",
        answer: [
          "Every job answers this question under **Job facts**. **Yes** means the clinic has a real opening to fill now. **No** means the clinic is building a pool of candidates for the future, so a job may not lead to a hire straight away.",
          "Ontario's job posting rules, in force since 1st January 2026, ask employers to say which it is, so Kestrel asks every clinic in every province.",
        ],
      },
      {
        id: "ai-screening",
        title: "What does \"uses AI to screen candidates\" mean?",
        answer: [
          "Every job also answers this question under **Job facts**. A clinic says **Yes** if it uses software with artificial intelligence to sort, rank or choose among applicants, and **No** if it does not. Ontario has required employers to say so since 1st January 2026.",
          "The answer is about the clinic's own tools. Kestrel does not rank or score applicants with AI: clinics see the applications that were sent to them, newest first, and read them for themselves. The only place a clinic can use AI on Kestrel is to draft a job ad, and that tool sees only the job details the clinic types in, never anything about candidates. The \"Recommended for you\" list on a candidate's home page uses plain rules, with no AI.",
        ],
      },
      {
        id: "where-your-data-is-kept",
        title: "Where is my information kept?",
        answer: [
          "Your details, CV and applications are stored in a database and a private file store hosted in Canada. Our website hosting, email, security check and AI providers are based in the United States and may handle requests, and the emails we send you, on servers outside Canada. While your information is there, it may be subject to the laws of that country.",
          "The [privacy policy](/privacy) has the full list of providers and how long we keep things, and [How we protect your data](/security) explains the safeguards.",
        ],
        links: [{ label: "Privacy policy", href: "/privacy" }, { label: "How we protect your data", href: "/security" }],
      },
      {
        id: "who-can-see-your-details",
        title: "Who can see my details?",
        answer: [
          "**If you are looking for a job:** your profile and CV are private. A clinic sees only what you send with an application: your cover letter, your CV and the details you chose to give, as they were the day you applied. It sees nothing from applications you sent to other clinics. The part of your profile about what you are looking for, such as how far you would travel and your lowest pay, is never shown to clinics. Your CV can be opened only through a link that works for 1 minute.",
          "**If you are a clinic:** your job posts are public, but the email address that applicant alerts go to is never shown on a post, and neither is the answer about how many people work for you. Candidates apply through Kestrel, so recruiters cannot harvest your address.",
          "We do not sell personal information. Our team can see account details when it needs to run the site, and a small number of service providers handle information only to provide their service to us.",
        ],
        links: [{ label: "Privacy policy", href: "/privacy" }],
      },
      {
        id: "provinces-and-quebec",
        title: "Which provinces are open, and why is Quebec not yet?",
        answer: [
          "Clinics can post jobs in every province and territory except Quebec. Kestrel is in English for now, so a job in Quebec is refused when it is posted. Quebec is planned for a later date, with French.",
          "You can still choose Quebec when you join the waitlist or fill in your profile. People in Quebec may want to move, and you can look at jobs in every other province in the meantime.",
        ],
        links: [{ label: "Jobs by province", href: "/eye-care-jobs" }],
      },
      {
        id: "found-on-clinic-website",
        title: "What does \"Found on the clinic's website, not yet claimed\" mean?",
        answer: [
          "Sometimes we find a job on a clinic's own careers page and list it so candidates can see it. We write the facts in our own words, link to the clinic's own application page, and do not use the clinic's logo. The label means the clinic has not yet taken the listing over, and to apply you go to the clinic's own website.",
          "These listings come down after 21 days. If you run the clinic, you can claim the listing, and it then becomes a normal Kestrel post that you manage. To ask us to take a listing down, write to hello@eyecarejobs.ca.",
        ],
      },
      {
        id: "report-a-job",
        title: "How do I report a job?",
        answer: [
          "If a job looks like a scam, comes from a recruiter or agency, uses discriminatory wording, has pay or details that look wrong, or has already been filled, tell us. A person reads every report.",
        ],
        steps: [
          "Open the job.",
          "Choose **Report this job**, under the Apply box.",
          "Choose what is wrong, and add more detail if you like.",
          "Add your email address only if you would like us to write back.",
          "Press **Send report**.",
        ],
      },
      {
        id: "email-choices",
        title: "How do I change which emails I get?",
        answer: [
          "You can choose what we email you about. We always email you about your security, such as a password reset, and about your account, such as a job we have had to take down. Every news or job alert email also has an unsubscribe link.",
          "Candidates can choose news and job alert emails, and whether to be emailed when a clinic updates an application. Clinics can choose how often to be emailed about new applicants, and whether to be reminded when an application has waited 2 weeks without being opened.",
        ],
        steps: [
          "Open the menu under your initials at the top of the page. On a phone, open **Menu** instead.",
          "Choose **Account settings**.",
          "Find the **Email choices** box and tick or untick what you want.",
          "Press **Save my email choices**.",
        ],
        links: [{ label: "Account settings", href: "/account" }],
      },
      {
        id: "contact-us",
        title: "How do I contact you?",
        answer: [
          "A person on the Kestrel team reads every message, and we aim to reply within 2 business days.",
          "For general questions and help, write to hello@eyecarejobs.ca. To see, correct or remove your information, write to privacy@eyecarejobs.ca. To report a job, use the **Report this job** link on the job's page.",
        ],
        links: [{ label: "Contact page", href: "/contact" }],
      },
      {
        id: "delete-or-download",
        title: "How do I download my information or delete my account?",
        answer: [
          "You can do both yourself, any time you are signed in. The download is a file with the account details we hold about you. For a candidate it also covers your profile, job alerts, applications and saved letters, and for a clinic it covers your clinic profile, jobs and templates. Your CV file is downloaded separately, with the **Download** button on your profile page.",
          "Deleting is permanent. It removes your profile, your CV and your applications. A clinic that already received your application may have kept its own copy of what you sent. Write to privacy@eyecarejobs.ca and we will ask that clinic to remove it. If you are a clinic, deleting your account also removes your jobs and the applications they received.",
        ],
        steps: [
          "Open the menu under your initials at the top of the page. On a phone, open **Menu** instead.",
          "Choose **Account settings**.",
          "To download, find **Download your information** and press **Download my information**.",
          "To delete, open **Delete my account** further down the page.",
          "Type your password. If you sign in with Google, type your email address instead.",
          "Type DELETE in capital letters and press **Delete my account for good**.",
        ],
        links: [{ label: "Account settings", href: "/account" }],
      },
    ],
  },
];
