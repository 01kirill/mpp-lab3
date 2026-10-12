FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_MAILHOG_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MAILHOG_URL=$VITE_MAILHOG_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Источник API для CSP connect-src; переопределяется переменной окружения контейнера
ENV API_ORIGIN=http://localhost:4000
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80