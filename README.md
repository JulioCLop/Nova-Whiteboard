# NOVA Whiteboard (Next.js + Tailwind)

This project has been migrated to Next.js with Tailwind. The NOVA Whiteboard lives at `/`, and the NOVA Command Center is available at `/nova-command-center`.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the whiteboard.

## Notes

- Legacy HTML sources were archived in `legacy/`.
- The whiteboard markup and scripts are served from `public/whiteboard-body.html` and `public/whiteboard.js` to preserve existing behavior.
- Command Center uses a Next.js page with Tailwind classes and loads `public/nova-command-center.js` for data wiring.
