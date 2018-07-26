const DISTANCE = 0;
const TRAVELTIME = 1;
const GEOJSON = 2;

export function getGeoJson (departures, arrivals) {
  /*
      departures: Array<Array<float>>
      arrivals: Array<Array<float>>
   */
  const search_range = 10000

  if (!departures.length || !arrivals.length) {
    return new Promise((resolve) => { resolve(); });
  }

  return fetch("/matrix/?departures=" + arrivals.join(';') + "&arrivals=" + departures.join(';') + "&route_info=geo_json&search_range=" + search_range)
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
        data.matrix.forEach(
          (row) => (
            row.forEach(
              (cell) => (
                geojson["features"] = geojson["features"]
                  .concat(cell[GEOJSON]["features"].map((f, k) => {
                    // ensure all features have 'properties' set
                    f["properties"] = f["properties"] || {};
                    if (k === 0) {
                      // Add travel info to endpoint
                      f["properties"]['travel_info'] = ~~(cell[TRAVELTIME] / 60) + " mins (" + ~~(cell[DISTANCE] / 1000) + " km)";
                    }
                    return f;
                  }))
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
