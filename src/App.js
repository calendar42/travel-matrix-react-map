// https://github.com/alex3165/react-mapbox-gl
import React, { Component } from 'react';
// import GeoJSONMap from "./GeoJSONMap.js";
import GeoJSONMap from "./FeatureVis.js";
import './App.css';


class App extends Component {
  render() {
    return (
        <GeoJSONMap/>
    );
  }
}

export default App;
