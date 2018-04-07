import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import chroma from 'chroma-js';


const width = 900;
const height = 900;
const margin = { left: 10,  top: 10, right: 10, bottom:10 };

//d3 functions
let colorScale = chroma.scale(['#53cf8d','#f7d283','#e85151']);
let amountScale = d3.scaleLog();

let simulation = d3.forceSimulation()
.force('x', d3.forceX(d => d.focusX))
.force('y', d3.forceY(d => d.focusY))
.stop();


class App extends Component {

  constructor(props){
    super(props);
    this.ArrivalData = [...this.props.mArrivals];
    this.LocationData = [...this.props.mLocations];
    this.state_month_group = [...this.props.state_month_group];
  }



  componentWillMount = () => {
    simulation.force('center',d3.forceCenter(width / 2, height / 2))
      .on('tick', this.ticked);
  }

  componentDidMount = () => {
    this.container = d3.select(this.refs.container);
    this.calculateData();
    this.renderBubbleChart();
    simulation.nodes(this.mArrivals).force('collide',d3.forceCollide(d => d.Arrival/2500)).alpha(0.9).restart();
    this.renderArcs();

  }

  componentDidUpdate = () => {
    this.calculateData();
    this.renderBubbleChart();
    this.renderArcs();
  }

  calculateData = () => {
    console.log(this.state_month_group);

    //process data
    this.ArrivalData.forEach(d => {
      let parser =  d3.utcParse("%B/%Y");
      d.date = parser(d.Month+"/"+d.Year);
    });


    this.bubble_circle_radius = width / 3 - margin.left;

    this.mArrivals = _.chain(this.ArrivalData)
      .groupBy(d => d.date.getMonth())
      //.sortBy(d => d.date.getMonth())
      .map(mArrivals => {
        return _.map(mArrivals, arr => {
          let month = arr.date.getMonth();
          let angle = (2*Math.PI/12)* month - (Math.PI/2);
          let focusX = this.bubble_circle_radius * Math.cos(angle) ;
          let focusY = this.bubble_circle_radius * Math.sin(angle) ;
          return Object.assign(arr,{
            focusX,
            focusY,
          });
        });
      }).flatten().value();

    //Processing LocationData
    this.LocationData.forEach(d => {
      let parser =  d3.utcParse("%B/%Y");
      d.date = parser(d.Month+"/"+d.Year);
    });

    //Processing state_month_group
    let fruit_count = [];
    this.state_month_group.forEach(d => {
      let parser =  d3.utcParse("%B/%Y");
      d.date = parser(d.Month+"/"+d.Year);
      fruit_count.push(d.Food_list.length);
    });
    this.max_foods_in_arc = d3.max(fruit_count);


    // Creating Dictionary keys
    this.food_keys = {

      Apple
      :21,
      'Pears Shandong'
      :3,
      Mango
      :4,
      Mosambi
      :5,
      Grapes
      :6,
      'Green Coconut'
      :7,
      Pomegranate
      :8,
      'Water Melon'
      :9,
      Kinnow
      :10,
      Papaya
      :11,
      Orange
      :12,
      'Sarda Melon'
      :2,
      Banana
      :14,
      Pineapple
      :15,
      Coconut
      :16,
      Sapota
      :17,
      Pumpkin
      :18,
      Plum
      :19,
      Guava
      :20,
      Corn
      :12,
    };


  }

  renderBubbleChart = () => {
    this.circles = this.container.selectAll('circle')
        .data(this.mArrivals);

    //exit
    this.circles.exit().remove();

    console.log(this.mArrivals);

    //enter+update
    this.circles = this.circles.enter().append('circle')
        .attr('fill-opacity', '0.25')
        .attr('stroke-width', '3')
      .merge(this.circles)
        .attr('r', d => d.Arrival/3000)
        .attr('fill',d => colorScale(this.food_keys[d.FoodEng]/21) )
        .attr('stroke',d => colorScale(this.food_keys[d.FoodEng]/21) );

  }

