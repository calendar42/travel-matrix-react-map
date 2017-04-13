import React, { Component } from "react";
import ReactMapboxGl, { Popup, Layer, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import config from "./config.json";
import { getGeoJson } from './MatrixService.js';
import { Button } from 'react-bootstrap';
const { accessToken, center } = config;

export default class GeoJSONMap extends Component {
  state = {
    center: center,
    markers: new Map(),
    geojson: null,
    popup: null
  };


  newMarker = function (lngLat) {
    return {
      "id": lngLat.toString(),
      "lngLat": lngLat.toArray(),
      "latLng": lngLat.toArray().reverse()
    };
  };

  removeMarker = function (marker) {
    var self = this
    this.state.markers.delete(marker.id);
    var newState = {
      "markers": this.state.markers,
      "geojson": null
    }
    if (this.state.popup.id == marker.id) {
      newState["popup"] = null;
    }
    this.setState(newState);
  };

  _setPopup = function (marker) {
    this.setState({
      "popup":marker
    })
  };

  // _onToggleHover = function (marker, hoverType) {
  //   marker = hoverType === "pointer" ? marker : null
  //   // this._setPopup(marker)
  // };

  onMapClick = function (map, event) {
    var self = this
    var marker = this.newMarker(event.lngLat)
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
                  // onMouseEnter={this._onToggleHover.bind(this, marker, "pointer")}
                  // onMouseLeave={this._onToggleHover.bind(this, marker, "")}
                  // onClick={this.markerClick.bind(this, marker)}
                  coordinates={marker.lngLat}/>
              ))
          }
        </Layer>

        { this.state.popup &&
        <Popup
          coordinates={this.state.popup.lngLat}
          >
          <Button onClick={this.removeMarker.bind(this, this.state.popup)}>Remove me</Button>
        </Popup>
        }

        { this.state.geojson &&
        <GeoJSONLayer
          data={this.state.geojson}
          linePaint= {{
            "line-color": "#44bbff",
            "line-width": 8,
            "line-opacity": 0.8,
            "line-offset":0.1,
            "line-blur": 4
          }}
          lineLayout={{ visibility: "visible" }}
          circleLayout={{
            "visibility": "false"
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