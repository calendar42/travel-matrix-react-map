import React, { Component } from 'react';

// const {Raphael,Paper,Set,Circle,Ellipse,Image,Rect,Text,Path,Line} = require('react-raphael');
// import { Hue } from 'react-color';

// import { ColorPicker, TriangleColorPicker } from 'react-native-color-picker'

import ColorPicker from 'react-color-picker'
import 'react-color-picker/index.css'

import './css/MetricPicker.css';

class MetricPicker extends Component {

  constructor(props) {
    super(props)
    this.state = {
      color: 'red'
    }
  }

  onDrag(color, c) {
    // console.log(color,c)
    debugger;

    function hexToRgb(hex) {
      // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function(m, r, g, b) {
          return r + r + g + g + b + b;
      });

      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
    }

    console.log(hexToRgb(color));

    this.setState({
      color
    })
  }

  render() {
    return (<div>
      <ColorPicker value={this.state.color} onDrag={this.onDrag.bind(this)} />
      <div style={{
        background: this.state.color,
        width: 100,
        height: 50,
        color: 'white'
      }}>
        {this.state.color}
      </div>
    </div>)  
    
  }
}

export default MetricPicker;
