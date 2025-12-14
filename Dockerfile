FROM node:20.18-bullseye

WORKDIR /app

COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/package.json
COPY functions/package.json functions/package.json

RUN npm install

COPY . .

RUN npm install --workspace frontend && npm install --workspace functions

EXPOSE 5173 5001 8080 4000

CMD ["npm", "run", "dev"]

