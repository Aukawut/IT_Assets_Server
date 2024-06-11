# Use official Node.js 18 base image
FROM node:18

# Set environment variables
ENV PORT=5002
ENV JWT_SECRET=FDEV_SECRET
#app02
ENV DB_USER=sa
ENV DB_PWD="p$th@2567"
ENV DB_NAME=DB_ITINVENTORY
ENV DB_SERVER=10.144.1.87

ENV LDAP_URL=ldap://10.144.1.1
ENV SERVER_API_MOVE_FILE=http://filesharewebapp
ENV DOMAIN_NAME=BSNCR.COM
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Expose port
EXPOSE $PORT

# Command to run the application
CMD ["node", "server.js"]
