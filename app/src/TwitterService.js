export function getTweetsGeoJson (departures, arrivals) {
  
  return fetch("http://0.0.0.0:8000/tweets")
    .then(res => res.text())
    .then(data => {
      return new Promise((resolve, reject) => {
        const geojson = JSON.parse(data)
        resolve(geojson);
      });
    })
}
