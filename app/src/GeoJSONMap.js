import React, { Component } from "react";
import { Form, FormGroup, FormControl, InputGroup, Button } from 'react-bootstrap';
import ReactMapboxGl, { Layer, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import {LngLat} from "mapbox-gl";
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
    pitch: [0],
    zoom: [5],
  };

  formStyle = {
    'position': 'fixed',
    'zIndex': 999,
    'padding': 5
  }

  dataDrivencolorStyle = {
    property: "speed",
    type: "exponential",
    stops: [
      [0, 'red'],
      [50, 'orange'],
      [100, 'green'],
    ]
  }

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

  onSubmittedPoint = function (event) {
    /*
      Stateless form control
      Parse point-input value and adds Marker on latLng
     */
    event.preventDefault()
    var pointField = event.target.getElementsByClassName('point-input')[0]
    var lngLats = pointField.value.split(';').map(l => l.split(','))
    pointField.value = ''
    for (var lngLat of lngLats) {
      if (lngLat.length !== 2) {
        // minimal validation
        continue;
      }
      lngLat = lngLat.map(l => parseFloat(l))

      // in NL lng is always smaller than the lat
      if (lngLat[0] > lngLat[1]) {
        lngLat = lngLat.reverse()
      }
      lngLat = new LngLat(lngLat[0], lngLat[1])
      this.extendMarkers(lngLat) 
    }
  }

  onMapClick = function (map, event) {
    this.extendMarkers(event.lngLat)
  };

  extendMarkers(lngLat) {
    var self = this
    var marker = this._newMarker(lngLat)
    var new_markers = new Map().set(marker.id, marker)

    getGeoJson(
      this._markersTolatLngs(new_markers),
      this._markersTolatLngs(this.state.markers)
    ).then(geojson => {
      self.setState({ geojson })
    });

    this.setState({
      "markers": new Map([...this.state.markers, ...new_markers])
    });
  }

  render() {
    return (
      <div>
        <Form inline onSubmit={this.onSubmittedPoint.bind(this)} style={this.formStyle}>
          <FormGroup>
            <InputGroup>
              <FormControl className='point-input' name="point" placeholder="lat,lng; lat,lng" />
              <InputGroup.Button>
                <Button type="submit">add</Button>
              </InputGroup.Button>
            </InputGroup>
          </FormGroup>
        </Form>
      <MapGL
        style="mapbox://styles/mapbox/light-v8"
        center={this.state.center}
        zoom = {this.state.zoom}
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
            "line-color": this.dataDrivencolorStyle,
            "line-width": 3,
            "line-opacity": 0.7,
            "line-blur": 1
          }}
          symbolLayout={{
            "text-optional": true,
            "text-field": "{travel_info}",
            "icon-allow-overlap": true,
            "symbol-avoid-edges": true,
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [1, 0.2],
            "text-anchor": "left",
            "text-size": 11,
          }}
          symbolPaint={{
            "text-halo-color": "rgba(255,255,255,1)",
            "text-halo-width": 2,
            "text-color": this.dataDrivencolorStyle
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
      </div>
    );
  }
}