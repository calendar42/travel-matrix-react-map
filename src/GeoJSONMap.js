import React, { Component } from "react";
import ReactMapboxGl, { Layer, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import config from "./config.json";
import { getGeoJson } from './MatrixService.js';

const { accessToken, center } = config;

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

  markerClick = function (marker, event) {
    event.originalEvent.preventDefault()
    alert(marker)
  };

  onMapClick = function (map, event) {
    var self = this
    var marker = this.createMarker(event.lngLat)
    var new_markers = new Map().set(marker.id, marker)

    getGeoJson(new_markers, this.state.markers).then(geojson => {
      self.setState({
        "geojson": geojson
      })
    });
    
    this.setState({
      "markers": new Map([...this.state.markers, ...new_markers])
    });
    
  };

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