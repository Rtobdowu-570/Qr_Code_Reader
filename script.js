// UI class to manage DOM interactions
    class UI {
        static switchTab(selectedTab) {
            const tabs = document.querySelectorAll('.tab-button');
            const tab_contents = document.querySelectorAll('.tab-content');

            const tabArray = Array.from(tabs);
            const tabIndex = tabArray.indexOf(selectedTab);

            // if a selected tab has the active class, do nothing
            if (selectedTab.classList.contains('active')) {
                return;
            }

            // remove active class from current tab and content
            const currentTab = document.querySelector('.tab-button.active');
            const currentContent = document.querySelector('.tab-content.active');
            if (currentTab) currentTab.classList.remove('active');
            if (currentContent) currentContent.classList.remove('active');

            // add active class to selected tab and corresponding content
            selectedTab.classList.add('active');
            if (tab_contents[tabIndex]) {
                tab_contents[tabIndex].classList.add('active')
            } else {
                console.error('Tab content not found for index:', tabIndex);
            }
        }

        static alert_msg(ElementID, message, type) {

        // Get elements id 
        // Error id
        const generate_error = document.getElementById('generateError');
        const scan_error = document.getElementById('scanError');
        
        // Success id
        const generate_success = document.getElementById('generateSuccess');
        const scan_success = document.getElementById('scanSuccess');

        // message span id
        const generate_error_text = document.getElementById('ErrorText');
        const scan_error_text = document.getElementById('scanErrorText');
        const generate_success_text = document.getElementById('SuccessText');
        const scan_success_text = document.getElementById('scanSuccessText');

        if (type === 'error') {
            if (ElementID === 'generate-error') {
                generate_error_text.textContent = message;
                generate_error.classList.add('show');
                setTimeout(() => {
                    generate_error.classList.remove('show');
                }, 3000);
            } else if (ElementID === 'scan-error') {
                scan_error_text.textContent = message;
                scan_error.classList.add('show');
                setTimeout(() => {
                    scan_error.classList.remove('show');
                }, 3000);
            }
        } else if (type === 'success') {
            if (ElementID === 'generate-success') {
                generate_success_text.textContent = message;
                generate_success.classList.add('show');
                setTimeout(() => {
                    generate_success.classList.remove('show');
                }, 3000);
            } else if (ElementID === 'scan-success') {
                scan_success_text.textContent = message;
                scan_success.classList.add('show');
                setTimeout(() => {
                    scan_success.classList.remove('show');
                }, 2000);
            }
        }
        }

        static copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                UI.alert_msg('scan-success', 'QR Code data copied to clipboard!', 'success');
            }, () => {
                UI.alert_msg('scan-error', 'Failed to copy to clipboard', 'error');
            });
        }

        static clear_generated_image() {
            const preview = document.querySelector('.qr-code-display');
            preview.innerHTML = '<div class="preview-placeholder">Your QR code will appear here</div>';
        }
}

class Utils {  
     // Validate url format and text length
        static validateInput(data) {
        const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
        
        if (data.length === 0) {
            return { valid: false, message: 'Input cannot be empty' };
        }
        if (data.length > 2593) {
            return { valid: false, message: 'Input exceeds maximum length of 2593 characters' };
        }
        if (urlPattern.test(data) || data.length <= 100) {
            return { valid: true };
        }
        return { valid: false, message: 'Invalid URL format or too long text' };
    }


        // Download generated QR code image
        static downloadImage(dataUrl, filename) {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
}

class QrCodeGenerator { 
    constructor() {
        this.scanner = null;
    }

