import React, { Component } from 'react';
import './App.css';
//import * as d3 from 'd3';
import Radial from './Radial';
import mArrivals from './Data/monthly_arrivals';
import mLocations from './Data/monthly_locations';
import state_month_group from './Data/state_loc_grouping';
import Radial2 from './Radial2';
import RadialGen from './RadialGen';

class App extends Component {

  render() {
    return (
      <div>
        <Radial mArrivals={mArrivals} mLocations={mLocations} state_month_group={state_month_group} />
        <RadialGen
          mArrivals={mArrivals} partition_ring_group={state_month_group} //Data
          ring='Location' partition='Month' arc='Food_list' alignment='No' //Encodings
          min_radius={130}  arc_height={6}  // Design
        />
        <RadialGen
          mArrivals={mArrivals} partition_ring_group={state_month_group} //Data
          ring='Month' partition='Location' arc='Food_list' alignment='Yes' //Encodings
          min_radius={130}  arc_height={6}  // Design
        />
      </div>
    );
  }
}

export default App;
