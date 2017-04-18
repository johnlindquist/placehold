FROM node:7.6.0

LABEL name="screenshot.johnlindquist.com"

RUN apt-get update &&\
    apt-get install -y \
    xvfb \
    x11-xkb-utils \
    xfonts-100dpi \
    xfonts-75dpi \
    xfonts-scalable \
    xfonts-cyrillic \
    x11-apps \
    clang \
    libdbus-1-dev \
    libgtk2.0-dev \
    libnotify-dev \
    libgnome-keyring-dev \
    libgconf2-dev \
    libasound2-dev \
    libcap-dev \
    libcups2-dev \
    libxtst-dev \
    libxss1 \
    libnss3-dev \
    gcc-multilib \
    g++-multilib

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

ADD app/index.js app/package.json /usr/src/app/

RUN npm install

EXPOSE 3000
CMD xvfb-run --server-args="-screen 0 1024x768x24" npm start
