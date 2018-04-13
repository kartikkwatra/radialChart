import React, { Component } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";

const width = 900;
const height = 900;
const margin = { left: 10, top: 10, right: 10, bottom: 10 };

//controlled growth curve function
// let cgf = (x) => {
//   return Math.abs(x/(70-x));
// }

//d3 functions
let colorScale = chroma.scale([
  "#53cf8d",
  "hotpink",
  "#9900cc",
  "teal",
  "#f7d283",
  "#e85151"
]);

class RadialCustom extends Component {
  constructor(props) {
    super(props);
    this.ArrivalData = [...this.props.mArrivals];
    this.partition_ring_group = [...this.props.partition_ring_group];

    this.partition = this.props.partition;
    this.ring = this.props.ring;
    this.arc = this.props.arc;
    this.extra_partitions = this.props.extra_partitions;

    for (let [key, value] of Object.entries(this.props)) {
      if (value === "Food") {
        this.food = key;
      }
    }

    this.simulation = d3
      .forceSimulation()
      .force("x", d3.forceX(d => d.focusX))
      .force("y", d3.forceY(d => d.focusY))
      .stop();
  }

  componentWillMount = () => {
    this.simulation
      .force("center", d3.forceCenter(width / 2, height / 2))
      .on("tick", this.ticked);
  };

  componentDidMount = () => {
    this.container = d3.select(this.refs.container);
    this.calculateData();
    this.renderBubbleChart();
    this.simulation
      .nodes(this.mArrivals)
      .force("collide", d3.forceCollide(d => d.Arrival / 3000)) //TODO: Creating a log like scale
      .alpha(0.8)
      .restart();
    this.renderArcChart();
  };

  componentDidUpdate = () => {
    this.calculateData();
    this.renderBubbleChart();
    this.renderArcChart();
  };

  calculateData = () => {
    //PROCESSING DATA
    // this.bubble_circle_radius = width / 2.5 - margin.left;

    //FIXME: Proper Filtering data flow. Ring filter-er
    //FIXME: Arrival Data not filtered based on rings!
    console.log(this.ArrivalData);
    // this.ArrivalData = this.ArrivalData.filter((d, i) => i < 20);
    this.key_filter = [];
    this.partition_ring_group.forEach(d => this.key_filter.push(d[this.ring]));
    this.key_filter = _.uniqBy(this.key_filter);
    this.partition_ring_group = this.partition_ring_group.filter(
      d => this.key_filter.indexOf(d[this.ring]) < 10
    );
    console.log(this.partition_ring_group);

    //Prepping the data

    //Adding Date
    this.ArrivalData.forEach(d => {
      let parser = d3.utcParse("%B/%Y");
      d.date = parser(d.Month + "/" + d.Year);
    });

    // Assigning FocusX and FocusY by grouping by month
    this.mArrivals = _.chain(this.ArrivalData)
      .groupBy(d => d.date.getMonth())
      //.sortBy(d => d.date.getMonth())
      .map(mArrivals => {
        return _.map(mArrivals, arr => {
          let month = arr.date.getMonth();
          let angle = 2 * Math.PI / 12 * month - Math.PI / 2;
          let focusX = this.props.bubble_circle_radius * Math.cos(angle);
          let focusY = this.props.bubble_circle_radius * Math.sin(angle);
          return Object.assign(arr, {
            focusX,
            focusY
          });
        });
      })
      .flatten()
      .value();

    //Processing partition_ring_group
    let arc_count = []; //for maximum number of arcs possible
    // FIXME: these keys are temporary solutions for things like color and arrangement (maybe others). Fix it soon
    this.arc_key = [];
    this.ring_key = [];
    this.partition_key = [];

    // Generating arc,ring,partition key, max_arc
    this.partition_ring_group.forEach(d => {
      let parser = d3.utcParse("%B/%Y");
      if (this.arc !== "Month") d.date = parser(d.Month + "/" + d.Year);

      arc_count.push(d[this.arc].length);
      this.ring_key.push(d[this.ring]);

      if (this.partition === "Month") {
        this.partition_key[d.date.getMonth()] = d.Month;
      } else {
        this.partition_key.push(d[this.partition]); // Partition key not logically sorted.
      }

      d[this.arc].forEach(d => {
        this.arc_key.push(d);
      });
    });

    console.log(this.partition_key);

    this.arc_key = _.uniqBy(this.arc_key);
    this.ring_key = _.uniqBy(this.ring_key);
    if (this.partition !== "Month")
      this.partition_key = _.uniqBy(this.partition_key);

    this.food_key = this[this.food + "_key"];
    this.max_arc = d3.max(arc_count);

    // DEPRECATED FOOD KEY: GIVES CONTROL OF ORDER OF FOOD
    // Creating Dictionary keys
    // this.food_keys = {

    //   Apple
    //   :21,
    //   'Pears Shandong'
    //   :3,
    //   Mango
    //   :4,
    //   Mosambi
    //   :5,
    //   Grapes
    //   :6,
    //   'Green Coconut'
    //   :7,
    //   Pomegranate
    //   :8,
    //   'Water Melon'
    //   :9,
    //   Kinnow
    //   :10,
    //   Papaya
    //   :11,
    //   Orange
    //   :12,
    //   'Sarda Melon'
    //   :2,
    //   Banana
    //   :14,
    //   Pineapple
    //   :15,
    //   Coconut
    //   :16,
    //   Sapota
    //   :17,
    //   Pumpkin
    //   :18,
    //   Plum
    //   :19,
    //   Guava
    //   :20,
    //   Corn
    //   :12,
    // };
  };

