FROM node:20-slim AS frontend

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend code
COPY . .

# Build the Next.js application
RUN npm run build

# Use Python base image for the backend
FROM python:3.11-slim

WORKDIR /app

# Install dependencies for apt-get
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install TeX Live with recommended packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code and built frontend
COPY --from=frontend /app/api ./api
COPY --from=frontend /app/.next ./.next
COPY --from=frontend /app/public ./public
COPY --from=frontend /app/next.config.js ./

# Create uploads directory
RUN mkdir -p ./api/uploads && chmod 777 ./api/uploads

# Expose ports for Next.js and FastAPI
EXPOSE 3000
EXPOSE 8000

# Install serve to run Next.js production build
RUN apt-get update && apt-get install -y --no-install-recommends npm && \
    npm install -g serve && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create start script
RUN echo '#!/bin/bash\n\
# Start FastAPI in the background\n\
python -m uvicorn api.index:app --host 0.0.0.0 --port 8000 & \n\
# Start Next.js frontend\n\
serve -s .next -p 3000' > /app/start.sh && \
    chmod +x /app/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV GEMINI_API_KEY=""

# Use the start script as the entry point
CMD ["/app/start.sh"]