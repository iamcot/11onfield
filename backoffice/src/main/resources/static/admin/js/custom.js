// Custom JavaScript for 11of Admin

$(document).ready(function() {
    console.log('11of Admin initialized');

    // Initialize TinyMCE for textareas with class 'tinymce'
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: 'textarea.tinymce',
            height: 400,
            menubar: false,
            plugins: 'lists link code image',
            toolbar: 'undo redo | formatselect | bold italic underline | bullist numlist | link image code',
            branding: false,
            promotion: false,
            // Image upload configuration
            images_upload_url: '/admin/events/upload-image',
            automatic_uploads: true,
            images_reuse_filename: false,
            // Image upload handler - must return a Promise
            images_upload_handler: function(blobInfo, progress) {
                return new Promise(function(resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.withCredentials = false;
                    xhr.open('POST', '/admin/events/upload-image');

                    xhr.upload.onprogress = function(e) {
                        progress(e.loaded / e.total * 100);
                    };

                    xhr.onload = function() {
                        if (xhr.status === 403) {
                            reject({ message: 'HTTP Error: ' + xhr.status, remove: true });
                            return;
                        }

                        if (xhr.status < 200 || xhr.status >= 300) {
                            reject('HTTP Error: ' + xhr.status);
                            return;
                        }

                        var json = JSON.parse(xhr.responseText);

                        if (!json || typeof json.location !== 'string') {
                            reject('Invalid JSON: ' + xhr.responseText);
                            return;
                        }

                        resolve(json.location);
                    };

                    xhr.onerror = function() {
                        reject('Image upload failed due to a XHR Transport error. Code: ' + xhr.status);
                    };

                    var formData = new FormData();
                    formData.append('file', blobInfo.blob(), blobInfo.filename());

                    xhr.send(formData);
                });
            }
        });
        console.log('TinyMCE initialized');
    }

    // Add confirmation for delete buttons
    $('.btn-danger').on('click', function(e) {
        if ($(this).find('.fa-trash').length > 0) {
            if (!confirm('Bạn có chắc chắn muốn xóa?')) {
                e.preventDefault();
            }
        }
    });

    // Auto-hide alerts after 5 seconds
    setTimeout(function() {
        $('.alert').fadeOut('slow');
    }, 5000);
});
