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

                    // Add travel info to endpoint based on total distances and times
                    if (k === 0) {
                      f["properties"]['travel_info'] = ~~(cell[TRAVELTIME] / 60) + " mins (" + ~~(cell[DISTANCE] / 1000) + " km)";
                    }

                    // Calculate speed in km/h
                    if (f["properties"]["travel_time"] && f["properties"]["distance"]) {
                      f["properties"]["speed"] = f["properties"]["distance"] / f["properties"]["travel_time"] * 3600;
                      f["properties"]['travel_info'] = ~~(f["properties"]["speed"]) + " km/h";
                    } else if (f["properties"]["linker"] === "as_the_crow") {
                      f["properties"]["speed"] = 0
                    } else if (f["properties"]["linker"]) {
                      f["properties"]["speed"] = 10
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
