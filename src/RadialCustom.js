import React, { Component } from "react";
import * as d3 from "d3";
import _ from "lodash";
import chroma from "chroma-js";

// const width = 900;
// const height = 900;
const margin = { left: 10, top: 10, right: 10, bottom: 10 };

//controlled growth curve function
// let cgf = (x) => {
//   return Math.abs(x/(70-x));
// }

//d3 functions
let colorScale = chroma.scale([
  "#53cf8d",
  "#9900cc",
  "#009688",
  "#2196F3",
  "#eb8787"
]);

colorScale.colors(10);

let colors2 = [
  "#2A88B2",
  "#FF5CBB",
  "#46FF98",
  "#9526C9",
  "#009688",
  "#C75E52"
];

let colors3 = [
  "#2C8ACC",
  "#D41FA9",
  "#24ED3F",
  "#FF782E",
  "#009688",
  "#E0DD20"
];

let colorsx = [
  "#eb8787",
  "#53cf8d",
  "#9C27B0",
  "#558B2F",
  "#009688",
  "#2196F3",
  "#FF1744",
  "#aad28c",
  "#795548",
  "#FF9800"
];

let colors = [
  "#66C5CC",
  "#F6CF71",
  "#F89C74",
  "#DCB0F2",
  "#87C55F",
  "#9EB9F3",
  "#FE88B1",
  "#8BE0A4",
  "#B497E7",
  "#D3B484"
];

let regionColorScale = d3
  .scaleOrdinal()
  .domain([
    "North India",
    "South India",
    "Central India",
    "West India",
    "Northeast India",
    "East India"
  ])
  .range(colors3);

class RadialCustom extends Component {
  constructor(props) {
    super(props);
    this.ArrivalData = [...this.props.mArrivals];
    this.partition_ring_group = [...this.props.partition_ring_group];

    this.partition = this.props.partition;
    this.ring = this.props.ring;
    this.arc = this.props.arc;
    this.extra_partitions = this.props.extra_partitions;
    this.radius = this.props.bubble_circle_radius;

    //TODO: What is this?
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
      .force(
        "center",
        d3.forceCenter(this.props.width / 2, this.props.height / 2 - 60) // Vertival adjustment of the ring
      )
      .alphaDecay(0.023)
      .on("tick", this.ticked);
  };

