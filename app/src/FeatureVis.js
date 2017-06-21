import React, { Component } from "react";
import ReactMapboxGl, { Marker, GeoJSONLayer, Layer,Feature,Popup } from "react-mapbox-gl";
import config from "./config.json";
// import routeGeojson from "./data/geojson_filtered_gt_5.json";
import amsterdamBounds from "./amsterdam.json";
import { Panel, FormGroup, FormControl, ControlLabel } from "react-bootstrap";
import turf from "@turf/turf";
import converter from "json-2-csv";

const { accessToken, center } = config;



/*
  ============================== START SETTINGS ================================
*/

const ORIGIN_COORDS = [4.53,52.22];

// const MAP_STYLE = "mapbox://styles/mapbox/dark-v9"
const MAP_STYLE = "mapbox://styles/jasperhartong/cj3a0w0hu00012rpet2mtv7h7"
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj1uzj8xj00092sk9ufhlhuon";  // dark map
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";  // white map
// const MAP_STYLE = "mapbox://styles/jasperhartong/cj1wiupfm002m2rn0y6bp80ys";  // 'natural map'

/*
  ============================== END SETTINGS ================================
*/


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
      bikesJson: {},
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



    this.getAddresses = this.getAddresses.bind(this);
    this.getAddressesCallback = this.getAddressesCallback.bind(this);
    this.loadBikes = this.loadBikes.bind(this);
    this.loadBikesCallback = this.loadBikesCallback.bind(this);
    this.filterByBoundingBox = this.filterByBoundingBox.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.geojsonFilter = this.geojsonFilter.bind(this);
  }


  /** ============== HTTP CALLs and CALLBACKS ============== **/

  getAddresses(callback,point,order,maxCount) {
    let lat = point.geometry.coordinates[1] +'';
    let lng = point.geometry.coordinates[0] +'';
    lat = lat.slice(0, lat.indexOf('.') + 6);
    lng = lng.slice(0, lng.indexOf('.') + 6);

    let url = (process.env.REACT_APP_PROXY_HOST_URL ? process.env.REACT_APP_PROXY_HOST_URL : '') +'/proxy/google?language=en&latlng='+lat +","+lng;
    console.log(url);
    return fetch(url)
    .then((response) => response.json())
    .then((responseJson) => {
      let isFinishedFetching = false;
      fetchedRequestsCount ++;
      if (fetchedRequestsCount === maxCount) {
        isFinishedFetching = true;
      }

      callback(responseJson,order,isFinishedFetching);
    })
    .catch((response) => {
      console.error(response.message)
    });
  }

  getAddressesCallback(results,order,isFinishedFetching){

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

  loadBikes(callback){
    let url = (process.env.REACT_APP_PROXY_HOST_URL ? process.env.REACT_APP_PROXY_HOST_URL : '') +'/proxy/flickbike';
    return fetch(url)
    .then((response) => response.json())
    .then((responseJson) => {
      callback(responseJson);
    })
    .catch((response) => {
      console.error(response.message)
    });
  }

  loadBikesCallback(results){
    let bikes = [];
    if (results.code === 200) {
      bikes = results.data.map(function(bike){
        bike.coordinates = [bike.gLng,bike.gLat];
        return bike;
      })
    }
    this.setState({
      bikesJson: bikes
    })
  }

  /** ============== HTTP CALLs and CALLBACKS ============== **/




  /** ============== MAP HANDLERS ============== **/

  onMarkerClick(marker) {
    this.setState({
      popUpCoords: marker.coordinates,
      popUpText: marker,
    })
  }

  onPopUpClick(){
    delete this.state.popUpCoords;
    delete this.state.popUpText;
    this.setState(this.state)
  }

  onToggleHover(cursorType,ev) {
    ev.map.getCanvas().style.cursor = cursorType;
  }


  /** ============== MAP HANDLERS ============== **/





  /** ============== PANEL HANDLERS ============== **/

  changeTourism(ev){
    let tourism = ev.target.value ? parseFloat(ev.target.value) : 0;
    let amenities = this.state.amenities;
    let publicTransport = this.state.publicTransport;

    if ((tourism + amenities + publicTransport) <= 100 ) {
      let filterArray = [tourism,amenities,publicTransport];

      let filteredMarkers;
      let markerCount = 0;

      filteredMarkers = this.geojsonFilter(filterArray);
      if (filteredMarkers) {
        markerCount = filteredMarkers.features.length;
      }

      this.setState(
        {
          tourism: tourism,
          filteredMarkerGeoJson: filteredMarkers,
          markerCount: markerCount,
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

      let filteredMarkers;
      let markerCount = 0;

      filteredMarkers = this.geojsonFilter(filterArray);
      if (filteredMarkers) {
        markerCount = filteredMarkers.features.length;
      }

      this.setState(
        {
          amenities: amenities,
          filteredMarkerGeoJson: filteredMarkers,
          markerCount: markerCount,
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

      let filteredMarkers;
      let markerCount = 0;

      filteredMarkers = this.geojsonFilter(filterArray);
      if (filteredMarkers) {
        markerCount = filteredMarkers.features.length;
      }

      this.setState(
        {
          publicTransport: publicTransport,
          filteredMarkerGeoJson: filteredMarkers,
          markerCount: markerCount,
        }
      );
    }

  }

  handleFileUpload(ev){
    let reader = new FileReader();
    let self = this;
    reader.onload = function(e) {
      let data = JSON.parse(reader.result);
      self.setState({
        markerGeojson: data
      },self.prepareDataForVisual);
    };
    let file = ev.target.files[0];
    if (file) {
      reader.readAsText(file);
    }
  }

  /** ============== PANEL HANDLERS ============== **/





  /** ============== DATA-MANIPULATION HANDLERS ============== **/

  filterByBoundingBox(){
    // Amsterdam has two polygons
    let poly1  = turf.polygon(amsterdamBounds.coordinates[0])
    let poly2 = turf.polygon(amsterdamBounds.coordinates[1])

    let points = this.state.markerGeojson;
    points = this.removeNulled(points);
    let featuresArray = [];

    for (var i = 0; i < points.features.length; i++) {
      let pt = turf.point(points.features[i].geometry.coordinates);

      let isInside1 = turf.inside(pt, poly1);
      let isInside2 = turf.inside(pt, poly2);

      if (isInside1 || isInside2) {
        featuresArray.push(points.features[i]);
      }
    }
    points["features"] = featuresArray;
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
      return false
    });

    return geojson;
  }

  normalizeHelper(min, max) {
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

    aSumArray = aSumArray.map(this.normalizeHelper(A_sumMin, A_sumMax));
    ptSumArray = ptSumArray.map(this.normalizeHelper(PT_sumMin, PT_sumMax));
    tSumArray = tSumArray.map(this.normalizeHelper(T_sumMin, T_sumMax));

    for (var i = 0; i < featuresArray.length; i++) {

      featuresArray[i].properties["A_sum"] = aSumArray[i];
      featuresArray[i].properties["PT_sum"] = ptSumArray[i];
      featuresArray[i].properties["T_sum"] = tSumArray[i];

    }

    // console.log(aSumArray.map(this.normalizeHelper(0, 1)).sort());
    // console.log(ptSumArray.map(this.normalizeHelper(0, 1)).sort());
    // console.log(tSumArray.map(this.normalizeHelper(0, 1)).sort());

    console.log("***** ASUM MAX *****" , A_sumMax);
    console.log("***** ASUM MIN *****" , A_sumMin);
    console.log("***** PTSUM MAX *****" , PT_sumMax);
    console.log("***** PTSUM MIN *****" , PT_sumMin);
    console.log("***** TSUM MAX *****" , T_sumMax);
    console.log("***** TSUM MIN *****" , T_sumMin);

    return geojson;
  }

  geojsonFilter(filterArray) {
    /*
      Returns copied instance of geojson, with features filtered by radius from originCoords
      - sampling allows you to only get a random sampling of the data
    */
    let geojson = this.state.markerGeojson;

    let totalAmountOfBikes = 1070;
    // console.log(feature.properties.T_sum, feature.properties.A_sum, feature.properties.PT_sum)
    let tourism = filterArray[0] /100;
    let amenities = filterArray[1] /100;
    let publicTransport = filterArray[2] /100;
    if (typeof(geojson) !== 'undefined') {
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

      let propsSumSum = 0;
      for (var i = 0; i < 499; i++) {
        if (geojson["features"][i]) {
          propsSumSum += geojson["features"][i].propsSum;
        }
        else {
          console.log(i);
        }
      }

      let tempTotalNumberBikes = 0;
      let biggestNumber =0;
      let biggestNumbersPlace = {};
      for (var i = 0; i < 499; i++) {
        let percentagePropsum = ((geojson["features"][i].propsSum)/propsSumSum)
        geojson["features"][i].amountOfBikes = (percentagePropsum * totalAmountOfBikes);
        tempTotalNumberBikes += geojson["features"][i].amountOfBikes;
        console.log(geojson["features"][i].amountOfBikes);
        if (geojson["features"][i].amountOfBikes > biggestNumber) {
          biggestNumber = geojson["features"][i].amountOfBikes;
          biggestNumbersPlace = geojson["features"][i];
        }
      }
      console.log('Biggest place=> ', biggestNumbersPlace.geometry.coordinates , ' number=> ' ,biggestNumbersPlace.amountOfBikes);
      for (var i = 0; i < 499; i++) {
        if (parseInt(geojson["features"][i].amountOfBikes) === 0 ) {
          console.log('zero');
        }
      }
      console.log(tempTotalNumberBikes);

      // sort by value
      geojson["features"].sort(function (a, b) {
        return b.propsSum - a.propsSum;
      });

      geojson["features"] = geojson["features"].slice(0,500);

    }

    // console.log("Done Filtering");
    return geojson
  }

  setFilteredFeatures() {
    /*
    This function uses the geojsonFilter to show a certain subset of the data.
      - This subset can be based on a samplesize (e.g: 0.05 of the data), or based on a radius
    */
    let filterArray = [this.state.tourism,this.state.amenities,this.state.publicTransport];

    let filteredMarkers = this.geojsonFilter(filterArray)
    this.setState({
      filteredMarkerGeoJson:filteredMarkers,
      markerCount: filteredMarkers.features.length
    });
  }

  /** ============== DATA-MANIPULATION HANDLERS ============== **/


  /** ============== HELPERS ============== **/


  exportPoints(){
    let points = this.state.filteredMarkerGeoJson;
    if (typeof(points) !== 'undefined') {

      for (var i = 0; i < 50; i++) {
        this.getAddresses(this.getAddressesCallback,points.features[i],i,50);
      }
    }
    // for (var i = 0; i < points.features.length; i++) {
    //   this.getAddresses(this.getAddressesCallback,points.features[i],i,points.features.length);
    // }
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

  prepareDataForVisual(){
    this.filterByBoundingBox();
    this.setFilteredFeatures();
    this.loadBikes(this.loadBikesCallback);
  }

  /** ============== HELPERS ============== **/



  render() {
    let bikeTemplates;
    let bikes = this.state.bikesJson;
    if (Array.isArray(bikes)) {
      bikeTemplates = bikes.map(
        (bike) => (
          <Feature
            key={bike.bid}
            onMouseEnter={this.onToggleHover.bind(this, 'pointer')}
            onMouseLeave={this.onToggleHover.bind(this, '')}
            onClick={this.onMarkerClick.bind(this, bike)}
            coordinates={bike.coordinates}
          />
        )
      );

    }

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
          <button onClick={this.loadBikes.bind(this,this.loadBikesCallback)}>Refresh Bike Locations</button>
          <input type="file" onChange={this.handleFileUpload} />
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

            <Layer
               type="symbol"
               id="marker"
               layout={{ "icon-image": "bicycle-share-15" }}>
               {bikeTemplates}
            </Layer>
            {
              this.state.popUpCoords && (
                <Popup
                  key={this.state.popUpText.bid}

                  offset={[0, -50]}
                  coordinates={this.state.popUpCoords}
                >
                    <span style={{position: 'absolute',top: '0px',right:'6px',cursor:'pointer'}} onClick={this.onPopUpClick.bind(this)}>X</span>
                    <div>
                      GSM: {this.state.popUpText.gsm}
                    </div>
                    <div>
                      PRICE: {this.state.popUpText.price} $ / POWER: {this.state.popUpText.powerPercent} %
                    </div>
                    <div>
                      BikeID: {this.state.popUpText.bid}
                    </div>

                </Popup>
              )
            }
          </ReactMapboxGl>
        }
      </div>
    );
  }
}
