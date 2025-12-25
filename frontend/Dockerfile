FROM node:20-alpine
WORKDIR /app

# Install dependencies first
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

# Build for production so Next.js emits assets under basePath/assetPrefix
RUN npm run build

# Expose Next.js port
EXPOSE 3000

# Start production server
CMD ["npm", "run", "start"]
