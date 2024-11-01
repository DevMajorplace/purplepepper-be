# Use a specific platform and Node.js version.
FROM --platform=linux/amd64 node:18.2

# Set the working directory inside the container.
WORKDIR /var/app

# Copy only package.json and package-lock.json first for better caching of npm install.
COPY package*.json ./

# Install app dependencies.
RUN npm install

# Copy the rest of the application code to the container.
COPY . .

# Expose the port your app runs on.
EXPOSE 3000

# Command to start the application.
CMD ["npm", "run", "start"]
