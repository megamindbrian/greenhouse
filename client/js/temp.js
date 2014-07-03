jQuery(document).ready(function () {


    jQuery(document).on('plugins', function (evt, data) {
        jQuery('#temperature strong').replaceWith('<strong>' + data.temp1.celsius + '&deg;C<sub> / ' + data.temp1.fahrenheit + '&deg;F</sub></strong>');
        jQuery('#humidity strong').replaceWith('<strong>' + data.temp1.humidity + '%</strong>');
        jQuery('#temperature small').replaceWith('<small>Last updated: ' + (new Date(data.temp1.timestamp)) + '</small>');
        jQuery('#humidity small').replaceWith('<small>Last updated: ' + (new Date(data.temp1.timestamp)) + '</small>');
    });

});
