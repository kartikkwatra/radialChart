import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import chroma from 'chroma-js';

const width = 900;
const height = 900;
const margin = { left: 10,  top: 10, right: 10, bottom:10 };

//d3 FUNCTIONS
let colorScale = chroma.scale(['#53cf8d','hotpink','#9900cc','teal','#f7d283','#e85151']);

class RadialGen extends Component {

  constructor(props) {
    super(props);
    this.ArrivalData = [...this.props.mArrivals];
    this.partition_ring_group = [...this.props.partition_ring_group];

    this.partition = this.props.partition;
    this.ring = this.props.ring;
    this.arc = this.props.arc;

    for (let [key, value] of Object.entries(this.props)) {
      if (value === 'Food') {
        this.food = key;
      }
    }
    this.simulation = d3.forceSimulation()
      .force('x', d3.forceX(d => d.focusX))
      .force('y', d3.forceY(d => d.focusY))
      .stop();
  }


  componentWillMount = () => {
    this.simulation.force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', this.ticked);
  }

  componentDidMount = () => {
    this.container = d3.select(this.refs.container);
    this.calculateData();
    this.renderBubbleChart();
    this.simulation.nodes(this.mArrivals).force('collide', d3.forceCollide(d => d.Arrival / 2500)).alpha(.9).restart();
    this.renderArcs();

  }

  componentDidUpdate = () => {
    this.calculateData();
    this.renderBubbleChart();
    this.renderArcs();
  }

