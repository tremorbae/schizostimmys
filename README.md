# Untitled Website

A Next.js application with Firebase Admin integration for whitelist management.

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

### Firebase Admin Configuration
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_PRIVATE_KEY`: Private key (with newlines properly escaped)
- `FIREBASE_PRIVATE_KEY_BASE64`: Base64 encoded private key (alternative to above)

## Vercel Deployment

### Setup Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY_BASE64=base64-encoded-private-key
```

### Getting the Base64 Private Key

To get the base64 encoded private key from your JSON service account file:

```bash
# If you have the JSON file:
cat path/to/your-service-account.json | jq -r .private_key | base64
```

Or encode the private key directly:
```bash
echo "-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----" | base64
```

### Deployment

Once environment variables are configured, deployment should work automatically:

```bash
vercel --prod
```

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## API Endpoints

- `POST /api/check-whitelist` - Check if wallet is on whitelist
- `GET /api/check-whitelist` - Health check endpoint

## Security Notes

- Never commit `.env.local` files to version control
- Never commit private key files to version control
- Use Vercel environment variables for production secrets
- The Firebase Admin SDK supports both raw and base64 encoded private keys
