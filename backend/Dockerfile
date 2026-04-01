FROM node:20-alpine

WORKDIR /app

ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bitehub?schema=public

COPY package.json ./
COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts

RUN npm install

ENV NODE_ENV=production
ENV DATABASE_URL=${DATABASE_URL}

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
