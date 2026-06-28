FROM node:22-alpine AS development-dependencies-env
COPY . /app
WORKDIR /app
RUN npm ci

FROM node:22-alpine AS production-dependencies-env
COPY ./package.json package-lock.json /app/
WORKDIR /app
RUN npm ci --omit=dev
ENV NODE_ENV=production

FROM node:22-alpine AS build-env

WORKDIR /app

# Copy entire project
COPY . .

# Install server dependencies
WORKDIR /app/server
RUN npm ci

# Install client dependencies
WORKDIR /app/client
RUN npm ci

# Build React Router app
RUN npm run build

# ---------------- Runtime ----------------

FROM node:22-alpine

WORKDIR /app

COPY --from=build /app /app

WORKDIR /app/server

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "server"]