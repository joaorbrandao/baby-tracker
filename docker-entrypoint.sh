#!/bin/sh
set -e

# Apply any pending Prisma migrations before starting the app.
npx prisma migrate deploy --schema server/prisma/schema.prisma

exec node server/dist/main.js
