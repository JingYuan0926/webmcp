# PageControl signing service

This small Node service keeps PageControl's Ed25519 private key outside the merchant site. It issues 60-second approval grants and publishes the public verification key.

## Routes

- `GET /health` — deployment health check.
- `GET /.well-known/pagecontrol-key.json` — public Ed25519 JWK.
- `POST /grant` — issue a signed grant. Requires `Authorization: Bearer $PAGECONTROL_SERVICE_TOKEN`.
- `POST /verify` — verify a compact signed grant.

## Environment

- `PAGECONTROL_PRIVATE_KEY` — base64-encoded PKCS#8 Ed25519 private key. Required for a stable production identity.
- `PAGECONTROL_SERVICE_TOKEN` — server-to-server credential required by `/grant`.
- `PAGECONTROL_ISSUER` — canonical API origin. Defaults to `https://api.pagecontrol.app`.
- `PORT` — supplied automatically by Railway.

Generate a production key without writing it to the repository:

```bash
openssl genpkey -algorithm ED25519 -outform DER | base64
```

Store the output directly in Railway as `PAGECONTROL_PRIVATE_KEY`. Generate `PAGECONTROL_SERVICE_TOKEN` with a password manager or `openssl rand -base64 32`.

## Railway

From this folder:

```bash
railway init
railway variables set PAGECONTROL_PRIVATE_KEY="..." PAGECONTROL_SERVICE_TOKEN="..."
railway up
```

Set the Railway health-check path to `/health`. Never place either secret in the merchant page or commit it to Git.

## Local check

```bash
npm test
PAGECONTROL_SERVICE_TOKEN=local-test-token npm start
```

When `PAGECONTROL_PRIVATE_KEY` is absent, local development uses a new ephemeral key on every process start and prints a warning.