  calculateData = () => {

    //PROCESSING DATA
    this.bubble_circle_radius = width / 3 - margin.left;

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
          let angle = (2 * Math.PI / 12) * month - (Math.PI / 2);
          let focusX = this.bubble_circle_radius * Math.cos(angle);
          let focusY = this.bubble_circle_radius * Math.sin(angle);
          return Object.assign(arr, {
            focusX,
            focusY,
          });
        });
      }).flatten().value();

    //Processing partition_ring_group
    let arc_count = []; //for maximum number of arcs possible
    this.arc_key = [];
    this.ring_key = [];
    this.partition_key = [];

    // Generating arc,ring,partition key, max_arc
    this.partition_ring_group.forEach(d => {
      let parser = d3.utcParse("%B/%Y");
      this.arc === 'Month' ? undefined : d.date = parser(d.Month + "/" + d.Year);
      arc_count.push(d.Food.length);

      this.ring_key.push(d[this.ring]);
      this.partition_key.push(d[this.partition]);

      d[this.arc].forEach(d => {
        this.arc_key.push(d);
      });
    });

    this.arc_key = _.uniqBy(this.arc_key);
    this.ring_key = _.uniqBy(this.ring_key);
    this.partition_key = _.uniqBy(this.partition_key);
    this.food_key = this[this.food + '_key'];
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

  }

  renderBubbleChart = () => {
    this.circles = this.container.selectAll('circle')
        .data(this.mArrivals);

    //exit
    this.circles.exit().remove();

    //enter+update
    this.circles = this.circles.enter().append('circle')
        .attr('fill-opacity', '0.8')
        .attr('stroke-width', '3')
      .merge(this.circles)
        .attr('r', d => d.Arrival / 3000)
        .attr('fill', d => colorScale(this.food_key.indexOf(d.FoodEng) / 20))
        .attr('stroke', d => colorScale(this.food_key.indexOf(d.FoodEng) / 20));
  }

  renderArcs = () => {
    let min_radius = this.props.min_radius;
    let max_radius = this.bubble_circle_radius - 50;
    let arc_height = this.props.arc_height;
    let no_of_partions = this.partition_key.length;
    let sep_degree = Math.PI / 360;
    let partition_degree = Math.PI * 2 / no_of_partions - sep_degree;
    let arc_degree;

    this.props.alignment === 'Yes' ? arc_degree = partition_degree / this.arc_key.length : arc_degree = partition_degree / this.max_arc;
    //for alignment devide by C_key.length instead of max_arc

    // let states_keys = {
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


    let ringScale = d3.scaleLinear()
      .domain([0, this.ring_key.length])
      .range([min_radius, max_radius]);

    let arcGen = d3.arc()
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
        this.partition === 'Month' ? partition_no = j[0].parentNode.__data__.date.getMonth() : partition_no = this.partition_key.indexOf(j[0].parentNode.__data__[this.partition]);
        let partitionBased_startAngle = -partition_degree / 2 + partition_degree * partition_no;

        if (this.props.alignment === 'Yes') {
          let arcBased_startAngle = (this.arc_key.indexOf(d)) * arc_degree;
          let s_angle = partitionBased_startAngle + arcBased_startAngle;
          return i === 0 ? sep_degree + s_angle : s_angle;
        }
        else if (this.props.alignment === 'No') {
          let arcBased_startAngle = (i) * arc_degree;
          let s_angle = partitionBased_startAngle + arcBased_startAngle;
          return i === 0 ? sep_degree + s_angle : s_angle;
        }
      })
      .endAngle((d, i, j) => {
        let partition_no;
        this.partition === 'Month' ? partition_no = j[0].parentNode.__data__.date.getMonth() : partition_no = this.partition_key.indexOf(j[0].parentNode.__data__[this.partition]);
        let partitionBased_startAngle = -partition_degree / 2 + partition_degree * partition_no;

        if (this.props.alignment === 'Yes') {
          let arcBased_startAngle = (this.arc_key.indexOf(d)) * arc_degree;
          let s_angle = partitionBased_startAngle + arcBased_startAngle;
          return s_angle + arc_degree;
        }
        else if (this.props.alignment === 'No') {
          let arcBased_startAngle = (i) * arc_degree;
          let s_angle = partitionBased_startAngle + arcBased_startAngle;
          return s_angle + arc_degree;
        }
      });
      
      // Keeping this copy aside for bacground arcs. MODIFY LATER
      // let arcGen =  d3.arc()
      //   .outerRadius( (d,i,j) => {
      //     let loc = j[0].parentNode.__data__.Location;
      //     return ringScale(states_keys[loc]) ;
      //   })
      //   .innerRadius( (d,i,j) => {
      //     let loc = j[0].parentNode.__data__.Location;
      //     return ringScale(states_keys[loc]) - 10 ;
      //   })
      //   .startAngle( (d,i,j) => {
      //     let month = j[0].parentNode.__data__.date.getMonth();
      //     return - Math.PI/12 + (Math.PI/6)*(month) ;
                // -partition_degree/2 + partition_degree*month
      //   })
      //   .endAngle( (d,i,j) => {
      //     let month = j[0].parentNode.__data__.date.getMonth();
      //     return  Math.PI/12 + (Math.PI/6)*(month) ;
      // // return  partition_degree/2 + partition_degree*month ;
      //   });



    let stateContainer = this.container.append('svg')
      .selectAll('g')
        .data(this.partition_ring_group)
      .enter()
      .append('g')

    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    let x = stateContainer.selectAll('path')
        .data(d => d[this.arc])
      .enter()
      .append('path')
        .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
        .attr('d', arcGen) // WHY IS TRANSITION DURATION NOT WORKING?
        .attr('fill-opacity', 1)
        .attr('fill', (d, i, j) => {
          //let loc = j[0].parentNode.__data__.Location;
          return colorScale(this.arc_key.indexOf(d) / this.arc_key.length);
        })
        .attr('stroke', d => colorScale(this.arc_key.indexOf(d) / this.arc_key.length))
        .attr('stroke-width', 0)
        .on("mouseover", (d, i, j) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html(d + " " + j[0].parentNode.__data__[this.ring])
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        });
  }

  ticked = () => {
    this.circles.attr('cx', d => d.x)
        .attr('cy', d => d.y);
  }


  render() {
    return (
      <svg width={width} height={height} ref="container">
      </svg>
    );
  }
}


export default RadialGen
