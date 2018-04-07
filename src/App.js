import React, { Component } from 'react';
import './App.css';
//import * as d3 from 'd3';
import Radial from './Radial';
import mArrivals from './Data/monthly_arrivals';
import mLocations from './Data/monthly_locations';
import state_loc_group from './Data/state_loc_grouping';

class App extends Component {

  render() {
    return (
      <Radial mArrivals={mArrivals} mLocations={mLocations} state_loc_group={state_loc_group} />
    );
  }
}

export default App;
