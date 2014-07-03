var safetyEnabled = false;
var storage = require('node-persist');
storage.initSync({
    dir: '/home/greenhouse/persist'
});
var pfio;

process.on('listen', function (server) {
    server.on('connect', function (req, res) {
        var match;
        if((match = (/^\/pin\/([0-8])\/(on|off)/i).exec(req.url)) != null)
        {
            console.log('http-pin-' + parseInt(match[1]), match[2] == 'on');

            if(safetyEnabled)
            {
                if(match[2] == 'on')
                    pfio.digital_write(parseInt(match[1]),1);
                if(match[2] == 'off')
                    pfio.digital_write(parseInt(match[1]),0);
            }
            else
                console.log('Emergency shutoff system inactive - ignoring');
            storage.setItem('pin-' + parseInt(match[1]), match[2] == 'on');
            res.end();
        }
    });

    server.on('plugins', function (req, res) {
        res.data.water = {};
        for(var i = 0; i < 8; i++)
            res.data.water['pin-' + i] = storage.getItem('pin-' + i);
    });
});

process.on('flood-safety', function () {
    console.log('Emergency shutoff enabled - allowing water switch');
    safetyEnabled = true;
});

process.on('flooding', function (startup) {
    var result = false;
    for(var i = 0; i < 8; i++)
    {
        if(pfio != null)
        {
            pfio.digital_write(i, 0);
            // make sure we have a valid connection to piface
            result = true;
        }
        storage.setItem('pin-' + i, false);
        if(startup)
            console.log('input-' + i, false);
        else
            console.log('emergency-off-pin-' + i, false);
    }
    return true;
});

process.on('pfio', function (iface) {
    pfio = iface;
    process.on('pfio.input.changed', function(pin, state) {
        console.log('input-' + pin, state);
        storage.setItem('pin-' + pin, state);
        if(safetyEnabled)
            pfio.digital_write(pin, state);
        else
            console.log('Emergency shutoff system inactive - ignoring');
    });
});

