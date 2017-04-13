var _markersToParams = function (markers) {
  return Array.from(markers.values()).map(m=>m.latLng).join(';')
}

export function getGeoJson (departures, arrivals) {
  departures = _markersToParams(departures)
  arrivals = _markersToParams(arrivals)

  if (departures === "" || arrivals === "") {
    return new Promise((resolve) => { resolve(); });
  }
  // TODO: construct this URL in a nicer way
  return fetch("/matrix?departures="+arrivals+"&arrivals="+departures+"&debug=true&search_range=100")
    .then(res => res.text())
    .then(data => {
      return new Promise((resolve, reject) => {

        // Create root geojson FeatureCollection
        var geojson = {
          "type": "FeatureCollection",
          "features": []
        }
        data = JSON.parse(data)

        // Walk over rows and columns and push feature into root geojson
        data.forEach(
          (row) => (
            row.forEach(
              (column) => (
                geojson["features"] = geojson["features"].concat(column[2]["features"])
                  ))))
        resolve(geojson)

        // TODO: Handle failures
        // parseString(data, (err, res) => {
        //   if(!err) {
        //     resolve(res);
        //   } else {
        //     reject(err);
        //   }
        // });
      });
    })
}