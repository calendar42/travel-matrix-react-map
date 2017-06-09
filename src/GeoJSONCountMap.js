import React, { Component } from "react";
import ReactMapboxGl, { Marker, GeoJSONLayer } from "react-mapbox-gl";
import config from "./config.json";
import {haversineDistance, getRandomColor} from "./utils.js";
import routePolyjson from "./data/geojson_filtered_gt_5_polyline.json";

import points from "./data/points.json";
import { Panel, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
const { accessToken, center } = config;

import polyliner from "geojson-polyline";

const PITCHED_FITBOUNDSOPTIONS = {
  _default_pitch: 60,
  padding: 30,
  offset: [0,-130],
  linear: false,
  duration: 1000,  // speed of panning animation
}

const NONPITCHED_FITBOUNDSOPTIONS = {
  _default_pitch: 0,
  padding: 80,
  offset: [0,-170],
  linear: false,
  duration: 1000,  // speed of panning animation
}

const ANIMATION_TYPE_FROM_ORIGIN_OUTWARDS = 1
const ANIMATION_TYPE_BETWEEN_ORIGIN_AND_DESTINATION = 2


/*
  ============================== START SETTINGS ================================
*/

/*
  Fit bounds needs different options depending on whether we want the map to be pitched
*/

const DEFAULT_FITBOUNDSOPTIONS = NONPITCHED_FITBOUNDSOPTIONS;  // NON_PITCHED_FITBOUNDSOPTIONS

/*
  There are 2 main markers:
*/
const DESTINATION_COORDS = [4.4881837,51.882791];
const ORIGIN_COORDS = [4.53,52.22];

/*
  Animations are simple motions of the markers
    There are 2 animation types
*/
const DEFAULT_ANIMATION_TYPE = ANIMATION_TYPE_FROM_ORIGIN_OUTWARDS;
const ANIMATION_MOVE_FRACTION = 500;
const ANIMATION_MOVE_DELAY_MS = 400;
const ANIMATION_ON = false;

/*
  The radiuses of the other markers and routes shown are
    based on the distance between the origin and destination.
  They are controlled with the numbers below
*/
const ROUTE_RADIUS_DISTANCE_FACTOR = 1/2;
const ROUTE_RADIUS_MAX_KM = 50;
const MARKER_RADIUS_DISTANCE_FACTOR = 1/4;
const MARKER_RADIUS_MAX_KM = 20;



// const MAP_STYLE = "mapbox://styles/denniskoks/cirroi8ln004uh0ncgm9s7g8w"

const MAP_STYLE = "mapbox://styles/jasperhartong/cj3pscyt700022rp9ehqpgvbd"

// const MAP_STYLE = "mapbox://styles/mapbox/dark-v9"
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj3a0w0hu00012rpet2mtv7h7"
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj1uzj8xj00092sk9ufhlhuon";  // dark map
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";  // white map
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";  // 'natural map'

/*
  ============================== END SETTINGS ================================
*/



/* 
  Prepare GeoJSON data
  - Transform array of latlons to geoJSON features with random colors
*/
const markerGeojson = {
  "type": "FeatureCollection",
  "features": points.coords.map(function (c) {
    return {
        "type": "Feature",
        "properties": {
          "color": getRandomColor()
        },
        "geometry": {
          "type": "Point",
          "coordinates": c
        }
      }
  })
};

/* 
  Prepare GeoJSON data
  - Add random colors to route data
*/


let routeGeojson = routePolyjson;
if(typeof routeGeojson.features[0].geometry.coordinates === "string"){
  routeGeojson = polyliner.decode(routeGeojson);
}

routeGeojson["features"].map(function(feature){
  feature["properties"]["color"] = getRandomColor();
})


/*
  Map styling
*/

const mobileContainerStyle = {
  position:"relative",
  height: "100%",
  width: "100%"
}

const bottomPanelStyle = {
  position:"absolute",
  bottom:0,
  zIndex:99999,
  margin:"0 10px",
  width:"calc(100% - 20px)",
  height:"55%",
  overflow: "auto"
}


export default class GeoJSONMap extends Component {
  /*
    FYI:
      componentDidMount() --callback--> setFilteredFeatures() --callback--> setmapBounds()
  */
  constructor(props) {
    super(props);
    this.state = {
      center: center,
      bearing: 0,
      pitch:DEFAULT_FITBOUNDSOPTIONS._default_pitch,
      routeGeojson: routeGeojson,
      markerGeojson: markerGeojson,
      lineWidth: 1,
      bounds: [DESTINATION_COORDS, ORIGIN_COORDS],  // initiate with preset bounding box
      destinationCoords: DESTINATION_COORDS,
      originCoords: ORIGIN_COORDS,
      originSrcUrl:"//avatars3.githubusercontent.com/u/452291?v=3&s=460",
      destinationSrcUrl:"./destination.png",
      open: true,
    };
  }

  componentDidMount() {
    this.setFilteredFeatures();
    this.animate()
  }

  onMapClick(map, event) {
    this.setState({
      originCoords: event.lngLat.toArray(),
    },this.setFilteredFeatures);
  }

  setFilteredFeatures() {
    /* 
    This function uses the geojsonFilter to show a certain subset of the data.
      - This subset can be based on a samplesize (e.g: 0.05 of the data), or based on a radius
    */
    let distance = haversineDistance(this.state.destinationCoords, this.state.originCoords);
    let markerRadius = Math.min((distance*MARKER_RADIUS_DISTANCE_FACTOR),MARKER_RADIUS_MAX_KM);
    let routeRadius = Math.min((distance*ROUTE_RADIUS_DISTANCE_FACTOR),ROUTE_RADIUS_MAX_KM);

    this.setState({
      // "routeGeojson": this.geojsonFilter(
      //   routeGeojson,
      //   this.state.destinationCoords,
      //   routeRadius,
      //   1.0
      // ),
      "markerGeojson": this.geojsonFilter(
        markerGeojson,
        this.state.originCoords,
        Infinity,
        0.07
      )
    }, this.setmapBounds);
  }

  animate() {
    if (!ANIMATION_ON) {
      return false;
    }
    let self = this;

    const getMove = function (coordinates, type) {
      const origin = self.state.originCoords;
      const destination = self.state.destinationCoords;
      const random = Math.random()
      if (type === ANIMATION_TYPE_BETWEEN_ORIGIN_AND_DESTINATION) {
        return [
          coordinates[0] - ((origin[0] - destination[0])/ANIMATION_MOVE_FRACTION*random),
          coordinates[1] - ((origin[1] - destination[1])/ANIMATION_MOVE_FRACTION*random),
        ]
      }
      if (type === ANIMATION_TYPE_FROM_ORIGIN_OUTWARDS) {
        return [
          coordinates[0] - ((origin[0] - coordinates[0])/ANIMATION_MOVE_FRACTION*random),
          coordinates[1] - ((origin[1] - coordinates[1])/ANIMATION_MOVE_FRACTION*random),
        ]
      }
    };

    requestAnimationFrame(
      function(){
        let geojson = JSON.parse(JSON.stringify(self.state.markerGeojson))  // deepcopy
        geojson["features"] = self.state.markerGeojson["features"].map(function (feature) {
          feature.geometry.coordinates = getMove(feature.geometry.coordinates, DEFAULT_ANIMATION_TYPE);
          return feature
        });
        self.setState({
          "markerGeojson": geojson
        });
        setTimeout(function() {
          self.animate()
        }, ANIMATION_MOVE_DELAY_MS);
      })
  }

  setmapBounds() {
    /*
      Create bounding box based on the destinationCoords and originCoords and setState
    */
    const c1 = this.state.destinationCoords;
    const c2 = this.state.originCoords;
    let bounds = [
      c1[0] < c2[0] ? c1[0] : c2[0],
      c1[1] < c2[1] ? c1[1] : c2[1],
      c1[0] > c2[0] ? c1[0] : c2[0],
      c1[1] > c2[1] ? c1[1] : c2[1],
    ];
    this.setState({
      bounds: bounds
    })
  }

  geojsonFilter(geojson, originCoords, radius, sampling) {
    /*
      Returns copied instance of geojson, with features filtered by radius from originCoords
      - sampling allows you to only get a random sampling of the data
    */
    geojson = JSON.parse(JSON.stringify(geojson))  // deepcopy
    geojson["features"] = geojson["features"].filter(function(feature){
      let distance = Infinity;
      if (feature.geometry.type === "Point") {
        distance = haversineDistance(feature.geometry.coordinates, originCoords);
      }
      if (feature.geometry.type === "LineString") {
        distance = haversineDistance(feature.geometry.coordinates[0], originCoords);
      }

      feature["properties"]["distance"] = distance;
      return radius > distance && (Math.random() > (1.0-sampling));
    });
    return geojson
  }

  changeWidth = ev => this.setState({
    lineWidth: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  changePitch = ev => this.setState({
    pitch: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  changeBearing = ev => this.setState({
    bearing: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  render() {
    return (
      <div style={mobileContainerStyle}>
        <Panel style={bottomPanelStyle}>
        <h3>
          Hi there!
        </h3>
        <p>
          <b>Click around above to change the position of the person bubble, zoom out to find a nice spot for it.</b>
        </p>
        <p>
          You'll see the amount of related people around you (and they'll animate slightly).
        </p>
        <hr/>
        <p>
          There are quite some settings to adjust in the code:
        </p>
        <p>
          <li>The colors</li>
          <li>The style of the map</li>
          <li>The animation type and speed</li>
          <li>The radius for the shown markers/ routes.</li>
          <li>The initial starting point of the person bubble</li>
          <li>The speed of the panning animation</li>
          <li>You can even Pitch the map</li>
        </p>
          {/*
          <form>
            <FormGroup>
              <ControlLabel>Map Pitch: {this.state.pitch}</ControlLabel>
              <FormControl type="range"
                value={this.state.pitch}
                onChange={this.changePitch}
              />
              <ControlLabel>Map Bearing: {this.state.bearing}</ControlLabel>
              <FormControl type="range"
                value={this.state.bearing}
                onChange={this.changeBearing}
              />
              <ControlLabel>Line width: {this.state.lineWidth}</ControlLabel>
              <FormControl type="range"
                value={this.state.lineWidth}
                onChange={this.changeWidth}
              />
            </FormGroup>
          </form>
          */}
        </Panel>

        <ReactMapboxGl
          style={MAP_STYLE}
          accessToken={accessToken}
          onClick={this.onMapClick.bind(this)}
          center={this.state.center}
          movingMethod="jumpTo"
          pitch={this.state.pitch}
          bearing={this.state.bearing}
          fitBounds={this.state.bounds}
          fitBoundsOptions={DEFAULT_FITBOUNDSOPTIONS}
          containerStyle={{ height: "100%", width: "100%" }}>

          { this.state.routeGeojson &&
          <GeoJSONLayer
            data={this.state.routeGeojson}
            linePaint= {{
              "line-width": this.state.lineWidth,
              "line-color": {
                property: "count",
                type: "interval",
                stops: [
                  [0, 'rgba(0,173,165,0.2)'],
                  [200, 'rgba(0,173,165,0.4)'],
                  [400, 'rgba(0,173,165,0.6)'],   
                  [600, 'rgba(0,173,165,0.8)'],   
                  [1000, 'rgba(0,173,165,1)']
                ]
              }
            }}
            lineLayout={{
              visibility: "visible",
              "line-cap": "round",
              "line-join": "round"
            }}
            />
          }

          { this.state.markerGeojson &&
          <GeoJSONLayer
            id={"marker-layer"}
            data={this.state.markerGeojson}
            circleLayout={{
              "visibility": "visible",
            }}
            circlePaint={{
              "circle-color": "rgb(0,173,165)",
              "circle-opacity": 1,
              "circle-radius": {
                property: "distance",
                type: "interval",
                stops: [
                  [40, 2],
                ]
              }
            }}
          />
          }


          <Marker
            offset="35px"
            coordinates={this.state.originCoords}
            anchor="bottom">
            <img className="img-circle"
              style={{width:"70px", height:"70px"}}
              src={this.state.originSrcUrl}/>
          </Marker>

          <Marker
            coordinates={this.state.destinationCoords}
            anchor="bottom">
            <img className="img-circle"
              style={{width:"90px", height:"90px"}}
              src={this.state.destinationSrcUrl}/>
          </Marker>
          
        </ReactMapboxGl>
      </div>
    );
  }
}