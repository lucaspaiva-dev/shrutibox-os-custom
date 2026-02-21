# Getting Started

This guide walks you through setting up and running the Shrutibox Digital project on your local machine.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)

npm comes bundled with Node.js, so no separate installation is needed.

## First-Time Setup

1. Open a terminal in the project root folder (`shrutibox-os-custom/`).

   In Cursor or VS Code, press **Ctrl + `** (or **Cmd + `** on Mac) to open the built-in terminal. It will already be in the project root.

2. Install all project dependencies:

   ```bash
   npm install
   ```

   This downloads the required packages into a `node_modules/` folder. You only need to do this once, unless:

   - You clone the project again on a new machine.
   - Someone adds a new dependency to `package.json`.
   - You delete the `node_modules/` folder.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open **http://localhost:5173** in your browser. The app should be up and running.

## Daily Workflow

Every time you come back to work on the project, just run:

```bash
npm run dev
```

That's it. No need to reinstall dependencies.

When you're done, press **Ctrl + C** in the terminal to stop the server.

## Other Useful Commands

| Command           | What it does                                      |
| ----------------- | ------------------------------------------------- |
| `npm run build`   | Creates an optimized production build in `dist/`  |
| `npm run preview` | Serves the production build locally for testing   |
| `npm run lint`    | Checks your code for style and quality issues     |

## Troubleshooting

**The terminal shows "vulnerabilities" after `npm install`.**
This is normal. These are known issues in upstream packages and do not affect local development.

**The terminal shows "packages are looking for funding".**
Some open-source packages ask for donations. You can safely ignore this message.

**The app doesn't play sound when I open it.**
Modern browsers require a user interaction (like a click) before playing audio. Click the start button on the screen to initialize audio.
