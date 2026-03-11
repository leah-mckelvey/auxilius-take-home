FROM node:22

WORKDIR /app

COPY package*.json ./
COPY api/package.json api/package.json
COPY web/package.json web/package.json
COPY types/package.json types/package.json

RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "-w", "@auxilius-take-home/web", "--", "--host", "0.0.0.0"]