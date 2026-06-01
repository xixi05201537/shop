# Misaki Shop

Single-product PayPal checkout shop built with Next.js, Prisma, MySQL, and Docker.

The app includes a public storefront, PayPal checkout, order records, an admin panel, product editing, image upload, email template settings, floating link settings, and article pages.

## Tech Stack

- Next.js 16 App Router
- React 19
- Prisma 6
- MySQL 8.4
- PayPal Checkout API
- Nodemailer
- Docker / Docker Compose

## Main Features

- Single active product checkout page
- PayPal order creation and capture
- PayPal webhook verification
- Admin login with JWT cookie session
- Product management
- Product image upload to `public/uploads`
- Order list and order details
- Email SMTP settings in admin panel
- Buyer/admin email templates
- Floating widget configuration
- Markdown article pages

## Local Development

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env
```

Start MySQL with Docker Compose:

```bash
docker compose up -d mysql
```

Push database schema and seed default data:

```bash
npm run db:push
npm run db:seed
```

Start dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Admin:

```text
http://localhost:3000/admin
```

Default admin account comes from `.env`:

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

## Environment Variables

Example:

```env
APP_URL=http://localhost:3000
DATABASE_URL=mysql://shop:shop_password@localhost:3306/pink_pay_shop
JWT_SECRET=change-me-to-a-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=
```

### `APP_URL`

Base URL used for server-side redirects and secure-cookie detection.

Local:

```env
APP_URL=http://localhost:3000
```

Production:

```env
APP_URL=https://diy.misaki.im
```

### `DATABASE_URL`

Prisma MySQL connection string.

Local Docker Compose:

```env
DATABASE_URL=mysql://shop:shop_password@localhost:3306/pink_pay_shop
```

Inside a Docker container, do not use `localhost` unless MySQL is in the same container. Use the MySQL service/container name.

Example for 1Panel container connection:

```env
DATABASE_URL=mysql://misaki:YOUR_PASSWORD@1Panel-mysql-SwmD:3306/misaki
```

### `JWT_SECRET`

Secret used to sign admin session tokens. Use a long random value in production.

### PayPal Variables

PayPal settings are read only from environment variables, not from the admin panel:

```env
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_ENV=sandbox
PAYPAL_WEBHOOK_ID=
```

Use matching credentials:

- Sandbox app credentials with `PAYPAL_ENV=sandbox`
- Live app credentials with `PAYPAL_ENV=live`

If credentials do not match the environment, PayPal returns:

```text
invalid_client
```

## Admin Settings

These settings are managed in the admin panel and stored in the database:

- SMTP host
- SMTP port
- SMTP user
- SMTP password
- From email/name
- Support email
- Admin notify email
- Upload directory
- Email templates
- Floating widget settings
- Product details
- Articles

Email and upload settings are intentionally not stored in `.env`.

## Docker Compose

Run app and MySQL together:

```bash
docker compose up -d --build
```

The app is exposed on:

```text
http://localhost:3000
```

The MySQL service is exposed on:

```text
localhost:3306
```

## Docker Image

Docker Hub image:

```text
aoizzz/misakishop:latest
```

Pull:

```bash
docker pull aoizzz/misakishop:latest
```

Run with an existing MySQL database:

```bash
docker run -d \
  --name misakishop \
  --restart unless-stopped \
  -p 3000:3000 \
  -e APP_URL="https://diy.misaki.im" \
  -e DATABASE_URL="mysql://misaki:YOUR_PASSWORD@1Panel-mysql-SwmD:3306/misaki" \
  -e JWT_SECRET="replace-with-a-long-random-secret" \
  -e ADMIN_EMAIL="admin@example.com" \
  -e ADMIN_PASSWORD="admin123456" \
  -e PAYPAL_CLIENT_ID="your-paypal-client-id" \
  -e PAYPAL_CLIENT_SECRET="your-paypal-client-secret" \
  -e PAYPAL_ENV="sandbox" \
  -e PAYPAL_WEBHOOK_ID="" \
  -v /opt/misakishop/uploads:/app/public/uploads \
  aoizzz/misakishop:latest
```

The container startup command runs:

```bash
npx prisma db push && node prisma/seed.mjs && node server.js
```

So it will sync the schema and insert default data on boot.

## 1Panel Deployment Notes

If MySQL is installed as a 1Panel container app, use the container connection address:

```text
host: 1Panel-mysql-SwmD
port: 3306
```

Example:

```env
DATABASE_URL=mysql://misaki:YOUR_PASSWORD@1Panel-mysql-SwmD:3306/misaki
```

For the website/reverse proxy, point your domain to:

```text
http://127.0.0.1:3000
```

Recommended production URL:

```env
APP_URL=https://diy.misaki.im
```

## Common Commands

```bash
npm run dev       # Start local dev server
npm run build     # Build production app
npm run db:push   # Push Prisma schema to database
npm run db:seed   # Seed default data
```

## Troubleshooting

### Prisma cannot find `DATABASE_URL`

Create `.env` and set:

```env
DATABASE_URL=mysql://shop:shop_password@localhost:3306/pink_pay_shop
```

Restart the dev server after changing `.env`.

### PayPal says `Unable to authenticate with PayPal`

Check that:

- `PAYPAL_CLIENT_ID` is filled
- `PAYPAL_CLIENT_SECRET` is filled
- `PAYPAL_ENV` matches the credentials
- The app was restarted after changing `.env`

### Docker pull says `no matching manifest for linux/amd64`

The server requires an amd64 image. Rebuild and push with:

```bash
docker buildx build --platform linux/amd64 -t aoizzz/misakishop:latest --push .
```

### Uploads do not show

Make sure the upload volume is mounted:

```bash
-v /opt/misakishop/uploads:/app/public/uploads
```

And the admin upload directory setting remains:

```text
./public/uploads
```
