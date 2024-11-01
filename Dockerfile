FROM --platform=linux/amd64 node:18.2

# Creating an app directory.
RUN mkdir -p /var/app
WORKDIR /var/app
COPY . .

# Installing app dependencies.
COPY package*.json ./
RUN npm install


EXPOSE 3030
CMD [ "npm", "run", "start:dev" ]