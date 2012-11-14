(function($) {

    var form = $('#imbo-setup'), client;
    var hasXhr2 = window.XMLHttpRequest && ('upload' in new XMLHttpRequest());
    if (!hasXhr2) {
        return form.html('<h2>Sorry, your browser does not support XMLHttpRequest2 :-(</h2>');
    }

    var supportsLocalStorage = function() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    form.on('submit', function(e) {
        e.preventDefault();

        var url     = this.url.value;
        var pubkey  = this.pubkey.value;
        var privkey = this.privkey.value;

        // Save the settings to localstorage (if user has agreed)
        if (this.remember.checked && supportsLocalStorage()) {
            localStorage['url'] = url;
            localStorage['pubkey'] = pubkey;
            localStorage['privkey'] = privkey;
        }

        client = new Imbo.Client(url, pubkey, privkey);
        form.addClass('hidden');
        $('#imbo-demo').removeClass('hidden');
    });

    // Load settings from localstorage (if supported)
    if (supportsLocalStorage()) {
        var el = form.get(0);
        el.url.value = localStorage['url'] || '';
        el.pubkey.value = localStorage['pubkey'] || '';
        el.privkey.value = localStorage['privkey'] || '';
    }

    $('#file-picker').on('change', function(e) {
        var progress = $('<progress />').attr({
            max: 100,
            value: 0
        });
        $('#file-picker').after(progress);

        var files = e.target.files || e.dataTransfer.files;
        var file = files[0];
        console.log(file, typeof file, file.constructor.name);

        var reader = new FileReader();
        reader.onload = function(e) {
            console.log(e, e.target.result, e.target.result.constructor.name);
            /*imbo.addImage(e.target.result, {
                requestComplete: function(res) {
                    var success = $('<h3 />').text('Done! Image identifier: ' + res.imageIdentifier);
                    progress.replaceWith(success);
                    var url = imbo.getImageUrl(res.imageIdentifier).maxSize(200, 200);
                    var img = $('<img />').attr('src', url.toString());
                    img.insertAfter(success);
                    var theImg = $('#theImage').attr('src', url.toString());

                    url.reset();
                    imbo.url = url;
                    imbo.img = theImg;
                },
                progress: function(e) {
                    if (!e.lengthComputable) { return; }
                    var percentage = Math.round((e.loaded * 100) / e.total);
                    progress.attr('value', percentage);
                }
            });
*/
        };
        reader.readAsBinaryString(file);

    });

})(Zepto);