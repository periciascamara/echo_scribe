// ============================================
// Echo Scribe — Main Application Entry Point
// ============================================

import { saveApiKey, getApiKey, clearApiKey, hasApiKey, validateApiKey, callGemini } from './api.js';
import { buildPrompt, TEMPLATES, TONES } from './prompts.js';
import { showToast, showLoading, hideLoading, renderOutput, clearOutput, copyToClipboard, downloadMarkdown, updateCharCount } from './ui.js';

// --- DOM References ---
/** @type {HTMLInputElement} */
let apiKeyInput;
/** @type {HTMLElement} */
let apiStatus;
/** @type {HTMLButtonElement} */
let apiSaveBtn;
/** @type {HTMLButtonElement} */
let apiDisconnectBtn;
/** @type {HTMLTextAreaElement} */
let inputTextarea;
/** @type {HTMLElement} */
let charCount;
/** @type {HTMLInputElement} */
let fileInput;
/** @type {HTMLSelectElement} */
let templateSelect;
/** @type {HTMLSelectElement} */
let toneSelect;
/** @type {HTMLButtonElement} */
let processBtn;
/** @type {HTMLButtonElement} */
let copyBtn;
/** @type {HTMLButtonElement} */
let downloadBtn;
/** @type {HTMLButtonElement} */
let clearBtn;

let isProcessing = false;

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    populateSelects();
    attachEventListeners();
    restoreApiKeyState();
});

function cacheElements() {
    apiKeyInput = document.getElementById('api-key-input');
    apiStatus = document.getElementById('api-status');
    apiSaveBtn = document.getElementById('api-save-btn');
    apiDisconnectBtn = document.getElementById('api-disconnect-btn');
    inputTextarea = document.getElementById('input-textarea');
    charCount = document.getElementById('char-count');
    fileInput = document.getElementById('file-input');
    templateSelect = document.getElementById('template-select');
    toneSelect = document.getElementById('tone-select');
    processBtn = document.getElementById('process-btn');
    copyBtn = document.getElementById('copy-btn');
    downloadBtn = document.getElementById('download-btn');
    clearBtn = document.getElementById('clear-btn');
}

function populateSelects() {
    // Templates
    if (templateSelect) {
        templateSelect.innerHTML = '';
        for (const [key, tmpl] of Object.entries(TEMPLATES)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${tmpl.icon}  ${tmpl.label}`;
            templateSelect.appendChild(opt);
        }
    }

    // Tones
    if (toneSelect) {
        toneSelect.innerHTML = '';
        for (const [key, tone] of Object.entries(TONES)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${tone.icon}  ${tone.label}`;
            toneSelect.appendChild(opt);
        }
    }
}

function attachEventListeners() {
    // API Key
    apiSaveBtn?.addEventListener('click', handleSaveApiKey);
    apiDisconnectBtn?.addEventListener('click', handleDisconnect);
    apiKeyInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveApiKey();
    });

    // Input
    inputTextarea?.addEventListener('input', () => updateCharCount(inputTextarea, charCount));
    fileInput?.addEventListener('change', handleFileUpload);

    // Process
    processBtn?.addEventListener('click', handleProcess);

    // Output actions
    copyBtn?.addEventListener('click', copyToClipboard);
    downloadBtn?.addEventListener('click', downloadMarkdown);
    clearBtn?.addEventListener('click', () => {
        clearOutput();
        showToast('Saída limpa.', 'success');
    });

    // Keyboard shortcut: Ctrl+Enter to process
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleProcess();
        }
    });
}

// --- API Key Management ---
function restoreApiKeyState() {
    if (hasApiKey()) {
        setApiConnected();
    } else {
        setApiDisconnected();
    }
}

