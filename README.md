This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Web App (Next.js)

This application is deployed on Vercel with the following configuration:

- **Vercel Project**: `royalfitness`
- **Production Domain**: `royalwellness.app`
- **Vercel URL**: `royalwellness.vercel.app`
- **Deployment Method**: Automatic GitHub integration (on push to main)

**Setup Instructions:**
1. Connect this repository to Vercel via GitHub integration at [vercel.com](https://vercel.com)
2. Ensure the project is named `royalfitness`
3. Configure these environment variables in Vercel project settings:
   - `DATABASE_URL` - PostgreSQL connection string (from Neon)
   - `AUTH_SECRET` - Session encryption key
   - `ADMIN_EMAIL` - Admin dashboard access
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
   - `APPLE_CLIENT_ID` & `APPLE_CLIENT_SECRET` - Apple Sign In (optional)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - Google Sign In (optional)

See `.env.example` for detailed instructions on obtaining each secret.

**Note:** Do NOT confuse this project with any other Vercel projects (e.g., old test projects). Only the `royalfitness` project is actively maintained and deployed.

### Mobile App (iOS)

The iOS app is built using Capacitor and deployed via GitHub Actions to Apple TestFlight:

- **App ID**: `com.royalwellness.app`
- **Deployment**: GitHub Actions workflow (`.github/workflows/ios-deploy.yml`)
- **Web Component**: Loads from `royalwellness.vercel.app`

For more details on iOS deployment, see the fastlane configuration in `fastlane/` directory.

### Release Repeatability (iOS)

To keep App Store releases repeatable across branches and machines:

1. Use Node `20` (repo `.nvmrc`) before running any Capacitor commands.
2. Configure all required GitHub secrets used by `.github/workflows/ios-deploy.yml`:
   - `ASC_API_KEY_ID`
   - `ASC_API_KEY_ISSUER_ID`
   - `ASC_API_KEY_BASE64`
   - `CERTIFICATE_P12_BASE64`
   - `CERTIFICATE_PASSWORD`
   - `PROVISIONING_PROFILE_BASE64`
   - `PROVISIONING_PROFILE_NAME`
   - `APPLE_TEAM_ID`
3. The deploy workflow now bootstraps `ios/` automatically when missing, then runs `npx cap sync ios`.

This does not change product behavior; it only makes the iOS delivery pipeline more resilient.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Vercel Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Health Endpoint (`/api/health`)

The health endpoint is intentionally minimal for production safety.

- **Public/unauthorized response**: always `{ "status": "ok" }`.
- **Detailed diagnostics** are only available when all conditions are true:
  1. `NODE_ENV` is not `production`
  2. `HEALTH_DIAGNOSTICS_ENABLED=true`
  3. Caller is authorized by either:
     - `x-health-token` header matching `HEALTH_INTERNAL_TOKEN`, or
     - authenticated admin session (`safeAuth` user email equals `ADMIN_EMAIL`)
- **Production behavior**: diagnostics are never returned, even for authorized callers.

This endpoint no longer returns environment configuration flags, connection string previews, raw error details, or user counts.
