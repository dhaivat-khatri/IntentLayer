# IntentLayer

IntentLayer is an AI product decision engine used by startup founders to convert customer conversation transcripts into clear product decisions and implementation plans.

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open `http://localhost:3000/app.html` in your browser.

## Deployment

This app consists of a static frontend (`index.html`, `app.html`, `app.js`, `app-style.css`) and a lightweight Express backend (`server.js`). 

To deploy (e.g., on Render or Heroku):
- Set the build command to `npm install`
- Set the start command to `npm start`
- Provide environment variables for your AI providers (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`).
