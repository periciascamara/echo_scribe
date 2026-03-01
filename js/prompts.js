// ============================================
// Echo Scribe — Prompt Templates
// ============================================

/**
 * @typedef {'relatorio' | 'resumo' | 'minuta'} TemplateType
 * @typedef {'tecnico' | 'formal'} ToneType
 */

/** Template display configuration */
export const TEMPLATES = {
  relatorio: {
    label: 'Relatório Pericial',
    icon: '📋',
    description: 'Laudo técnico com metodologia e constatações',
  },
  resumo: {
    label: 'Resumo Executivo',
    icon: '📊',
    description: 'Síntese objetiva com pontos-chave',
  },
  minuta: {
    label: 'Minuta Jurídica',
    icon: '⚖️',
    description: 'Documento formal com cláusulas estruturadas',
  },
};

/** Tone display configuration */
export const TONES = {
  tecnico: { label: 'Técnico', icon: '🔬' },
  formal: { label: 'Formal', icon: '🎩' },
};

/**
 * System instructions per template
 * @type {Record<string, string>}
 */
const SYSTEM_PROMPTS = {
  relatorio: `Você é um redator técnico especializado em laudos periciais. 
Sua tarefa é transformar o texto bruto fornecido em um Relatório Pericial/Laudo de Constatação profissional e estruturado.

O documento DEVE seguir esta estrutura em Markdown:

# [Título do Laudo]

## 1. Objeto
Descreva o objeto da perícia/vistoria.

## 2. Metodologia
Relate os métodos e procedimentos utilizados.

## 3. Constatações
Organize as constatações em subtópicos claros, numerados. Cada ponto deve ser factual.

## 4. Análise Técnica
Se aplicável, cruze as constatações com normas ou referências técnicas.

## 5. Conclusão
Sintetize os achados de forma objetiva.

## 6. Encerramento
Inclua local, data e campo para assinatura do responsável técnico.

---
*Documento gerado com auxílio do Echo Scribe v1.0.0*`,

  resumo: `Você é um redator executivo especializado em sínteses e resumos corporativos.
Sua tarefa é transformar o texto bruto fornecido em um Resumo Executivo claro e conciso.

O documento DEVE seguir esta estrutura em Markdown:

# [Título do Resumo]

## Contexto
Apresente o contexto geral em 2–3 parágrafos.

## Pontos-Chave
- Liste os pontos mais relevantes como bullet points
- Cada ponto deve ser autocontido e objetivo
- Priorize por relevância

## Dados e Evidências
Se o texto original contiver dados quantitativos, organize-os aqui.

## Recomendações
Liste as ações recomendadas, se aplicável.

## Próximos Passos
Sugira um caminho de ação baseado na análise.

---
*Documento gerado com auxílio do Echo Scribe v1.0.0*`,

  minuta: `Você é um redator jurídico especializado em minutas e instrumentos legais.
Sua tarefa é transformar o texto bruto fornecido em uma Minuta Jurídica formal e bem estruturada.

O documento DEVE seguir esta estrutura em Markdown:

# [Título do Instrumento]

## EPÍGRAFE
Identifique o tipo de instrumento e sua finalidade.

## PREÂMBULO
Qualifique as partes envolvidas (se identificáveis no texto).

## CLÁUSULAS

### Cláusula 1ª — Do Objeto
Defina o objeto.

### Cláusula 2ª — Das Obrigações
Estabeleça obrigações das partes.

### Cláusula 3ª — Das Condições
Termos e condições relevantes.

*(Adicione cláusulas conforme necessário)*

## DISPOSIÇÕES GERAIS
Cláusulas padrão de foro, vigência, etc.

## FECHO
Local, data e campos para assinaturas.

---
*Documento gerado com auxílio do Echo Scribe v1.0.0*`,
};

/**
 * Tone modifiers appended to the system prompt
 * @type {Record<string, string>}
 */
const TONE_MODIFIERS = {
  tecnico: `
DIRETRIZES DE TOM:
- Use linguagem técnica e precisa
- Empregue terminologia especializada da área
- Seja objetivo e impessoal (terceira pessoa ou voz passiva)
- Priorize clareza e rigor na exposição dos fatos
- Evite coloquialismos e subjetividades`,

  formal: `
DIRETRIZES DE TOM:
- Use linguagem formal e culta
- Empregue construções tradicionais e polidas
- Mantenha um tom respeitoso e protocolar
- Use tratamentos adequados (V.Sa., Senhor(a))
- Priorize elegância e sobriedade na redação`,
};

/**
 * Build the full prompt for the Gemini API
 * @param {string} inputText - Raw user text
 * @param {TemplateType} template - Selected template key
 * @param {ToneType} tone - Selected tone key
 * @returns {{ systemInstruction: string, userPrompt: string }}
 */
export function buildPrompt(inputText, template, tone) {
  const systemInstruction = SYSTEM_PROMPTS[template] + '\n' + TONE_MODIFIERS[tone] + `

REGRAS GERAIS:
- Limpe vícios de linguagem (hm, é..., aí, né, tipo)
- Corrija erros gramaticais e de concordância
- Remova repetições desnecessárias
- Mantenha TODOS os fatos e dados do texto original
- NÃO invente informações que não estejam no texto
- Responda SEMPRE em Português do Brasil
- Formate o resultado em Markdown`;

  const userPrompt = `Transforme o seguinte texto bruto em um documento estruturado conforme as instruções:\n\n---\n${inputText}\n---`;

  return { systemInstruction, userPrompt };
}
