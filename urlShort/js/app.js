/**
 * URL Shortener Application Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    // is.gd OpenAPI (CORS enabled, no API key required)
    const API_ENDPOINT = 'https://is.gd/create.php';
    const FALLBACK_ENDPOINT = 'https://v.gd/create.php';

    // DOM Elements
    const form = document.getElementById('shortenForm');
    const longUrl = document.getElementById('longUrl');
    const btnClear = document.getElementById('btnClear');
    const btnShorten = document.getElementById('btnShorten');
    const btnCopy = document.getElementById('btnCopy');
    const shortUrl = document.getElementById('shortUrl');
    const outputWrapper = document.querySelector('.output-wrapper');
    const inputWrapper = document.getElementById('inputWrapper');
    const formMessage = document.getElementById('formMessage');
    const toastContainer = document.getElementById('toastContainer');

    let isLoading = false;
    let hasResult = false;
    let requestToken = 0;

    initEvents();
    updateShortenButton();

    function initEvents() {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleShorten();
        });

        longUrl.addEventListener('input', () => {
            requestToken++;
            btnClear.classList.toggle('visible', longUrl.value.length > 0);
            updateShortenButton();
            resetResult();
            clearMessage();
        });

        longUrl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (!btnShorten.disabled) handleShorten();
            }
        });

        btnClear.addEventListener('click', () => {
            longUrl.value = '';
            btnClear.classList.remove('visible');
            updateShortenButton();
            resetResult();
            clearMessage();
            longUrl.focus();
        });

        btnCopy.addEventListener('click', copyShortUrl);
    }

    /**
     * Enable "단축하기" only when the input has non-whitespace content
     */
    function updateShortenButton() {
        const isEmpty = longUrl.value.trim().length === 0;
        btnShorten.disabled = isEmpty || isLoading;
    }

    function setLoading(state) {
        isLoading = state;
        btnShorten.classList.toggle('is-loading', state);
        btnShorten.querySelector('.btn-shorten-label').textContent = state ? '단축 중...' : '단축하기';
        updateShortenButton();
    }

    function resetResult() {
        if (!hasResult) return;
        hasResult = false;
        shortUrl.value = '';
        btnCopy.disabled = true;
        outputWrapper.classList.remove('has-result');
    }

    function applyResult(url) {
        hasResult = true;
        shortUrl.value = url;
        btnCopy.disabled = false;
        outputWrapper.classList.add('has-result');
    }

    function setMessage(text) {
        formMessage.textContent = text;
    }

    function clearMessage() {
        formMessage.textContent = '';
    }

    function shakeInput() {
        inputWrapper.classList.remove('shake');
        void inputWrapper.offsetWidth;
        inputWrapper.classList.add('shake');
        setTimeout(() => inputWrapper.classList.remove('shake'), 450);
    }

    /**
     * Normalize user input: add https:// when scheme is missing
     */
    function normalizeUrl(raw) {
        const value = raw.trim();
        if (!value) return null;
        if (/^https?:\/\//i.test(value)) return value;
        if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return value;
        return 'https://' + value;
    }

    function isValidUrl(value) {
        try {
            const parsed = new URL(value);
            if (!/^https?:$/.test(parsed.protocol)) return false;
            return Boolean(parsed.hostname) && parsed.hostname.includes('.');
        } catch (err) {
            return false;
        }
    }

    /**
     * Request the OpenAPI and print the short link into the result box
     */
    async function handleShorten() {
        if (isLoading) return;

        const target = normalizeUrl(longUrl.value);

        if (!target) {
            shakeInput();
            setMessage('단축할 URL을 입력해 주세요.');
            longUrl.focus();
            return;
        }

        if (!isValidUrl(target)) {
            shakeInput();
            setMessage('올바른 URL 형식이 아닙니다. 예: https://example.com');
            longUrl.focus();
            return;
        }

        clearMessage();
        resetResult();
        setLoading(true);

        const token = ++requestToken;

        try {
            const shortLink = await requestShortUrl(API_ENDPOINT, target);
            if (token !== requestToken) return;
            applyResult(shortLink);
            showToast('🔗 URL이 단축되었습니다.');
        } catch (error) {
            if (error.code === 'network') {
                try {
                    const shortLink = await requestShortUrl(FALLBACK_ENDPOINT, target);
                    if (token !== requestToken) return;
                    applyResult(shortLink);
                    showToast('🔗 URL이 단축되었습니다.');
                } catch (fallbackError) {
                    if (token !== requestToken) return;
                    handleError(fallbackError);
                }
            } else {
                if (token !== requestToken) return;
                handleError(error);
            }
        } finally {
            setLoading(false);
        }
    }

    function handleError(error) {
        if (error.code === 'network') {
            setMessage('서비스에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
        } else {
            setMessage(error.message || 'URL 단축에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        }
    }

    async function requestShortUrl(endpoint, target) {
        const requestUrl = `${endpoint}?format=json&url=${encodeURIComponent(target)}`;

        let response;
        try {
            response = await fetch(requestUrl);
        } catch (err) {
            const networkError = new Error('network');
            networkError.code = 'network';
            throw networkError;
        }

        if (!response.ok) {
            throw new Error(`요청에 실패했습니다. (HTTP ${response.status})`);
        }

        let data;
        try {
            data = await response.json();
        } catch (err) {
            throw new Error('서버 응답을 해석할 수 없습니다.');
        }

        if (data.errorcode) {
            throw new Error(data.errormessage || 'URL 단축에 실패했습니다.');
        }

        if (!data.shorturl) {
            throw new Error('단축된 URL을 받지 못했습니다.');
        }

        return data.shorturl;
    }

    /**
     * Copy result to clipboard and notify the user
     */
    function copyShortUrl() {
        const value = shortUrl.value;
        if (!value) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value)
                .then(() => showToast('복사하였습니다.'))
                .catch(() => fallbackCopy(value));
        } else {
            fallbackCopy(value);
        }
    }

    function fallbackCopy(text) {
        shortUrl.removeAttribute('readonly');
        shortUrl.select();
        shortUrl.setSelectionRange(0, text.length);

        let succeeded = false;
        try {
            succeeded = document.execCommand('copy');
        } catch (err) {
            succeeded = false;
        }

        shortUrl.setAttribute('readonly', 'readonly');
        window.getSelection().removeAllRanges();

        if (succeeded) {
            showToast('복사하였습니다.');
        } else {
            showToast('복사하지 못했습니다. 직접 선택해 주세요.');
        }
    }

    /**
     * Toast notification
     */
    function showToast(message) {
        Array.from(toastContainer.children).forEach((child) => child.remove());

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg class="toast-icon-success" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span></span>
        `;
        toast.querySelector('span').textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-leave');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3200);
    }
});
