FROM node:20-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY web/admin-dashboard/package.json web/admin-dashboard/package.json
COPY mobile/customer-app/package.json mobile/customer-app/package.json
COPY mobile/vendor-app/package.json mobile/vendor-app/package.json
COPY mobile/rider-app/package.json mobile/rider-app/package.json

RUN npm ci

COPY . .

ENV NODE_ENV=production
WORKDIR /app/backend

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]

