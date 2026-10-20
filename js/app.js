/**
 * QR Code Studio Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.body;
    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const btnClearInput = document.getElementById('btnClearInput');
    const btnSubmit = document.getElementById('btnSubmit');
    const btnReset = document.getElementById('btnReset');
    const qrCard = document.getElementById('qrCard');
    const qrCanvasContainer = document.getElementById('qrCanvasContainer');
    const qrCardUrlText = document.getElementById('qrCardUrlText');
    const btnDownloadJpg = document.getElementById('btnDownloadJpg');
    const btnCopyUrl = document.getElementById('btnCopyUrl');
    const presetChips = document.getElementById('presetChips');
    const toastContainer = document.getElementById('toastContainer');
    const logoWrapper = document.getElementById('logoWrapper');

    let currentQRCode = null;
    let currentInputData = '';

    // Initialize Event Listeners
    initEvents();

    function initEvents() {
        // Form Submit
        urlForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleGenerate();
        });

        btnSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            handleGenerate();
        });

        // Input Changes
        urlInput.addEventListener('input', () => {
            toggleClearButton();
        });

        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleGenerate();
            }
        });

        // Clear Button
        btnClearInput.addEventListener('click', () => {
            urlInput.value = '';
            toggleClearButton();
            urlInput.focus();
        });

        // Preset Chips
        if (presetChips) {
            presetChips.addEventListener('click', (e) => {
                const chip = e.target.closest('.chip-item');
                if (chip && chip.dataset.url) {
                    urlInput.value = chip.dataset.url;
                    toggleClearButton();
                    handleGenerate();
                }
            });
        }

        // QR Code Card Click -> Download JPG
        qrCard.addEventListener('click', (e) => {
            triggerRipple(e);
            downloadJpg();
        });

        // QR Code Card Keyboard Enter / Space -> Download JPG
        qrCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                downloadJpg();
            }
        });

        // Action Buttons
        btnDownloadJpg.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadJpg();
        });

        btnCopyUrl.addEventListener('click', (e) => {
            e.stopPropagation();
            copyUrlToClipboard();
        });

        // Reset to initial state
        btnReset.addEventListener('click', () => {
            resetToInitialState();
        });

        // Logo click -> Reset
        logoWrapper.addEventListener('click', () => {
            resetToInitialState();
        });
    }

    /**
     * Handle QR Generation & Layout Transition
     */
    function handleGenerate() {
        let rawValue = urlInput.value.trim();

        if (!rawValue) {
            shakeInput();
            showToast('변환할 URL 또는 텍스트를 입력해주세요.', 'info');
            urlInput.focus();
            return;
        }

        // Auto format common domains (e.g. google.com -> https://google.com)
        const formattedValue = formatUrl(rawValue);
        currentInputData = formattedValue;

        // Generate QR Code
        renderQRCode(formattedValue);

        // Update URL preview text
        qrCardUrlText.textContent = formattedValue;
        qrCardUrlText.title = formattedValue;

        // Transition layout state: Center input slides to bottom, QR appears in center
        if (body.classList.contains('state-initial')) {
            body.classList.remove('state-initial');
            body.classList.add('state-generated');
            btnReset.style.display = 'inline-flex';
        } else {
            // Pulse QR card if already in generated state
            qrCard.classList.remove('pop-refresh');
            void qrCard.offsetWidth; // Trigger reflow
            qrCard.classList.add('pop-refresh');
        }

        showToast('✨ QR 코드가 생성되었습니다! 클릭하여 다운로드하세요.', 'success');
    }

    /**
     * Render QR Code into Canvas Container
     */
    function renderQRCode(text) {
        qrCanvasContainer.innerHTML = '';

        // Create high-res QRCode
        currentQRCode = new QRCode(qrCanvasContainer, {
            text: text,
            width: 320,
            height: 320,
            colorDark: '#0f172a',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
            quietZone: 2
        });
    }

    /**
     * Download QR Code as High-Quality JPG
     */
    function downloadJpg() {
        if (!currentInputData) {
            showToast('먼저 QR 코드를 생성해주세요.', 'info');
            return;
        }

        // Generate clean high-resolution JPG canvas (1000x1000 px)
        const exportSize = 1000;
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportSize;
        exportCanvas.height = exportSize;
        const ctx = exportCanvas.getContext('2d');

        // 1. Pure White Background (crucial for JPG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, exportSize, exportSize);

        // 2. Render QR onto high-res canvas with safe quiet zone
        const tempQrContainer = document.createElement('div');
        const tempQr = new QRCode(tempQrContainer, {
            text: currentInputData,
            width: 840,
            height: 840,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
            quietZone: 2
        });

        const tempCanvas = tempQrContainer.querySelector('canvas');
        if (tempCanvas) {
            const margin = 80;
            ctx.drawImage(tempCanvas, margin, margin, exportSize - margin * 2, exportSize - margin * 2);
        } else {
            // Fallback to currently rendered canvas
            const currentCanvas = qrCanvasContainer.querySelector('canvas');
            if (currentCanvas) {
                const margin = 80;
                ctx.drawImage(currentCanvas, margin, margin, exportSize - margin * 2, exportSize - margin * 2);
            }
        }

        // 3. Export to JPG data URL
        const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

        // 4. Filename generation
        const filename = generateFilename(currentInputData);

        // 5. Trigger download
        const downloadLink = document.createElement('a');
        downloadLink.download = filename;
        downloadLink.href = jpgDataUrl;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showToast(`📥 ${filename} 파일이 다운로드되었습니다!`, 'success');
    }

    /**
     * Copy URL to Clipboard
     */
    function copyUrlToClipboard() {
        if (!currentInputData) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentInputData).then(() => {
                showToast('📋 URL이 클립보드에 복사되었습니다.', 'success');
            }).catch(() => {
                fallbackCopyText(currentInputData);
            });
        } else {
            fallbackCopyText(currentInputData);
        }
    }

    function fallbackCopyText(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('📋 URL이 클립보드에 복사되었습니다.', 'success');
        } catch (err) {
            showToast('복사에 실패했습니다.', 'info');
        }
        document.body.removeChild(textarea);
    }

    /**
     * Reset to Initial Screen State
     */
    function resetToInitialState() {
        body.classList.remove('state-generated');
        body.classList.add('state-initial');
        btnReset.style.display = 'none';
        urlInput.value = '';
        currentInputData = '';
        toggleClearButton();
        setTimeout(() => {
            urlInput.focus();
        }, 100);
    }

    /**
     * Helper: Format URL
     */
    function formatUrl(str) {
        // If string starts with standard protocol or custom scheme, leave as is
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(str)) {
            return str;
        }

        // If it looks like a domain name (e.g. google.com, sub.domain.co.kr)
        if (/^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(str)) {
            return 'https://' + str;
        }

        return str;
    }

    /**
     * Helper: Generate clean filename for JPG
     */
    function generateFilename(input) {
        try {
            if (input.startsWith('http://') || input.startsWith('https://')) {
                const urlObj = new URL(input);
                const hostClean = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '_');
                return `${hostClean}_qrcode.jpg`;
            }
        } catch (e) {
            // Ignore URL parse error
        }

        const clean = input.slice(0, 15).replace(/[^a-zA-Z0-9가-힣]/g, '_');
        return `${clean || 'qr'}_qrcode.jpg`;
    }

    /**
     * Helper: Toggle Clear Button
     */
    function toggleClearButton() {
        if (urlInput.value.length > 0) {
            btnClearInput.classList.add('visible');
        } else {
            btnClearInput.classList.remove('visible');
        }
    }

    /**
     * Helper: Shake Input on Empty / Error
     */
    function shakeInput() {
        const wrapper = urlInput.closest('.input-inner-wrapper');
        if (!wrapper) return;
        wrapper.style.animation = 'none';
        void wrapper.offsetWidth;
        wrapper.style.animation = 'shake 0.4s ease-in-out';
        setTimeout(() => {
            wrapper.style.animation = '';
        }, 450);
    }

    /**
     * Helper: Trigger Tactile Ripple Effect on QR Card
     */
    function triggerRipple(e) {
        const overlay = document.getElementById('rippleOverlay');
        if (!overlay) return;
        qrCard.classList.remove('ripple-active');
        void qrCard.offsetWidth;
        qrCard.classList.add('ripple-active');
        setTimeout(() => {
            qrCard.classList.remove('ripple-active');
        }, 500);
    }

    /**
     * Helper: Toast Notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';

        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `
                <svg class="toast-icon-success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
        } else {
            iconSvg = `
                <svg class="toast-icon-info" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            `;
        }

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-leave');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3200);
    }
});
