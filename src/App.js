import React, { Component } from "react";
import "./App.css";
import Radial from "./Radial";
import mArrivals from "./Data/monthly_arrivals";
import month_food_group from "./Data/month_food_grouping";
import RadialCustom from "./RadialCustom";

class App extends Component {
  render() {
    return (
      <div>
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
          width={850}
          height={850}
          bubble_circle_radius={310} //Governs the size of the whole radial proportionally
          min_radius={135}
          arc_height={8}
          bubbleRfactor={110}
          // extra_partitions={1} //Can't be zero now TODO: Remove from props
          bg_ring_gap={1}
          containerId="cmp1"
        />
      </div>
    );
  }
}

export default App;
