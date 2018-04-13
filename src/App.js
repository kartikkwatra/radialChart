import React, { Component } from "react";
import "./App.css";
import Radial from "./Radial";
import mArrivals from "./Data/monthly_arrivals";
import mLocations from "./Data/monthly_locations";
import state_month_group from "./Data/state_month_grouping";
import state_food_group from "./Data/state_food_grouping";
import month_food_group from "./Data/month_food_grouping";
import RadialCustom from "./RadialCustom";

class App extends Component {
  render() {
    return (
      <div>
        {/* <Radial mArrivals={mArrivals} mLocations={mLocations} state_month_group={state_month_group} /> */}
        {/* <RadialGen
          mArrivals={mArrivals} partition_ring_group={state_month_group} //Data
          ring='Location' partition='Month' arc='Food' alignment='No' //Encodings
          min_radius={130} arc_height={6}  // Design
        />
        <RadialGen
          mArrivals={mArrivals} partition_ring_group={state_month_group} //Data
          ring='Month' partition='Location' arc='Food' alignment='Yes' //Encodings
          min_radius={130} arc_height={6}  // Design
        />
        <RadialGen
          mArrivals={mArrivals} partition_ring_group={state_food_group} //Data
          ring='Food' partition='Location' arc='Month' alignment='No' //Encodings
          min_radius={130} arc_height={6}  // Design
        /> */}
        <RadialCustom
          // Here you can give some logical grouping to arc i.e States to support decoding by reducing colors
          // Mini India Map on top right to help decode Location
          //Data
          mArrivals={mArrivals}
          partition_ring_group={month_food_group}
          //Encodings
          ring="Food"
          partition="Month"
          arc="Location"
          alignment="No"
          //Design
          bubble_circle_radius = {320} //Governs the size of the whole radial proportionally
          min_radius={130}
          arc_height={10}
          // extra_partitions={1} //Can't be zero now TODO: Remove from props
          bg_ring_gap={2}
        />
        {/* <RadialGen 
          // Here you can give some logical grouping to arc i.e States to support decoding by reducing colors
          // Mini India Map on top right to help decode Location
          mArrivals={mArrivals} partition_ring_group={month_food_group} //Data
          ring='Month' partition='Food' arc='Location' alignment='No' //Encodings
          min_radius={130} arc_height={6}  // Design
        /> */}
      </div>
    );
  }
}

export default App;
