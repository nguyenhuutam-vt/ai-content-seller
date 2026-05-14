<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Coding Rules

This project is AI Content Seller: a Vietnamese AI content generator for Shopee and TikTok Shop sellers. Optimize for fast delivery, clean code, low future AI/API cost, and a simple scalable MVP.

## Before Editing

- Inspect the relevant existing files before changing code.
- Explain which files need changes, why they need changes, what can be reused, and what should not be touched.
- Keep edits scoped to the user's request and the MVP.

## Change Scope

- Edit the minimum number of files required.
- Do not create new files unless clearly necessary.
- Prefer editing existing files first.
- Do not add dependencies unless the value is clear and the cost is justified.
- Do not touch unrelated user changes in the worktree.

## UI And Styling

- Use Tailwind CSS only.
- Reuse existing layout, spacing, colors, buttons, cards, typography, gradients, shadows, and section styles.
- Keep the black and gold premium SaaS theme:
  - background: near black
  - primary: gold/yellow
  - text: white/gray
  - cards: dark gray/black
  - borders: subtle gray/gold
- Do not invent a new design system for each section.
- Avoid unnecessary animations, heavy images, and large dependencies.
- Use accessible labels for buttons, inputs, and selects.
- Keep text contrast readable and interactive focus states visible.

## Components

- Do not create a new component unless the same UI repeats at least twice, the component improves readability, or it is likely to be reused later.
- Keep components small, typed, and colocated when possible.
- Reuse existing local patterns before introducing new abstractions.

## State And Data

- Use simple React state first.
- Do not add Zustand, Redux, React Query, or similar libraries unless the need is clear.
- Avoid client components unless interactivity requires them.

## AI And API Cost

When integrating AI later:

- Keep prompts short but effective.
- Avoid sending unnecessary page content.
- Avoid long system prompts.
- Do not call AI APIs on every keystroke.
- Call AI APIs only after the user clicks generate.
- Limit generated output length.
- Prefer cheaper models by default unless quality requires more.

## Product Boundaries

Every feature must support the MVP:

- generate captions
- generate hashtags
- generate product descriptions
- generate CTAs

Do not add blog, admin panel, analytics, team management, payment, or auth unless explicitly requested.

## Code Quality

- Use TypeScript properly.
- Avoid `any`.
- Avoid duplicate logic.
- Use clear variable names.
- Keep functions small.
- Remove unused imports.
- Do not leave console logs unless useful for debugging.

## Final Response Checklist

After every change, summarize:

- files changed
- what was reused
- what was newly added
- what should be tested manually
