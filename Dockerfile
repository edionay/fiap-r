FROM node:24.13.1-bookworm-slim AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY tsconfig.json tsconfig.build.json tsoa.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:24.13.1-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node migrations ./migrations

USER node

EXPOSE 3000

CMD ["node", "dist/config/server.js"]
