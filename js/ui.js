// ============================================
// Echo Scribe — UI Utilities
// Toast notifications, loading, copy, download
// ============================================

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success' | 'error' | 'warning'} type
 * @param {number} duration - ms before auto-dismiss
 */
export function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✕', warning: '⚠' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

/**
 * Show loading skeleton in the output area.
 */
export function showLoading() {
    const skeleton = document.getElementById('skeleton-loader');
    const outputContent = document.getElementById('output-content');
    if (skeleton) skeleton.classList.add('active');
    if (outputContent) outputContent.style.display = 'none';
}

/**
 * Hide loading skeleton.
 */
export function hideLoading() {
    const skeleton = document.getElementById('skeleton-loader');
    const outputContent = document.getElementById('output-content');
    if (skeleton) skeleton.classList.remove('active');
    if (outputContent) outputContent.style.display = '';
}

/**
 * Render markdown to HTML using the marked library.
 * @param {string} markdown
 */
export function renderOutput(markdown) {
    const outputContent = document.getElementById('output-content');
    if (!outputContent) return;

    // @ts-ignore - marked is loaded via CDN
    if (typeof marked !== 'undefined') {
        outputContent.innerHTML = marked.parse(markdown);
    } else {
        // Fallback: render as plain text with basic formatting
        outputContent.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(markdown)}</pre>`;
    }
    outputContent.classList.remove('empty');

    // Store raw markdown for copy/export
    outputContent.dataset.rawMarkdown = markdown;
}

/**
 * Clear the output panel.
 */
export function clearOutput() {
    const outputContent = document.getElementById('output-content');
    if (!outputContent) return;
    outputContent.innerHTML = '<span>O documento processado aparecerá aqui...</span>';
    outputContent.classList.add('empty');
    outputContent.dataset.rawMarkdown = '';
}

/**
 * Copy the raw markdown output to clipboard.
 */
export async function copyToClipboard() {
    const outputContent = document.getElementById('output-content');
    const raw = outputContent?.dataset?.rawMarkdown;

    if (!raw) {
        showToast('Nenhum conteúdo para copiar.', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(raw);
        showToast('Conteúdo copiado para a área de transferência!', 'success');
    } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = raw;
        textarea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Conteúdo copiado!', 'success');
    }
}

/**
 * Download the output as a .md file.
 */
export function downloadMarkdown() {
    const outputContent = document.getElementById('output-content');
    const raw = outputContent?.dataset?.rawMarkdown;

    if (!raw) {
        showToast('Nenhum conteúdo para baixar.', 'warning');
        return;
    }

    const blob = new Blob([raw], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `echo-scribe-${timestamp}.md`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Arquivo "${filename}" baixado com sucesso!`, 'success');
}

/**
 * Escape HTML entities.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Update character count display.
 * @param {HTMLTextAreaElement} textarea
 * @param {HTMLElement} countEl
 */
export function updateCharCount(textarea, countEl) {
    if (!textarea || !countEl) return;
    const len = textarea.value.length;
    countEl.textContent = `${len.toLocaleString('pt-BR')} caracteres`;
}
