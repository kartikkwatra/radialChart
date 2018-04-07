import React, { Component } from 'react';
import './App.css';
//import * as d3 from 'd3';
import Radial from './Radial';
import mArrivals from './Data/monthly_arrivals';
import mLocations from './Data/monthly_locations';
import state_month_group from './Data/state_loc_grouping';
import Radial2 from './Radial2';
class App extends Component {

  render() {
    return (
      <div>
      <Radial mArrivals={mArrivals} mLocations={mLocations} state_month_group={state_month_group} />
      <Radial2 mArrivals={mArrivals} mLocations={mLocations} state_month_group={state_month_group} />
      </div>
    );
  }
}

export default App;
