/* global Imbo */
(function($) {
    'use strict';

    $('.host').text(window.location.hostname);

    var form = $('#imbo-setup'), client;
    try {
        new Imbo.Client('', '', '');
    } catch (e) {
        return form.html('<h2>Sorry! ' + e.message + ' :-(</h2>');
    }

    var supportsLocalStorage = function() {
        try {
            return 'localStorage' in window;
        } catch (e) {
            return false;
        }
    };

    if (supportsLocalStorage()) {
        $('.checkbox.remember').removeClass('hidden');
    }

    form.find('[name="url"]').val(window.location.protocol + '//');
    form.on('submit', function(e) {
        e.preventDefault();

        var url     = this.url.value;
        var pubkey  = this.pubkey.value;
        var privkey = this.privkey.value;

        // Save the settings to localstorage (if user has agreed)
        if (this.remember.checked && supportsLocalStorage()) {
            localStorage.url = url || window.location.protocol + '//';
            localStorage.pubkey = pubkey;
            localStorage.privkey = privkey;
        }

        client = new Imbo.Client(url, pubkey, privkey);
        form.addClass('hidden');
        $('#imbo-demo').removeClass('hidden');
    });

    // Load settings from localstorage (if supported)
    if (supportsLocalStorage()) {
        var el = form.get(0);
        el.url.value = localStorage.url || window.location.protocol + '//';
        el.pubkey.value = localStorage.pubkey || '';
        el.privkey.value = localStorage.privkey || '';
    }

    // Set up some DOM-elements
    var bar, progress, active, urlOutput = $('#url');

    // Demonstrating the URL helper
    var updateUrl = function(org) {
        var url = decodeURIComponent(org.toString());
        urlOutput.empty().attr('href', url);

        url = url.replace(/.*?\/users\//g, '/users/');
        url = url.replace(/Token=(.{10}).*/g, 'Token=$1...');

        var parts  = url.split('?'), param;
        var params = parts[1].replace(/t\[\]=maxSize.*?&/g, '').split('&');

        // Base url
        $('<div />').text(parts[0]).appendTo(urlOutput);
        for (var i = 0, prefix; i < params.length; i++) {
            prefix = i > 0 ? '&' : '?';

            parts = params[i].split(/t\[\]=/);
            param = prefix + parts[0];
            if (parts.length > 1) {
                var args = [], trans = parts[1].split(':');
                param = prefix + 't[]=<span class="transformation">' + trans[0] + '</span>';

                if (trans.length > 1) {
                    trans[1].split(',').forEach(function(item) {
                        var c = item.split('='), x = '';
                        x += '<span class="param">' + c[0] + '</span>=';
                        x += '<span class="value">' + c[1] + '</span>';
                        args.push(x);
                    });
                    param += ':' + args.join(',');
                }
            }

            param = param.replace(/(.*?=)/, '<strong>$1</strong>');
            $('<div />').html(param).appendTo(urlOutput);
        }
    };

    // Callback for when the image is uploaded
    var onImageUploaded = function(err, imageIdentifier, res) {
        // Remove progress bar
        bar.css('width', '100%');
        progress.animate({ opacity: 0}, {
            duration: 1000,
            complete: function() { $(this).remove(); }
        });

        // Check for any XHR errors (200 means image already exists)
        if (err && res && res.headers['X-Imbo-Error-Internalcode'] !== 200) {
            if (err === 'Signature mismatch') {
                err += ' (probably incorrect private key)';
            }

            return window.alert(err);
        }

        // Build an Imbo-url
        var result = $('#result').removeClass('hidden');
        var url = client.getImageUrl(imageIdentifier);
        $('#image-identifier').text(imageIdentifier).attr('href', url.toString());
        result.find('img').attr('src', url.maxSize({ width: result.width() }).toString());
        updateUrl(url);

        if (!active) {
            $('#controls [data-transformation="border"]').on('click', function() {
                url.border({ color: 'bf1942', width: 5, height: 5 });
            });

            $('#controls button').on('click', function() {
                var el = $(this),
                    transformation = el.data('transformation'),
                    args = el.data('args'),
                    pass = args ? (args + '').split(',') : [];

                url[transformation].apply(url, pass);

                if (transformation === 'reset') {
                    url.maxSize({ width: result.width() });
                }

                updateUrl(url);

                result.find('img').attr('src', url.toString());
            });
        }
    };

    // Callback for progress handling
    var onProgress = function(e) {
        if (!e.lengthComputable) {
            return;
        }

        bar.css('width', ((e.loaded / e.total) * 100) + '%');
    };

    $('#file-picker').on('change', function(e) {
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }

        bar = $('<div class="bar">').css('width', 0);
        progress = $('<div class="progress" />').append(bar);
        $('#file-picker').after(progress);

        client.addImage(files[0], {
            onComplete: onImageUploaded,
            onProgress: onProgress
        });
    });

    $('button.back').on('click', function() {
        $('#imbo-setup, #imbo-demo').toggleClass('hidden');
    });

})(window.Zepto || window.jQuery);
