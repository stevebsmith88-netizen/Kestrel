#!/usr/bin/env python3
"""Builds docs/market-count-sheet.xlsx: the weekly count sheet Steve fills in by hand. Run from the repository root."""
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as L

NAVY, CREAM, INPUT, GREY = "1B2B4B", "F7F1E6", "FFF6D6", "DCE3E6"
head = PatternFill("solid", fgColor=NAVY); cream = PatternFill("solid", fgColor=CREAM); inp = PatternFill("solid", fgColor=INPUT); grey = PatternFill("solid", fgColor=GREY)
white = Font(bold=True, color="FFFFFF"); bold = Font(bold=True); title = Font(bold=True, size=15, color=NAVY)
thin = Side(style="thin", color="C9CED3"); box = Border(left=thin, right=thin, top=thin, bottom=thin)
wrap = Alignment(wrap_text=True, vertical="top")

wb = Workbook()

# ------------------------------------------------------------------ Read me
r = wb.active; r.title = "Read me"
r["A1"] = "Eye care job counts, by hand"; r["A1"].font = title
lines = [
    ("Why", "To estimate how many eye care roles are advertised in Canada in a year. The home page says 2,000+, which is a deliberately cautious floor. These counts show whether the real figure is higher."),
    ("How often", "Today, then once a week on the same weekday, for at least 4 weeks (the sheet has room for 8)."),
    ("The rules", "COUNTS ONLY. Read a number off the screen and type it in. Do not copy, save or paste any ad, name or employer. No scraping, no automation, no browser extensions that collect results. Do not use anything from your employer's own member job board or any member only information."),
    ("Keep it identical", "Use exactly the same searches, wording and place every week, and pick the same weekday. Do not change a search in the middle of the 4 weeks, or the weeks cannot be compared."),
    ("Indeed", "Search the job title (use the words in column B), with the place set to Canada. Type the total shown (for example '214 jobs') into the Open column. Then set the filter 'Date posted' to 'Last 7 days' and type that total into the New 7 days column."),
    ("Jobs4ECPs and Job-Opportunities (OSI)", "Use only what any visitor can see on the public pages, with no sign in and no member access. Type the total number of open ads into Open. If the site lets you sort by date or filter to the last 7 days, type that count into New 7 days. If not, leave it blank. Never use anything from a members only board."),
    ("Relevance check (once)", "Look at the first 20 results of any one Indeed search. Count how many really are eye care roles, and put that as a share (for example 16 of 20 is 0.8) into the Summary sheet, cell B7. Searches pull in some unrelated jobs, so this keeps the estimate honest."),
    ("Yellow cells", "Yellow cells are for you. On the Summary sheet the yellow cells are guesses. Change them if you know better, and they will update the answer."),
    ("What the Summary tells you", "Two estimates of roles advertised in a year: one from how many NEW ads appear each week, and one from how many are OPEN at a time and how long an ad stays up. If they roughly agree, trust them more. Neither is exact."),
    ("Before changing the website", "Do not change the number on the home page from these counts alone. Send the Summary to Claude and we will decide together, and note the method in docs/market-sizing.md."),
]
for i, (k, v) in enumerate(lines, start=3):
    r.cell(i, 1, k).font = bold; r.cell(i, 1).alignment = wrap; r.cell(i, 1).fill = cream
    r.cell(i, 2, v).alignment = wrap
    r.row_dimensions[i].height = 62 if len(v) > 190 else 46 if len(v) > 110 else 32
r.column_dimensions["A"].width = 24; r.column_dimensions["B"].width = 110

# ------------------------------------------------------------------ Counts
c = wb.create_sheet("Counts")
c["A1"] = "Weekly counts"; c["A1"].font = title
c["A2"] = "Type the date above each pair (for example 7th Nov 2026), then fill the yellow cells. Open = total shown. New 7 days = shown after filtering to the last 7 days."
rows = [
    ("Jobs4ECPs", "All jobs", "Canada"),
    ("Job-Opportunities (OSI)", "All jobs", "Canada"),
    ("Indeed", "optometrist", "Canada"),
    ("Indeed", "optician", "Canada"),
    ("Indeed", "optometric assistant", "Canada"),
    ("Indeed", "optometric technician", "Canada"),
    ("Indeed", "ophthalmic assistant", "Canada"),
    ("Indeed", "optical manager", "Canada"),
    ("Indeed", "eye care clinic", "Canada"),
    ("(your own)", "", "Canada"),
]
WEEKS = 8
first, last = 5, 5 + len(rows) - 1
total_row = last + 2
for col, h in enumerate(["Site", "Search", "Where"], start=1):
    cell = c.cell(4, col, h); cell.font = white; cell.fill = head; cell.border = box
for w in range(WEEKS):
    o, n = 4 + 2 * w, 5 + 2 * w
    c.merge_cells(start_row=3, start_column=o, end_row=3, end_column=n)
    d = c.cell(3, o, None); d.fill = inp; d.border = box; d.alignment = Alignment(horizontal="center"); d.number_format = "d mmm yyyy"
    for col, label in ((o, f"Wk {w+1} open"), (n, f"Wk {w+1} new 7 days")):
        cell = c.cell(4, col, label); cell.font = white; cell.fill = head; cell.border = box; cell.alignment = Alignment(horizontal="center", wrap_text=True)
        c.column_dimensions[L(col)].width = 12
