<!--
  TODO: Replace all placeholder content below with your actual resume information.
  Each section is marked with TODO so you know exactly where to update.
  This file is the single source of truth — both PDFs are generated from here.
-->

# Aldwin Von Yu

**Email:** aldwin.yu@hotmail.com &nbsp;|&nbsp; **GitHub:** github.com/mabanana &nbsp;|&nbsp; **Location:** Toronto, Canada

---

## Summary

Full-stack software engineer with production experience in TypeScript, Node.js, Python, and Django, building scalable back-end systems and web applications in the education technology sector. Proven track record delivering measurable impact through automation, performance optimization, and API-driven architecture. Experienced owning systems end-to-end — from database design and server-side logic to deployment and stakeholder collaboration — with a strong foundation in software engineering principles and the full SDLC.

---

## Experience

### Software Engineer / Full-Stack Developer — RoboEdu
**Sep 2024 – Present** | East York, ON

- Owned end-to-end development of a Django/Python web application supporting core business operations in education technology
- Built and maintained REST APIs consumed by front-end clients; enforced clean separation between server-side logic and API layer
- Automated previously manual workflows for assignment distribution, grading, feedback, and recurring communications
- Reduced over 40 hours per week of manual administrative work, enabling operational scaling without additional staff
- Designed and optimized PostgreSQL database schemas; reduced long-running queries from ~25 seconds to <1 second
- Deployed and maintained the application on Linux-based infrastructure using Docker for consistent, reproducible environments
- Worked directly with stakeholders to gather requirements and deliver features end-to-end
- Wrote and maintained technical documentation to support future development and maintenance

---

### Gameplay Programmer — Outlaw Odyssey (Production Indie Project)
**Jun 2025 – Present** | Remote

- Developed and maintained gameplay systems using object-oriented and data-driven design
- Built internal testing and tooling systems to validate complex logic outside the runtime environment
- Collaborated with designers and artists to iterate on features and tooling based on production needs
- Used Git-based version control and followed structured iteration and testing practices

---

## Education

### Bachelor of Economics — University of Waterloo

---

## Skills

**Languages:** TypeScript, JavaScript, Python, SQL, GDScript, C++, HTML, CSS
**Back-End & Frameworks:** Node.js, Django, REST APIs, server-side architecture
**Databases:** PostgreSQL, SQLite
**DevOps & Infrastructure:** Docker, Linux, Git, CI workflows
**Software Engineering:** OOP, data structures, system design, unit testing, full SDLC
**Methodologies:** Agile-style iteration, stakeholder-driven requirements, technical documentation

---

## Projects

### Serverless REST API – Email Summarization Service
**Tech:** TypeScript, Node.js, Fermyon Cloud (Spin), OAuth 2.0, Gmail API

- Designed and implemented a serverless REST API end-to-end using TypeScript and Node.js (Fermyon Spin runtime)
- Integrated webhook-based requests from a Telegram bot to trigger API workflows
- Implemented OAuth 2.0 authentication to securely access the Gmail API
- Ensured no user data is persisted, storing only access and refresh tokens using Fermyon key-value storage
- Implemented scheduled execution via cron-triggered API calls to process unread emails
- Designed async request handling to minimize execution time and serverless resource usage
- Implemented structured error handling and logging across API boundaries

---

### Combat Simulation & Testing Tool
**Tech:** GDScript, Godot

- Developed a combat testing tool that wraps the live turn-based combat system without launching the rest of the game
- Executes full combat sequences directly using the current codebase by injecting game state data customizable via GUI
- Enabled a major gameplay redesign after multiple iterations of feedback from play testers; became the singular tool for all combat system testing

---

### CSV to In-Game Data Pipeline
**Tech:** Python, GDScript, VBA, System Design

- Built a custom validation-enabled spreadsheet → Python → GDScript pipeline to convert Excel data into in-game data formats
- Enabled unsupervised data authoring and integration without programmer intervention, generating four pull requests for gameplay changes that otherwise would not have occurred

---

### Shader Animation Authoring Tool
**Tech:** GLSL, GDScript

- Created a tool exposing shader animation behaviour through an animation editor UI
- Enabled a previously blocked team member to author and tweak shader-driven animations independently, increasing animation creation speed by over 100%
