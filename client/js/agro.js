
(function($) {
    var updateInterval = 0;

    $(document).ready(function () {

        var history = [],
            maxTemp,
            maxHum,
            minTemp,
            minHum,
            minTime,
            maxTime,
            path,
            path2,
            chartBody,
            yAxis,
            xAxis,
            w,
            h,
            m = [30, 30, 30, 30],
            x,
            y,
            y2,
            line,
            line2;

        updateInterval = setInterval(function () {
            $.ajax({
                url: '/plugins',
                dataType: 'json',
                data:{},
                success: function (data)
                {
                    jQuery(document).trigger('plugins', data);
                }
           });
        }, 2000);

        //$(window).resize(redraw);

        var color = d3.scale.category10();

        var chart = d3.select("#timeline").select('strong').append("svg")
            .attr("pointer-events", "all")
            .append("g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

        if(typeof window.initialHistory != 'undefined')
        {
            //updateHistory(window.initialHistory);
            //setTimeout(lines, 1);
        }

        function updateHistory(newHistory)
        {
            var parse = d3.time.format.utc("%Y-%m-%d %H:%M:%S").parse;

            newHistory.forEach(function (d) {
                d.time = parse(d.time);
                d.celsius = parseFloat(d.celsius);
                //ROUND((UNIX_TIMESTAMP(UTC_TIMESTAMP()) - UNIX_TIMESTAMP(`time`)) / 432)
                if(history.length > 0 && Math.round(history[history.length - 1].time.getTime() / 432000) == Math.round(d.time.getTime() / 432000))
                    history[history.length - 1] = d;
                else
                    history[history.length] = d;
            });

            for(var i = 0; i < history.length - 200; i++)
                history.shift();
        }

        function redraw()
        {
            w = $('#timeline strong').width() - m[1] - m[3];
            h = $('#timeline strong').width() * $(window).height() / $(window).width() - m[0] - m[2];

            d3.select("#timeline svg").attr("width", w + m[1] + m[3]);
            d3.select("#timeline svg").attr("height", h + m[0] + m[2]);

            maxTemp = d3.max(history, function(d) { return d.celsius; });
            maxHum = d3.max(history, function(d) { return d.humidity; });
            minTemp = d3.min(history, function(d) { return d.celsius; });
            minHum = d3.min(history, function(d) { return d.humidity; });
            minTime = d3.min(history, function(d) { return d.time; });
            maxTime = d3.max(history, function(d) { return d.time; });

            x = d3.time.scale().range([0, w - m[1] - m[3]]);
            y = d3.scale.linear().range([h - m[0] - m[2], 0]);
            y2 = d3.scale.linear().range([h - m[0] - m[2], 0]);

            x.domain([minTime, maxTime]);
            y.domain([minTemp, maxTemp]);
            y2.domain([minHum, maxHum]);

            line = d3.svg.line()
                .interpolate("cardinal")
                .x(function(d) { return x(d.time); })
                .y(function(d) { return y(d.celsius); });

            line2 = d3.svg.line()
                .interpolate("cardinal")
                .x(function(d) { return x(d.time); })
                .y(function(d) { return y2(d.humidity); });

            // x-axis label
            /*chart.append("text")
                .attr("class", "x label")
                .attr("text-anchor", "end")
                .attr("x", w)
                .attr("y", h - 6)
                .text("Time");

            // y-axis label
            chart.append("text")
                .attr("class", "y label")
                .attr("text-anchor", "end")
                .attr("y", 6)
                .attr("dy", ".75em")
                .attr("transform", "rotate(-90)")
                .text("Temp");
*/
            xAxis = d3.svg.axis().orient("bottom").scale(x).ticks(12, d3.format(",d"));
            yAxis = d3.svg.axis().orient("left").scale(y);
            //xAxis.scale(x);
            //yAxis.scale(y);

            // x-axis
            if(chart.select('.x.axis').empty())
                chart.append("g").attr("class", "x axis");
            chart.selectAll('.x.axis')
                .attr("transform", "translate(0," + h + ")")
                .call(xAxis);

            // y-axis
            if(chart.select('.y.axis').empty())
                chart.append("g").attr("class", "y axis");
            chart.selectAll('.y.axis')
                .call(yAxis);

            if(chartBody == null)
                chartBody = chart.append("g")
                    .attr('class', 'body')
                    .call(d3.behavior.zoom().scaleExtent([0.2, 5]).on("zoom", redrawToScale));

            redrawLines();
        }

        function redrawToScale()
        {
            path.transition()
                .ease("linear")
                .attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }

        function redrawLines(k)
        {
            if(typeof k == 'undefined')
                k = history.length - 1;

            if(path == null)
                path = chartBody.append("svg:path")
                    .data(history)
                    .attr("class", "line line1")
                    .attr("fill", "none")
                    .attr("stroke", function(d) { return color('Temp'); })
                    .attr("stroke-width", 2);

            if(path2 == null)
                path2 = chartBody.append("svg:path")
                    .data(history)
                    .attr("class", "line line2")
                    .attr("fill", "none")
                    .attr("stroke", function(d) { return color('Humidity'); })
                    .attr("stroke-width", 2);

            if(chartBody.selectAll('circle.line1').empty())
                chartBody.append("circle")
                    .attr("class", "line1")
                    .attr("r", 5)
                    .style("fill", function(d) { return color('Temp'); })
                    .style("stroke-width", "2px");

            if(chartBody.selectAll('text.line1').empty())
                chartBody.append("text")
                    .attr("class", "line1")
                    .attr("x", 12)
                    .attr("dy", ".31em")
                    .text('Temp');

            if(chartBody.selectAll('circle.line2').empty())
                chartBody.append("circle")
                    .attr("class", "line2")
                    .attr("r", 5)
                    .style("fill", function(d) { return color('Humidity'); })
                    .style("stroke-width", "2px");

            if(chartBody.selectAll('text.line2').empty())
                chartBody.append("text")
                    .attr("class", "line2")
                    .attr("x", 12)
                    .attr("dy", ".31em")
                    .text('Humidity');

            path.attr("d", function(d) { return line(history.slice(0, k + 1)); });
            path2.attr("d", function(d) { return line2(history.slice(0, k + 1)); });

            chartBody.selectAll("circle.line1, text.line1")
                .data(function(d) { return [history[k], history[k]]; })
                .attr("transform", function(d) {
                    return "translate(" + x(d.time) + "," + y(d.celsius) + ")";
                });

            chartBody.selectAll("circle.line2, text.line2")
                .data(function(d) { return [history[k], history[k]]; })
                .attr("transform", function(d) { return "translate(" + x(d.time) + "," + y2(d.humidity) + ")"; });
        }

        function lines() {

            redraw();

            var k = 1, n = history.length;
            d3.timer(function() {
                redrawLines(k);
                if ((k += 2) >= n - 1) {
                    redrawLines(n - 1);
                    //setTimeout(areas, 500);
                    return true;
                }
            });

        }

    });

})(jQuery);


