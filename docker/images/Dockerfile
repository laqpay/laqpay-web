FROM node:8-alpine AS build

COPY . /usr/src/laqpay-web

WORKDIR /usr/src/laqpay-web

RUN npm install -g @angular/cli \
    && npm install \
    && npm run build

FROM nginx:alpine

COPY --from=build /usr/src/laqpay-web/dist /usr/share/nginx/html/dist

COPY ./docker/images/nginx.conf /etc/nginx/nginx.conf
