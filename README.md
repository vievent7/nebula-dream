# Nebula Dream

Site de vente de musiques relaxantes, simple et maintenable.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + SQLite
- Auth par cookie JWT (inscription/connexion)
- Stripe Checkout + webhook
- SMTP transactionnel (SendGrid / Resend compatible)

## Fonctionnalites

- Chargement automatique des tracks depuis `tracks/` (1 dossier = 1 track)
- Preview audio publique
- Ecoute complete reservee aux utilisateurs ayant achete
- Panier
- Pricing optimise:
  - 1 track = 1.99
  - 5 tracks = 7.99
  - 10 tracks = 9.99
  - priorite pack 10, puis 5, puis unite
- Paiement Stripe
- Telechargement securise apres achat
- Espace compte avec historique des achats
- Design sombre cosmique
- Emails transactionnels:
  - creation de compte
  - reinitialisation du mot de passe
  - confirmation de commande
  - acces au produit

## Installation

```bash
npm install
cp .env.example .env
npm run db:migrate -- --name init
npm run db:generate
npm run dev
```

## Variables d'environnement

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="replace-with-long-random-secret"
APP_URL="https://nebula-dream.onrender.com"
NEXT_PUBLIC_APP_URL="https://nebula-dream.onrender.com"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="apikey"
SMTP_PASS="SG_xxx"
SMTP_FROM="Nebula Dream <noreply@nebula-dream.onrender.com>"
SMTP_TLS_REJECT_UNAUTHORIZED="true"
```

Important:
- Tous les liens email utilisent `APP_URL` (domaine reel).
- En production, `APP_URL` ne doit jamais etre `localhost`.

## Stripe (local)

1. Creer une cle Stripe test (`STRIPE_SECRET_KEY`)
2. Lancer l'app en local
3. Lancer Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

4. Copier le secret webhook fourni dans `STRIPE_WEBHOOK_SECRET`

## Configuration email (SendGrid)

1. Creer un expÃ©diteur verifie sur SendGrid (SPF/DKIM valides).
2. Copier la cle API SendGrid dans `SMTP_PASS`.
3. Garder `SMTP_USER=apikey` et `SMTP_HOST=smtp.sendgrid.net`.
4. Definir `SMTP_FROM` avec le nom expÃ©diteur exact:
   - `Nebula Dream <noreply@nebula-dream.onrender.com>`
5. Definir `APP_URL` sur votre domaine public du site.

## Ajouter des tracks

Ajouter un dossier dans `tracks/`:

```text
tracks/
  cosmic-drift/
    track.json
    preview.mp3
    full.mp3
```

`track.json` est optionnel mais recommande:

```json
{
  "title": "Cosmic Drift",
  "description": "Pads spatiaux et respiration lente.",
  "mood": "Deep Sleep",
  "duration": "05:32",
  "preview": "preview.mp3",
  "full": "full.mp3"
}
```

## Personnalisation visuelle

Dans `src/app/globals.css`:

- `--nebula-global-bg`: fond global (image locale)
- `--nebula-hero-bg`: reserve pour hero
- `--nebula-catalog-bg`: reserve pour sections catalogues

Exemple:

```css
:root {
  --nebula-global-bg: url("/backgrounds/global.jpg");
}
```

Place les images dans `public/backgrounds/`.

Banniere haute:
- fichier utilise: `public/assets/banner-top.png`
- pour changer la banniere, remplace ce fichier.

Miniatures tracks:
- source principale: `tracks/`
- regle: `NomDeTrack.mp3` + `NomDeTrack.jpg|png|webp`
- mode dossier: image `cover.jpg` ou champ `cover` / `thumbnail` dans metadata
- fallback local uniquement si image absente: `public/assets/default-track-cover.png`

## Commandes utiles

```bash
npm run lint
npm run build
npm run start
```

## Render (basculement production)

Service cible: `nebula-dream` (remplacement complet du service Sky Store).

Commandes utilisÃ©es:

- Build: `npm ci && npm run build`
- Start: `npx prisma migrate deploy && npm run start`
- Health check: `/api/health`

Fichier prÃªt pour Render Blueprint:

- `render.yaml`

Variables clÃ©s Ã  poser cÃ´tÃ© Render:

- `APP_URL=https://nebula-dream.onrender.com`
- `NEXT_PUBLIC_APP_URL=https://nebula-dream.onrender.com`
- `SMTP_FROM=Nebula Dream <noreply@nebula-dream.onrender.com>`
- `STRIPE_*`, `AUTH_SECRET`, `SMTP_*` (secrets)

AprÃ¨s dÃ©ploiement:

1. associer `nebula-dream.onrender.com` au service Nebula Dream
2. retirer le domaine du service Sky Store abandonnÃ©
3. vÃ©rifier `/`, `/login`, `/api/health`, achat Stripe et emails