  renderArcs = () => {
    let min_radius = 50;
    let max_radius = this.bubble_circle_radius - 50;
    let arc_height = 5;
    let no_of_partions = 12;
    let month_degree = Math.PI*2/no_of_partions;
    let food_degree = month_degree/this.max_foods_in_arc;

    let states_keys = {
      AP: 2,
      AR: 3,
      AS: 4,
      BR: 5,
      CG: 6,
      GA: 7,
      GJ: 8,
      HR: 9,
      HP: 10,
      JK: 11,
      JH: 12,
      KA: 13,
      KL: 14,
      MP: 15,
      MH: 16,
      MN: 17,
      ML: 18,
      MZ: 19,
      NL: 20,
      OR: 21,
      PB: 22,
      RJ: 23,
      SK: 24,
      TN: 25,
      TR: 26,
      UK: 27,
      UP: 28,
      WB: 29,
      AN: 30,
      CH: 31,
      DH: 32,
      DD: 33,
      DL: 34,
      LD: 35,
      PY: 36,
      TS: 37,
    };


    let stateScale = d3.scaleLinear()
      .domain([0, 30])
      .range([min_radius, max_radius]);

    let arcGen =  d3.arc()
      .outerRadius( (d,i,j) => {
        let loc = j[0].parentNode.__data__.Location;
        return stateScale(states_keys[loc]) ;
      })
      .innerRadius( (d,i,j) => {
        let loc = j[0].parentNode.__data__.Location;
        return stateScale(states_keys[loc]) - arc_height ;
      })
      .startAngle( (d,i,j) => {
        let month = j[0].parentNode.__data__.date.getMonth();
        return  -month_degree/2 + month_degree*month + i*food_degree ;
      })
      .endAngle( (d,i,j) => {
        let month = j[0].parentNode.__data__.date.getMonth();
        return  -month_degree/2 + month_degree*month + (i+1)*food_degree ;

      });


      // Keeping this copy aside for bacground arcs. MODIFY LATER
      // let arcGen =  d3.arc()
      //   .outerRadius( (d,i,j) => {
      //     let loc = j[0].parentNode.__data__.Location;
      //     return stateScale(states_keys[loc]) ;
      //   })
      //   .innerRadius( (d,i,j) => {
      //     let loc = j[0].parentNode.__data__.Location;
      //     return stateScale(states_keys[loc]) - 10 ;
      //   })
      //   .startAngle( (d,i,j) => {
      //     let month = j[0].parentNode.__data__.date.getMonth();
      //     return - Math.PI/12 + (Math.PI/6)*(month) ;
                // -month_degree/2 + month_degree*month
      //   })
      //   .endAngle( (d,i,j) => {
      //     let month = j[0].parentNode.__data__.date.getMonth();
      //     return  Math.PI/12 + (Math.PI/6)*(month) ;
      // // return  month_degree/2 + month_degree*month ;
      //   });



    let stateContainer = this.container.append('svg')
                          .selectAll('g')
                            .data(this.state_month_group)
                          .enter()
                          .append('g')

    let x = stateContainer.selectAll('path')
                .data(d => d.Food_list)
                .enter()
                .append('path')
                .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')')
                .attr('d', arcGen ) // WHY IS TRANSITION DURATION NOT WORKING?
                .attr('fill-opacity', 1)
                .attr('fill', (d,i,j) => {
                  //let loc = j[0].parentNode.__data__.Location;
                  return colorScale(this.food_keys[d]/21);
                })
                .attr('stroke', d => this.food_keys[d]/21)
                .attr('stroke-width', 0.9 );

  }

  ticked = () => {
    this.circles.attr('cx', d => d.x)
        .attr('cy', d => d.y);
  }


  render () {
    return (
      <svg width={width} height={height} ref="container">

      </svg>
    );
  }
}


export default App
