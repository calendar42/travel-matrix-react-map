import React, { Component } from "react";
import ReactMapboxGl, { Marker, GeoJSONLayer, Cluster } from "react-mapbox-gl";
import config from "./config.json";
import {haversineDistance, getRandomColor} from "./utils.js";
// import routeGeojson from "./data/geojson_filtered_gt_5.json";
import markerGeojson from "./data/cleared.json";
import { Panel, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import turf from "@turf/turf";
import converter from "json-2-csv";

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

var fetchedRequestsCount = 0;

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
      markerCount: 0,
      lineWidth: 3,
      // bounds: [DESTINATION_COORDS, ORIGIN_COORDS],  // initiate with preset bounding box
      // destinationCoords: DESTINATION_COORDS,
      originCoords: ORIGIN_COORDS,
      open: true,
      amenities: 0,
      tourism: 0,
      publicTransport:0,
    };


    let pt = turf.point([-77, 44]);
    let poly = turf.polygon([[
      [-81, 41],
      [-81, 47],
      [-72, 47],
      [-72, 41],
      [-81, 41]
    ]]);

    let isInside = turf.inside(pt, poly);
    console.log(isInside);

    this.getAddresses = this.getAddresses.bind(this);
    this.getReposCallback = this.getReposCallback.bind(this);
    this.filterByBoundingBox = this.filterByBoundingBox.bind(this);
  }

  filterByBoundingBox(){
    let boundingTL = [100, 0]
    let boundingBR = [0, 100];
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
    points = this.removeNulled(points);
    points = this.normaliseData(points);

    this.setState({
      markerGeojson: points,
      filteredMarkerGeoJson: points,
      markerCount: points.features.length
    })

  }

  removeNulled(geojson){
    geojson["features"] = geojson["features"].filter(function(feature){
      if(feature.properties.T_sum && feature.properties.A_sum  && feature.properties.PT_sum){
        return true
      }
      console.log('Some nulled');
      return false
    });

    return geojson;
  }

  normalize(min, max) {
    var delta = max - min;
    return function (val) {
        return (val - min) / delta;
    };
  }

  normaliseData(geojson){
    let A_sumMax = 0;
    let A_sumMin = 1000;
    let aSumArray = [];

    let PT_sumMax = 0;
    let PT_sumMin = 1000;
    let ptSumArray = [];

    let T_sumMax = 0;
    let T_sumMin = 1000;
    let tSumArray = [];

    let featuresArray = geojson["features"]
    for (var i = 0; i < featuresArray.length; i++) {

      aSumArray.push(featuresArray[i].properties["A_sum"]);
      ptSumArray.push(featuresArray[i].properties["PT_sum"]);
      tSumArray.push(featuresArray[i].properties["T_sum"]);

      if (featuresArray[i].properties["A_sum"] > A_sumMax) {
        A_sumMax = featuresArray[i].properties["A_sum"];
      }
      if (featuresArray[i].properties["A_sum"] < A_sumMin) {
        A_sumMin = featuresArray[i].properties["A_sum"];
      }

      if (featuresArray[i].properties["PT_sum"] > PT_sumMax) {
        PT_sumMax = featuresArray[i].properties["PT_sum"];
      }
      if (featuresArray[i].properties["PT_sum"] < PT_sumMin) {
        PT_sumMin = featuresArray[i].properties["PT_sum"];
      }

      if (featuresArray[i].properties["T_sum"] > T_sumMax) {
        T_sumMax = featuresArray[i].properties["T_sum"];
      }
      if (featuresArray[i].properties["T_sum"] < T_sumMin) {
        T_sumMin = featuresArray[i].properties["T_sum"];
      }

    }

    aSumArray = aSumArray.map(this.normalize(A_sumMin, A_sumMax));
    ptSumArray = ptSumArray.map(this.normalize(PT_sumMin, PT_sumMax));
    tSumArray = tSumArray.map(this.normalize(T_sumMin, T_sumMax));

    for (var i = 0; i < featuresArray.length; i++) {

      featuresArray[i].properties["A_sum"] = aSumArray[i];
      featuresArray[i].properties["PT_sum"] = ptSumArray[i];
      featuresArray[i].properties["T_sum"] = tSumArray[i];

    }

    // console.log(aSumArray.map(this.normalize(0, 1)).sort());
    // console.log(ptSumArray.map(this.normalize(0, 1)).sort());
    // console.log(tSumArray.map(this.normalize(0, 1)).sort());

    console.log("***** ASUM MAX *****" , A_sumMax);
    console.log("***** ASUM MIN *****" , A_sumMin);
    console.log("***** PTSUM MAX *****" , PT_sumMax);
    console.log("***** PTSUM MIN *****" , PT_sumMin);
    console.log("***** TSUM MAX *****" , T_sumMax);
    console.log("***** TSUM MIN *****" , T_sumMin);

    return geojson;
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
    geojson["features"] = geojson["features"].map(function(feature){
      let propsSum = 0;
      if (tourism === 0 && amenities === 0 && publicTransport === 0) {
        propsSum = (feature.properties.T_sum) + (feature.properties.A_sum) + (feature.properties.PT_sum);
      }
      else{
        propsSum = (feature.properties.T_sum * tourism) + (feature.properties.A_sum * amenities) + (feature.properties.PT_sum * publicTransport);
      }

      feature.propsSum = propsSum;

      return feature;
    });

    // sort by value
    geojson["features"].sort(function (a, b) {
      return b.propsSum - a.propsSum;
    });

    geojson["features"] = geojson["features"].slice(0,499);
    // console.log("Done Filtering");
    return geojson
  }

  setFilteredFeatures() {
    /*
    This function uses the geojsonFilter to show a certain subset of the data.
      - This subset can be based on a samplesize (e.g: 0.05 of the data), or based on a radius
    */
    let filterArray = [this.state.tourism,this.state.amenities,this.state.publicTransport];

    let filteredMarkers = this.geojsonFilter(filterArray,markerGeojson)
    this.setState({
      filteredMarkerGeoJson:filteredMarkers,
      markerCount: filteredMarkers.features.length
    });
  }

  changeTourism(ev){
    let tourism = ev.target.value ? parseFloat(ev.target.value) : 0;
    let amenities = this.state.amenities;
    let publicTransport = this.state.publicTransport;

    if ((tourism + amenities + publicTransport) <= 100 ) {
      let filterArray = [tourism,amenities,publicTransport];

      let currentMarkers = this.state.markerGeojson;

      let filteredMarkers = this.geojsonFilter(filterArray,currentMarkers)
      this.setState(
        {
          tourism: tourism,
          filteredMarkerGeoJson: filteredMarkers,
          markerCount: filteredMarkers.features.length
        }
      );
    }


  }

  changeAmenities(ev){
    let amenities = ev.target.value ? parseFloat(ev.target.value) : 0;
    let tourism = this.state.tourism;
    let publicTransport = this.state.publicTransport;

    if ((tourism + amenities + publicTransport) <= 100 ) {
      let filterArray = [tourism,amenities,publicTransport];

      let currentMarkers = this.state.markerGeojson;

      let filteredMarkers = this.geojsonFilter(filterArray,currentMarkers)
      this.setState(
        {
          amenities: amenities,
          filteredMarkerGeoJson: filteredMarkers,
          markerCount: filteredMarkers.features.length
        }
      );
    }
  }

  changePublicTransport(ev){
    let publicTransport = ev.target.value ? parseFloat(ev.target.value) : 0;
    let amenities = this.state.amenities;
    let tourism = this.state.tourism;

    if ((tourism + amenities + publicTransport) <= 100 ) {
      let filterArray = [tourism,amenities,publicTransport];

      let currentMarkers = this.state.markerGeojson;

      let filteredMarkers = this.geojsonFilter(filterArray,currentMarkers)
      this.setState(
        {
          publicTransport: publicTransport,
          filteredMarkerGeoJson: filteredMarkers,
          markerCount: filteredMarkers.features.length
        }
      );
    }

  }

  exportPoints(){
    let points = this.state.filteredMarkerGeoJson;
    // for (var i = 0; i < 50; i++) {
    //   this.getAddresses(this.getReposCallback,points.features[i],i,50);
    // }
    for (var i = 0; i < points.features.length; i++) {
      this.getAddresses(this.getReposCallback,points.features[i],i,points.features.length);
    }
  }

  // 3
  getReposCallback(results,order,isFinishedFetching){

    let filteredMarkerGeoJson = this.state.filteredMarkerGeoJson;
    if (typeof(results.results[0]) !== 'undefined') {
      filteredMarkerGeoJson.features[order].properties["address"] = results.results[0].formatted_address;
    }
    else {
      console.log(filteredMarkerGeoJson.features[order].geometry.coordinates);
    }

    this.setState({
      filteredMarkerGeoJson: filteredMarkerGeoJson,
    })
    console.log(this.state.filteredMarkerGeoJson.features[order].properties["address"]);
    if (isFinishedFetching) {
      console.log('We finished fetching');
      fetchedRequestsCount = 0;
      this.prepareDataForExport();

    }
  }

  prepareDataForExport(){
    let data = [];

    let currentMarkers = this.state.filteredMarkerGeoJson.features;

    for (var i = 0; i < currentMarkers.length; i++) {
      let csvElement = {
        "coordinates": currentMarkers[i].geometry.coordinates,
        "address": currentMarkers[i].properties.address
      }
      data.push(csvElement);
    }

    let options = {
        delimiter : {
            field : ';', // Comma field delimiter
            array : ',',
        }
    };

    let json2csvCallback = function (err, csv) {
      if (err) throw err;

      if (window.navigator.msSaveOrOpenBlob) {
          var blob = new Blob([csv]);
          window.navigator.msSaveOrOpenBlob(blob, 'myFile.csv');
      } else {
          var a         = document.createElement('a');
          a.href        = 'data:attachment/csv,' +  encodeURIComponent(csv);
          a.target      = '_blank';
          a.download    = 'bike-placement-spots.csv';
          document.body.appendChild(a);
          a.click();
      }

    };

    converter.json2csv(data,json2csvCallback,options)
  }

  // 1
  getAddresses(callback,point,order,maxCount) {
    let url = window.location.pathname+'proxy/google' +'?language=en&latlng='+point.geometry.coordinates[1].toFixed(6) +","+point.geometry.coordinates[0].toFixed(6);
    return fetch(url)
      .then((response) => response.json())
      .then((responseJson) => {
        let isFinishedFetching = false;
        fetchedRequestsCount ++;
        if (fetchedRequestsCount === maxCount) {
          isFinishedFetching = true;
        }
        console.log(fetchedRequestsCount);
        callback(responseJson,order,isFinishedFetching);
      })
      .catch((response) => {
        console.error(response.message)
      });
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
          <button onClick={this.exportPoints.bind(this)}>Export points</button>
          {this.state.markerCount}
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
