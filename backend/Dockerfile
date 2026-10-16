# Backend Dockerfile — Clearview Complaints Management
# Node.js 20 + Python 3.11 (for agent pipeline subprocess calls)
FROM node:20-slim

# Install Python 3.11 and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Install Anthropic Python SDK globally
RUN pip3 install anthropic --break-system-packages

WORKDIR /app

# Copy and install Node dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy TypeScript source and compile
COPY tsconfig*.json ./
COPY server.ts ./
RUN npx tsc --outDir dist server.ts || \
    (npm install --save-dev typescript @types/node @types/express @types/cors @types/pg && \
     npx tsc --outDir dist server.ts)

# The agents/ folder is volume-mounted at runtime via docker-compose
# so the Python orchestrator is available without baking it into the image

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
