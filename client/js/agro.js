
(function($) {
    var updateInterval = 0;

    $(document).ready(function () {


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


    });

})(jQuery);


