/**
 * Created by Brian Cullinan on 6/29/14.
 */

jQuery(document).ready(function () {
   jQuery('#water-status').on('change', 'input[type="radio"]', function () {
       jQuery.ajax({
           url: '/pin/' + jQuery(this).attr('name').substring(4) + '/' + jQuery(this).val(),
           type: 'GET',
           dataType: 'json',
           success: function ()
           {

           }
       })
   });

    jQuery(document).on('plugins', function (evt, data) {
        for(var i = 0; i < 8; i++)
            if(data.water['pin-' + i])
                jQuery('#water-status input[name="pin-' + i + '"][value="on"]').prop('checked', true);
            else
                jQuery('#water-status input[name="pin-' + i + '"][value="off"]').prop('checked', true);
    });

});
