FROM node:20-alpine AS development

WORKDIR /app
ENV NODE_ENV=development
ENV API_PORT=3000

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 3000
CMD ["node", "src/server.js"]

FROM node:20-alpine AS production

WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
