# Checking uploaded CVs for harmful files

A CV is a file from a stranger, opened by a clinic on its own computer. Here is what we do now, what is still missing, and the choices for the missing part.

## What is done now

- **Only 3 kinds of file are accepted** (PDF, .docx and .doc), checked by what is inside the file and not just its name, and no bigger than 3 MB.
- **Macros, scripts and embedded programs are refused.** The check looks for the things most harmful CVs depend on: scripts and launch actions in a PDF, macros and embedded objects in a Word file. A person who is refused is told to save their CV as a plain PDF.
- **CVs are never opened or processed by our servers,** so a harmful file cannot attack Kestrel itself.
- **They sit in a private store** and open only through a download link that works for 1 minute. They download as a file, and are never shown inside a Kestrel page.
- **Clinics are told** next to every download that no file can be promised safe, to open it in their usual viewer, and to report anything odd.

## What is still missing

The check cannot see inside compressed parts of a file, so a determined attacker could get past it. A real antivirus scan is the missing piece. Before launch, choose one:

| Option | What it is | Good | Not so good |
| --- | --- | --- | --- |
| **A. Our own scanner** | A small ClamAV virus scanner running as its own tiny service (on a cloud provider's smallest plan). Each CV is scanned when uploaded. | CVs never leave our control or Canada if the service is placed in a Canadian region. Cheap, from a few dollars to about $15 a month (check current prices). | Someone has to set it up and keep its virus list up to date. I can build and document it. |
| **B. A paid scanning service** | A company's virus scanning service that we send each file to. | Least work. | CVs go to another company, probably outside Canada. It needs a privacy policy change, and a check of what the company keeps. |
| **C. Accept PDFs only** | Remove Word files. | Removes the biggest risk, because macros live in Word. | Some candidates only have Word, and it still does not cover PDF tricks. |
| **D. Do nothing more** | Keep the checks above. | No cost. | Weakest. Not enough once there are many clinics. |

**Do not use** a public scanning site such as VirusTotal for CVs. Files sent there are shared with the security community.

## Recommendation

Choose **A** before launch, with the checks above kept as a first filter. It keeps CVs in our hands and in Canada, and costs little. Until then, the checks above plus the note to clinics are reasonable for a small private launch.
