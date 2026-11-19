# Licence numbers on candidate profiles: research and plan (19th November 2026)

Decided with Steve (19th November 2026): ask for the licence number on the candidate profile, not at sign up. It is self reported and shown to the clinic inside an application, labelled "entered by the candidate, not checked by Kestrel". Kestrel never looks a number up itself (no automated collection from college registers). Next to the number is a small button with the external link icon (an arrow leaving a box) that opens the college's public register in a new tab, so the clinic can check it. Required to apply for optometrist jobs, and for optician jobs where the province regulates opticians. Research below, 2 provinces first (Ontario and BC), the rest to follow.

## British Columbia (confirmed from the regulator's own site)

- Since 28th June 2024 optometrists and opticians are regulated by the **College of Health and Care Professionals of BC (CHCPBC)**, which replaced the College of Opticians of BC and the College of Optometrists of BC (and others). Old college names and links are out of date.
- Public registry (labelled "View Public Registry" on chcpbc.org): https://chcpbc.alinityapp.com/client/publicdirectory . It shows licence status, certifications, and any limits or conditions. CHCPBC's licence verification page says a person can be searched by name or licence number (that page's address returned an error when fetched, so check the wording by hand).
- Optician categories on CHCPBC's application form: **Optician/contact lens fitter**; **Optician with refracting certification**; **Optician/contact lens fitter with refracting certification**. CHCPBC says an optician needs additional training and an additional licence to use the title "contact lens fitter", and the Opticians Regulation restricts contact lens fitting to contact lens fitters or people supervised by one. So in BC, "contact lens fitter" is a real licence level, and "optician only" is possible.
- Sources: chcpbc.org (home page, Opticianry application form), BC Opticians Regulation (gov.bc.ca).

## Ontario

- Optometrists: **College of Optometrists of Ontario**, register called "Find an Optometrist", linked from collegeoptom.on.ca: https://members.collegeoptom.on.ca/COO/PublicDirectory/Public_Directory_Member/Public_Register/PublicRegisterMember.aspx
- Opticians: **College of Opticians of Ontario**, public register: https://members.collegeofopticians.ca/Public-Register
- Opticians' registration classes (O. Reg. 869/93 under the Opticianry Act, 1991): registered optician, registered student optician, registered intern optician, emergency optician. A registered optician may dispense contact lenses, eye glasses and subnormal vision devices, on the prescription of an optometrist or physician, subject to conditions on their certificate. There is no separate "contact lens fitter only" class in Ontario in what I found, so the dual licence question does not arise in the same way as in BC. A student optician dispenses only under a registered optician.
- **Not confirmed:** I could not open either Ontario register page from this session (the sites are outside the session's allowed network), so I have not confirmed what each register shows, or whether it can be searched by registration number. Steve to open both and say what the search boxes are called and whether a registration number appears.

## What this means for the build

- The licence number field needs a province, since the college and the register differ. Ontario and BC have 1 register link per profession. BC has 1 shared registry for both.
- A licence level choice ("contact lens fitter only", "optician with contact lens fitting") is needed for BC. Ontario needs none beyond registered optician (students and interns are a separate question for the apply rule).
- Other provinces still to research. Some may not regulate opticians at all, in which case the field is not shown.
- Open: the exact label each college uses for the number (registration number, licence number, member number), so the form uses the right word.
