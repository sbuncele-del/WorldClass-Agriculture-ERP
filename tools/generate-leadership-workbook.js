#!/usr/bin/env node

/**
 * The Succession Covenant - Leadership Workbook
 * A printable journal with writing spaces for daily practice
 * Designed for pen and paper use
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Helper to create lined writing space
function createLines(count, label = '') {
  let lines = '';
  if (label) {
    lines += `<div class="line-label">${label}</div>`;
  }
  for (let i = 0; i < count; i++) {
    lines += '<div class="writing-line"></div>';
  }
  return lines;
}

// Helper to create a checkbox item
function createCheckbox(text) {
  return `<div class="checkbox-item"><span class="checkbox">☐</span> ${text}</div>`;
}

// Helper to create date field
function createDateField(label = 'Date') {
  return `<div class="date-field"><span class="date-label">${label}:</span> <span class="date-line">____________________</span></div>`;
}

const HTML_CONTENT = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');

        @page {
            size: A4;
            margin: 15mm;
        }

        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.4;
            color: #1f2937;
            margin: 0;
            padding: 0;
            font-size: 11pt;
        }

        .page {
            page-break-after: always;
            min-height: 257mm;
            padding: 5mm 0;
        }

        .page:last-child {
            page-break-after: auto;
        }

        /* Cover Page */
        .cover-page {
            height: 267mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            background: white;
            margin: -15mm;
            padding: 20mm;
            color: #1f2937;
            page-break-after: always;
        }

        .cover-title {
            font-family: 'Cinzel', serif;
            font-size: 32px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 10px;
            letter-spacing: 3px;
        }

        .cover-subtitle {
            font-size: 18px;
            color: #4b5563;
            margin-bottom: 40px;
        }

        .cover-box {
            border: 2px solid #1e3a8a;
            padding: 30px 50px;
            border-radius: 8px;
            margin: 30px 0;
        }

        .cover-label {
            font-size: 12px;
            color: #4b5563;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .cover-input {
            border-bottom: 2px solid #1e3a8a;
            min-width: 250px;
            height: 30px;
            margin: 10px 0;
        }

        .cover-tagline {
            margin-top: 50px;
            font-size: 14px;
            color: #1e3a8a;
            letter-spacing: 3px;
            text-transform: uppercase;
        }

        /* Section Headers */
        .section-header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 100%);
            color: white;
            padding: 20px;
            margin: -5mm -15mm 20px -15mm;
            text-align: center;
        }

        .section-title {
            font-family: 'Cinzel', serif;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .section-subtitle {
            font-size: 12px;
            opacity: 0.8;
        }

        /* Page Headers */
        .page-header {
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        .page-title {
            font-size: 18px;
            font-weight: 700;
            color: #1e3a8a;
        }

        .page-subtitle {
            font-size: 11px;
            color: #6b7280;
        }

        /* Writing Lines */
        .writing-line {
            border-bottom: 1px solid #d1d5db;
            height: 28px;
            margin: 0;
        }

        .writing-line-dark {
            border-bottom: 1px solid #9ca3af;
            height: 28px;
            margin: 0;
        }

        .line-label {
            font-size: 10px;
            color: #6b7280;
            margin-top: 15px;
            margin-bottom: 3px;
            font-weight: 600;
            text-transform: uppercase;
        }

        /* Checkboxes */
        .checkbox-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            font-size: 11px;
        }

        .checkbox {
            font-size: 16px;
            margin-right: 10px;
            color: #1e3a8a;
        }

        /* Date Fields */
        .date-field {
            margin: 10px 0;
        }

        .date-label {
            font-weight: 600;
            color: #374151;
        }

        .date-line {
            border-bottom: 1px solid #9ca3af;
            display: inline-block;
            min-width: 150px;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 10px;
        }

        th {
            background: #1e3a8a;
            color: white;
            padding: 8px;
            text-align: left;
            font-weight: 600;
        }

        td {
            padding: 12px 8px;
            border: 1px solid #d1d5db;
            vertical-align: top;
        }

        td.write-cell {
            height: 40px;
        }

        td.write-cell-large {
            height: 60px;
        }

        /* Declarations Box */
        .declaration-box {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #1e3a8a;
            padding: 15px;
            margin: 15px 0;
            font-style: italic;
            font-size: 11px;
            line-height: 1.6;
        }

        .declaration-title {
            font-weight: 700;
            color: #1e3a8a;
            font-style: normal;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-size: 10px;
        }

        /* Quote Box */
        .quote-box {
            background: #faf5ff;
            border-left: 4px solid #7c3aed;
            padding: 12px 15px;
            margin: 15px 0;
            font-style: italic;
            font-size: 11px;
        }

        /* Two Column */
        .two-column {
            display: flex;
            gap: 20px;
        }

        .column {
            flex: 1;
        }

        /* Rating Scale */
        .rating-row {
            display: flex;
            align-items: center;
            margin: 10px 0;
            font-size: 11px;
        }

        .rating-label {
            width: 150px;
            font-weight: 500;
        }

        .rating-scale {
            display: flex;
            gap: 8px;
        }

        .rating-circle {
            width: 24px;
            height: 24px;
            border: 2px solid #1e3a8a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #1e3a8a;
        }

        /* Time Box */
        .time-box {
            display: inline-block;
            border: 1px solid #d1d5db;
            padding: 3px 10px;
            margin-right: 10px;
            font-size: 10px;
            min-width: 60px;
            text-align: center;
        }

        /* Instruction Text */
        .instruction {
            font-size: 10px;
            color: #6b7280;
            font-style: italic;
            margin: 5px 0;
        }

        /* Big Number */
        .big-number {
            font-size: 36px;
            font-weight: 800;
            color: #1e3a8a;
            text-align: center;
            margin: 10px 0;
        }

        /* Divider */
        .divider {
            border-top: 1px solid #e5e7eb;
            margin: 20px 0;
        }

        .divider-thick {
            border-top: 2px solid #1e3a8a;
            margin: 20px 0;
        }

        /* Footer */
        .page-footer {
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
        }

        /* Compact mode for dense pages */
        .compact .writing-line {
            height: 24px;
        }

        .compact .checkbox-item {
            margin: 5px 0;
        }

        /* Grid for multiple entries */
        .entry-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .entry-box {
            border: 1px solid #e5e7eb;
            padding: 10px;
            background: #fafafa;
        }

        .entry-number {
            font-size: 14px;
            font-weight: 700;
            color: #1e3a8a;
            margin-bottom: 5px;
        }

    </style>
</head>
<body>

<!-- ==================== COVER PAGE ==================== -->
<div class="cover-page">
    <div class="cover-title">LEADERSHIP WORKBOOK</div>
    <div class="cover-subtitle">The Succession Covenant — Daily Practice Journal</div>
    
    <div class="cover-box">
        <div class="cover-label">This Workbook Belongs To</div>
        <div class="cover-input"></div>
        
        <div class="cover-label" style="margin-top: 30px;">Started On</div>
        <div class="cover-input"></div>
        
        <div class="cover-label" style="margin-top: 30px;">Completed On</div>
        <div class="cover-input"></div>
    </div>
    
    <div class="cover-tagline">This Is How We Take Over</div>
</div>

<!-- ==================== DOCUMENT CONTROL ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">DOCUMENT CONTROL</div>
        <div class="section-subtitle">Track the evolution of this living document</div>
    </div>
    
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt;">
        <thead>
            <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; width: 15%;">Version</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; width: 20%;">Date</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left;">Description of Changes</th>
                <th style="padding: 8px; border: 1px solid #d1d5db; text-align: left; width: 20%;">Author</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 8px; border: 1px solid #d1d5db;">1.0</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">2024-01-01</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">Initial Release</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">System</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #d1d5db;">1.1</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">2026-01-06</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">Updated Declarations & Cover Page</td>
                <td style="padding: 8px; border: 1px solid #d1d5db;">Leadership Team</td>
            </tr>
        </tbody>
    </table>
</div>

<!-- ==================== DECLARATIONS REFERENCE ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">THE DECLARATIONS</div>
        <div class="section-subtitle">Read these aloud every morning — speak with conviction</div>
    </div>

    <div class="declaration-box">
        <div class="declaration-title">The Identity Declaration</div>
        <p>"I am a god, ordained by the Divine Gods, to represent and reign and flourish here on earth.</p>
        <p>I master my circumstances. I am a creator of reality.<br>
        I transcend all limitations. I am a vessel of infinite possibility.</p>
        <p>I was born for this moment. I was prepared for this assignment. I was chosen for this mission.</p>
        <p>I accept my calling. I embrace my destiny. I rise to my purpose."</p>
    </div>

    <div class="declaration-box">
        <div class="declaration-title">The Heritage Declaration</div>
        <p>"I am a god, son of the Most High.</p>
        <p>I was born to rule and to reign on earth without any condemnation.</p>
        <p>I carry the DNA of dominion. I walk in the authority of my lineage.</p>
    </div>

    <div class="declaration-box">
        <div class="declaration-title">The Vision Declaration</div>
        <p>"I see clearly.</p>
        <p>I see the vision that was entrusted to me. I see nations transformed.<br>
        I see systems renewed. I see humanity flourishing under righteous stewardship.</p>
        <p>What I see, I will pursue. What I perceive, I will possess. What I envision, I will manifest.</p>
        <p>My eyes are open. My vision is clear. My path is illuminated."</p>
    </div>

    <div class="declaration-box">
        <div class="declaration-title">The Word Declaration</div>
        <p>"My words are creative forces.</p>
        <p>I speak life, not death. I speak abundance, not scarcity.<br>
        I speak possibility, not limitation. I speak victory, not defeat.</p>
        <p>My yes is yes. My no is no. What I declare, I deliver. What I promise, I perform.</p>
        <p>I shape my world through my words. Today, I speak only that which builds."</p>
    </div>
</div>

<div class="page">
    <div class="declaration-box">
        <div class="declaration-title">The Mind Declaration</div>
        <p>"My mind is the cultivator of my future.</p>
        <p>I guard what enters it. I direct what occupies it. I harvest what grows within it.</p>
        <p>I think in generations, not moments. I think in possibilities, not problems.<br>
        I think in solutions, not obstacles.</p>
        <p>My mind is disciplined. My thoughts are intentional. My future is cultivated."</p>
    </div>

    <div class="declaration-box">
        <div class="declaration-title">The Mission Declaration</div>
        <p>"I am called to govern, to rule, to empower.</p>
        <p>Not for my own glory, but for the flourishing of humanity.<br>
        Not for my own wealth, but for the prosperity of nations.<br>
        Not for my own name, but for the continuation of eternal purpose.</p>
        <p>This mission will outlive me by a thousand years. I am a faithful link in an eternal chain.</p>
        <p><strong>This is how we take over.</strong></p>
        <p>So it is spoken. So it shall be."</p>
    </div>

    <div class="declaration-box">
        <div class="declaration-title">The Alignment Declaration</div>
        <p>"God is the Power. I am the Vision. We are the Team.</p>
        <p>I am a faithful link in an eternal chain.</p>
        <p>Power flows through the Vision. The Team executes the Vision.<br>
        Together, we manifest the Kingdom."</p>
    </div>

    <div class="divider-thick"></div>

    <div class="declaration-box">
        <div class="declaration-title">The Evening Declaration</div>
        <p>"I release this day. What was done is done. What was not done will wait.</p>
        <p>I am grateful for breath, for life, for purpose.</p>
        <p>As I sleep, my mind will process and organize.<br>
        As I sleep, wisdom will be deposited. As I sleep, the vision will clarify.</p>
        <p>Tomorrow, I rise again to fulfill my calling.</p>
        <p><strong>This is how we take over.</strong>"</p>
    </div>
</div>

<!-- ==================== DAILY PAGES (30 days worth) ==================== -->
${generateDailyPages(30)}

<!-- ==================== WEEKLY REVIEW PAGES (4 weeks) ==================== -->
${generateWeeklyPages(4)}

<!-- ==================== MONTHLY EVALUATION ==================== -->
${generateMonthlyEvaluation()}

<!-- ==================== GRATITUDE LOG ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">GRATITUDE LOG</div>
        <div class="section-subtitle">Three things you're grateful for each day</div>
    </div>

    <table>
        <tr>
            <th style="width: 80px;">Date</th>
            <th>Gratitude 1</th>
            <th>Gratitude 2</th>
            <th>Gratitude 3</th>
        </tr>
        ${generateGratitudeRows(15)}
    </table>
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Gratitude Log (Continued)</div>
    </div>

    <table>
        <tr>
            <th style="width: 80px;">Date</th>
            <th>Gratitude 1</th>
            <th>Gratitude 2</th>
            <th>Gratitude 3</th>
        </tr>
        ${generateGratitudeRows(16)}
    </table>
</div>

<!-- ==================== VISION JOURNAL ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">VISION JOURNAL</div>
        <div class="section-subtitle">What do you see? Write the vision in detail.</div>
    </div>

    <div class="quote-box">
        "Write the vision and make it plain on tablets, that he may run who reads it." — Habakkuk 2:2
    </div>

    <div class="line-label">10-Year Vision — What do you see?</div>
    ${createLines(12)}

    <div class="line-label">25-Year Vision — What legacy are you building?</div>
    ${createLines(10)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Vision Journal (Continued)</div>
    </div>

    <div class="line-label">100-Year Vision — What will remain after you are gone?</div>
    ${createLines(10)}

    <div class="line-label">What must happen THIS YEAR to move toward this vision?</div>
    ${createLines(8)}

    <div class="line-label">What must happen THIS MONTH?</div>
    ${createLines(6)}
</div>

<!-- ==================== WISDOM CODEX ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">WISDOM CODEX</div>
        <div class="section-subtitle">Key quotes and principles from your study</div>
    </div>

    ${generateWisdomEntry(1)}
    ${generateWisdomEntry(2)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Wisdom Codex (Continued)</div>
    </div>
    ${generateWisdomEntry(3)}
    ${generateWisdomEntry(4)}
    ${generateWisdomEntry(5)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Wisdom Codex (Continued)</div>
    </div>
    ${generateWisdomEntry(6)}
    ${generateWisdomEntry(7)}
    ${generateWisdomEntry(8)}
</div>

<!-- ==================== PEOPLE INVESTMENT TRACKER ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">PEOPLE INVESTMENT TRACKER</div>
        <div class="section-subtitle">Who are you developing? Track your investments.</div>
    </div>

    <table>
        <tr>
            <th style="width: 70px;">Date</th>
            <th style="width: 120px;">Person</th>
            <th style="width: 80px;">Type</th>
            <th>What was discussed / invested</th>
        </tr>
        ${generatePeopleRows(12)}
    </table>

    <div class="instruction">Type: DR = Direct Report, PR = Peer, SC = Successor Candidate, OT = Other</div>
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">People Investment Tracker (Continued)</div>
    </div>

    <table>
        <tr>
            <th style="width: 70px;">Date</th>
            <th style="width: 120px;">Person</th>
            <th style="width: 80px;">Type</th>
            <th>What was discussed / invested</th>
        </tr>
        ${generatePeopleRows(14)}
    </table>
</div>

<!-- ==================== COMMITMENT TRACKER ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">COMMITMENT TRACKER</div>
        <div class="section-subtitle">Your word is your bond. Track every promise.</div>
    </div>

    <table>
        <tr>
            <th style="width: 65px;">Date Made</th>
            <th style="width: 90px;">Made To</th>
            <th>Commitment</th>
            <th style="width: 60px;">Due</th>
            <th style="width: 50px;">Done</th>
        </tr>
        ${generateCommitmentRows(12)}
    </table>
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Commitment Tracker (Continued)</div>
    </div>

    <table>
        <tr>
            <th style="width: 65px;">Date Made</th>
            <th style="width: 90px;">Made To</th>
            <th>Commitment</th>
            <th style="width: 60px;">Due</th>
            <th style="width: 50px;">Done</th>
        </tr>
        ${generateCommitmentRows(14)}
    </table>
</div>

<!-- ==================== QUARTERLY RETREAT PLANNER ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">QUARTERLY RETREAT</div>
        <div class="section-subtitle">3-Day Strategic Reset</div>
    </div>

    ${createDateField('Retreat Dates')}
    <div class="line-label">Location</div>
    <div class="writing-line"></div>

    <div class="divider"></div>

    <div class="page-title" style="font-size: 14px; margin-bottom: 10px;">DAY 1: SEPARATION — "Where am I?"</div>

    <div class="line-label">Physical State (Energy, Health, Sleep) — Rate 1-10:</div>
    <div class="writing-line"></div>

    <div class="line-label">Mental State (Clarity, Focus, Anxiety) — Rate 1-10:</div>
    <div class="writing-line"></div>

    <div class="line-label">Emotional State (What dominates? Joy, fear, frustration, peace?)</div>
    ${createLines(3)}

    <div class="line-label">Spiritual State (Connection, Purpose, Alignment) — Rate 1-10:</div>
    <div class="writing-line"></div>

    <div class="line-label">Relational State (Key relationships — thriving or struggling?)</div>
    ${createLines(3)}

    <div class="line-label">Professional State (Organization health, team strength)</div>
    ${createLines(3)}
</div>

<div class="page">
    <div class="page-title" style="font-size: 14px; margin-bottom: 15px;">DAY 2: VISION — "Where am I going?"</div>

    <div class="line-label">Is my current vision still the right vision? What has changed?</div>
    ${createLines(4)}

    <div class="line-label">Where has my vision become unclear or fuzzy?</div>
    ${createLines(3)}

    <div class="line-label">What confirms the vision? What challenges it?</div>
    ${createLines(4)}

    <div class="divider"></div>

    <div class="line-label">QUARTERLY GOALS (3-5 maximum)</div>

    <table>
        <tr>
            <th style="width: 30px;">#</th>
            <th>Goal</th>
            <th style="width: 100px;">Key Result</th>
            <th style="width: 70px;">Owner</th>
        </tr>
        <tr><td>1</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>2</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>3</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>4</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>5</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
    </table>
</div>

<div class="page">
    <div class="page-title" style="font-size: 14px; margin-bottom: 15px;">DAY 3: COMMITMENT — "How will I get there?"</div>

    <div class="line-label">What must I STOP doing this quarter?</div>
    ${createLines(3)}

    <div class="line-label">What must I START doing this quarter?</div>
    ${createLines(3)}

    <div class="line-label">What must I CONTINUE (protect) this quarter?</div>
    ${createLines(3)}

    <div class="line-label">What must I DELEGATE this quarter?</div>
    ${createLines(3)}

    <div class="divider"></div>

    <div class="line-label">Successor Progress — What will I do this quarter to develop them?</div>
    ${createLines(3)}

    <div class="divider-thick"></div>

    <div class="declaration-box">
        <div class="declaration-title">Quarterly Covenant</div>
        <p>I commit to pursuing the goals outlined above with full dedication. I accept responsibility for the outcomes and will review progress honestly.</p>
    </div>

    <div style="margin-top: 20px;">
        <strong>Signed:</strong> _________________________ &nbsp;&nbsp;&nbsp; <strong>Date:</strong> _____________
    </div>
</div>

<!-- ==================== ANNUAL DECLARATION OF INTENT ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">ANNUAL DECLARATION OF INTENT</div>
        <div class="section-subtitle">What I will accomplish this year</div>
    </div>

    ${createDateField('Year')}

    <div class="line-label">SECTION 1: Review of Previous Year</div>
    <table>
        <tr>
            <th>Goal from Last Year</th>
            <th style="width: 80px;">Achieved?</th>
            <th>Explanation</th>
        </tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
    </table>

    <div class="line-label">SECTION 2: Vision Reaffirmation</div>
    <div class="instruction">In one paragraph, reaffirm the overarching vision and mission:</div>
    ${createLines(5)}

    <div class="line-label">SECTION 3: This Year's Goals (5-7 Maximum)</div>
    <table>
        <tr>
            <th>#</th>
            <th>Goal Statement</th>
            <th>How Measured</th>
            <th style="width: 70px;">Target Date</th>
        </tr>
        <tr><td>1</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>2</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>3</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
    </table>
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Declaration of Intent (Continued)</div>
    </div>

    <table>
        <tr>
            <th>#</th>
            <th>Goal Statement</th>
            <th>How Measured</th>
            <th style="width: 70px;">Target Date</th>
        </tr>
        <tr><td>4</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>5</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>6</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>7</td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
    </table>

    <div class="line-label">SECTION 4: Three Strategic Priorities for This Year</div>
    ${createLines(5)}

    <div class="line-label">SECTION 5: Personal Development Commitments</div>
    <div class="instruction">What will I study, develop, or change in myself?</div>
    ${createLines(4)}

    <div class="line-label">SECTION 6: Succession Progress</div>
    ${createLines(3)}

    <div class="divider-thick"></div>

    <div class="line-label">SECTION 7: Closing Declaration</div>
    <div class="declaration-box">
        <p>I declare these intentions before those who hold me accountable. I commit to pursuing them with excellence and reviewing them with honesty. My word is my bond.</p>
    </div>

    <div style="margin-top: 15px;">
        <strong>Signed:</strong> _________________________ &nbsp;&nbsp;&nbsp; <strong>Date:</strong> _____________
    </div>
</div>

<!-- ==================== PILGRIMAGE JOURNAL ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">PILGRIMAGE JOURNAL</div>
        <div class="section-subtitle">Annual 7-Day Journey</div>
    </div>

    ${createDateField('Pilgrimage Dates')}
    <div class="line-label">Destination</div>
    <div class="writing-line"></div>
    <div class="line-label">Why this location?</div>
    ${createLines(3)}

    <div class="divider"></div>

    <div class="quote-box">
        Carry these questions throughout your pilgrimage:<br>
        1. What does this place teach me about power?<br>
        2. What does this place teach me about time?<br>
        3. What does this place teach me about legacy?<br>
        4. What do I need to stop doing?<br>
        5. What do I need to start doing?<br>
        6. How must I change as a leader?<br>
        7. What is my message for the coming year?
    </div>

    <div class="line-label">DAY 1 — Arrival & First Impressions</div>
    ${createLines(6)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Pilgrimage Journal (Continued)</div>
    </div>

    <div class="line-label">DAY 2</div>
    ${createLines(8)}

    <div class="line-label">DAY 3</div>
    ${createLines(8)}

    <div class="line-label">DAY 4</div>
    ${createLines(8)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Pilgrimage Journal (Continued)</div>
    </div>

    <div class="line-label">DAY 5</div>
    ${createLines(8)}

    <div class="line-label">DAY 6</div>
    ${createLines(8)}

    <div class="line-label">DAY 7 — Final Day & Integration</div>
    ${createLines(8)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Pilgrimage Summary</div>
    </div>

    <div class="line-label">1. What did this place teach me about POWER?</div>
    ${createLines(4)}

    <div class="line-label">2. What did this place teach me about TIME?</div>
    ${createLines(4)}

    <div class="line-label">3. What did this place teach me about LEGACY?</div>
    ${createLines(4)}

    <div class="line-label">4. What must I STOP doing?</div>
    ${createLines(3)}

    <div class="line-label">5. What must I START doing?</div>
    ${createLines(3)}

    <div class="line-label">6. How must I CHANGE as a leader?</div>
    ${createLines(3)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Pilgrimage Summary (Continued)</div>
    </div>

    <div class="line-label">7. What is my MESSAGE for the coming year?</div>
    ${createLines(6)}

    <div class="divider-thick"></div>

    <div class="line-label">Key Insights to Carry Forward</div>
    ${createLines(8)}

    <div class="line-label">Commitments I Make as a Result of This Journey</div>
    ${createLines(6)}
</div>

<!-- ==================== NOTES PAGES ==================== -->
<div class="page">
    <div class="section-header">
        <div class="section-title">NOTES</div>
        <div class="section-subtitle">Space for additional reflection</div>
    </div>

    ${createLines(28)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Notes (Continued)</div>
    </div>
    ${createLines(30)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Notes (Continued)</div>
    </div>
    ${createLines(30)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Notes (Continued)</div>
    </div>
    ${createLines(30)}
</div>

<!-- ==================== CLOSING PAGE ==================== -->
<div class="page" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
    <div style="max-width: 400px;">
        <div class="quote-box" style="background: #f0f9ff; border-color: #1e3a8a;">
            "The principles only work<br>if you work them."
        </div>

        <div style="margin: 40px 0;">
            <div style="font-size: 24px; font-weight: 700; color: #1e3a8a; letter-spacing: 2px;">
                THIS IS HOW<br>WE TAKE OVER
            </div>
        </div>

        <div style="font-size: 11px; color: #6b7280; margin-top: 40px;">
            The Succession Covenant<br>
            Leadership Workbook<br><br>
            © Masaphokati Technologies (Pty) Ltd<br>
            In Perpetuity
        </div>
    </div>
</div>

</body>
</html>
`;

// Generate 30 daily pages
function generateDailyPages(count) {
  let pages = '';
  
  for (let i = 1; i <= count; i++) {
    // Each day gets 2 pages (morning + evening)
    pages += `
<!-- DAY ${i} - MORNING -->
<div class="page compact">
    ${i === 1 ? '<div class="section-header"><div class="section-title">DAILY JOURNAL</div><div class="section-subtitle">Morning Ritual & Evening Reflection</div></div>' : ''}
    
    <div class="page-header">
        <div class="page-title">Day ${i} — Morning</div>
        <div class="date-field" style="float: right; margin-top: -25px;"><span class="date-label">Date:</span> <span class="date-line">________________</span></div>
    </div>

    <div class="two-column">
        <div class="column">
            <strong style="font-size: 10px;">Morning Checklist:</strong>
            ${createCheckbox('Awoke without phone')}
            ${createCheckbox('7 breaths taken')}
            ${createCheckbox('Identity Declaration')}
            ${createCheckbox('Vision Declaration')}
            ${createCheckbox('Word Declaration')}
            ${createCheckbox('Mind Declaration')}
            ${createCheckbox('Mission Declaration')}
            ${createCheckbox('20-min Meditation')}
            ${createCheckbox('Strategic Review')}
            ${createCheckbox('Physical Activation')}
        </div>
        <div class="column">
            <div class="line-label">Time Started:</div>
            <div class="writing-line"></div>
            <div class="line-label">Time Completed:</div>
            <div class="writing-line"></div>
            <div class="line-label">Quality of Sleep (1-10):</div>
            <div class="writing-line"></div>
            <div class="line-label">Energy Level (1-10):</div>
            <div class="writing-line"></div>
        </div>
    </div>

    <div class="divider"></div>

    <div class="line-label">Insight from Meditation</div>
    ${createLines(3)}

    <div class="line-label">Three Priorities for Today</div>
    <div class="writing-line"><span style="color: #1e3a8a; font-weight: bold; margin-right: 5px;">1.</span></div>
    <div class="writing-line"><span style="color: #1e3a8a; font-weight: bold; margin-right: 5px;">2.</span></div>
    <div class="writing-line"><span style="color: #1e3a8a; font-weight: bold; margin-right: 5px;">3.</span></div>

    <div class="line-label">One Person I Will Invest in Today</div>
    <div class="writing-line"></div>
</div>

<!-- DAY ${i} - EVENING -->
<div class="page compact">
    <div class="page-header">
        <div class="page-title">Day ${i} — Evening Reflection</div>
    </div>

    <div class="line-label">1. VISION CHECK — Did I see clearly today? Where was my vision clouded?</div>
    ${createLines(2)}

    <div class="line-label">2. WORD CHECK — What did I speak? Did my words build or destroy? Commitments kept?</div>
    ${createLines(2)}

    <div class="line-label">3. MIND CHECK — What occupied my mind? Did I cultivate or neglect?</div>
    ${createLines(2)}

    <div class="line-label">4. MISSION CHECK — Did I advance the mission? How?</div>
    ${createLines(2)}

    <div class="line-label">5. RELATIONSHIP CHECK — Who did I invest in? Who did I neglect?</div>
    ${createLines(2)}

    <div class="line-label">6. VALUE CHECK — Did I operate in fair exchange?</div>
    ${createLines(2)}

    <div class="line-label">7. SUCCESSOR CHECK — Did I do anything to develop my successor?</div>
    ${createLines(2)}

    <div class="divider"></div>

    <div class="two-column">
        <div class="column">
            <div class="line-label">One Victory Today</div>
            ${createLines(2)}
        </div>
        <div class="column">
            <div class="line-label">One Failure to Learn From</div>
            ${createLines(2)}
        </div>
    </div>

    <div class="line-label">One Thing to Do Differently Tomorrow</div>
    <div class="writing-line"></div>

    <div style="margin-top: 10px;">
        ${createCheckbox('Evening Declaration Spoken')}
        ${createCheckbox('Asleep by 10:30 PM')}
    </div>
</div>
`;
  }
  
  return pages;
}

// Generate weekly review pages
function generateWeeklyPages(count) {
  let pages = '';
  
  for (let i = 1; i <= count; i++) {
    pages += `
<div class="page">
    ${i === 1 ? '<div class="section-header"><div class="section-title">WEEKLY REVIEW</div><div class="section-subtitle">Friday Reflection</div></div>' : '<div class="page-header"><div class="page-title">Weekly Review</div></div>'}
    
    ${createDateField('Week Ending')}

    <div class="line-label">1. What were my three priorities this week? Did I accomplish them?</div>
    ${createLines(4)}

    <div class="line-label">2. What decisions did I make this week? Do I stand by them?</div>
    ${createLines(3)}

    <div class="line-label">3. What did I learn this week that I didn't know last week?</div>
    ${createLines(3)}

    <div class="line-label">4. Who did I invest in? Who did I neglect?</div>
    ${createLines(3)}

    <div class="line-label">5. Did I operate in fair exchange in all dealings?</div>
    ${createLines(2)}

    <div class="line-label">6. What must change next week?</div>
    ${createLines(3)}

    <div class="line-label">7. What am I grateful for from this week?</div>
    ${createLines(3)}

    <div class="divider"></div>
    <strong style="font-size: 10px;">Weekly Checklist:</strong>
    <div class="two-column" style="margin-top: 5px;">
        <div class="column">
            ${createCheckbox('3-hour study completed')}
            ${createCheckbox('Three people invested in')}
        </div>
        <div class="column">
            ${createCheckbox('Successor meeting held')}
            ${createCheckbox('Wisdom teaching prepared')}
        </div>
    </div>
</div>
`;
  }
  
  return pages;
}

// Generate monthly evaluation
function generateMonthlyEvaluation() {
  return `
<div class="page">
    <div class="section-header">
        <div class="section-title">MONTHLY EVALUATION</div>
        <div class="section-subtitle">First Saturday of Each Month — 4 Hours</div>
    </div>

    ${createDateField('Month/Year')}

    <div class="line-label">HOUR 1: METRICS REVIEW</div>
    
    <table>
        <tr>
            <th>Category</th>
            <th style="width: 60px;">Rating (1-10)</th>
            <th>Explanation</th>
        </tr>
        <tr><td>Financial</td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>Operational</td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>People/Team</td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>Strategic Progress</td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td>Personal (Health/Energy)</td><td class="write-cell"></td><td class="write-cell"></td></tr>
    </table>
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Monthly Evaluation — Hour 2: Values Alignment</div>
    </div>

    <div class="line-label">VISION — Has it remained clear? Expanded? Dimmed? Why?</div>
    ${createLines(4)}

    <div class="line-label">WORDS — Review commitments. How many kept? How many broken?</div>
    ${createLines(3)}

    <div class="line-label">MIND — What occupied your mind? What did you read/study?</div>
    ${createLines(3)}

    <div class="line-label">FAIR EXCHANGE — Did you give more than you took?</div>
    ${createLines(3)}

    <div class="line-label">INTEGRITY — Where did you compromise? Where hold firm?</div>
    ${createLines(3)}

    <div class="line-label">LEADERSHIP — Who grew under you? Who stagnated?</div>
    ${createLines(3)}
</div>

<div class="page">
    <div class="page-header">
        <div class="page-title">Monthly Evaluation — Hour 3 & 4: Assessment & Planning</div>
    </div>

    <div class="line-label">QUARTERLY GOAL PROGRESS</div>
    <table>
        <tr>
            <th>Goal</th>
            <th style="width: 80px;">Status</th>
            <th>Obstacles</th>
            <th>Required Action</th>
        </tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
        <tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>
    </table>
    <div class="instruction">Status: Behind / On Track / Ahead</div>

    <div class="divider"></div>

    <div class="line-label">STOP — What must I stop doing? (Max 2)</div>
    ${createLines(3)}

    <div class="line-label">START — What must I start doing? (Max 2)</div>
    ${createLines(3)}

    <div class="line-label">CONTINUE — What is working that I must protect? (Max 3)</div>
    ${createLines(3)}

    <div class="line-label">DELEGATE — What am I doing that someone else should do? (Max 2)</div>
    ${createLines(3)}

    <div class="divider-thick"></div>
    <div style="text-align: center; font-style: italic; color: #1e3a8a;">
        "I have examined myself honestly. I accept what I see. I commit to what must change."
    </div>
</div>
`;
}

// Generate gratitude rows
function generateGratitudeRows(count) {
  let rows = '';
  for (let i = 0; i < count; i++) {
    rows += '<tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>';
  }
  return rows;
}

// Generate wisdom entry
function generateWisdomEntry(num) {
  return `
<div style="margin-bottom: 20px; padding: 10px; border: 1px solid #e5e7eb; background: #fafafa;">
    <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 8px;">Entry ${num}</div>
    <div class="line-label">Source (Book/Author)</div>
    <div class="writing-line"></div>
    <div class="line-label">Quote or Principle</div>
    ${createLines(3)}
    <div class="line-label">My Commentary / Application</div>
    ${createLines(3)}
</div>
`;
}

// Generate people investment rows
function generatePeopleRows(count) {
  let rows = '';
  for (let i = 0; i < count; i++) {
    rows += '<tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td></tr>';
  }
  return rows;
}

// Generate commitment rows
function generateCommitmentRows(count) {
  let rows = '';
  for (let i = 0; i < count; i++) {
    rows += '<tr><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell"></td><td class="write-cell" style="text-align: center;">☐</td></tr>';
  }
  return rows;
}

async function generateWorkbook() {
  console.log('📓 Generating Leadership Workbook...\n');
  console.log('   Creating printable journal with writing spaces...\n');

  const outputPath = path.join(__dirname, '..', 'succession', 'LEADERSHIP-WORKBOOK.pdf');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(HTML_CONTENT, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: false,
    margin: {
      top: '15mm',
      right: '15mm',
      bottom: '15mm',
      left: '15mm'
    }
  });

  await browser.close();

  console.log('✅ Leadership Workbook created successfully!\n');
  console.log(`📓 Output: ${outputPath}\n`);
  console.log('   Print this workbook, and begin your practice.\n');
  console.log('   "The principles only work if you work them."\n');
}

generateWorkbook().catch(console.error);