           // Validate size
        generate(size) 
        {if (size < 100 || size > 1000) {
            UI.alert_msg('generate-error', 'Invalid size. Must be between 100 and 1000', 'error');
            return;
        }

        const userInput = document.getElementById('qrInput').value.trim();
        const validate = Utils.validateInput(userInput);

        if (!validate.valid) {
            UI.alert_msg('generate-error', validate.message, 'error');
            return;
        }

        try {
            const container = document.querySelector('.qr-code-display');
            if (!container) {
                UI.alert_msg('generate-error', 'QR code container not found', 'error');
                return;
            }
            
            // Clear and create a fresh div for QRCode
            container.innerHTML = '';
            const qrDiv = document.createElement('div');
            container.appendChild(qrDiv);
            
            new QRCode(qrDiv, {
                text: userInput,
                width: size,
                height: size,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            UI.alert_msg('generate-success', 'QR-Code generated successfully', 'success');
        } catch (error) {
            UI.alert_msg('generate-error', `Failed to generate QR code: ${error.message}`, 'error');
        }
    }


    // Scan QR code from uploaded file
     scanFile(file) {
        if (!file) {
            UI.alert_msg('scan-error', 'Please select a file first', 'error');
            return;
        }

        const html5QrCode = new Html5Qrcode("reader");
        const scanResult = document.getElementById('scanResult');

        html5QrCode.scanFile(file, true)
            .then(decodedText => {
                scanResult.value = decodedText;
                UI.alert_msg('scan-success', 'QR Code scanned successfully!', 'success');
            })
            .catch(err => {
                UI.alert_msg('scan-error', `Failed to scan QR code: ${err}`, 'error');
            });
    }

    scanCamera() {
        if (this.scanner) {
            this.scanner.stop();
        }

        this.scanner = new Html5Qrcode("reader", { fps: 10, qrbox: 250 });
        const scanResult = document.getElementById('scanResult');

        this.scanner.start(
            { facingMode: "environment" },
            {
                successCallback: (decodedText) => {
                    scanResult.textContent = decodedText;
                    UI.copyToClipboard(decodedText);
                    UI.alert_msg('scan-success', 'QR Code data copied to clipboard!', 'success');
                },
                errorCallback: (errorMessage) => {
                    UI.alert_msg('scan-error', 'Scanning error: ' + errorMessage, 'error');
                }
            }
        ).catch(err => {
            UI.alert_msg('scan-error', `Failed to start scanner: ${err.message}`, 'error');
        });
    }

    stopScanning() {
        if (this.scanner) {
            this.scanner.stop().catch(err => {
                console.error('Failed to stop scanner:', err);
            });
            this.scanner = null;
        }
    }
}

const qrCodeGenerator = new QrCodeGenerator();

// Event listeners 
// Tab button 
const tabs = document.querySelectorAll('.tab-button');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        UI.switchTab(tab);
    });
});

// Generate button 
const generate = document.getElementById('generateBtn');
generate.addEventListener('click', () => {
    UI.clear_generated_image();
    const size = 200;
    qrCodeGenerator.generate(size);
});


// Download button 
const download = document.getElementById('downloadBtn');
download.addEventListener('click', () => {
    const canvas = document.querySelector('.qr-code-display canvas');
    if (!canvas) {
        UI.alert_msg('generate-error', 'No QR code to download', 'error');
        return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const filename = 'qr-code.png';
    Utils.downloadImage(dataUrl, filename);
});

// Clear generate button 
const clear = document.getElementById('clearGenerate');
clear.addEventListener('click', () => {
    UI.clear_generated_image();
    const preview = document.querySelector('.qr-code-display');
    preview.innerHTML = '<div class="preview-placeholder">Your QR code will appear here</div>';
    document.getElementById('qrInput').value = '';
});

// Scan button 
const scan = document.getElementById('scanBtn');
scan.addEventListener('click', () => {
    const fileInput = document.getElementById('qrFile');
    const file = fileInput.files[0];
    
    if (file) {
        // Scan uploaded file
        qrCodeGenerator.scanFile(file);
    } else {
        // Use camera
        if(qrCodeGenerator.scanner) {
            qrCodeGenerator.stopScanning();
        } else {
            qrCodeGenerator.scanCamera();
        }
    }
});


// Copy scan result
const copyResult = document.getElementById('resultBtn');
copyResult.addEventListener('click', () => {
    const scanResult = document.getElementById('scanResult').value;
    if (scanResult) {
        UI.copyToClipboard(scanResult);
    } else {
        UI.alert_msg('scan-error', 'No result to copy', 'error');
    }
});

// Clear scan result
const clearScan = document.getElementById('clearScan');
clearScan.addEventListener('click', () => {
    document.getElementById('scanResult').value = '';
    qrCodeGenerator.stopScanning();
    const reader = document.getElementById('reader');
    reader.innerHTML = '';

});