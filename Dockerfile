FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY app/ /usr/src/app/

RUN npm install --silent

RUN npm run build

RUN npm install -g serve
# Run serve when the image is run.
CMD serve -s -p 8042 build
# Let Docker know about the port that serve runs on.
EXPOSE 8042
