var pfio = require('piface-node');
var prev_state = 0, prev_prev_state = 0;

// Watch for Ctrl+C
process.on('closing', stopListening);

// Main busy loop uses setTimeout internally, rather than setInterval.  It was because I had
// different delays in different cases, but I don't think it really matters a whole lot either
// way.
function startListening() {
    console.log('starting input listener');
    pfio.init();
    watchInputs();
    process.emit('pfio', pfio);
    console.log('inputs enabled');
}

function stopListening() {
    pfio.deinit();
}

// Watches for state changes
function watchInputs() {
    var state;
    state = pfio.read_input();

    // for some reason the input is picking up interference and grounding itself, so we added prev_prev_state to
    // require at least 100 milliseconds of switch activation
    if (state !== prev_state || state != prev_prev_state) {
        process.emit('pfio.inputs.changed', state, prev_state, prev_prev_state);
        prev_prev_state = prev_state;
        prev_state = state;
    }
    setTimeout(watchInputs, 100);
}

// Breaks up the inputs.changed event into individual pin events input.changed.
process.on('pfio.inputs.changed', function(state, prev_state, prev_prev_state) {
    var changed = (state ^ prev_prev_state) & (prev_state ^ prev_prev_state);
    for (var pin = 0; pin < 8; pin++) {
        if ((changed & (1 << pin)) === (1 << pin)) {
            process.emit('pfio.input.changed', pin, ((state & (1 << pin)) === (1 << pin)));
        }
    }
});

// TODO: enable plugins based on settings
require('./water-switch.js');

// give modules enough time to register
setTimeout(startListening, 1000);


