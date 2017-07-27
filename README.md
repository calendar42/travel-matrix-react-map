# travel-matrix-react-map

App that uses travel-matrix to get the best route between points which has been selected by user.

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
* Clone RoutingKit => https://github.com/calendar42/RoutingKit


## Running

> To make use of the oracle endpoints, it is required to change the `Dockerfile` to add the actual oracle api key

* Start back-end => go to `RoutingKit` directory and run `docker-compose up --build`
* Start front-end => go to `travel-matrix-react-map` directory and run `docker-compose up --build`
* visit `http://localhost:8042`


## Developing

> Recommended

* [node-dev](https://github.com/fgnass/node-dev)

Starting FE
* cd IN to travel-matrix-react-map folder
* `npm install`
* in same folder run `node-dev server.js`
* in another terminal `REACT_APP_MATRIX_URL="http://localhost:8042" npm start`
* visit `localhost:3000`
Starting BE
* cd IN to RoutingKit folder
* docker-compose up


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
