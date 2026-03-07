# Use Node 22 - required by camera-controls and package.json engines
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies
RUN yarn install

# Copy source
COPY . .

# Build the app
RUN yarn build || npm run build

# Serve on port 3000 (Elestio expects this)
EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "--listen", "3000"]
