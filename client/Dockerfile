FROM node:22-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:22-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci
ENV NODE_ENV=production

FROM node:22-alpine AS build

WORKDIR /app

# copy everything first
COPY . .

# install ALL deps (important for react-router CLI)
RUN npm ci
RUN cd server && npm install
RUN cd client && npm install

# build client
RUN cd client && npm run build


FROM node:22-alpine

WORKDIR /app

COPY --from=build /app /app

WORKDIR /app/server

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "server"]