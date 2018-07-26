import React, { Component } from "react";
import ReactMapboxGl, { Layer, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import config from "./config.json";
import { getGeoJson } from './MatrixService.js';
const { accessToken, center } = config;

const MapGL = ReactMapboxGl({
  accessToken: accessToken
});

export default class GeoJSONMap extends Component {
  state = {
    center: center,
    markers: new Map(),
    geojson: null,
    pitch: [0]
  };

  _markersTolatLngs = function (markers) {
    return Array.from(markers.values()).map(m => m.latLng)
  };

  _newMarker = function (lngLat) {
    return {
      "id": lngLat.toString(),
      "lngLat": lngLat.toArray(),
      "latLng": lngLat.toArray().reverse()
    };
  };

  onMapClick = function (map, event) {
    var self = this
    var marker = this._newMarker(event.lngLat)
    var new_markers = new Map().set(marker.id, marker)

    getGeoJson(
      this._markersTolatLngs(new_markers),
      this._markersTolatLngs(this.state.markers)
    ).then(geojson => {
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
      <MapGL
        style="mapbox://styles/mapbox/light-v8"
        center={this.state.center}
        movingMethod="jumpTo"
        pitch={this.state.pitch}
        onClick={this.onMapClick.bind(this)}
        containerStyle={{ height: "100vh", width: "100%" }}>
        
        <ScaleControl/>
        <ZoomControl/>

        { this.state.geojson &&
        <GeoJSONLayer
          data={this.state.geojson}

          lineLayout={{
            "visibility": "visible"
          }}
          linePaint= {{
            "line-color": {
              property: 'linker',
              type: 'categorical',
              default: "#44bbff",
              stops: [
                ['as_the_crow', 'red'],
                ['from_depart', '#223b53'],
                ['to_arrive', '#e55e5e'],
              ]
            },
            "line-width": 3,
            "line-opacity": 0.8,
            "line-offset":0.1,
            "line-blur": 1
          }}
          symbolLayout={{
            "text-optional": true,
            "text-field": "{travel_info}",
            "icon-allow-overlap": true,
            'icon-anchor': "top-right",
            "text-optional": true,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 3],
            "text-anchor": "bottom",
            "text-size": 11,
          }}
          symbolPaint={{
            "text-halo-color": "rgba(255,255,255,1)",
            "text-halo-width": 2
          }}
          />

        }

        <Layer
          type="symbol"
          id="marker"
          layout={{ "icon-image": "marker-15" }}>
          {
            Array.from(this.state.markers.values())
              .map((marker, index) => (
                <Feature
                  key={marker.id}
                  coordinates={marker.lngLat} />
              ))
          }
        </Layer>

      </MapGL>
    );
  }
}