for i, (site, search, where) in enumerate(rows):
    row = first + i
    for col, v in enumerate((site, search, where), start=1):
        cell = c.cell(row, col, v); cell.border = box; cell.fill = cream if v else inp
    for col in range(4, 4 + 2 * WEEKS):
        cell = c.cell(row, col); cell.fill = inp; cell.border = box; cell.number_format = "#,##0"
c.cell(total_row, 1, "Total, all rows").font = bold
for w in range(WEEKS):
    for col in (4 + 2 * w, 5 + 2 * w):
        rng = f"{L(col)}{first}:{L(col)}{last}"
        cell = c.cell(total_row, col, f'=IF(COUNT({rng})=0,"",SUM({rng}))'); cell.font = bold; cell.fill = grey; cell.border = box; cell.number_format = "#,##0"
c.cell(total_row + 2, 1, "Notes for each week (anything odd: a holiday, a site change, a search that behaved differently):").font = bold
c.cell(total_row + 3, 1).fill = inp
c.merge_cells(start_row=total_row + 3, start_column=1, end_row=total_row + 5, end_column=3 + 2 * WEEKS)
c.cell(total_row + 3, 1).alignment = wrap
c.column_dimensions["A"].width = 24; c.column_dimensions["B"].width = 26; c.column_dimensions["C"].width = 10
c.row_dimensions[4].height = 32; c.freeze_panes = "D5"

# ------------------------------------------------------------------ Summary
s = wb.create_sheet("Summary")
s["A1"] = "What your counts say"; s["A1"].font = title
open_cells = ",".join(f"Counts!{L(4+2*w)}{total_row}" for w in range(WEEKS))
new_cells = ",".join(f"Counts!{L(5+2*w)}{total_row}" for w in range(WEEKS))
s["A3"] = "From your counts"; s["A3"].font = bold
s["A4"] = "Weeks filled in"; s["B4"] = f"=COUNT({open_cells})"
s["A5"] = "Average ads open at a time (all searches added)"; s["B5"] = f'=IF(B4=0,"",AVERAGE({open_cells}))'
s["A6"] = "Average new ads a week (all searches added)"; s["B6"] = f'=IF(COUNT({new_cells})=0,"",AVERAGE({new_cells}))'
s["A8"] = "Guesses (yellow, change them if you know better)"; s["A8"].font = bold
# the labels sit one row above the cells used in formulas, so keep references explicit
s["A9"] = "Share of results that really are eye care roles (do the 20 result check)"; s["B9"] = 0.8
s["A10"] = "Share that are different ads (the same job appears under several searches, reposts or both sites)"; s["B10"] = 0.7
s["A11"] = "Share of all advertised eye care roles that appear on these 2 sites"; s["B11"] = 0.6
s["A12"] = "How many days a typical ad stays up"; s["B12"] = 30
for ref in ("B9", "B10", "B11", "B12"):
    s[ref].fill = inp; s[ref].border = box
for ref in ("B9", "B10", "B11"):
    s[ref].number_format = "0%"
s["A14"] = "Estimates of eye care roles advertised in Canada in a year"; s["A14"].font = bold
s["A15"] = "A. From new ads each week  (new a week x 52)"; s["B15"] = '=IF(B6="","",ROUND(B6*52*B9*B10/B11,-2))'
s["A16"] = "B. From ads open at a time  (open / days up x 365)"; s["B16"] = '=IF(B5="","",ROUND(B5/B12*365*B9*B10/B11,-2))'
for ref in ("B15", "B16"):
    s[ref].font = Font(bold=True, size=13, color="A4502C"); s[ref].number_format = "#,##0"; s[ref].fill = grey; s[ref].border = box
s["A18"] = "Where that sits against the website"; s["A18"].font = bold
s["A19"] = "Home page figure (a cautious floor)"; s["B19"] = 2000
s["A20"] = "Central case in docs/market-sizing.md"; s["B20"] = 4000
s["A21"] = "Higher turnover case, top of range"; s["B21"] = 12500
for ref in ("B19", "B20", "B21"):
    s[ref].number_format = "#,##0"
s["A22"] = "Verdict on estimate A"
s["B22"] = '=IF(B15="","Fill in the counts first",IF(B15>=B21,"Above even the higher turnover case",IF(B15>=B20,"Above the central case, in the higher turnover range",IF(B15>=B19,"Between the 2,000 floor and the 4,000 central case","Below the 2,000 floor: check the guesses and the counts"))))'
s["A23"] = "Do A and B roughly agree?"
s["B23"] = '=IF(OR(B15="",B16=""),"",IF(MAX(B15,B16)/MIN(B15,B16)<=1.5,"Yes, within half of each other","No: they differ by more than half. Treat both with care"))'
s["A25"] = "These are rough. The weekly count of NEW ads is the more reliable of the two. Send this sheet to Claude when you have 4 weeks."
s["A25"].alignment = wrap; s.merge_cells("A25:B27")
s.column_dimensions["A"].width = 78; s.column_dimensions["B"].width = 58
for row in s.iter_rows(min_row=3, max_row=23):
    for cell in row:
        if cell.column == 1: cell.alignment = wrap

wb.move_sheet("Summary", offset=0)
wb.save("docs/market-count-sheet.xlsx")
print("saved", total_row)
