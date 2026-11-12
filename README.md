# KusinaMatch — Smart Pantry-to-Plate Recipe Recommender

A Next.js web application built on top of the starter template that solves an everyday cooking problem: figuring out what to cook using only the ingredients you already have in your pantry or fridge.

## Features

- **Interactive Pantry Inventory Manager:** Check off common pantry staples, apply quick presets (*Basic Student Dorm*, *Full Weekend Fridge*), or add custom ingredients. Persists automatically via `localStorage`.
- **Real-Time Recipe Matching Engine:** Dynamically calculates ingredient overlap against `data/recipes.json` and sorts recipes into **Ready to Cook** (100% match) and **Almost Ready** (missing 1–2 items).
- **Smart Substitution Matrix:** Suggests practical ingredient swaps when you are missing a specific item.
- **Distraction-Free Kitchen Mode:** Full-screen cooking modal with tappable step-by-step progress tracking and an interactive missing-item shopping checklist.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
