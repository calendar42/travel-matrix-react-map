import React, { Component } from "react";
import ReactMapboxGl, { Marker, GeoJSONLayer } from "react-mapbox-gl";
import config from "./config.json";
import {haversineDistance, getRandomColor} from "./utils.js";
import routeGeojson from "./data/geojson_filtered_gt_5.json";
import points from "./data/points.json";
import { Panel, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
const { accessToken, center } = config;


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
routeGeojson["features"].map(function(feature){
  feature["properties"]["color"] = getRandomColor()
})


/*
  Prepare styling of map
*/
// const mapStyle = "mapbox://styles/jasperhartong/cj1uzj8xj00092sk9ufhlhuon";  // dark map
// const mapStyle = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";  // white map
const mapStyle = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";  // 'natural map'

const mobileContainerStyle = {
  position:"relative",
  height: "736px",
  width: "414px",
  marginTop:"30px",
  marginLeft:"calc(50% - 207px)",
  boxShadow: "0px 0px 10px"
}

const bottomPanelStyle = {
  position:"absolute",
  bottom:0,
  zIndex:99999,
  margin:"0 10px",
  width:"calc(100% - 20px)",
  height:"55%"
}

const fitBoundsOptions = {
  // padding: {bottom: "300px"},
  offset: [0,-200],
  padding:60,
  linear: false
}

export default class GeoJSONMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      center: center,
      routeGeojson: routeGeojson,
      markerGeojson: markerGeojson,
      lineWidth: 6,
      markerRadius:20,
      pitch:60,
      bounds: [[4.4881837,51.882791],[4.53,52.22]],
      eventCoords: [4.4881837,51.882791],
      personCoords: [4.53,52.22],
      personUrl:"//avatars3.githubusercontent.com/u/452291?v=3&s=460",
      destinationUrl:"./destination.png",
      open: true,
    };
  }

  componentDidMount() {
    this.setFilteredFeatures();
  }  

  onMapClick(map, event) {
    this.setState({
      personCoords: event.lngLat.toArray(),
    },this.setFilteredFeatures);
  }

  setFilteredFeatures() {
    this.setState({
      "routeGeojson": this.geojsonFilter(
        routeGeojson,
        this.state.eventCoords,
        this.state.markerRadius
      ),
      "markerGeojson": this.geojsonFilter(
        markerGeojson,
        this.state.personCoords,
        this.state.markerRadius
      )
    }, this.setmapBounds);
  }

  setmapBounds() {
    this.setState({
      bounds: [this.state.eventCoords, this.state.personCoords]
    })
  }

  geojsonFilter = function (geojson, originCoords, radius) {
    /*
      Returns new instance of geojson, with features filtered by radius from originCoords
    */
    geojson = JSON.parse(JSON.stringify(geojson))  // deepcopy
    geojson["features"] = geojson["features"].filter(function(feature){
      if (feature.geometry.type === "Point") {
        return haversineDistance(feature.geometry.coordinates, originCoords) < radius;  
      }
      if (feature.geometry.type === "LineString") {
       return haversineDistance(feature.geometry.coordinates[0], originCoords) < radius;   
      }
      return false;
    });
    return geojson
  }

  changeWidth = ev => this.setState({
    lineWidth: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  changePitch = ev => this.setState({
    pitch: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  changeMarkerRadius(event) {
    this.setState({
      markerRadius: parseInt(event.target.value)
    },this.setFilteredFeatures);
  }

  render() {
    return (
      <div style={mobileContainerStyle}>
        <Panel style={bottomPanelStyle}>
          <form>
            <FormGroup>
              <ControlLabel>Map Pitch: {this.state.pitch}</ControlLabel>
              <FormControl type="range"
                value={this.state.pitch}
                onChange={this.changePitch}
              />
              <ControlLabel>Line width: {this.state.lineWidth}</ControlLabel>
              <FormControl type="range"
                value={this.state.lineWidth}
                onChange={this.changeWidth}
              />
              <ControlLabel>Marker Radius: {this.state.markerRadius}</ControlLabel>
              <FormControl type="range"
                value={this.state.markerRadius}
                onChange={this.changeMarkerRadius.bind(this)}
              />
            </FormGroup>
          </form>
        </Panel>

        <ReactMapboxGl
          style={mapStyle}
          accessToken={accessToken}
          onClick={this.onMapClick.bind(this)}
          center={this.state.center}
          movingMethod="jumpTo"
          pitch={this.state.pitch}
          fitBounds={this.state.bounds}
          fitBoundsOptions={fitBoundsOptions}
          containerStyle={{ height: "100%", width: "100%" }}>

          { this.state.routeGeojson &&
          <GeoJSONLayer
            data={this.state.routeGeojson}
            linePaint= {{
              "line-width": this.state.lineWidth,
              "line-color": {
                property: "color",
                type: "identity"
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
              "circle-color": {
                "property":"color",
                "type":"identity",
              },
              "circle-opacity": 1,
              "circle-radius": this.state.markerRadius
            }}
          />
          }


          <Marker
            coordinates={this.state.personCoords}
            offset="35"
            anchor="bottom">
            <img className="img-circle"
              style={{width:"70px", height:"70px"}}
              src={this.state.personUrl}/>
          </Marker>

          <Marker
            coordinates={this.state.eventCoords}
            offset="45"
            anchor="bottom">
            <img className="img-circle"
              style={{width:"90px", height:"90px"}}
              src={this.state.destinationUrl}/>
          </Marker>
          
        </ReactMapboxGl>
      </div>
    );
  }
}