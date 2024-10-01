$(document).ready(function () {
    console.log("Document is ready. Initializing file upload system.");
    initFileUpload();
});

function initFileUpload() {
    let certificateFile = null;
    let resumeFile = null;

    $('#certificateInput').on('change', function () {
        handleSingleFileChange(this, 'certificate', function(file) {
            certificateFile = file;
        });
    });

    $('#resumeInput').on('change', function () {
        handleSingleFileChange(this, 'resume', function(file) {
            resumeFile = file;
        });
    });

    $('.custom-file-label').on('click', function (event) {
        event.preventDefault();
        const inputId = $(this).attr('for');
        $('#' + inputId).click();
    });

    $('#submitBtn').on('click', function () {
        submitFiles(certificateFile, resumeFile);
    });
}

function handleSingleFileChange(input, type, callback) {
    const files = input.files;
    if (files.length > 0) {
        const file = files[0]; // Only one file allowed
        callback(file); // Pass the file to the callback function
        displaySingleFile(type, file);
    }
    input.value = ''; // Reset input to avoid re-triggering
}

function displaySingleFile(type, file) {
    const fileList = type === 'certificate' ? $('#certificateFileList') : $('#resumeFileList');
    fileList.empty(); // Clear the current list
    const fileItem = $('<span></span>').text(`${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    fileList.append(fileItem);

    // Hide error message if files are present
    if (file) {
        $(`#${type}Error`).hide();
    }
}

function validateFiles(certificateFile, resumeFile) {
    let valid = true;
    if (!certificateFile) {
        $('#certificateError').show();
        valid = false;
    } else {
        $('#certificateError').hide();
    }
    if (!resumeFile) {
        $('#resumeError').show();
        valid = false;
    } else {
        $('#resumeError').hide();
    }
    return valid; // Return validation result
}

function submitFiles(certificateFile, resumeFile) {
    if (!validateFiles(certificateFile, resumeFile)) return; // Validate files before proceeding

    const userID = "{{ user.id }}";  // Liquid code to get the current user's ID
    const _url = "/_api/cloudflow/v1.0/trigger/{Here replace your Power Automate trigger url. You can obtain this link from Power Pages > Setup > Cloud flows > Copy the Power Automate link}"; // Replace with your actual API URL

    // Convert files to base64 strings
    Promise.all([
        getFileBase64(certificateFile),
        getFileBase64(resumeFile)
    ]).then(function ([certificateContent, resumeContent]) {
        const data1 = {
            CertificateFileName: certificateFile.name,  // Append certificate file name
            ResumeFileName: resumeFile.name,  // Append resume file name
            PortalUserId: userID,  // Append user ID
            CertificateContent: certificateContent,  // Append base64-encoded certificate content
            ResumeContent: resumeContent  // Append base64-encoded resume content
        };

        var data = {};
        data["FileUploadDetails"] = "test";

        var payload = {};
        payload.eventData = JSON.stringify(data1);

        // Sending the data via AJAX
        shell.ajaxSafePost({
            type: "POST",
            url: _url,
            data: JSON.stringify(payload),  // Send data as JSON
            contentType: 'application/json',  // Set content type to JSON
            processData: false,
            global: false,
        })
        .done(function (response) {
            alert('Files uploaded successfully!');
            console.log(response);
            // Clear the display after successful upload
            $('#certificateFileList').empty();
            $('#resumeFileList').empty();
        })
        .fail(function (error) {
            console.error('Error uploading files:', error);
            alert('Error uploading files.');
        });
    }).catch(function (error) {
        console.error('Error reading file:', error);
        alert('Error reading file.');
    });
}

// Function to convert file to base64
function getFileBase64(file) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();
        reader.onload = function () {
            resolve(reader.result.split(',')[1]); // Extract base64 content without metadata
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(file);  // Read file as Data URL (base64 encoding)
    });
}
