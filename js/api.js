// ============================================
// Echo Scribe — Gemini API Client
// Security: Key stored in sessionStorage only
// ============================================

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL = 'gemini-1.5-pro';
const STORAGE_KEY = 'echo_scribe_api_key';

/**
 * Save the API key securely to sessionStorage.
 * @param {string} key
 */
export function saveApiKey(key) {
    if (!key || typeof key !== 'string') return;
    sessionStorage.setItem(STORAGE_KEY, key.trim());
}

/**
 * Retrieve the API key from sessionStorage.
 * @returns {string | null}
 */
export function getApiKey() {
    return sessionStorage.getItem(STORAGE_KEY);
}

/**
 * Clear the stored API key.
 */
export function clearApiKey() {
    sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if an API key is currently stored.
 * @returns {boolean}
 */
export function hasApiKey() {
    const key = getApiKey();
    return !!key && key.length > 10;
}

/**
 * Validate the API key by making a lightweight test request.
 * @returns {Promise<boolean>}
 */
export async function validateApiKey() {
    const key = getApiKey();
    if (!key) return false;

    try {
        const response = await fetch(
            `${API_BASE}/${MODEL}:generateContent?key=${key}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Responda apenas: OK' }] }],
                    generationConfig: { maxOutputTokens: 5 },
                }),
            }
        );

        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Call the Gemini API with structured prompts.
 * @param {string} systemInstruction - System instruction for the model
 * @param {string} userPrompt - User content to process
 * @returns {Promise<string>} - Generated markdown text
 * @throws {Error} - On API or network failure
 */
export async function callGemini(systemInstruction, userPrompt) {
    const key = getApiKey();
    if (!key) {
        throw new Error('Chave de API não configurada. Por favor, insira sua chave do Google AI Studio.');
    }

    const requestBody = {
        system_instruction: {
            parts: [{ text: systemInstruction }],
        },
        contents: [
            {
                role: 'user',
                parts: [{ text: userPrompt }],
            },
        ],
        generationConfig: {
            temperature: 0.4,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 8192,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
    };

    const response = await fetch(
        `${API_BASE}/${MODEL}:generateContent?key=${key}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData?.error?.message || `Erro HTTP ${response.status}`;

        if (response.status === 400) {
            throw new Error(`Requisição inválida: ${message}`);
        } else if (response.status === 401 || response.status === 403) {
            throw new Error('Chave de API inválida ou sem permissão. Verifique sua chave.');
        } else if (response.status === 429) {
            throw new Error('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
        } else if (response.status >= 500) {
            throw new Error('Erro no servidor do Google. Tente novamente em instantes.');
        } else {
            throw new Error(`Falha na API: ${message}`);
        }
    }

    const data = await response.json();

    // Extract text from response
    const candidate = data?.candidates?.[0];
    if (!candidate) {
        throw new Error('A API não retornou conteúdo. O texto pode ter sido bloqueado por filtros de segurança.');
    }

    const text = candidate.content?.parts?.map((p) => p.text).join('') || '';
    if (!text.trim()) {
        throw new Error('Resposta vazia da API. Tente novamente com um texto diferente.');
    }

    return text;
}
