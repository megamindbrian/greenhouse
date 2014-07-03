var safetyEnabled = false;
var gpio = 4;
var maxMinutes = 15;
var maxHumidity = 65;
var safetyTimespan = 3600;
var storage = require('node-persist');
storage.initSync({
    dir: '/home/greenhouse/persist'
});
var sensorLib = require('node-dht-sensor');
var seconds = [];
var temps = [];
var secondsTimestamp = new Date().getTime();
var savedMinutes = storage.getItem('emergency-shutoff-minutes') || {};
var minutes = savedMinutes.minutes || {};
var savedTemps = savedMinutes.temps || {};
var minuteTimestamp = savedMinutes.timestamp || 0;
var savedHours = storage.getItem('water-hours') || {};
var pfio;

process.on('listen', function (server) {

    server.on('plugins', function (req, res) {
        res.data.temp1 = storage.getItem('temp1') || {
            timestamp: 0,
            celsius: 0,
            fahrenheit: 0,
            humidity: 0
        };
        var timeline = storage.getItem('water-hours') || {};
        res.data.temp1.timeline = timeline;
    });

});

function timeElapsedString(past)
{
    var elapsed = new Date().getTime() / 1000 - past / 1000;

    if (elapsed < 1)
    {
        return '0 seconds';
    }

    var replacement = { };
    replacement[12 * 30 * 24 * 60 * 60] = 'year';
    replacement[30 * 24 * 60 * 60] = 'month';
    replacement[24 * 60 * 60] = 'day';
    replacement[60 * 60] = 'hour';
    replacement[60] = 'minute';
    replacement[1] = 'second';

    for (var s in replacement)
    {
        var $d = elapsed / s;
        if ($d >= 1)
        {
            var $r = Math.round($d);
            return $r + ' ' + replacement[s] + ($r > 1 ? 's' : '') + ' ago';
        }
    }
}

setTimeout(function () {
    if (sensor.initialize()) {
        console.log('temperature and humidity sensor initialized');
        sensor.read();
    } else {
        console.warn('Failed to initialize sensor');
    }
}, 1000);

Math.median = function (values) {

    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
};

var sensor = {
    initialize: function() {
        console.log('initializing temperature and humidity sensor');
        return sensorLib.initialize(22, gpio);
    },
    read: function() {
        var readout = sensorLib.read();
        var f = (9.0 / 5) * readout.temperature + 32;
        var now = new Date();

        // something went wrong reading the sensor, bit in the wrong position
        if(readout.humidity > .1)
        {
            seconds[seconds.length] = readout.humidity.toFixed(2);
            temps[temps.length] = readout.temperature.toFixed(2);
            storage.setItem('temp1', {
                timestamp: now.getTime(),
                celsius: readout.temperature.toFixed(2),
                fahrenheit: f.toFixed(2),
                humidity: readout.humidity.toFixed(2)
            });
        }

        // check for emergency condition awesomeness
        // get the median of the minute
        if(now.getTime() - secondsTimestamp > 60 * 1000)
        {
            var median = Math.median(seconds);
            var medianTemps = Math.median(temps);
            seconds = [];

            // store minute save a days worth
            minutes[secondsTimestamp] = median;
            savedTemps[secondsTimestamp] = medianTemps;
            storage.setItem('emergency-shutoff-minutes', {
                timestamp: minuteTimestamp,
                minutes: minutes,
                temps: savedTemps
            });

            // restart seconds timer since last update
            secondsTimestamp = now.getTime();
        }

        // run water count if it has been longer than a minute
        var emergency = false;
        if(now.getTime() - minuteTimestamp  > 60 * 1000)
        {
            var count = 0;
            var hourAverages = {};
            for(var m in minutes)
            {
                // if m is more than 24 hours ago, store it
                var h = Math.floor((now.getTime() - m) / 60 * 60 * 1000) * 60 * 60 * 1000;
                if(h > 24 * 60 * 60 * 1000)
                {
                    if(typeof hourAverages[h] == 'undefined')
                        hourAverages[h] = [];
                    hourAverages[h][hourAverages[h].length] = {hum: minutes[m], temp: savedTemps[m] || 0}
                }

                // check humidity readings within the last hour
                if(now.getTime() - m < safetyTimespan * 1000 &&
                    parseFloat(minutes[m]) > maxHumidity)
                {
                    count++;
                    // if at least 15 minutes in the hour are over 65%
                    if(count >= maxMinutes)
                    {
                        console.log('Emergency water shut-off');
                        emergency = true;
                    }
                }
            }

            // get the averages for hour temperature readings and save
            var save = false;
            for(var t in hourAverages)
            {
                savedHours[t] = {
                    humidity: Math.median(hourAverages[t].map(function (x) {return x.hum; }).get()),
                    temperature: Math.median(hourAverages[t].map(function (x) {return x.temp; }).get())
                };
                save = true;
            }
            if(save)
                storage.setItem('water-hours', savedHours);

            // log the current temperature
            var temp1 = storage.getItem('temp1');
            console.log('Emergency wet detector: ' + count + ' minutes, ' +
                'Fahrenheit: ' + (temp1.fahrenheit || 0) + 'F, ' +
                'Celsius: ' + (temp1.celsius || 0) + 'C, ' +
                'Humidity: ' + (temp1.humidity || 0) + '%, ' +
                'Last updated: ' + timeElapsedString(temp1.timestamp || 0));

            minuteTimestamp = now.getTime();
        }

        // trigger off and write piface
        if(emergency || !safetyEnabled)
        {
            // only emit on startup when we have a valid reading from the last minute
            if(emergency || seconds.length > 0)
                if(process.emit('flooding', !safetyEnabled))
                    safetyEnabled = true;

            // if safety was enabled, allow water works to be turned on
            if(safetyEnabled && !emergency)
            {
                process.emit('flood-safety');
            }
        }

        // run again in 1.5 seconds
        setTimeout(function() {
            sensor.read();
        }, 1500);
    }
};
