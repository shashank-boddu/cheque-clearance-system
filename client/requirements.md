## Packages
recharts | Dashboard analytics and charts
framer-motion | Smooth animations for page transitions and micro-interactions
date-fns | Date formatting for timestamps
clsx | Utility for conditional classes (often paired with tailwind-merge)
tailwind-merge | Utility for merging tailwind classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-sans)"],
  display: ["var(--font-display)"],
  mono: ["var(--font-mono)"],
}

API Integration:
- Cheque creation is a two-step process in the UI (Upload -> Process), but API might handle it. 
- We will auto-trigger the 'process' endpoint after successful creation to simulate the AI/Blockchain workflow immediately for this demo.