  renderBubbleChart = () => {
    this.circles = this.container
      .append("g")
      .attr("id", "bubble_group")
      .selectAll("circle")
      .data(this.mArrivals);

    //exit
    this.circles.exit().remove();

    //enter+update
    this.circles = this.circles
      .enter()
      .append("circle")
      .attr("fill-opacity", "0.8")
      .attr("stroke-width", "3")
      .merge(this.circles)
      .attr("r", d => d.Arrival / 3000) //TODO: Creating a log like scale
      .attr("fill", d => colorScale(this.food_key.indexOf(d.FoodEng) / 20))
      .attr("stroke", d => colorScale(this.food_key.indexOf(d.FoodEng) / 20));
  };

  renderArcChart = () => {
    let min_radius = this.props.min_radius;
    let max_radius = this.props.bubble_circle_radius - 35;
    const arc_height = this.props.arc_height;
    let no_of_partitions = this.partition_key.length; //+ this.extra_partitions;
    let sep_degree = Math.PI / 360;
    let annotation_partition_degree = Math.PI / 2.2;
    let available_degree = Math.PI * 2 - annotation_partition_degree;
    let partition_degree = available_degree / no_of_partitions;
    let arc_degree;
    let rotation_degree = partition_degree / 2; //TODO: Centering the annotation_partition, hence rotating all   -partition_degree / 2;

    this.props.alignment === "Yes"
      ? (arc_degree = partition_degree / this.arc_key.length)
      : (arc_degree = partition_degree / this.max_arc);
    //for alignment devide by C_key.length instead of max_arc

    // DEPRECATED STATE KEYS
    //let states_keys = {
    //   AP: 2,
    //   AR: 3,
    //   AS: 4,
    //   BR: 5,
    //   CG: 6,
    //   GA: 7,
    //   GJ: 8,
    //   HR: 9,
    //   HP: 10,
    //   JK: 11,
    //   JH: 12,
    //   KA: 13,
    //   KL: 14,
    //   MP: 15,
    //   MH: 16,
    //   MN: 17,
    //   ML: 18,
    //   MZ: 19,
    //   NL: 20,
    //   OR: 21,
    //   PB: 22,
    //   RJ: 23,
    //   SK: 24,
    //   TN: 25,
    //   TR: 26,
    //   UK: 27,
    //   UP: 28,
    //   WB: 29,
    //   AN: 30,
    //   CH: 31,
    //   DH: 32,
    //   DD: 33,
    //   DL: 34,
    //   LD: 35,
    //   PY: 36,
    //   TS: 37,
    // };

    let ringScale = d3
      .scaleLinear()
      .domain([0, this.ring_key.length])
      .range([min_radius, max_radius]);

    let minor_arcGen = d3
      .arc()
      .outerRadius((d, i, j) => {
        let ring = j[0].parentNode.__data__[this.ring];
        return ringScale(this.ring_key.indexOf(ring));
      })
      .innerRadius((d, i, j) => {
        let ring = j[0].parentNode.__data__[this.ring];
        return ringScale(this.ring_key.indexOf(ring)) - arc_height;
      })
      .startAngle((d, i, j) => {
        let partition_no; // If partition is Month, then it accesses date, else not
        this.partition === "Month"
          ? (partition_no = j[0].parentNode.__data__.date.getMonth())
          : (partition_no = this.partition_key.indexOf(
              // FIXME: Non-Month Partitions being arranged based on partition_key
              j[0].parentNode.__data__[this.partition]
            ));

        let partitionBased_startAngle =
          -partition_degree / 2 + partition_degree * partition_no;

        if (partition_no >= 6) {
          partitionBased_startAngle += annotation_partition_degree;
        }

        if (this.props.alignment === "Yes") {
          let arcBased_startAngle = this.arc_key.indexOf(d) * arc_degree;
          let s_angle =
            partitionBased_startAngle + arcBased_startAngle + rotation_degree;
          return i === 0 ? sep_degree + s_angle : s_angle;
        } else if (this.props.alignment === "No") {
          let arcBased_startAngle = i * arc_degree;
          let s_angle =
            partitionBased_startAngle + arcBased_startAngle + rotation_degree;
          return i === 0 ? sep_degree + s_angle : s_angle;
        }
      })
      .endAngle((d, i, j) => {
        let partition_no;
        this.partition === "Month"
          ? (partition_no = j[0].parentNode.__data__.date.getMonth())
          : (partition_no = this.partition_key.indexOf(
              j[0].parentNode.__data__[this.partition]
            ));
        let partitionBased_startAngle =
          -partition_degree / 2 + partition_degree * partition_no;

        if (partition_no >= 6) {
          partitionBased_startAngle += annotation_partition_degree;
        }

        if (this.props.alignment === "Yes") {
          let arcBased_startAngle = this.arc_key.indexOf(d) * arc_degree;
          let s_angle =
            partitionBased_startAngle + arcBased_startAngle + rotation_degree;
          return s_angle + arc_degree;
        } else if (this.props.alignment === "No") {
          let arcBased_startAngle = i * arc_degree;
          let s_angle =
            partitionBased_startAngle + arcBased_startAngle + rotation_degree;
          return s_angle + arc_degree;
        }
      });

    //FIXME: Done for now. Creating the 13 parts background rings. Data will be ring_keys
    let bg_ringGen = d3
      .arc()
      .outerRadius((d, i, j) => {
        // let sector_no = j[0].parentNode.__data__ ;
        return ringScale(i) + this.props.bg_ring_gap;
      })
      .innerRadius((d, i, j) => {
        // let ring = j[0].parentNode.__data__[this.ring];
        return ringScale(i) - arc_height - this.props.bg_ring_gap;
      })
      .startAngle((d, i, j) => {
        let partition_no = j[0].parentNode.__data__;
        let s_angle =
          -partition_degree / 2 +
          partition_degree * partition_no +
          rotation_degree;

        if (partition_no >= 7) {
          s_angle += annotation_partition_degree - partition_degree;
        }

        return sep_degree + s_angle;
      })
      .endAngle((d, i, j) => {
        let partition_no = j[0].parentNode.__data__;
        let s_angle =
          -partition_degree / 2 +
          partition_degree * partition_no +
          rotation_degree;
        // pehle end angle shift hoga, fir start angle shift hoga (7 onwards), you are drwaing with one pen,one hand at a time, not two lines simultaneously.
        let end_angle = s_angle + partition_degree; //Partition no 6 is annotation_partition
        if (partition_no === 6) {
          end_angle = s_angle + annotation_partition_degree;
        } else if (partition_no > 6) {
          end_angle += annotation_partition_degree - partition_degree;
        }

        return end_angle;
      });

    let arcChartContainer = this.container.append("svg");

    let arcManipulator = (selection, reverseFlag = 1) => {
      // Docstring:
      // Arg: D3 Selection of path element to be manipulated
      // Returns the reversed newArc
      // /Docstring

      //Search pattern for everything between the start and the first capital L
      let firstArcSection = /(^.+?)L/;

      //Grab everything up to the first Line statement //Changed select(this) to j[i]
      let newArc = firstArcSection.exec(selection.attr("d"))[1];

      //Replace all the commas so that IE can handle it
      newArc = newArc.replace(/,/g, " ");

      if (reverseFlag) {
        //If the angle lies beyond a quarter of a circle (90 degrees or pi/2)
        //flip the end and start position

        //Everything between the capital M and first capital A
        let startLoc = /M(.*?)A/;
        //Everything between the capital A and 0 0 1
        let middleLoc = /A(.*?)0 0 1/;
        //Everything between the 0 0 1 and the end of the string (denoted by $)
        let endLoc = /0 0 1 (.*?)$/;
        //Flip the direction of the arc by switching the start and end point
        //and using a 0 (instead of 1) sweep flag
        let newStart = endLoc.exec(newArc)[1];
        let newEnd = startLoc.exec(newArc)[1];
        let middleSec = middleLoc.exec(newArc)[1];

        //Build up the new arc notation, set the sweep-flag to 0
        newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;
      }

      return newArc;
    };

    // 13 parts Background Rings
    const lastringid = this.ring_key.length - 1;
    let bg_ring = arcChartContainer
      .selectAll("g")
      .data(d3.range(13))
      .enter()
      .append("g")
      .attr("class", "rings")
      .attr("id", d => "partition" + d);

    //Appending Visible path for bg rings
    bg_ring
      .selectAll("path")
      .data(this.ring_key)
      .enter()
      .append("path")
      .attr("class", "visibleArcs")
      .attr("id", (d, i, j) => {
        let partition_no = j[0].parentNode.__data__;
        return "partition" + partition_no + "ring" + i;
      })
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .attr("d", bg_ringGen)
      .attr("fill", "blue")
      .attr("fill-opacity", 0.08);

    bg_ring.each((d, i, j) => {
      let selector = "path#partition" + d + "ring" + lastringid;
      let selection_of_pathElem = d3.select(selector);
      let newArc;
      if (d in { 5: 0, 4: 0, 8: 0, 7: 0 }) {
        newArc = arcManipulator(selection_of_pathElem, 1);
      } else {
        newArc = arcManipulator(selection_of_pathElem, 0);
      }

      // let firstArcSection = /(^.+?)L/;
      // let newArc = firstArcSection.exec(selection_of_pathElem.attr("d"))[1];
      // newArc = newArc.replace(/,/g, " ");
      // let startLoc = /M(.*?)A/;
      // let middleLoc = /A(.*?)0 0 1/;
      // let endLoc = /0 0 1 (.*?)$/;
      // let newStart = endLoc.exec(newArc)[1];
      // let newEnd = startLoc.exec(newArc)[1];
      // let middleSec = middleLoc.exec(newArc)[1];
      // newArc = "M" + newStart + "A" + middleSec + "0 0 0 " + newEnd;

      //Appending hidden arc
      // let selector = "g#partition" + i;
      d3
        .select(j[i])
        .append("path")
        .attr("class", "hiddenArcs")
        .attr("id", (d, i, j) => {
          // let partition_no = j[0].parentNode.__data__;
          return "HiddenPartition" + d + "ring" + lastringid;
        })
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
        .attr("d", newArc)
        .style("fill", "none");
    });

    //Challeng
    // Appending Partition Annotations
    d3
      .selectAll("g.rings")
      .append("text")
      .attr("class", "partition_annot")
      .attr("dy", d => {
        // Code for adjusting the dy for the reversed arcs (partition 5 & 7)
        if (d in { 5: 0, 4: 0, 8: 0, 7: 0 }) return arc_height + 5;
        else return -5;
      })
      .each((d, i, j) => {
        d3
          .select(j[i])
          .append("textPath")
          .attr("startOffset", "50%")
          .style("text-anchor", "middle")
          .attr("xlink:href", "#HiddenPartition" + d + "ring" + lastringid)
          .text(d => {
            // Code for Jumping the annotation partition i.e the partition with Food Names in rings
            if (d === 6) return null;
            else if (d > 6) return this.partition_key[d - 1];
            else return this.partition_key[d];
          });
      });

    //Appending hidden arcs for Annot Partition
    d3
      .select("g#partition6") //TODO: Change 6 incase you change orientation
      .selectAll("path.visibleArcs")
      .each((d, i, j) => {
        let newArc = arcManipulator(d3.select(j[i]));

        //Create a new invisible arc that the text can flow along
        d3
          .select("g#partition6")
          .append("path")
          .attr("class", "hiddenArcs")
          .attr("id", "hiddenArc" + i)
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
          .attr("d", newArc)
          .style("fill", "none");
      });

    let food_ring_annotations = arcChartContainer
      .append("svg")
      .attr("class", "ring_annot_container")
      .selectAll("text.ring_annot")
      .data(this.ring_key)
      .enter()
      .append("text")
      .attr("class", "ring_annot")
      .style("fill", "blue")
      .attr("x", 1)
      .attr("dy", -3)
      .attr("font-size", 14)
      .append("textPath")
      .attr("startOffset", "50%")
      .style("text-anchor", "middle")
      .attr("xlink:href", (d, i) => {
        // let partition_no = j[0].parentNode.__data__;
        return "#hiddenArc" + i;
      })
      .text(d => d);

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Adding groups and Data for arcs (this.arc)
    let minor_arcContainer = arcChartContainer
      .selectAll("g.arcs")
      .data(this.partition_ring_group)
      .enter()
      .append("g")
      .attr("class", "arcs");

    // Minor Arcs
    minor_arcContainer
      .selectAll("path")
      .data(d => d[this.arc])
      .enter()
      .append("path")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .attr("d", minor_arcGen) // WHY IS TRANSITION DURATION NOT WORKING?
      .attr("fill-opacity", 0.7)
      .attr("stroke-opacity", 0.9)
      .attr("fill", (d, i, j) => {
        //let loc = j[0].parentNode.__data__.Location;
        return colorScale(this.arc_key.indexOf(d) / this.arc_key.length);
      })
      .attr("stroke", d =>
        colorScale(this.arc_key.indexOf(d) / this.arc_key.length)
      )
      .attr("stroke-width", 0.5)
      .on("mouseover", (d, i, j) => {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .html(d + " " + j[0].parentNode.__data__[this.ring])
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      });
  };

  ticked = () => {
    this.circles.attr("cx", d => d.x).attr("cy", d => d.y);
  };

  render() {
    return <svg width={width} height={height} ref="container" />;
  }
}

export default RadialCustom;
