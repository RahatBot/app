# Stage 1: Building the application
FROM node:16-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_SOCKET_PATH
ENV NEXT_PUBLIC_SOCKET_PATH=$NEXT_PUBLIC_SOCKET_PATH
ARG NEXT_PUBLIC_TEXT_TO_SPEECH
ENV NEXT_PUBLIC_TEXT_TO_SPEECH=$NEXT_PUBLIC_TEXT_TO_SPEECH
ARG NEXT_PUBLIC_SPEECH_TO_TEXT
ENV NEXT_PUBLIC_SPEECH_TO_TEXT=$NEXT_PUBLIC_SPEECH_TO_TEXT
ARG NEXT_PUBLIC_BOT_ID
ENV NEXT_PUBLIC_BOT_ID=$NEXT_PUBLIC_BOT_ID
ARG NEXT_PUBLIC_ORG_ID
ENV NEXT_PUBLIC_ORG_ID=$NEXT_PUBLIC_ORG_ID
# Copy the rest of your application's source code
COPY . .

# Build your Next.js application
RUN npm run build

# Stage 2: Running the application in production
FROM node:16-alpine AS runner

# Set the working directory
WORKDIR /app

# If there's a potential issue with overwriting directories, ensure clean slate (Use with caution)
# RUN rm -rf .next public node_modules

# Copy the build artifacts from the builder stage
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose the port your app runs on
EXPOSE 3000

# Set the command to run your app
CMD ["npm", "start"]
