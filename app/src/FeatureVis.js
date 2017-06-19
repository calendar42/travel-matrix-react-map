import React, { Component } from "react";
import ReactMapboxGl, { Marker, GeoJSONLayer, Cluster } from "react-mapbox-gl";
import config from "./config.json";
import {haversineDistance, getRandomColor} from "./utils.js";
// import routeGeojson from "./data/geojson_filtered_gt_5.json";
import markerGeojson from "./data/less_clustered.json";
import { Panel, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
const { accessToken, center } = config;

// import MetricPicker from "./components/MetricPicker/MetricPicker";

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

// const MAP_STYLE = "mapbox://styles/mapbox/dark-v9"
const MAP_STYLE = "mapbox://styles/jasperhartong/cj3a0w0hu00012rpet2mtv7h7"
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
// const markerGeojson = {
//   "type": "FeatureCollection",
//   "features": points.coords.map(function (c) {
//     return {
//         "type": "Feature",
//         "properties": {
//           "color": getRandomColor()
//         },
//         "geometry": {
//           "type": "Point",
//           "coordinates": c
//         }
//       }
//   })
// };

/*
  Prepare GeoJSON data
  - Add random colors to route data
*/
// routeGeojson["features"].map(function(feature){
//   feature["properties"]["color"] = getRandomColor()
// })

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
  width:"30%",
  height:"35%",
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
      // pitch:DEFAULT_FITBOUNDSOPTIONS._default_pitch,
      // routeGeojson: routeGeojson,
      markerGeojson: markerGeojson,
      lineWidth: 3,
      // bounds: [DESTINATION_COORDS, ORIGIN_COORDS],  // initiate with preset bounding box
      // destinationCoords: DESTINATION_COORDS,
      originCoords: ORIGIN_COORDS,
      open: true,
      amenities: 90,
      tourism: 0,
      publicTransport:0
    };

    this.filterByBoundingBox = this.filterByBoundingBox.bind(this);
    this.normaliseData = this.normaliseData.bind(this);
  }

  filterByBoundingBox(){
    let boundingTL = [52.385554, 4.838650]
    let boundingBR = [52.337852, 4.935210];
    let points = this.state.markerGeojson;
    let featuresArray = [];

    for (var i = 0; i < points.features.length; i++) {
      let lon = points.features[i].geometry.coordinates[0];
      let lat = points.features[i].geometry.coordinates[1];

      if (lat < boundingTL[0] && lat > boundingBR[0] && lon > boundingTL[1] && lon < boundingBR[1]) {
        featuresArray.push(points.features[i]);
      }
    }

    points["features"] = featuresArray;

    this.setState({
      markerGeojson: points,
      filteredMarkerGeoJson: points,
    })

  }

  normaliseData(){

  }

  componentDidMount() {
    this.filterByBoundingBox();
    this.setFilteredFeatures();
  }

  geojsonFilter(filterArray,geojson) {
    /*
      Returns copied instance of geojson, with features filtered by radius from originCoords
      - sampling allows you to only get a random sampling of the data
    */
    let self = this;
    geojson = JSON.parse(JSON.stringify(geojson))  // deepcopy


    var featuresList = []

    // console.log(feature.properties.T_sum, feature.properties.A_sum, feature.properties.PT_sum)
    let tourism = filterArray[0] /100;
    let amenities = filterArray[1] /100;
    let publicTransport = filterArray[2] /100;
    // console.log(self.state.tourism, self.state.amenities, self.state.publicTransport)
    geojson["features"] = geojson["features"].filter(function(feature){
      let distance = Infinity;

      let pass = false;

      // console.log(feature.properties.A_sum, amenities, feature.properties.A_sum >= amenities);
      // console.log(feature.properties.T_sum, tourism, feature.properties.T_sum >= tourism);
      if(
        feature.properties.T_sum >= tourism ||
        feature.properties.A_sum >= amenities ||
        feature.properties.PT_sum >= publicTransport
        ){
        return true
      }
      return false
    });
    // console.log("Done Filtering");
    return geojson
  }

  setFilteredFeatures() {
    /*
    This function uses the geojsonFilter to show a certain subset of the data.
      - This subset can be based on a samplesize (e.g: 0.05 of the data), or based on a radius
    */
    let filteredMarkers = this.geojsonFilter(markerGeojson)
    this.setState({
      "filteredMarkerGeoJson":filteredMarkers
    });
  }

  changeTourism(ev){
    let tourism = ev.target.value ? parseFloat(ev.target.value) : 0;
    let amenities = this.state.amenities;
    let publicTransport = this.state.publicTransport;
    let filterArray = [tourism,amenities,publicTransport];

    let currentMarkers = this.state.markerGeojson;

    let filteredMarkers = this.geojsonFilter(filterArray,currentMarkers)
    this.setState(
      {
        tourism: tourism,
        filteredMarkerGeoJson: filteredMarkers,
      }
    );
  }

  changeAmenities(ev){
    let amenities = ev.target.value ? parseFloat(ev.target.value) : 0;
    let tourism = this.state.tourism;
    let publicTransport = this.state.publicTransport;
    let filterArray = [tourism,amenities,publicTransport];

    let currentMarkers = this.state.markerGeojson;

    let filteredMarkers = this.geojsonFilter(filterArray,currentMarkers)
    this.setState(
      {
        amenities: amenities,
        filteredMarkerGeoJson: filteredMarkers,
      }
    );
  }

  changePublicTransport(ev){
    let publicTransport = ev.target.value ? parseFloat(ev.target.value) : 0;
    let amenities = this.state.amenities;
    let tourism = this.state.tourism;
    let filterArray = [tourism,amenities,publicTransport];

    let currentMarkers = this.state.markerGeojson;

    let filteredMarkers = this.geojsonFilter(filterArray,currentMarkers)
    this.setState(
      {
        publicTransport: publicTransport,
        filteredMarkerGeoJson: filteredMarkers,
      }
    );

  }

  onMarkerClick(coords) {
    console.log(coords);
  }

  clusterMarker = (coordinates, pointCount) => (
    <Marker coordinates={coordinates} key={coordinates.toString()}>
      { pointCount }
    </Marker>
  );

  render() {
    return (
        <div style={mobileContainerStyle}>
        <div id="triangle"></div>
        {
          /*
            <MetricPicker />
          */
        }
        {
          <Panel style={bottomPanelStyle}>
           <form>
            <FormGroup>
              <ControlLabel>Tourism: {this.state.tourism} %</ControlLabel>
              <FormControl type="range"
                value={this.state.tourism}
                onChange={this.changeTourism.bind(this)}
              />
              <ControlLabel>Amenities: {this.state.amenities} %</ControlLabel>
              <FormControl type="range"
                value={this.state.amenities}
                onChange={this.changeAmenities.bind(this)}
              />

              <ControlLabel>Public Transport: {this.state.publicTransport} %</ControlLabel>
              <FormControl type="range"
                value={this.state.publicTransport}
                onChange={this.changePublicTransport.bind(this)}
              />

            </FormGroup>
          </form>
        </Panel>
        }
        {
          <ReactMapboxGl
            style={MAP_STYLE}
            accessToken={accessToken}
            center={this.state.center}
            movingMethod="jumpTo"
            bearing={this.state.bearing}
            containerStyle={{ height: "100%", width: "100%" }}>
            { this.state.filteredMarkerGeoJson &&
            <GeoJSONLayer
              id={"marker-layer"}
              data={this.state.filteredMarkerGeoJson}
              circleLayout={{
                "visibility": "visible",
              }}
              circlePaint={{
                "circle-color": "rgb(0,171,163)",
                "circle-opacity": 1,
                "circle-radius": 3
              }}
            />
            }
          </ReactMapboxGl>
        }
      </div>
    );
  }
}
