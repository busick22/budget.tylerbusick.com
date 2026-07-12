# Budget — one-time setup checklist

These are the owner steps to connect the app to Firebase. Everything in the
code is already wired up and waiting for the values below.

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Name it something like `busick-budget` (the name becomes the project ID —
   note whatever ID Firebase gives you).
3. Google Analytics: **off** (not needed for a one-person app).

## 2. Register a web app + get the config

1. In the project: **Project settings (gear) → Your apps → Web (`</>`)**.
2. Nickname: `Budget`. Skip Firebase Hosting setup here (we deploy by CLI later).
3. Firebase shows a `firebaseConfig` block — copy the six values into
   [`src/firebase.js`](src/firebase.js), replacing every `PASTE_...`
   placeholder. Reload the app; the "Waiting on Firebase" note disappears
   when this is done.

## 3. Turn on sign-in (Auth)

1. **Build → Authentication → Get started**.
2. **Sign-in method** tab → enable **Google** (pick your support email).
3. Optionally also enable **Email/Password** if you want a password besides
   Google. (If you skip it, the email form on the sign-in screen will say the
   method isn't enabled — that's expected.)

## 4. Create the database (Firestore)

1. **Build → Firestore Database → Create database**.
2. Location: `us-central1` (or nearest). Start in **production mode** —
   our own rules file takes over on first deploy.

## 5. Connect the CLI + first deploy

From the `budget/` folder in a terminal:

```sh
firebase login                     # once per machine
firebase use --add                 # pick the new project, alias "default"
npm run build
firebase deploy                    # hosting + Firestore rules
```

The app is then live at `https://<project-id>.web.app`.

## 6. Statement import

The app imports prepared `.json` files only. There is no backend import service,
no API key, and no Blaze upgrade needed for import.

1. Create or export a prepared import file in the shape described in
   [`import/README.md`](import/README.md).
2. Reload the app → Spending → **Import** → choose that `.json` file.
3. Review the rows, untick anything you want to skip, then save.

## 7. Later (not needed yet)

- **Custom domain** — Hosting → Add custom domain → `budget.tylerbusick.com`
  (same DNS dance as accomplish.tylerbusick.com).
