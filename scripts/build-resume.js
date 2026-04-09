#!/usr/bin/env node
/**
 * build-resume.js
 *
 * Reads  resume/resume.md
 * Builds resume/templates/plain.html    → Assets/Resume-ATS.pdf
 *         resume/templates/designed.html → Assets/Resume-Designed.pdf
 *
 * Usage:
 *   node scripts/build-resume.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { marked }     = require('marked');
const { chromium }   = require('playwright');

// ── Paths ───────────────────────────────────────────────────────────────────
const ROOT          = path.resolve(__dirname, '..');
const RESUME_MD     = path.join(ROOT, 'resume', 'resume.md');
const TEMPLATE_DIR  = path.join(ROOT, 'resume', 'templates');
const STYLES_DIR    = path.join(ROOT, 'resume', 'styles');
const ASSETS_DIR    = path.join(ROOT, 'Assets');

const OUTPUT_ATS      = path.join(ASSETS_DIR, 'Resume-ATS.pdf');
const OUTPUT_DESIGNED = path.join(ASSETS_DIR, 'Resume-Designed.pdf');

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Read a file relative to ROOT, throw a helpful error if missing. */
function read(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Parse the Markdown source and extract structured pieces.
 *
 * Returns:
 *   name        – first h1 text
 *   contactLine – inline contact from the bold paragraph after h1
 *   sections    – array of { heading, level, htmlContent }
 */
function parseResume(mdSource) {
  const lines  = mdSource.split('\n');
  let name         = 'Your Name';
  let contactLine  = '';
  const sections   = [];
  let currentHeading = null;
  let currentLevel   = 0;
  let currentLines   = [];
  let foundH1        = false;
  let foundContact   = false;

  for (const line of lines) {
    // Skip HTML comment lines (<!-- ... -->)
    if (line.trim().startsWith('<!--')) {
      continue;
    }

    // h1 → name
    const h1Match = line.match(/^#\s+(.+)/);
    if (h1Match && !foundH1) {
      name    = h1Match[1].trim();
      foundH1 = true;
      continue;
    }

    // Contact line (bold-heavy paragraph immediately after h1)
    if (foundH1 && !foundContact && line.trim().startsWith('**') && line.includes('|')) {
      contactLine  = line.trim();
      foundContact = true;
      continue;
    }

    // h2 / h3 headings start new sections
    const hMatch = line.match(/^(#{2,3})\s+(.+)/);
    if (hMatch) {
      if (currentHeading !== null) {
        sections.push({
          heading:     currentHeading,
          level:       currentLevel,
          htmlContent: marked.parse(currentLines.join('\n')),
        });
      }
      currentHeading = hMatch[2].trim();
      currentLevel   = hMatch[1].length;
      currentLines   = [];
      continue;
    }

    // Horizontal rules (---) separate entries but don't start new sections
    if (line.trim() === '---' && currentHeading !== null) {
      currentLines.push('\n');
      continue;
    }

    if (currentHeading !== null) {
      currentLines.push(line);
    }
  }

  // Flush last section
  if (currentHeading !== null) {
    sections.push({
      heading:     currentHeading,
      level:       currentLevel,
      htmlContent: marked.parse(currentLines.join('\n')),
    });
  }

  return { name, contactLine, sections };
}

/**
 * Convert the parsed contact line (Markdown inline) to a simple HTML list
 * for the designed sidebar.
 */
function contactToSidebarHtml(contactLine) {
  // Strip bold markers, split on |
  const items = contactLine
    .replace(/\*\*/g, '')
    .replace(/&nbsp;/g, ' ')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean);

  return '<ul>' + items.map(item => `<li>${item}</li>`).join('\n') + '</ul>';
}

/**
 * Render the inline contact line for the plain template.
 * Converts Markdown inline syntax → HTML.
 */
function contactToInlineHtml(contactLine) {
  // marked.parseInline returns inline HTML (no wrapping <p>)
  return marked.parseInline(contactLine);
}

// ── Security helpers ─────────────────────────────────────────────────────────

/** Strip HTML tags, returning text that still contains HTML-encoded entities.
 *  The result is safe to embed directly in HTML (entities remain encoded). */
function stripHtmlTags(html) {
  // Use a repeated replace to handle nested/malformed tags safely
  let prev;
  let str = html;
  do {
    prev = str;
    str  = str.replace(/<[^>]*>/g, '');
  } while (str !== prev);
  return str.trim();
}

/** Escape special HTML characters to prevent injection.
 *  Only call this on raw plain-text strings that have NOT already been
 *  HTML-encoded (e.g. direct user input, never on marked HTML output). */
function escapeHtml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}



function buildPlainHtml(parsed) {
  const { name, contactLine, sections } = parsed;
  const template = read(path.join(TEMPLATE_DIR, 'plain.html'));
  const css      = read(path.join(STYLES_DIR,   'plain.css'));

  // Build body HTML from sections
  let body = '';
  for (const sec of sections) {
    body += `<section class="section">\n`;
    body += `<h${sec.level}>${sec.heading}</h${sec.level}>\n`;
    body += sec.htmlContent;
    body += `</section>\n`;
  }

  return template
    .replace('{{CSS}}',     css)
    .replace('{{NAME}}',    name)
    .replace('{{CONTACT}}', contactToInlineHtml(contactLine))
    .replace('{{BODY}}',    body);
}

// ── Designed builder ─────────────────────────────────────────────────────────

function buildDesignedHtml(parsed) {
  const { name, contactLine, sections } = parsed;
  const template = read(path.join(TEMPLATE_DIR, 'designed.html'));
  const css      = read(path.join(STYLES_DIR,   'designed.css'));

  // Sections that go in the sidebar vs. main
  const SIDEBAR_SECTIONS = new Set(['skills', 'education', 'certifications']);

  // Derive a title / headline from summary section if present
  let title = 'Software Engineer'; // fallback
  const summarySection = sections.find(s => s.heading.toLowerCase() === 'summary');
  if (summarySection) {
    // Extract first sentence of plain text as a title hint (keep short).
    // stripHtmlTags preserves HTML entity encoding, making the result safe to
    // embed directly into an HTML attribute/element without further escaping.
    const plain = stripHtmlTags(summarySection.htmlContent);
    const firstSentence = plain.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 0 && firstSentence.length < 80) {
      title = firstSentence;
    }
  }

  // Contact sidebar block
  const contactBlock = contactToSidebarHtml(contactLine);

  // Sidebar extra (skills, education, certifications)
  let sidebarExtra = '';
  for (const sec of sections) {
    if (SIDEBAR_SECTIONS.has(sec.heading.toLowerCase())) {
      sidebarExtra += `<div class="sidebar-section">\n`;
      sidebarExtra += `<h2>${sec.heading}</h2>\n`;

      // For skills: wrap each list item in a skill-tag span
      if (sec.heading.toLowerCase() === 'skills') {
        const skillsHtml = sec.htmlContent.replace(
          /<li>([\s\S]*?)<\/li>/g,
          (_, content) => {
            // Strip HTML tags; entities remain encoded so the result is
            // already HTML-safe — no further escaping is needed.
            const text  = stripHtmlTags(content);
            // Split "Category: item1, item2" into tags
            const colonIdx = text.indexOf(':');
            if (colonIdx !== -1) {
              const category = text.slice(0, colonIdx).trim();
              const tags = text.slice(colonIdx + 1).split(',').map(t =>
                `<span class="skill-tag">${t.trim()}</span>`
              ).join('');
              return `<li><strong>${category}</strong><br>${tags}</li>`;
            }
            return `<li><span class="skill-tag">${text}</span></li>`;
          }
        );
        sidebarExtra += skillsHtml;
      } else {
        sidebarExtra += sec.htmlContent;
      }
      sidebarExtra += `</div>\n`;
    }
  }

  // Main body (summary, experience, projects)
  let mainBody = '';
  for (const sec of sections) {
    if (!SIDEBAR_SECTIONS.has(sec.heading.toLowerCase())) {
      mainBody += `<section>\n`;
      mainBody += `<h2>${sec.heading}</h2>\n`;
      if (sec.heading.toLowerCase() === 'summary') {
        mainBody += `<div class="summary-text">${sec.htmlContent}</div>\n`;
      } else {
        mainBody += `<div class="job-entry">${sec.htmlContent}</div>\n`;
      }
      mainBody += `</section>\n`;
    }
  }

  return template
    .replace('{{CSS}}',           css)
    .replace('{{NAME}}',          name)
    .replace('{{TITLE}}',         title)
    .replace('{{CONTACT_BLOCK}}', contactBlock)
    .replace('{{SIDEBAR_EXTRA}}', sidebarExtra)
    .replace('{{MAIN_BODY}}',     mainBody);
}

// ── PDF renderer ─────────────────────────────────────────────────────────────

async function htmlToPdf(htmlContent, outputPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    await page.pdf({
      path:              outputPath,
      format:            'Letter',
      printBackground:   true,
      margin:            { top: '0', right: '0', bottom: '0', left: '0' },
    });
    console.log(`  ✓  Wrote ${path.relative(ROOT, outputPath)}`);
  } finally {
    await browser.close();
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📄  Building resume PDFs…');

  // Ensure Assets/ exists
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const mdSource = read(RESUME_MD);
  const parsed   = parseResume(mdSource);
  console.log(`  Name parsed: "${parsed.name}"`);

  console.log('\n  Building plain (ATS) version…');
  const plainHtml = buildPlainHtml(parsed);
  await htmlToPdf(plainHtml, OUTPUT_ATS);

  console.log('\n  Building designed version…');
  const designedHtml = buildDesignedHtml(parsed);
  await htmlToPdf(designedHtml, OUTPUT_DESIGNED);

  console.log('\n✅  Done. Both PDFs are in Assets/');
}

main().catch(err => {
  console.error('❌  Build failed:', err.message);
  process.exit(1);
});
