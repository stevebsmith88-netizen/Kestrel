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
          "**If you are looking for a job:** your profile and CV are private. A clinic sees only what you send with an application: your cover letter, your CV, and your name, email address, role, licences, experience and availability, plus your phone number if you added one, as they were the day you applied. It sees nothing from applications you sent to other clinics. The part of your profile about what you are looking for, such as how far you would travel and your lowest pay, is never shown to clinics. Your CV can be opened only through a link that works for 1 minute.",
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
          "These listings come down after 21 days. If you run the clinic, you can [claim the listing](/help#claim-a-listing), and your clinic then owns it and manages it from the dashboard. To ask us to take a listing down, write to hello@eyecarejobs.ca.",
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
  {
    id: "candidates",
    title: "Candidates",
    intro: "For people looking for a job: your account, your profile, applying and following what happens next.",
    topics: [
      {
        id: "create-a-candidate-account",
        title: "How do I create an account?",
        answer: [
          "It is free. Your password needs at least 10 characters. A few words you will remember work well.",
          "After you press the button, we email you a confirmation link. Open it to confirm your address, then sign in. If you use Google, there is no password and no confirmation email, and the next screen asks whether you are looking for a job or hiring.",
        ],
        steps: [
          "Choose **Create account** at the top of the page. On a phone, open **Menu** first.",
          "Under **I am**, choose **I'm looking for a job**. Or choose **Continue with Google** if you see that button.",
          "Type your first name, last name, email address and a password.",
          "Tick the box to agree to the terms of use and the privacy policy. The second box, about launch news and job alerts, is optional.",
          "Complete the security check and press **Create my account**.",
          "Open the confirmation email, follow the link, and sign in.",
        ],
        links: [{ label: "Create an account", href: "/sign-up" }],
      },
      {
        id: "profile-and-cv",
        title: "How do I build my profile and add a CV?",
        answer: [
          "To apply through Kestrel you need 2 things: your role and a saved CV. Everything else on the profile is optional, and your profile is private. A CV can be a PDF or a Word file, up to 3 MB, and it is stored privately in Canada.",
          "You can replace or delete your CV at any time. Replacing it does not change applications you have already sent, because a clinic keeps what you sent that day.",
        ],
        steps: [
          "Open the menu under your initials at the top of the page and choose **Profile and CV**. On a phone, open **Menu** instead.",
          "In the **Your CV** box, choose your file and press **Upload**. Once a CV is saved you can use **Download** or **Delete** next to its name, and the box offers **Replace your CV**.",
          "Below that, choose **Your role** and tick every province or territory where you are licensed or registered. Add your years of experience and when you are available. Your phone number is optional, and it is shared only with a clinic you apply to.",
          "Press **Save my details**.",
          "If you like, fill in **What you are looking for** on the same page. It shapes your recommended jobs (see [What are Recommended for you and Not interested?](/help#recommended-for-you)).",
        ],
        links: [{ label: "Profile and CV", href: "/candidate/profile" }],
      },
      {
        id: "search-and-filter-jobs",
        title: "How do I search and filter jobs, including by distance?",
        answer: [
          "You do not need an account to search. Every job shows its pay, and you can narrow the list as much or as little as you like.",
          "Distance works from a town or city. Kestrel knows towns of about 1,000 people or more, so if a place is not found, check the spelling or try the nearest larger town. You can choose within 10, 25 or 50 km, and 25 km is the usual choice. Field based jobs, such as sales and service roles that travel to clinics, are always included alongside the jobs near you.",
        ],
        steps: [
          "Choose **Find jobs** in the bar at the top of the page.",
          "Type a role or keyword, or choose a role, a province or territory, a type of employer (independent or corporate), and whether the person works on site or in the field.",
          "To search by distance, type a city or town, then choose **Within 10 km**, **Within 25 km** or **Within 50 km**.",
          "Tick the types of work you want, such as full time or part time. Open **Software, equipment and specialties** to narrow by what the job uses.",
          "Press **Search**. The number of jobs found appears above the list.",
        ],
        links: [{ label: "Find jobs", href: "/jobs" }],
      },
      {
        id: "how-to-apply",
        title: "How do I apply, on Kestrel or on the clinic's own site?",
        answer: [
          "The **Apply** box on a job page tells you which kind it is. Some clinics take applications through Kestrel, and others send you to their own careers page.",
          "When you apply through Kestrel, the clinic sees your cover note, your CV and your details: your name, email address, phone number if you added one, role, where you are licensed, years of experience and when you are available. You can follow the application under My applications. When a clinic uses its own site, the box says **Apply on the clinic's website** and opens that site in a new tab. Kestrel cannot see what happens there, so that application does not appear in My applications.",
          "You can apply to a job once. A cover note is optional, but we recommend one, because clinics tend to read the personal ones first.",
        ],
        steps: [
          "Open the job. On a phone, the small **Apply** button near the top jumps down to the Apply box.",
          "Choose **Quick Apply**. If you are not signed in, sign in or create a free account first.",
          "The first time, **Complete my profile** takes you to save your CV and choose your role. Then you come back to the job.",
          "Check your name, email, role and CV under **Your details**.",
          "Write a cover note, or choose one of your saved letters and press **Use it**. **Save as a draft** keeps it if you want to come back later.",
          "Tick the box agreeing that the clinic can see your application. The box about keeping your details for future roles is optional.",
          "Press **Send my application**. If the note is empty, we ask once: choose **Write a short note** or **Send without a note**.",
        ],
        links: [{ label: "Find jobs", href: "/jobs" }, { label: "My saved letters", href: "/candidate/letters" }],
      },
      {
        id: "track-your-applications",
        title: "How do I track my applications, and what does each status mean?",
        answer: [
          "Every application shows a progress bar with 5 steps: **Applied**, **Viewed**, **Shortlisted**, **Interview** and **Offer**. Applied means it is sent and the clinic has not opened it yet. Viewed means the clinic has opened it. Shortlisted means you are in the running. Interview means the clinic would like to meet you, and Offer means it has made you an offer.",
          "An application can also close. **Not selected this time** means the clinic chose other candidates. **Role filled** means the job is no longer open. **Kept for future roles** means the clinic will keep your details for future openings, if you agreed to that when you applied. **No update from the clinic** means the job closed without a decision. **Withdrawn** means you withdrew it.",
          "A clinic can write you a message with an update, and you see it on the application. The clinic's private notes are never shown to you. We also email you when a clinic updates an application, unless you have turned those emails off. The topic [How do I change which emails I get?](/help#email-choices) says how.",
        ],
        steps: [
          "Open the menu under your initials and choose **My applications**. On a phone, open **Menu** instead. Your home page also shows the latest few.",
          "Use the tabs **All**, **In review**, **Interviews**, **Offers** and **Closed** to find one.",
          "Choose **View details** to see where it stands, the clinic's message, the history, and what you sent.",
        ],
        links: [{ label: "My applications", href: "/candidate/applications" }],
      },
      {
        id: "job-alerts",
        title: "How do I set up job alerts?",
        answer: [
          "A job alert emails you when a new job is posted that matches what you choose. You can have up to 5 alerts. You get one email with everything new, never one email per job, and every email has an unsubscribe link.",
          "Alerts match on role, province or territory and type of employer. They do not use distance. If you turn off news and job alert emails under Account settings, your alerts are kept but no emails are sent until you turn them back on.",
        ],
        steps: [
          "Choose **Job alerts** in the bar at the top of the page. On a phone, open **Menu** first.",
          "Under **Add an alert**, choose a role, a province or territory and a type of employer. Leave a choice on \"any\" to hear about more jobs.",
          "Choose how often we should email you: daily, weekly or monthly.",
          "Press **Save this alert**.",
          "To stop one, press **Remove** next to it in **Your alerts**.",
        ],
        links: [{ label: "Job alerts", href: "/candidate/alerts" }],
      },
      {
        id: "recommended-for-you",
        title: "What are Recommended for you and Not interested?",
        answer: [
          "Your home page shows up to 8 jobs that fit what you told us, each with a line saying why it fits, such as the role, how far away it is, or that its pay reaches your minimum. They come from plain rules applied to your profile, with no AI, and nothing about you is shared with clinics.",
          "**Not interested** removes a job from your list, for you only. There is no undo, and the job still appears when you search. To get better suggestions, fill in **What you are looking for** on your profile: your town, how far you would travel, the provinces you would work in, your lowest pay and the type of work. The list starts once you have chosen your role.",
        ],
        steps: [
          "Open your home page by choosing **Home** in the bar at the top.",
          "Read the **Recommended for you** list and the line under each job that starts **Why this fits**.",
          "Press **Not interested** on any job you do not want to see again in the list.",
          "To change what we suggest, choose **What you are looking for**, update your details on the profile page and press **Save my details**.",
        ],
        links: [{ label: "What you are looking for", href: "/candidate/profile#looking-for" }],
      },
      {
        id: "keep-my-details",
        title: "What does \"Keep my details for future roles\" do?",
        answer: [
          "When you apply, an optional box lets the clinic keep your details if the role is filled by someone else, so it can contact you about future openings. You can leave it unticked, and your application is treated the same either way.",
          "A clinic can only choose **Kept for future roles** on your application if you ticked the box, and you see that status in My applications. You can ask the clinic to delete your details at any time. Write to privacy@eyecarejobs.ca and we will ask the clinic for you.",
        ],
      },
      {
        id: "withdraw-an-application",
        title: "How do I withdraw an application?",
        answer: [
          "You can withdraw at any step until the application is closed, including after an interview or an offer. The clinic sees the application as **Withdrawn**. We do not ask you to confirm, so the change happens as soon as you press the button.",
          "A withdrawn application cannot be sent again. You can apply to a job only once, so if you change your mind, contact the clinic directly.",
        ],
        steps: [
          "Open the menu under your initials and choose **My applications**. On a phone, open **Menu** instead.",
          "Choose **View details** on the application.",
          "Scroll to **Need to step back?** and press **Withdraw my application**.",
        ],
        links: [{ label: "My applications", href: "/candidate/applications" }],
      },
      {
        id: "private-until-you-apply",
        title: "Is my profile private until I apply?",
        answer: [
          "Yes. Clinics cannot search for you or browse candidate profiles. A clinic sees you only through an application you send to it, and only what you sent with it: your cover note, your CV, and your name, email address, role, licences, experience and availability as they were the day you applied, plus your phone number if you added one. What you are looking for, such as how far you would travel and your lowest pay, is never shown to clinics.",
          "Your CV is stored privately, and a clinic can open it only through a link that works for 1 minute. The topic [Who can see my details?](/help#who-can-see-your-details) has the full picture, and the privacy policy has the rest.",
        ],
        links: [{ label: "Privacy policy", href: "/privacy" }],
      },
    ],
  },
  {
    id: "clinics",
    title: "Clinics",
    intro: "For clinics, practices and suppliers that hire directly: your account, posting, applicants and keeping a job up to date.",
    topics: [
      {
        id: "create-clinic-account-and-profile",
        title: "How do I create my account and clinic profile?",
        answer: [
          "You need a clinic account and a clinic profile before you can post. The profile is where candidates learn about you, so a few honest lines about your team help. Some details are private: the email address that applicant alerts go to is never shown on a post, and neither is how many people work for you.",
          "While clinic accounts are by invitation, the sign up form also asks for the invitation code we sent you. You can change your profile later from the menu under your initials.",
        ],
        steps: [
          "Choose **Create account** at the top of the page. On a phone, open **Menu** first.",
          "Under **I am**, choose **I'm hiring for a clinic**. Type your first name, last name, work email address and a password of at least 10 characters.",
          "Tick the box to agree to the terms of use and the privacy policy, complete the security check and press **Create my account**.",
          "Open the confirmation email, follow the link, and sign in. Your dashboard asks you to set up your clinic profile.",
          "Choose **Create my clinic profile**. Fill in your clinic or company name, the type of employer (independent, corporate, or supplier or manufacturer), your city and province or territory, and roughly how many people work for you.",
          "Add your website and a few lines **About your clinic** if you like. They are shown on your job posts.",
          "Type the private address that new applicant alerts should go to.",
          "Tick the box confirming that you hire directly and are not a recruiter, staffing agency or job broker, and press **Create my clinic profile**.",
        ],
        links: [{ label: "Clinic profile", href: "/clinic/profile" }, { label: "Create an account", href: "/sign-up" }],
      },
      {
        id: "post-a-job",
        title: "How do I post a job, and what does every post need?",
        answer: [
          "Allow about 5 minutes. A draft needs only a title, so you can save it and come back from your dashboard. To send it for review, a post needs the job title, a role, an employment type, a city and a province or territory, a pay range, the 2 quick questions about existing vacancy and AI screening, and a description of at least 50 characters. Jobs in Quebec cannot be posted yet.",
          "Please keep the ad free of email addresses, phone numbers and any mention of Canadian experience, even to say it is not needed. Our post checker refuses that phrase however it is used. You can have up to 10 open jobs at a time, counting drafts, jobs in review and live jobs.",
          "Posting is free during the free launch, and you do not need a credit card.",
          "If you see a **Write my ad** box, it can turn a few lines about the job into a draft ad. The draft goes into the **Describe the job** box for you to read and change. Always check it before you send it.",
        ],
        steps: [
          "Choose **Post a job** in the bar at the top of the page.",
          "Under **The role**, type a job title and choose a role, an employment type, whether the person works on site or in the field, a city and a province or territory. A field based job also asks for the area covered.",
          "Under **Pay**, fill in the pay range. The next topic explains the options.",
          "Under **Tools and specialties**, tick anything that applies. It is optional, and candidates can search by it.",
          "Under **2 quick questions**, answer **Is this an existing vacancy?** and **Do you use AI to screen or select candidates?**",
          "Under **The ad**, type a few lines in the box and press **Write my ad**, or write the description yourself in **Describe the job**.",
          "Under **How people apply**, choose **Through Kestrel (recommended)**, or choose **On our own careers page** and give its address.",
          "Press **Submit for review**, or **Save draft** to finish later.",
        ],
        links: [{ label: "Post a job", href: "/clinic/jobs/new" }],
      },
      {
        id: "pay-options-by-role",
        title: "What pay options are there for each role?",
        answer: [
          "Every post needs a pay range, and it is shown to everyone. For every role you can give dollars a year or an hour, using **Lowest pay** and **Highest pay**. If you pay one set amount, type it in both boxes. A yearly range can be at most $50,000 wide unless the top is over $200,000. An hourly range is counted as a year first, at 2,080 hours, so it can be about 24 dollars wide an hour. Words such as \"negotiable\" are not accepted on their own.",
          "Optometrist roles have more choices. You can pay by **A day**, with a range of at most 200 dollars wide. You can add the days a week, and the job page then shows a yearly estimate, labelled as our estimate. You can also give a percentage range, up to 10 points wide, of **Production**, **Collections**, **Billings** or **Exam fees**. Fill in dollars, a percentage, or both. With both, the ad reads as dollars plus the percentage, or you can tick that the dollars are a guaranteed minimum, and then the percentage is paid when it comes to more.",
          "Bonuses, commission, a car allowance or a company vehicle go in the optional **Bonus, commission or anything else that is part of the pay** box, while the range itself stays as base pay. Field and supplier roles work the same way.",
          "Under the pay boxes, a line may tell you whether your range looks below, in line with or above what is typical for that role and province. It uses Job Bank wages, it is guidance only, and it never blocks or changes your post. It appears for yearly and hourly pay, and for a daily rate once you give the days a week, but not for a percentage.",
        ],
        links: [{ label: "Post a job", href: "/clinic/jobs/new" }, { label: "Pay by province", href: "/resources" }],
      },
      {
        id: "after-you-submit",
        title: "What happens after I submit a job?",
        answer: [
          "A person on our team reads every post before it goes live, usually within 1 business day. Your dashboard shows the job as **In review**, with the line \"With our team\".",
          "If it is approved, it goes live for 30 days and we email you. Your dashboard also shows a message about it for 7 days, with a **See your job** link and a **Dismiss** button. Nothing can be published without that check, and you cannot publish a job yourself.",
          "If we send it back, your dashboard shows a note headed **What to change**. Change what the note asks for and send it again. While a job is in review you can press **Take back to edit** to change it yourself first.",
        ],
        steps: [
          "Press **Submit for review** at the bottom of the Post a job form.",
          "Open your dashboard by choosing **Dashboard** in the bar at the top.",
          "Find the job under **Your jobs**. It shows **In review** until we have read it.",
          "If it comes back, read **What to change**, press **Edit**, fix it and submit again.",
        ],
        links: [{ label: "Your dashboard", href: "/clinic" }],
      },
      {
        id: "edit-a-live-job",
        title: "How do I edit a live job?",
        answer: [
          "You can change a live job, but the change goes to our team before candidates see it. The job goes offline until we have read the changes, usually within 1 business day, and its original 30 days keep running. Applications you have already received are kept. A live job cannot be saved as a draft, only sent for review or closed.",
          "A draft, or a job we sent back, is edited in the same way and does not go offline, because it is not live.",
        ],
        steps: [
          "Open your dashboard and find the job under **Your jobs**.",
          "Press **Edit**.",
          "Change what you need. The page reminds you that the job goes offline until our team has read the changes.",
          "Press **Send my changes for review**.",
        ],
        links: [{ label: "Your dashboard", href: "/clinic" }],
      },
      {
        id: "read-and-manage-applicants",
        title: "How do I read and manage applicants, one at a time?",
        answer: [
          "We email you about new applicants as often as you chose under Email choices, and the email has no personal details in it. The applicants are always on your dashboard, newest first. Opening an application marks it **Viewed**, so the candidate can see it has been read. Then you can read the cover letter and details, download the CV, and move the application along.",
          "When you move an application, the candidate is told by email, unless they turned those emails off, and they can always see the update in their account. An interview, an offer, a kind no, role filled and kept for future roles each need a message, and there is a kind one ready for you to edit. Fill in any details shown in square brackets before you send. **Kept for future roles** is only offered if the candidate agreed to that when they applied. Shortlisting does not need a message, but when you shortlist one person this way they are still emailed.",
          "Your private notes on an application are for you. The candidate never sees them. Kestrel does not use AI to rank applicants, so the list shows everyone in the order they applied.",
        ],
        steps: [
          "On your dashboard, press **Applicants** next to the job. It appears once someone has applied, and the number in brackets is how many have applied and how many are new.",
          "Use the tabs **All**, **In review**, **Interviews**, **Offers** and **Closed** to narrow the list.",
          "Choose **Open** on an application to read their cover letter and details. Use **Download their CV** to open the CV.",
          "Under **Update this application**, choose a step from **Move this application to**. For a kind no, choose **Not selected this time**. For an interview, choose **Interview**. Choose **Shortlisted** to keep them in the running.",
          "Check the message and edit it if you like.",
          "Press **Save and tell the candidate**.",
          "To keep a private note, write it in **Private notes** and press **Save note**.",
        ],
        links: [{ label: "Your dashboard", href: "/clinic" }],
      },
      {
        id: "bulk-actions-on-applicants",
        title: "How do I shortlist, invite or decline several applicants at once?",
        answer: [
          "On the applicants list, tick the boxes next to the people you want, then use the panel **With the ticked applicants**. Only applications still waiting can be ticked: Applied, Viewed and Shortlisted. You can act on up to 100 at a time.",
          "**Shortlist** sends no email. It is your own working list, and the candidate sees the step in their account. **Invite to interview** sends everyone you ticked the same message, by email and in their account, so write the date, time and how to join in the **Interview invitation** box first. For different times, open each application instead. **Send a kind no** gives each person the same warm message you would send one at a time.",
          "Offers are never made in bulk. Open the application to make one. Applicants who are already at the interview or offer step cannot be ticked.",
        ],
        steps: [
          "Open the applicants list for the job.",
          "Tick the box next to each applicant you want to include.",
          "For an interview, write your invitation in the **Interview invitation** box first.",
          "Press **Shortlist**, **Invite to interview** or **Send a kind no**.",
          "The page confirms how many were moved. Anyone who was already at that step, or who had withdrawn, is left as they were.",
        ],
        links: [{ label: "Your dashboard", href: "/clinic" }],
      },
      {
        id: "extend-close-fill-and-post-again",
        title: "How do I extend, close, mark filled and post again?",
        answer: [
          "**Extend.** In the last 7 days of a live job, and for 7 days after it ends, an **Extend 30 days** button appears on your dashboard. It puts the job straight back up with the same wording and no new review. Extending is free while we launch. We also email you 3 days before a job ends, and the email links to a page where you can say it is filled or extend it.",
          "**Mark filled.** When you have found someone, press **Filled it?** next to the job, say how you found the person if you like, and confirm. That closes the job and tells everyone still waiting, kindly, that it has been filled. People at the interview or offer step are not changed. The same choice is on the applicants page as **Role filled?**",
          "**Close.** **Close** takes a job off Kestrel without messaging anyone, and keeps the record so candidates can still see that they applied. A job that was never live and has no applicants shows **Delete** instead.",
          "**Post again.** A closed or ended job has a **Post again** button. It copies the job into a new draft, which you can change and send for review like any other. It counts towards your 10 open jobs.",
        ],
        steps: [
          "Open your dashboard and find the job under **Your jobs**.",
          "To extend, press **Extend 30 days**. To mark it filled, press **Filled it?**, then **Yes, it's filled**.",
          "To close it without telling anyone, press **Close**.",
          "To post it again later, press **Post again** on the closed or ended job, then finish the draft and submit it.",
        ],
        links: [{ label: "Your dashboard", href: "/clinic" }],
      },
      {
        id: "claim-a-listing",
        title: "How do I claim a listing you found?",
        answer: [
          "If we found one of your jobs on your own careers page and listed it, you can claim it. Claiming makes your clinic the owner of the listing: applications arrive in your dashboard with the CV and cover letter, you can close the job whenever you like, and you can post new ones. It is free during the launch. It must be claimed with a clinic account, and a person who already has a clinic profile cannot take over another clinic's listing. Write to hello@eyecarejobs.ca and we will help.",
          "We check every claim, usually within 1 business day, and email you when it is approved or if we cannot approve it. The link in the verification email works for 2 days, and only for the account that made the claim.",
        ],
        steps: [
          "Open the job. It carries the label \"Found on the clinic's website, not yet claimed\".",
          "Choose **Is this your clinic? Claim this listing**.",
          "Choose **Create a clinic account**, or **I already have one** to sign in. A new account needs its email confirmed before you come back.",
          "Type your **Work email**, using an address at your clinic's own website, and your role at the clinic. Tick the box saying you are authorised to post for the clinic. Press **Send my verification email**.",
          "If you do not have an address at the clinic's website, tick that box instead and explain how we can confirm you work there. Press **Send my claim for checking**, and a person will check by hand.",
          "Open the email, follow the link and press **Confirm my claim**.",
          "Wait for our team's check. When it is approved, the listing is yours to manage from your dashboard.",
        ],
      },
      {
        id: "job-templates",
        title: "How do job templates work?",
        answer: [
          "A template is a saved post you can start from next time, so you do not type the same job again. You can keep up to 20. Saving a template with a name you already use replaces that one. The 2 quick questions are never kept, so you answer them fresh for each post, and you should check every detail before you send.",
        ],
        steps: [
          "To save one while posting, tick **Also keep this as a template** near the bottom of the Post a job form, and give it a name. To save a job you have already submitted, press **Save as template** next to it on your dashboard.",
          "To use one, choose **Post a job**. Under **Start from a template**, press **Use this** next to the one you want. The form is filled in for you.",
          "Check every detail, answer the 2 questions again and submit as usual. Choose **Start blank instead** to ignore the template.",
          "To remove a template, press **Delete** next to it under **Start from a template**.",
        ],
        links: [{ label: "Post a job", href: "/clinic/jobs/new" }],
      },
      {
        id: "views-and-apply-clicks",
        title: "What do views and apply clicks mean on my dashboard?",
        answer: [
          "A **view** is counted each time a job page is opened in a browser tab. An **apply click** is counted when someone presses the Apply button on the job page. The tiles at the top of your dashboard show the last 30 days across all your jobs, and each job shows its own total underneath, or \"No views yet\".",
          "Visits from search engines and link previews are left out, and so are your own visits and our team's. Nothing about the visitor is stored. The counts are guidance, not exact numbers: someone who opens the job in several tabs or on several devices is counted more than once. An apply click is not an application, because a person may press the button and not finish. The number of applicants is the figure to trust.",
        ],
        links: [{ label: "Your dashboard", href: "/clinic" }],
      },
    ],
  },
];
