import React, { Component } from "react";
import ReactMapboxGl, { Popup, Layer, Marker, Feature, GeoJSONLayer, ScaleControl, ZoomControl } from "react-mapbox-gl";
import config from "./config.json";
import {haversineDistance} from "./utils.js";
import geoJsonData from "./data/geojson_counts.json";
import points from "./data/points.json";
import { getGeoJson } from './MatrixService.js';
import { Panel, Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
const { accessToken, center } = config;

// Edit here:
// https://www.mapbox.com/studio/styles/jasperhartong/cj1uzj8xj00092sk9ufhlhuon/
// https://gis.stackexchange.com/questions/179255/mapbox-gl-addlayer-where-are-the-icon-images-coming-from
// https://www.mapbox.com/help/studio-troubleshooting-svg/

const defaultStyle = "mapbox://styles/jasperhartong/cj1uzj8xj00092sk9ufhlhuon";
const iconImage = "dot-11";

// const defaultStyle = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";
// const iconImage = "toogethr-dot";


const ToogethrColors = ["#3E1C73","#FD5056", "#20A99F"];



// Vintage: https://www.mapbox.com/gallery/#map-7

export default class GeoJSONMap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      center: center,
      geojson: geoJsonData,
      lineWidth: 3,
      color_0: ToogethrColors[2],
      color_1: ToogethrColors[1],
      style: defaultStyle,
      radius:5,
      pitch:20,
      markers: [],
      personCoords: [4.53,52.22],
      personUrl:"//s3.amazonaws.com/uifaces/faces/twitter/adhamdannaway/128.jpg",
      destinationUrl:"https://pbs.twimg.com/profile_images/692731013462675456/-FkBGCfi_400x400.png",
      open: true

    };
  }

  componentDidMount() {
    this.setFilteredMarkers();
  }

  setFilteredMarkers() {
    this.setState({
      markers: points.coords.filter(this.distanceFilter)
    });
  }

  onMapClick(map, event) {
    this.setState({
      personCoords: event.lngLat.toArray(),
    },this.setFilteredMarkers);
  }

  distanceFilter = coords => haversineDistance(coords, this.state.personCoords) < this.state.radius;

  changeWidth = ev => this.setState({
    lineWidth: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  changePitch = ev => this.setState({
    pitch: (ev.target.value ? parseFloat(ev.target.value) : 0)
  })

  changeColor0 = ev => this.setState({
    color_0: (ev.target.value ? ev.target.value : "#FFFFFF")
  })

  changeColor1 = ev => this.setState({
    color_1: (ev.target.value ? ev.target.value : "#FFFFFF")
  })

  changeStyle = ev => this.setState({
    style: (ev.target.value ? ev.target.value : "#FFFFFF")
  })

  changeRadius(event) {
    this.setState({
      radius: event.target.value
    },this.setFilteredMarkers);
  }

  render() {
    return (

      <ReactMapboxGl
        style={this.state.style}
        accessToken={accessToken}
        onClick={this.onMapClick.bind(this)}
        center={this.state.center}
        movingMethod="jumpTo"
        pitch={this.state.pitch}
        containerStyle={{ height: "100vh", width: "100%" }}>

        <Button style={{position:'absolute',zIndex:1,bottom:0}} onClick={ ()=> this.setState({ open: !this.state.open })}>
          Toggle Editor
        </Button>
        <Panel collapsible expanded={this.state.open} style={{position:'absolute',zIndex:1,margin:0}}>
          <form>
            <FormGroup>
              <ControlLabel>Map Pitch: {this.state.pitch}</ControlLabel>
              <FormControl
                type="range"
                value={this.state.pitch}
                onChange={this.changePitch}
              />
              <ControlLabel>Line width: {this.state.lineWidth}</ControlLabel>
              <FormControl
                type="range"
                value={this.state.lineWidth}
                onChange={this.changeWidth}
              />
              <ControlLabel>Marker Radius: {this.state.radius}</ControlLabel>
              <FormControl
                type="range"
                value={this.state.radius}
                onChange={this.changeRadius.bind(this)}
              />
              <FormControl
                type="color"
                value={this.state.color_0}
                onChange={this.changeColor0}
              />
              <FormControl
                type="color"
                value={this.state.color_1}
                onChange={this.changeColor1}
              />              
            </FormGroup>
          </form>
        </Panel>

        { this.state.geojson &&
        <GeoJSONLayer
          data={this.state.geojson}
          linePaint= {{
            "line-width": this.state.lineWidth,
            "line-color": {
              property: 'count',
              stops: [
                [0,this.state.color_0],
                [750,this.state.color_1],
              ]
            },
            "line-opacity": {
                property: 'count',
                stops: [
                    [0, 0.15],
                    [50, 0.3],
                    [500, 0.5],
                    [1000, 0.75],
                    [1500, 1],
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
        <Layer
          type="symbol"
          id="marker"
          layout={{ "icon-image": iconImage }}>
          {
            this.state.markers
              .map((marker, index) => (
                <Feature
                  key={index}
                  coordinates={marker}/>
              ))
          }
        </Layer>


        <Marker
          coordinates={this.state.personCoords}
          offset="30"
          anchor="bottom">
          <img className="img-circle" style={{width:"60px", height:"60px"}} src={this.state.personUrl}/>
        </Marker>

        <Marker
          coordinates={[4.4881837,51.882791]}
          offset="30"
          anchor="bottom">
          <img className="img-circle" style={{width:"60px", height:"60px"}} src={this.state.destinationUrl}/>
        </Marker>
        


      </ReactMapboxGl>
    );
  }
}
