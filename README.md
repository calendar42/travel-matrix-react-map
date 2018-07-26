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


## Running & Developing

* `npm install`
* `npm start`
* visit `localhost:3000`
* Check package.json to change proxy to any (local) running [TravelMatrix](https://github.com/calendar42/RoutingKit) instance

## Deploying

* `npm build`
* (manually) upload build-directory to Netlify

> Note that the build output will contain a `_redirects` file to set up a [Netlify Proxy](https://www.netlify.com/docs/redirects/#proxying) to a travelmatrix on dev05.c42.io.

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
