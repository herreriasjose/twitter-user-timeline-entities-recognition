// viz.js
    
	var margin = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50
    },
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.bottom - margin.top;
	var dataset;
	var user_name = '@realDonaldTrump';
	var viz;
    var timeScale;
    var minTime, maxTime, selectedTime;
    var startValue, startingValue;
    var formatDate = d3.time.format("%Y %b %d");
    var opacities = [];
    var radiuses = [];
	
	d3.json("datasets/entities_dataset.json", function(err, json) {
		if(err) return console.log(err);
		dataset = json;
		getData();
	});
    
    
	
	function getData() {
		
        now = new Date()
		offset = now.getTimezoneOffset() // Here we get the offset (in minutes) of our system respect to GMT.
        // In our case (Spain) at this time of the year the value is -120 == GMT+0200 (daylight savings time).
        eastern_america = (60 * -4) // The user timezone is GMT-0400.
        offset = offset + eastern_america
        offset = offset * 60 // In seconds now.

        arraySize = dataset.length;
        while(arraySize--){
            opacities.push(0);
            radiuses.push(0);
        }
        dataset.forEach(function(d) { d.time = new Date((d.created_at + offset) * 1000) }); // JavaScript uses milliseconds.

        
        // Finds data range.
        minTime = d3.min(dataset, function(d){ return Math.min(d.time) / 1000; });
        maxTime = d3.max(dataset, function(d){ return Math.max(d.time) / 1000; });
        selectedTime = minTime
        timeScale = d3.time.scale()
        .domain([new Date(minTime* 1000), new Date(maxTime * 1000)])
        .range([0, width])
        .clamp(true);
        
        // Initial values.
        startValue = timeScale(new Date(minTime * 1000));
        startingValue = new Date(minTime * 1000);
        createViz();

	};

	
	
    function createViz() {
    
        // Defines brush.
        var brush = d3.svg.brush()
          .x(timeScale)
          .extent([startingValue, startingValue])
          .on("brush", brushed);
            
            
            
       // Creates the projection.      
       var projection = d3.geo.mercator()
            .center([0,50])
            .scale(170)
            .rotate([0,0]);
               
       // Creates the svg container.
       viz = d3.select("body")
          .append("svg:svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          // Classic transform to position g.
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    
            
        var world_proj = d3.geo.path()
            .projection(projection);

        var g = viz.append("g");

        // Loads and display the map.
        d3.json("datasets/world-110m2.json", function(error, topology) {
        // Loads and display the entities.
        g.selectAll("path")
              .data(topojson.object(topology, topology.objects.countries)
                  .geometries)
            .enter()
              .append("path")
              .attr("d", world_proj)
              
           placeEntities();   
        }
        
        
        
        );
   
  viz.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height  + ")")
  // Introduces axis.
  .call(d3.svg.axis()
  .scale(timeScale)
  .orient("bottom")
  .tickFormat(function(d) {
    return formatDate(d);
      })
  .tickSize(0)
  .tickPadding(12)
  .tickValues([timeScale.domain()[0], timeScale.domain()[1]]))
  .select(".domain")
  .select(function() {
    return this.parentNode.appendChild(this.cloneNode(true));
  });

  var slider = viz.append("g")
  .attr("class", "slider")
  .call(brush);

  slider.selectAll(".extent,.resize")
  .remove();

  slider.select(".background")
  .attr("height", height);

  var handle = slider.append("g")
  .attr("class", "handle")

  handle.append("path")
  .attr("transform", "translate(0," + height + ")")
  .attr("d", "M 0 -10 V 10")
  .attr("class","path_slider")

  handle.append('text')
  .text(startingValue)
  .attr("transform", "translate(" + (-30) + " ," + (height  - 15) + ")")
  .attr("class","text_slider")



function brushed() {
  var value = brush.extent()[0];

  if (d3.event.sourceEvent) {
    value = timeScale.invert(d3.mouse(this)[0]);
    brush.extent([value, value]);
  };

  handle.attr("transform", "translate(" + timeScale(value) + ",0)");
  handle.select('text').text(formatDate(value));
  selectedTime = value.getTime() / 1000;
  
}

function placeEntities() {
     
    g.selectAll("circle")
       .data(dataset)
       .enter()
       .append("circle")
       .attr("cx", function(d) {
           return projection([d.lon, d.lat])[0];
       })
       .attr("cy", function(d) {
           return projection([d.lon, d.lat])[1];
       })
       .attr("r", function(d,i) {  return radiuses[i];} )
       .style("fill", "blue")

               
    g.selectAll("text")
       .data(dataset)
       .enter()
       .append("text")
       .attr("x", function(d) {
               return projection([d.lon, d.lat])[0];
       })
       .attr("y", function(d) {
               return projection([d.lon, d.lat])[1];
       })
       .attr("dy", -7) 
      .attr("text-anchor", "middle")
      .attr("class","text_slider")
      .text(function(d) {return d.entity;})
      .style("fill", "white")
      .attr("fill-opacity", function(d,i) { return opacities[i];} )
    
}


function updateEntities(){

    viz.selectAll('circle')
      .data(dataset)
      .attr("cx", function(d) {
                       return projection([d.lon, d.lat])[0];
               })
               .attr("cy", function(d) {
                       return projection([d.lon, d.lat])[1];
               })
               .attr("r", function(d,i) {  
               
                if (d.created_at > selectedTime && d.created_at < (selectedTime + (24 * 60 * 60))) {
                    radiuses[i] = 10;
                    
                }
               
                radiuses[i] -= .5;
                if (radiuses[i] < 0) radiuses[i] = 0;
               return radiuses[i];} )
               .style("fill", "blue")
    
    viz.selectAll('text')
      .data(dataset)
      .attr("x", function(d) {
               return projection([d.lon, d.lat])[0];
       })
       .attr("y", function(d) {
               return projection([d.lon, d.lat])[1];
       })
       .attr("dy", -7)
      .attr("text-anchor", "middle") 
      .attr("class","text_slider")
      .text(function(d) {return d.entity;})
      .style("fill", "white")
      .attr("fill-opacity", function(d,i) { 
            if (d.created_at > selectedTime && d.created_at < (selectedTime + (24 * 60 * 60))) {
                    opacities[i] = 1;            
                };
          if (radiuses[i] > .2) opacities[i] -= .2;
          return opacities[i];} 
          )       
     
}

function update(){
  
  if (selectedTime < maxTime) {
    selectedTime += (24 * 60 * 60)
    handle.attr("transform", "translate(" + timeScale(new Date(selectedTime* 1000)) + ",0)");
    handle.select('text').text(formatDate(new Date(selectedTime* 1000)));
    updateEntities(); 
    }
}

  slider.call(brush.event)
  setInterval(function() {update();}, 250);    
       
};   
