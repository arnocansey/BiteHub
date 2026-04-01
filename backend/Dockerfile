FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY prisma.config.ts tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
COPY scripts ./scripts

RUN npm install

ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "start"]
