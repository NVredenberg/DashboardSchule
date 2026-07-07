FROM node:lts-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY tsconfig.base.json ./
COPY frontend/package*.json ./frontend/

RUN npm install --workspace frontend --include-workspace-root

COPY frontend ./frontend

RUN npm run build -w frontend

FROM nginx:alpine AS runtime

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 3333

