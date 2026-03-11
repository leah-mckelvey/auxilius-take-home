FROM node:22

WORKDIR /app

COPY package*.json ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY types/package.json types/package.json

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start", "-w", "@auxilius-take-home/api"]