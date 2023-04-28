FROM node:alpine as development

RUN mkdir -p /app
WORKDIR /app

COPY . /app
COPY package.json ./
COPY package-lock.json ./


RUN npm install

COPY . .

RUN npm run build

