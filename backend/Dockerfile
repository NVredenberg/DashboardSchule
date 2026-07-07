FROM node:lts-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY backend/package*.json ./backend/

RUN npm install --workspace backend --include-workspace-root

COPY backend ./backend

RUN npm run build -w backend

FROM node:lts-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm install --omit=dev --workspace backend --include-workspace-root \
  && npm cache clean --force

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/config ./backend/config

EXPOSE 3001

CMD ["npm", "run", "start", "-w", "backend"]
