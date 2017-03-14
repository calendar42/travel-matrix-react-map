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
    marker_coordinates: [],
    geojson: null
  };
  markerClick = function (c) {
    alert(c);
  };
  onMapClick = function (map, event) {
    var self = this;
    this.refreshMatrixGeoJson([event.lngLat.toArray()], this.state.marker_coordinates).then(geojson => {
      console.log(JSON.stringify(geojson));
      self.setState({
        "geojson": geojson
      })
    });

    var new_markers = this.state.marker_coordinates.concat([event.lngLat.toArray()]);
    this.setState({
      "marker_coordinates": new_markers
    });
    
  };

  componentWillMount = function () {
    // this.setState({marker_coordinates:[[ 4.3504057,52.0149705 ], [ 4.3428165,52.0108834 ] ]});
  };

  getParamStringFromCoordinates = function (coordinates) {
    return coordinates.map((coordinate) => ([coordinate[1], coordinate[0]])).join(';');
  }
  refreshMatrixGeoJson = function (departures, arrivals) {
    if (!departures || !arrivals) {
      departures = this.getParamStringFromCoordinates(this.state.marker_coordinates)
      arrivals = departures
    } else {
      departures = this.getParamStringFromCoordinates(departures)
      arrivals = this.getParamStringFromCoordinates(arrivals)
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
            this.state.marker_coordinates
              .map((coordinate, index) => (
                <Feature
                  // key={index}
                  // onMouseEnter={this._onToggleHover.bind(this, "pointer")}
                  // onMouseLeave={this._onToggleHover.bind(this, "")}
                  onClick={this.markerClick.bind(this, coordinate)}
                  coordinates={coordinate}/>
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