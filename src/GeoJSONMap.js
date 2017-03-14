import React, { Component } from "react";
import ReactMapboxGl, { Layer, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import config from "./config.json";

const { accessToken } = config;

const containerStyle = {
  height: "100vh",
  width: "100%"
};

const center = [ 4.3666811, 51.996583 ];





export default class GeoJSONMap extends Component {
  state = {
    center: center,
    markers: new Map(),
    geojson: null
  };

  createMarker = function (lngLat) {
    return {
      "id": lngLat.toString(),
      "lngLat": lngLat.toArray(),
      "latLng": lngLat.toArray().reverse()
    };
  };

  markerClick = function (c) {
    alert(c);
  };

  onMapClick = function (map, event) {
    var self = this
    var marker = this.createMarker(event.lngLat)
    var new_markers = new Map().set(marker.id, marker)

    this.refreshMatrixGeoJson(new_markers, this.state.markers).then(geojson => {
      self.setState({
        "geojson": geojson
      })
    });
    
    this.setState({
      "markers": new Map([...this.state.markers, ...new_markers])
    });
    
  };

  // componentWillMount = function () {
  //   // this.setState({markers:[[ 4.3504057,52.0149705 ], [ 4.3428165,52.0108834 ] ]});
  // };
  

  markersToParams = function (markers) {
    return Array.from(markers.values()).map(m=>m.latLng).join(';')
  }

  refreshMatrixGeoJson = function (departures, arrivals) {
    if (!departures || !arrivals) {
      departures = this.markersToParams(this.state.markers)
      arrivals = departures
    } else {
      departures = this.markersToParams(departures)
      arrivals = this.markersToParams(arrivals)
    }

    if (departures === "" || arrivals === "") {
      return new Promise((resolve) => { resolve(); });
    }

    return fetch("/matrix?departures="+arrivals+"&arrivals="+departures+"&debug=true&search_range=100")
      .then(res => res.text())
      .then(data => {
        return new Promise((resolve, reject) => {
          var geojson = {
            "type": "FeatureCollection",
            "features": []
          }
          data = JSON.parse(data)
          data.forEach(
            (row) => (
              row.forEach(
                (column) => (
                  geojson["features"] = geojson["features"].concat(column[2]["features"])
                    ))))
          resolve(geojson)
          
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



  render() {
    return (
      <ReactMapboxGl
        style="mapbox://styles/mapbox/light-v8"
        accessToken={accessToken}
        center={this.state.center}
        movingMethod="jumpTo"
        pitch="60"
        onClick={this.onMapClick.bind(this)}
        containerStyle={{ height: "100vh", width: "100%" }}>
        

        <ScaleControl/>
        <ZoomControl/>

        <Layer
          type="symbol"
          id="marker"
          layout={{ "icon-image": "marker-15" }}>
          {
            Array.from(this.state.markers.values())
              .map((marker, index) => (
                <Feature
                  key={marker.id}
                  // onMouseEnter={this._onToggleHover.bind(this, "pointer")}
                  // onMouseLeave={this._onToggleHover.bind(this, "")}
                  onClick={this.markerClick.bind(this, marker)}
                  coordinates={marker.lngLat}/>
              ))
          }
        </Layer>

        { this.state.geojson &&
        <GeoJSONLayer
          data={this.state.geojson}
          linePaint= {{
            "line-color": "#000000",
            "line-width": 1,
            "line-opacity": 0.6
          }}
          lineLayout={{ visibility: "visible" }}
          circleLayout={{
            "visibility": "visible"
          }}
          circlePaint = {{
            "circle-radius": 2
          }}
          symbolLayout={{
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
          }}
          />
        }


      </ReactMapboxGl>
    );
  }
}