async function handleSaveApiKey() {
    const key = apiKeyInput?.value?.trim();
    if (!key) {
        showToast('Insira uma chave de API válida.', 'warning');
        return;
    }

    apiSaveBtn.disabled = true;
    apiSaveBtn.textContent = 'Validando...';
    setApiStatus('Validando chave...', '');

    saveApiKey(key);
    const valid = await validateApiKey();

    if (valid) {
        setApiConnected();
        apiKeyInput.value = '';
        showToast('Chave de API conectada com sucesso!', 'success');
    } else {
        clearApiKey();
        setApiDisconnected();
        setApiStatus('Chave inválida. Verifique e tente novamente.', 'error');
        showToast('Chave de API inválida.', 'error');
    }

    apiSaveBtn.disabled = false;
    apiSaveBtn.textContent = 'Conectar';
}

function handleDisconnect() {
    clearApiKey();
    setApiDisconnected();
    showToast('Chave de API removida com segurança.', 'success');
}

function setApiConnected() {
    const maskedKey = maskKey(getApiKey());
    setApiStatus(`Conectado • ${maskedKey}`, 'connected');
    if (apiKeyInput) apiKeyInput.style.display = 'none';
    if (apiSaveBtn) apiSaveBtn.style.display = 'none';
    if (apiDisconnectBtn) apiDisconnectBtn.style.display = '';
    if (processBtn) processBtn.disabled = false;
}

function setApiDisconnected() {
    setApiStatus('Desconectado — insira sua chave do Google AI Studio', '');
    if (apiKeyInput) {
        apiKeyInput.style.display = '';
        apiKeyInput.value = '';
    }
    if (apiSaveBtn) apiSaveBtn.style.display = '';
    if (apiDisconnectBtn) apiDisconnectBtn.style.display = 'none';
    if (processBtn) processBtn.disabled = true;
}

/**
 * @param {string} msg 
 * @param {string} cls 
 */
function setApiStatus(msg, cls) {
    if (!apiStatus) return;
    apiStatus.className = `api-status ${cls}`;
    apiStatus.innerHTML = `<span class="status-dot"></span><span>${msg}</span>`;
}

/**
 * Mask the API key for display
 * @param {string | null} key
 * @returns {string}
 */
function maskKey(key) {
    if (!key || key.length < 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

// --- File Upload ---
async function handleFileUpload(e) {
    const file = e.target?.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        showToast('Arquivo muito grande. Limite: 5MB.', 'error');
        return;
    }

    try {
        const text = await file.text();
        if (inputTextarea) {
            inputTextarea.value = text;
            updateCharCount(inputTextarea, charCount);
            showToast(`Arquivo "${file.name}" carregado com sucesso!`, 'success');
        }
    } catch {
        showToast('Erro ao ler o arquivo. Tente um .txt ou .md.', 'error');
    }

    // Reset file input
    if (fileInput) fileInput.value = '';
}

// --- Process ---
async function handleProcess() {
    if (isProcessing) return;

    if (!hasApiKey()) {
        showToast('Configure sua chave de API primeiro.', 'warning');
        return;
    }

    const text = inputTextarea?.value?.trim();
    if (!text) {
        showToast('Cole ou digite o texto bruto no campo de entrada.', 'warning');
        inputTextarea?.focus();
        return;
    }

    if (text.length < 20) {
        showToast('Texto muito curto. Forneça mais conteúdo para processar.', 'warning');
        return;
    }

    const template = templateSelect?.value || 'relatorio';
    const tone = toneSelect?.value || 'tecnico';

    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = '<span class="spinner"></span> Processando...';
    showLoading();

    try {
        const { systemInstruction, userPrompt } = buildPrompt(text, template, tone);
        const result = await callGemini(systemInstruction, userPrompt);

        hideLoading();
        renderOutput(result);
        showToast('Documento gerado com sucesso!', 'success');
    } catch (error) {
        hideLoading();
        clearOutput();
        showToast(error.message || 'Erro ao processar. Tente novamente.', 'error');
    } finally {
        isProcessing = false;
        processBtn.disabled = false;
        processBtn.innerHTML = '✨ Refinar Escrita';
    }
}
