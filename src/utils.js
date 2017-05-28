export function haversineDistance (coords1, coords2) {
  const toRad = function (x) {
    return x * Math.PI / 180;
  }

  var lon1 = coords1[0];
  var lat1 = coords1[1];

  var lon2 = coords2[0];
  var lat2 = coords2[1];

  var R = 6371; // km

  var x1 = lat2 - lat1;
  var dLat = toRad(x1);
  var x2 = lon2 - lon1;
  var dLon = toRad(x2);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;

  return d;
}


const colors = [
  "rgb(52,128,247)",
  "rgb(235,85,62)",
  "rgb(131,186,64)",
  "rgb(252,175,30)",
  "rgb(80,45,132)",
  "rgb(0,171,163)",
];

export function getRandomColor () {
  return colors[Math.floor(Math.random() * colors.length)];
}