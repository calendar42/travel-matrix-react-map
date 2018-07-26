import React, { Component } from "react";
import ReactMapboxGl, { Popup, Layer, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import config from "./config.json";
import { getGeoJson } from './MatrixService.js';
import { getTweetsGeoJson } from './TwitterService.js';
import { Button } from 'react-bootstrap';
const { accessToken, center } = config;

const MapGL = ReactMapboxGl({
  accessToken: accessToken
});

export default class TwitterMap extends Component {
  state = {
    center: center,
    markers: new Map(),
    geojson: null,
    popup: null,
    pitch: [0]
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

  componentDidMount = function () {
    var self = this 
    getTweetsGeoJson().then(geojson => {
      console.log(geojson);
      self.setState({
        "geojson": geojson
      })
    });
  }

  onMapClick = function (map, event) {
    var self = this
    var marker = this.newMarker(event.lngLat)
    var new_markers = new Map().set(marker.id, marker)
    
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
          <div style={{position:'absolute', zIndex:1000, top:'10px', left:'20px', color:"rgb(39,39,39)"}}>
            <h3 style={{color:"rgb(113,175,49)"}}>
              #STORMPOOLEN 2018-01-18 
            </h3>
            <h4>
              Rides & locations extracted from {this.state.geojson.features.length} Tweets
            </h4>
            <h5>
              #dataviz #nlp #toogethr
            </h5>
          </div>
        }
        { this.state.geojson && 
        <GeoJSONLayer
          data={this.state.geojson}
          linePaint= {{
            "line-color": "rgb(113,175,49)",
            "line-width": 4,
            "line-opacity": 0.8,
            "line-offset":0.1,
            "line-blur": 2
          }}
          lineLayout={{ visibility: "visible" }}
          circleLayout={{
            "visibility": "visible"
          }}
          circlePaint = {{
            "circle-radius": 4,
            "circle-color": "rgb(255,255,255)",
            "circle-stroke-width": 5,
            "circle-stroke-color": "rgb(113,175,49)"
          }}
          symbolLayout={{
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
          }}
          />
        }


      </MapGL>
    );
  }
}