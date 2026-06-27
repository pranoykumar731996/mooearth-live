# 🚀 MooEarth Live — Deployment Guide

MooEarth Live is a modern Next.js application designed to run seamlessly on Edge networks and Serverless infrastructure. Configuration files have been provided for Vercel, Netlify, and Firebase.

## 🔑 Environment Variables Checklist

Before deploying to **any** platform, you MUST add the following environment variables to your deployment provider's dashboard (e.g., Vercel Project Settings, Netlify Environment Variables).

The application relies on 13 critical environment variables:

### External APIs
*   `NEWS_API_KEY` - Your News API Key
*   `FOOTBALL_API_KEY` - Your API-Sports Football API Key
*   `OPENAI_API_KEY` - OpenAI API Key for AI operations
*   `GEMINI_API_KEY` - Google Gemini API Key
*   `GROQ_API_KEY` - Groq API Key

### Firebase Client Configuration
*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
*   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Application Settings
*   `NEXT_PUBLIC_ENABLE_TRANSLATION` - Set to `"true"` or `"false"`

---

## 🔼 Option 1: Vercel (Recommended)

Vercel provides the best out-of-the-box support for Next.js applications, offering zero-configuration serverless deployments.

1.  Push your code to a GitHub, GitLab, or Bitbucket repository.
2.  Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3.  Import your repository.
4.  Open the **Environment Variables** section and paste the 13 variables listed above.
5.  Click **Deploy**.
> Note: The included `vercel.json` ensures that PWA service workers bypass Vercel's Edge Cache to enable instant user updates.

---

## 🔼 Option 2: Firebase Hosting (Web Frameworks)

Firebase now natively supports Next.js Server-Side Rendering via the experimental Web Frameworks integration.

1.  Ensure you have the Firebase CLI installed: `npm install -g firebase-tools`.
2.  Log in to the Firebase CLI: `firebase login`.
3.  Ensure the experimental frameworks feature is enabled: 
    ```bash
    firebase experiments:enable webframeworks
    ```
4.  Set your environment variables in the Firebase Secret Manager or environment config. Since Firebase Web Frameworks handles Next.js envs automatically on build, you can optionally rely on your `.env.local` during the deploy process, but Secret Manager is recommended for production.
5.  Deploy the application:
    ```bash
    firebase deploy --only hosting
    ```
> Note: The included `firebase.json` and `.firebaserc` are pre-configured to deploy the `mooearth-live` project and correctly map headers.

---

## 🔼 Option 3: Netlify

Netlify is another robust platform for Next.js deployments.

1.  Push your code to a repository.
2.  Log in to [Netlify](https://netlify.com/) and click **Add new site** > **Import an existing project**.
3.  Select your repository.
4.  Click **Show advanced** and enter the 13 Environment Variables.
5.  Click **Deploy site**.
> Note: The included `netlify.toml` handles the build command, output directory, plugin installation, and PWA caching rules.