  componentDidMount = () => {
    this.container = d3.select(this.refs[this.props.containerId]);
    this.canvasContainer = d3.select(
      this.refs["Canvas" + this.props.containerId]
    );
    this.calculateData();
    this.renderBubbleChart();
    this.simulation
      .nodes(this.mArrivals)
      .force("collide", d3.forceCollide(d => Math.sqrt(d.Arrival / 100) + 2)) //TODO: Creating a log like scale
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
    // this.bubble_circle_radius = this.props.width / 2.5 - margin.left;

    //FIXME: Proper Filtering data flow. Ring filter-er
    //FIXME: Arrival Data not filtered based on rings!

    //UGLY: Filtering for data without any logic, just based on array index.
    this.key_filter = [];
    this.partition_ring_group.forEach(d => this.key_filter.push(d[this.ring]));
    this.key_filter = _.uniqBy(this.key_filter);
    this.partition_ring_group = this.partition_ring_group.filter(
      d => this.key_filter.indexOf(d[this.ring]) < 10
    );

    // STATE KEYS for color ATM
    this.stateRegionKeys = {
      "Himachal Pradesh": "North India",
      Haryana: "North India",
      "Uttar Pradesh": "North India",
      Uttarakhand: "North India",
      "Jammu and Kashmir": "North India",
      Punjab: "North India",
      Rajasthan: "North India",
      Goa: "West India",
      Gujarat: "West India",
      Maharashtra: "West India",
      "Andhra Pradesh": "South India",
      "Tamil Nadu": "South India",
      Karnataka: "South India",
      Telangana: "South India",
      Kerala: "South India",
      Bihar: "East India",
      Jharkhand: "East India",
      Orissa: "East India",
      "West Bengal": "East India",
      Chhattisgarh: "Central India",
      "Madhya Pradesh": "Central India",
      "Arunachal Pradesh": "Northeast India",
      Assam: "Northeast India",
      Manipur: "Northeast India",
      Meghalaya: "Northeast India",
      Mizoram: "Northeast India",
      Nagaland: "Northeast India",
      Sikkim: "Northeast India",
      Tripura: "Northeast India"
    };

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

      d[this.arc] = _.sortBy(d[this.arc]);

      d[this.arc] = _.sortBy(d[this.arc], d => this.stateRegionKeys[d]);
    });

    console.log(this.partition_key);

    this.arc_key = _.uniqBy(this.arc_key);
    this.ring_key = _.uniqBy(this.ring_key);
    if (this.partition !== "Month")
      this.partition_key = _.uniqBy(this.partition_key);

    this.food_key = this[this.food + "_key"];
    this.max_arc = d3.max(arc_count);

    //Prepping the data

    // Filtering arrival data
    this.ArrivalData = this.ArrivalData.filter(
      d => this.key_filter.indexOf(d.FoodEng) < 10
    );
    //REVIEW: Can JS UTC formatted date be added right in the data? No month, no year
    //Adding Date
    this.ArrivalData.forEach(d => {
      let parser = d3.utcParse("%B/%Y");
      d.date = parser(d.Month + "/" + d.Year);
    });

    //Angle calculations
    this.min_radius = this.props.min_radius;
    this.max_radius = this.radius - this.props.bubble_circle_radius / 5; //TODO: Gap maintain
    this.arc_height = this.props.arc_height;
    let no_of_partitions = this.partition_key.length; //+ this.extra_partitions;
    this.sep_degree = Math.PI / 360;
    this.arc_degree;
    this.annotation_partition_degree = Math.PI / 3;
    let available_degree = Math.PI * 2 - this.annotation_partition_degree;
    this.partition_degree = available_degree / no_of_partitions;
    this.rotation_degree = this.partition_degree / 2; //TODO: Centering the annotation_partition, hence rotating all   -this.partition_degree / 2;

    //REVIEW: For synching with ArcChart
    // Assigning FocusX and FocusY by grouping by month
    this.mArrivals = _.chain(this.ArrivalData)
      .groupBy(d => d.date.getMonth())
      //.sortBy(d => d.date.getMonth())
      .map(Arrivals => {
        return _.map(Arrivals, arr => {
          let month = arr.date.getMonth();
          // let partitionBased_startAngle =
          // -this.partition_degree / 2 + this.partition_degree * month;
          let angle;
          if (month <= 5) {
            angle =
              this.partition_degree * (month + 1) -
              Math.PI / 2 -
              this.rotation_degree +
              2 * 2 * Math.PI / 360;
          } else if (month > 5) {
            angle =
              this.partition_degree * (month + 1) +
              this.annotation_partition_degree -
              Math.PI / 2 -
              this.rotation_degree +
              -2 * 1 * Math.PI / 360;
          }

          // this.partition_degree * month - Math.PI / 2 + this.rotation_degree;
          let focusX = this.radius * Math.cos(angle);
          let focusY = this.radius * Math.sin(angle);
          return Object.assign(arr, {
            focusX,
            focusY
          });
        });
      })
      .flatten()
      .value();

    console.log(this.mArrivals);

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
    //Prerequisites:
    var defs = this.container.append("defs");
    function rgbToCMYK(rgb) {
      var r = rgb.r / 255,
        g = rgb.g / 255,
        b = rgb.b / 255,
        k = 1 - Math.max(r, g, b);

      return {
        cyan: (1 - r - k) / (1 - k),
        magenta: (1 - g - k) / (1 - k),
        yellow: (1 - b - k) / (1 - k),
        black: k
      };
    } //function rgbToCMYK

    //Canvas Part /////////////////////////////////////////
    // var canvas = d3
    //   .select(this.refs["Canvas" + this.props.containerId])
    //   .append("canvas")
    //   .attr("id", "canvas")
    //   .attr("width", 400)
    //   .attr("height", 400);

    // var context = canvas.node().getContext("2d");

    //////////////////////////////////////////////////////////////
    ///////////////////// Create CMYK patterns ///////////////////
    //////////////////////////////////////////////////////////////

    let size_factor = 1.5;
    var radius_color_max = 2 * size_factor;
    var radius_color = d3.scaleSqrt().range([0, radius_color_max]);

    var cmyk_colors = ["yellow", "magenta", "cyan", "black"],
      rotation = [0, -15, 15, 45];

    //Loop over the different colors in the palette
    for (var j = 0; j < colors.length; j++) {
      //Get the radius transformations for this color
      var CMYK = rgbToCMYK(d3.rgb(colors[j]));

      //Create 4 patterns, C-Y-M-K, together forming the color
      defs
        .selectAll(".pattern-sub")
        .data(cmyk_colors)
        .enter()
        .append("pattern")
        .attr("id", function(d) {
          return "pattern-sub-" + d + "-" + j;
        })
        .attr("patternUnits", "userSpaceOnUse")
        .attr("patternTransform", function(d, i) {
          return "rotate(" + rotation[i] + ")";
        })
        .attr("width", 2 * radius_color_max)
        .attr("height", 2 * radius_color_max)
        .append("circle")
        .attr("fill", Object)
        .attr("cx", radius_color_max)
        .attr("cy", radius_color_max)
        .attr("r", function(d) {
          return Math.max(0.001, radius_color(CMYK[d]));
        });

      //Nest the CMYK patterns into a larger pattern
      var patterns = defs
        .append("pattern")
        .attr("id", "pattern-total-" + j)
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", radius_color_max * 31)
        .attr("height", radius_color_max * 31);

      //Append white background
      patterns
        .append("rect")
        .attr("width", 900)
        .attr("height", 900)
        .attr("x", 0)
        .attr("y", 0)
        .style("fill", "white");

      //Add the CMYK patterns
      patterns
        .selectAll(".dots")
        .data(cmyk_colors)
        .enter()
        .append("rect")
        .attr("class", "dots")
        .attr("width", 900)
        .attr("height", 900)
        .attr("x", 0)
        .attr("y", 0)
        .style("mix-blend-mode", "multiply")
        .attr("fill", function(d, i) {
          return "url(#pattern-sub-" + cmyk_colors[i] + "-" + j + ")";
        });
    } //for j

    // Canvas part ends here ////////////////////////////
    this.circles = this.container
      .append("g")
      .attr("class", "bubble_group")
      .selectAll("circle")
      .data(this.mArrivals);

    //exit
    this.circles.exit().remove();

    console.log(this.food_key);

    //enter+update
    this.circles = this.circles
      .enter()
      .append("circle")
      .attr("class", d => this.food_key.indexOf(d.FoodEng) + "bubble")
      .merge(this.circles)
      .attr("r", d => Math.sqrt(d.Arrival / this.props.bubbleRfactor)) //TODO: Creating a log like scale
      .attr("fill", (d, i) => {
        return "url(#pattern-total-" + this.food_key.indexOf(d.FoodEng) + ")";
      }) //d => colorScale(this.food_key.indexOf(d.FoodEng) / 10))
      .attr("stroke", d => colors[this.food_key.indexOf(d.FoodEng)])
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.7)
      .attr("fill-opacity", 0.6);
  };

  renderArcChart = () => {
    //TODO: I don't think there is need for alignment based on region, rather sorting
    this.props.alignment === "Yes"
      ? (this.arc_degree = this.partition_degree / this.arc_key.length)
      : (this.arc_degree = this.partition_degree / this.max_arc);
    //for alignment devide by arc_key.length instead of max_arc

    let ringScale = d3
      .scaleLinear()
      .domain([0, this.ring_key.length])
      .range([this.min_radius, this.max_radius]);

    // Arc Setup
    let minor_arcGen = d3
      .arc()
      .outerRadius((d, i, j) => {
        let ring = j[0].parentNode.__data__[this.ring];
        return ringScale(this.ring_key.indexOf(ring));
      })
      .innerRadius((d, i, j) => {
        let ring = j[0].parentNode.__data__[this.ring];
        return ringScale(this.ring_key.indexOf(ring)) - this.arc_height;
      })
      .startAngle((d, i, j) => {
        let partition_no; // If partition is Month, then it accesses date, else not
        this.partition === "Month"
          ? (partition_no = j[0].parentNode.__data__.date.getMonth())
          : (partition_no = this.partition_key.indexOf(
              j[0].parentNode.__data__[this.partition]
              // FIXME: Non-Month Partitions being arranged based on partition_key
            ));

        let partitionBased_startAngle =
          -this.partition_degree / 2 + this.partition_degree * partition_no;

        if (partition_no >= 6) {
          partitionBased_startAngle += this.annotation_partition_degree;
        }

        if (this.props.alignment === "Yes") {
          let arcBased_startAngle = this.arc_key.indexOf(d) * this.arc_degree;
          let s_angle =
            partitionBased_startAngle +
            arcBased_startAngle +
            this.rotation_degree;
          return i === 0 ? this.sep_degree + s_angle : s_angle;
        } else if (this.props.alignment === "No") {
          let arcBased_startAngle = i * this.arc_degree;
          let s_angle =
            partitionBased_startAngle +
            arcBased_startAngle +
            this.rotation_degree;
          return i === 0 ? this.sep_degree + s_angle : s_angle;
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
          -this.partition_degree / 2 + this.partition_degree * partition_no;

        if (partition_no >= 6) {
          partitionBased_startAngle += this.annotation_partition_degree;
        }

        if (this.props.alignment === "Yes") {
          let arcBased_startAngle = this.arc_key.indexOf(d) * this.arc_degree;
          let s_angle =
            partitionBased_startAngle +
            arcBased_startAngle +
            this.rotation_degree;
          return s_angle + this.arc_degree;
        } else if (this.props.alignment === "No") {
          let arcBased_startAngle = i * this.arc_degree;
          let s_angle =
            partitionBased_startAngle +
            arcBased_startAngle +
            this.rotation_degree;
          return s_angle + this.arc_degree;
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
        return ringScale(i) - this.arc_height - this.props.bg_ring_gap;
      })
      .startAngle((d, i, j) => {
        let partition_no = j[0].parentNode.__data__;
        let s_angle =
          -this.partition_degree / 2 +
          this.partition_degree * partition_no +
          this.rotation_degree;

        if (partition_no >= 7) {
          s_angle += this.annotation_partition_degree - this.partition_degree;
        }

        return this.sep_degree + s_angle;
      })
      .endAngle((d, i, j) => {
        let partition_no = j[0].parentNode.__data__;
        let s_angle =
          -this.partition_degree / 2 +
          this.partition_degree * partition_no +
          this.rotation_degree;
        // pehle end angle shift hoga, fir start angle shift hoga (7 onwards), you are drwaing with one pen,one hand at a time, not two lines simultaneously.
        let end_angle = s_angle + this.partition_degree; //Partition no 6 is annotation_partition
        if (partition_no === 6) {
          end_angle = s_angle + this.annotation_partition_degree;
        } else if (partition_no > 6) {
          end_angle += this.annotation_partition_degree - this.partition_degree;
        }

        return end_angle;
      });

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

    // #### Creating the Arcs ####
    let arcChartContainer = this.container.append("svg");

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
      .selectAll("path.visible_bg_Arc")
      .data(this.ring_key)
      .enter()
      .append("path")
      .attr("class", "visible_bg_Arcs")
      .attr("id", (d, i, j) => {
        let partition_no = j[0].parentNode.__data__;
        return "partition" + partition_no + "ring" + i;
      })
      .attr(
        "transform",
        "translate(" + this.props.width / 2 + "," + this.props.height / 2 + ")"
      )
      .attr("d", bg_ringGen)
      .attr("fill", "none")
      .attr("fill-opacity", 0.07);
    // .attr("stroke", "grey")
    // .attr("stroke-width", 0.15);

    // Creating Hidden arcs for Partition Annotations (last rings of each partition)
    bg_ring.each((d, i, j) => {
      let selector = "path#partition" + d + "ring" + lastringid;
      let selection_of_pathElem = this.container.select(selector);
      let newArc;
      if (d in { 5: 0, 4: 0, 8: 0, 7: 0 }) {
        newArc = arcManipulator(selection_of_pathElem, 1);
      } else {
        newArc = arcManipulator(selection_of_pathElem, 0);
      }
      //Appending hidden arc
      // let selector = "g#partition" + i;
      d3
        .select(j[i])
        .append("path")
        .attr("class", "hiddenArcs")
        .attr("id", (d, i, j) => {
          // let partition_no = j[0].parentNode.__data__;
          return (
            this.props.containerId + "HiddenPartition" + d + "ring" + lastringid
          );
        })
        .attr(
          "transform",
          "translate(" +
            this.props.width / 2 +
            "," +
            this.props.height / 2 +
            ")"
        )
        .attr("d", newArc)
        .style("fill", "none");
    });

    // Creating Partition Annotations
    this.container
      .selectAll("g.rings")
      .append("text")
      .attr("class", "partition_annotations")
      .attr("dy", d => {
        // Code for adjusting the dy for the reversed arcs (partition 5 & 7)
        if (d in { 5: 0, 4: 0, 8: 0, 7: 0 }) return this.arc_height + 5;
        else return -5;
      })
      .each((d, i, j) => {
        d3
          .select(j[i])
          .append("textPath")
          .attr("startOffset", "50%")
          .style("text-anchor", "middle")
          .attr(
            "xlink:href",
            "#" +
              this.props.containerId +
              "HiddenPartition" +
              d +
              "ring" +
              lastringid
          )
          .text(d => {
            // Code for Jumping the annotation partition i.e the partition with Food Names in rings
            if (d === 6) return null;
            else if (d > 6) return this.partition_key[d - 1];
            else return this.partition_key[d];
          });
      });

    //Appending hidden arcs for Annot Partition (partition 6)
    this.container
      .select("g#partition6") //TODO: Change 6 incase you change orientation
      .selectAll("path.visible_bg_Arcs")
      .attr("fill-opacity", 0.3)
      .attr("fill", (d, i) => "url(#pattern-total-" + i + ")")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.4)
      .attr("stroke", (d, i) => colors[i])
      .each((d, i, j) => {
        let newArc = arcManipulator(d3.select(j[i]));

        //Create a new invisible arc that the text can flow along
        this.container
          .select("g#partition6")
          .append("path")
          .attr("class", "hiddenArcs") // TODO: Change the naming here: More specific
          .attr("id", this.props.containerId + "hiddenArc" + i)
          .attr(
            "transform",
            "translate(" +
              this.props.width / 2 +
              "," +
              this.props.height / 2 +
              ")"
          )
          .attr("d", newArc)
          .style("fill", "none");
      })
      .on("mouseover", (d, i, j) => {
        //Listen to mouseover on Annot Partition bg_rings
        d3.event.stopPropagation();

        this.container
          .selectAll("path.minor_arcs")
          .transition()
          .duration(150)
          .attr("fill-opacity", (dx, ix, jx) => {
            let ringId = this.ring_key.indexOf(jx[ix].parentNode.__data__.Food);

            return ringId === i ? 1 : 0.1;
          })
          .attr("stroke-opacity", (dx, ix, jx) => {
            let ringId = this.ring_key.indexOf(jx[ix].parentNode.__data__.Food);
            return ringId === i ? 1 : 0.1;
          })
          .attr("stroke", (dx, ix, jx) => {
            let ringId = this.ring_key.indexOf(jx[ix].parentNode.__data__.Food);
            return ringId === i ? "white" : "none";
          });

        this.container //Highlighting the Annot Partition Ring being hovered
          .select("g#partition6") //TODO: Change 6 incase you change orientation
          .selectAll("path.visible_bg_Arcs")
          .transition()
          .duration(150)
          .attr("fill", (dy, iy) => {
            return "url(#pattern-total-" + iy + ")";
          })
          .attr("fill-opacity", (dy, iy, jy) => {
            return iy === i ? 0.4 : 0;
          })
          .attr("stroke-opacity", (dy, iy, jy) => {
            return iy === i ? 0.5 : 0;
          });

        let selector = "circle." + this.food_key.indexOf(d) + "bubble";

        // this.container
        //   .select("g.bubble_group")
        //   .selectAll("circle")
        //   .attr("fill-opacity", dx => {
        //     dx.FoodEng !== d ? 0 : 1;
        //   })
        //   .attr("stroke-opcacity", dx => {
        //     dx.FoodEng === d ? 1 : 0;
        //   });

        // this.container
        //   .select("g.bubble_group")
        //   .selectAll(selector)
        //   .attr("opacity", 1);

        //Highlighting the bubbles
        this.container
          .select("g.bubble_group")
          .selectAll("circle")
          .each((dx, ix, jx) => {
            dx.FoodEng === d
              ? d3
                  .select(jx[ix])
                  .transition()
                  .duration(500)
                  .attr("opacity", 0.99)
                  .attr("stroke-opacity", 1)
              : d3
                  .select(jx[ix])
                  .transition()
                  .duration(500)
                  .attr("opacity", 0.1)
                  .attr("stroke-opacity", 0.8);
          });
        // .attr("opacity", dx => {
        //   dx.FoodEng !== d ? 0 : 0;
        // });

        // console.log(this.mArrivals);

        // .attr("stroke-width", "3")
        // .merge(this.circles)
        // .attr("r", d => d.Arrival / 3000) //TODO: Creating a log like scale
        // .attr("fill", d => colorScale(this.food_key.indexOf(d.FoodEng) / 20))
        // .attr("stroke", d => colorScale(this.food_key.indexOf(d.FoodEng) / 20));
      });

    let annot_partition_annotations = arcChartContainer
      .append("svg")
      .attr("class", "annot_partition_Annotations_container")
      .selectAll("text.ring_annot")
      .data(this.ring_key)
      .enter()
      .append("text")
      .attr("class", "ring_annot")
      .style("fill", "red")
      .attr("stroke-width", 1)
      .attr("x", 1)
      .attr("dy", 0)
      .attr("font-size", this.arc_height + this.props.bg_ring_gap)
      .append("textPath")
      .attr("startOffset", "50%")
      .style("text-anchor", "middle")
      .attr("xlink:href", (d, i) => {
        // let partition_no = j[0].parentNode.__data__;
        return "#" + this.props.containerId + "hiddenArc" + i;
      })
      .text(d => d);

    //REVIEW: Why attach tooltip to <body> ?
    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Adding groups and Data for arcs (this.arc)
    let minor_arcContainer = arcChartContainer
      .selectAll("g.arcsContainer")
      .data(this.partition_ring_group)
      .enter()
      .append("g")
      .attr("class", "arcsContainer");

    // Appending Minor Arcs
    minor_arcContainer
      .selectAll("path.minor_arcs")
      .data(d => d[this.arc])
      .enter()
      .append("path")
      .attr("class", (d, i, j) => {
        //FIXME:
        let ringId = this.ring_key.indexOf(j[0].parentNode.__data__.Food); //REVIEW: J[0] makes an issue?j[i]
        return "minor_arcs ring" + ringId;
      })
      .attr(
        "transform",
        "translate(" + this.props.width / 2 + "," + this.props.height / 2 + ")"
      )
      .attr("d", minor_arcGen) // WHY IS TRANSITION DURATION NOT WORKING?
      .attr("fill-opacity", 0.7)
      .attr("stroke-opacity", 0.9)
      .attr("fill", (d, i, j) => {
        //let loc = j[0].parentNode.__data__.Location;
        return regionColorScale(this.stateRegionKeys[d]);
      })
      //REVIEW: STROKE DESIGN CHOICES
      .attr(
        "stroke",
        d => "white" // colorScale(this.arc_key.indexOf(d) / this.arc_key.length)
      )
      .attr("stroke-width", this.arc_height / 25)
      .on("mouseover", (d, i, j) => {
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);

        div
          .html(
            d +
              " " +
              j[0].parentNode.__data__[this.ring] +
              " " +
              this.stateRegionKeys[d]
          )
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 10 + "px");
      });
  };

  ticked = () => {
    this.circles.attr("cx", d => d.x).attr("cy", d => d.y);
  };

  render() {
    return (
      <div ref={"Canvas" + this.props.containerId}>
        <svg
          width={this.props.width}
          height={this.props.height}
          ref={this.props.containerId}
        />
      </div>
    );
  }
}

export default RadialCustom;
