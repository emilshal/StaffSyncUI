# Cloudinary Upload Setup (Unsigned Preset)

## Preset settings (recommended)

- Signing mode: `Unsigned`
- Asset folder: `staffsync/sops`
- Disallow public ID: `Enabled`
- Generated public ID: `Auto-generate an unguessable public ID value`
- Generated display name: `Use the filename of the uploaded file as the asset's display name`

## Vite env vars

Add these to `.env.local`:

```
VITE_DEBUG_LOGS=1
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=staffsync
VITE_CLOUDINARY_FOLDER=staffsync/sops
VITE_MAKE_WEBHOOK_URL=https://hook.us1.make.com/...
VITE_MAKE_WEBHOOK_KEY=...
VITE_MAKE_WEBHOOK_KEY_MODE=header
VITE_MAKE_WEBHOOK_KEY_HEADER=x-staffsync-key
VITE_MAKE_WEBHOOK_KEY_QUERY_PARAM=key
VITE_ORGANIZATION_ID=org-demo
```

## Flow used by the UI

1. React uploads the video directly to Cloudinary.
2. React posts `SOP.CREATE` to your Make webhook with the returned Cloudinary URL + metadata.
