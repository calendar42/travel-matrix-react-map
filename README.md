# Flick bike

App that allows users to get hotspots of Amsterdam by tweaking `transportation`/`tourism`/`amenities`.
Also using google to getting the real addresses of the points and exports it as csv.

<!-- MarkdownTOC -->

- [Prerequisites](#prerequisites)
- [Demo](#demo)
- [Installation](#installation)
- [Running](#running)
- [Usage](#usage)
- [Third party libraries](#third-party-libraries)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

<!-- /MarkdownTOC -->

## Prerequisites

#### Environment

* [docker](https://github.com/fgnass/node-dev)
* [docker-compose](https://docs.docker.com/compose/)


## Installation

* Clone this repo
* go to folder and run `npm install`

## Running

* go to `travel-matrix-react-map` directory and run `docker-compose up --build`
* visit `http://localhost:8042`


====

If you want to export the real addresses using google:

* Go inside of the repo folder and run `export GOOGLE_API_KEY_FLICK_BIKE="yoUrAwesOmeSecRetPerSonalToKen"`

Then In the same terminal

* `docker-compose up`
* visit: `localhost:8042`

## Developing

> Recommended

* [node-dev](https://github.com/fgnass/node-dev)

* cd IN to travel-matrix-react-map folder

* in same folder run `GOOGLE_API_KEY_FLICK_BIKE=yourkey node-dev server.js`
* in another terminal `REACT_APP_PROXY_HOST_URL="http://localhost:8042" npm start`
* visit `localhost:3000`


## Third party libraries

* [Docker](https://www.docker.com/)
* [reactJS](https://facebook.github.io/react/)


## Contributing

Make sure to use pull requests when extending this web app

```
# Before starting to touch code
git checkout -b feature/unicorn
# Make nice atomic commits
git commit
# Push back
git push -u origin feature/unicorn
# Please rebase to master if needed
git rebase master
```

## Credits

* [Edmon Marine Clota](https://github.com/comlaterra) - [C42](https://github.com/calendar42) - [2017](http://www.onthisday.com/events/date/2017)
* [Mehmet Ali Izci](https://github.com/mmehmetAliIzci) - [C42](https://github.com/calendar42) - [2017](http://www.onthisday.com/events/date/2017)
* [Jasper Hartong](https://github.com/clinct) - [C42](https://github.com/calendar42) - [2017](http://www.onthisday.com/events/date/2017)

## License

Copyright (C) Calendar42 - All Rights Reserved
Unauthorized copying of this file, via any medium is strictly prohibited
Proprietary and confidential
