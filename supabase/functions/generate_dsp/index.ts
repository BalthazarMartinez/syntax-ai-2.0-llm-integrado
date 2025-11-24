import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  opportunity_id: z.number().int().positive(),
});

// Schema for DSP validation
const dspSchema = z.object({
  deal_strategy_plan: z.object({
    project_objective: z.object({
      purpose: z.string(),
      strategic_objective: z.string(),
      success_criteria: z.string(),
      notes: z.string(),
    }),
    use_case: z.object({
      purpose: z.string(),
      problem_to_solve: z.string(),
      current_consequences: z.string(),
      business_impact: z.string(),
      priority_level: z.string(),
      priority_rationale: z.string(),
      notes: z.string(),
    }),
    bundles: z.object({
      purpose: z.string(),
      recommended_bundle: z.string(),
      bundle_options_considered: z.array(z.object({
        bundle: z.string(),
        fit_reason: z.string(),
      })),
      notes: z.string(),
    }),
    preliminary_solution_approach: z.object({
      purpose: z.string(),
      recommended_approach: z.string(),
      approach_rationale: z.string(),
      assumptions: z.array(z.string()),
      open_questions: z.array(z.string()),
      notes: z.string(),
    }),
    functionalities_description: z.object({
      purpose: z.string(),
      expected_functionalities: z.array(z.object({
        name: z.string(),
        description: z.string(),
        business_value: z.string(),
      })),
      out_of_scope: z.array(z.string()),
      notes: z.string(),
    }),
    technical: z.object({
      purpose: z.string(),
      cloud_environment: z.string(),
      cloud_experience: z.string(),
      infrastructure_owner: z.string(),
      required_data: z.array(z.object({
        data_type: z.string(),
        availability: z.string(),
        location: z.string(),
      })),
      data_gaps_or_risks: z.array(z.string()),
      notes: z.string(),
    }),
    competitiveness_and_strategic_positioning: z.object({
      purpose: z.string(),
      competitors_or_alternatives: z.array(z.object({
        name: z.string(),
        status_or_role: z.string(),
        strengths: z.string(),
        weaknesses: z.string(),
      })),
      santex_advantages: z.array(z.string()),
      differentiation_narrative: z.string(),
      notes: z.string(),
    }),
    commercial_roadmap_next_steps: z.object({
      purpose: z.string(),
      next_steps: z.array(z.object({
        step: z.string(),
        owner: z.string(),
        expected_date_or_window: z.string(),
        exit_criteria: z.string(),
      })),
      dependencies: z.array(z.string()),
      notes: z.string(),
    }),
    meta: z.object({
      opportunity_id: z.string(),
      generated_from_inputs: z.array(z.string()),
      confidence_level: z.string(),
      missing_information_summary: z.string(),
    }),
  }),
});

async function extractTextFromPDF(pdfBytes: Uint8Array, fileName: string): Promise<string> {
  try {
    console.log(`Extrayendo texto de ${fileName} usando Lovable AI...`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

    // Convert PDF bytes to base64
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
    const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

    // Use Lovable AI to extract text from PDF
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text content from this PDF document. Return only the extracted text without any additional commentary or formatting.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en Lovable AI para ${fileName}:`, response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const extractedText = aiResponse.choices?.[0]?.message?.content;

    if (!extractedText) {
      console.warn(`No se pudo extraer texto de ${fileName}`);
      return '';
    }

    console.log(`Texto extraído de ${fileName}: ${extractedText.length} caracteres`);
    return extractedText;
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    return '';
  }
}

async function generateDSPWithAI(corpus: string, opportunityId: number, inputNames: string[]): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY no está configurada');
  }

  const systemPrompt = `Eres un experto en generación de Deal Strategy Plans (DSP) para proyectos tecnológicos.
Tu tarea es analizar el corpus de documentos proporcionado y generar un JSON estructurado siguiendo el schema exacto del DSP.

REGLAS CRÍTICAS:
1. SOLO devolver JSON válido, sin markdown, sin comentarios, sin texto adicional
2. NO inventar datos que no estén en el corpus
3. Si falta información para un campo, usar "N/A" como valor
4. Mantener la estructura exacta del schema proporcionado
5. Ser preciso y conciso en las respuestas
6. Usar español en todos los campos de contenido`;

  const userPrompt = `Analiza el siguiente corpus de documentos y genera el Deal Strategy Plan en formato JSON:

${corpus}

Genera el JSON siguiendo este schema EXACTO (devuelve SOLO el JSON, sin markdown):
{
  "deal_strategy_plan": {
    "project_objective": {
      "purpose": "Definir el objetivo estratégico que persigue el cliente con la iniciativa.",
      "strategic_objective": "",
      "success_criteria": "",
      "notes": ""
    },
    "use_case": {
      "purpose": "Describir el problema concreto a resolver y su impacto en el negocio.",
      "problem_to_solve": "",
      "current_consequences": "",
      "business_impact": "",
      "priority_level": "",
      "priority_rationale": "",
      "notes": ""
    },
    "bundles": {
      "purpose": "Identificar si aplica un bundle de aceleración.",
      "recommended_bundle": "",
      "bundle_options_considered": [],
      "notes": ""
    },
    "preliminary_solution_approach": {
      "purpose": "Definir el abordaje inicial según claridad del proyecto y madurez tecnológica.",
      "recommended_approach": "",
      "approach_rationale": "",
      "assumptions": [],
      "open_questions": [],
      "notes": ""
    },
    "functionalities_description": {
      "purpose": "Listar funcionalidades iniciales esperadas, sin detalle técnico profundo.",
      "expected_functionalities": [],
      "out_of_scope": [],
      "notes": ""
    },
    "technical": {
      "purpose": "Evaluar infraestructura y disponibilidad de datos.",
      "cloud_environment": "",
      "cloud_experience": "",
      "infrastructure_owner": "",
      "required_data": [],
      "data_gaps_or_risks": [],
      "notes": ""
    },
    "competitiveness_and_strategic_positioning": {
      "purpose": "Mapear el entorno competitivo y construir una narrativa diferencial.",
      "competitors_or_alternatives": [],
      "santex_advantages": [],
      "differentiation_narrative": "",
      "notes": ""
    },
    "commercial_roadmap_next_steps": {
      "purpose": "Establecer hitos comerciales y criterios de salida.",
      "next_steps": [],
      "dependencies": [],
      "notes": ""
    },
    "meta": {
      "opportunity_id": "${opportunityId}",
      "generated_from_inputs": ${JSON.stringify(inputNames)},
      "confidence_level": "",
      "missing_information_summary": ""
    }
  }
}`;

  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt++;
    console.log(`Intento ${attempt} de ${maxAttempts} para generar DSP`);

    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en Lovable AI:', response.status, errorText);
        
        if (response.status === 429) {
          throw new Error('Límite de tasa excedido. Por favor, intenta más tarde.');
        }
        if (response.status === 402) {
          throw new Error('Se requiere pago. Por favor, agrega créditos a tu workspace.');
        }
        throw new Error(`Error en AI Gateway: ${response.status}`);
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No se recibió contenido del AI');
      }

      // Limpiar el contenido de markdown si existe
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Intentar parsear el JSON
      const parsedJSON = JSON.parse(jsonString);

      // Validar contra el schema
      const validatedData = dspSchema.parse(parsedJSON);
      console.log('JSON validado correctamente');
      
      return validatedData;

    } catch (error) {
      console.error(`Error en intento ${attempt}:`, error);
      
      if (attempt >= maxAttempts) {
        throw new Error('No se pudo estructurar el DSP después de múltiples intentos. Por favor, reintentar.');
      }

      // Si es el primer intento, intentar de nuevo con prompt correctivo
      if (attempt === 1) {
        console.log('Reintentando con prompt correctivo...');
      }
    }
  }

  throw new Error('No se pudo generar el DSP');
}

// Note: In edge function, we inline the template to avoid external dependencies
// This is the same template as src/templates/dealStrategyPlan.ts
function generateHTMLFromDSP(dsp: any, opportunityName: string): string {
  const data = dsp.deal_strategy_plan;
  
  const escapeHtml = (text: string): string => {
    if (!text) return '';
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  const getBadgeForPriority = (priority: string): string => {
    if (!priority || priority === 'N/A') {
      return '<span class="empty-state">N/A</span>';
    }
    
    const priorityLower = priority.toLowerCase();
    let badgeClass = 'badge-info';
    
    if (priorityLower.includes('high') || priorityLower.includes('alta')) {
      badgeClass = 'badge-high';
    } else if (priorityLower.includes('medium') || priorityLower.includes('media')) {
      badgeClass = 'badge-medium';
    } else if (priorityLower.includes('low') || priorityLower.includes('baja')) {
      badgeClass = 'badge-low';
    }
    
    return `<span class="badge ${badgeClass}">${escapeHtml(priority)}</span>`;
  };
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deal Strategy Plan - ${escapeHtml(opportunityName)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: #f8f9fa;
      padding: 40px 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    
    .header {
      text-align: center;
      border-bottom: 4px solid #3498db;
      padding-bottom: 30px;
      margin-bottom: 50px;
    }
    
    .header h1 {
      font-size: 2.5em;
      color: #2c3e50;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header .opportunity-name {
      font-size: 1.5em;
      color: #7f8c8d;
      font-weight: 300;
    }
    
    .section {
      margin-bottom: 50px;
      page-break-inside: avoid;
    }
    
    .section-title {
      color: #2c3e50;
      font-size: 1.8em;
      font-weight: 700;
      margin-bottom: 25px;
      padding-bottom: 12px;
      border-bottom: 3px solid #3498db;
      display: flex;
      align-items: center;
    }
    
    .section-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: #3498db;
      color: white;
      border-radius: 50%;
      margin-right: 15px;
      font-size: 0.8em;
      flex-shrink: 0;
    }
    
    .purpose-box {
      background: #ecf7fd;
      border-left: 4px solid #3498db;
      padding: 15px 20px;
      margin-bottom: 25px;
      border-radius: 4px;
      font-style: italic;
      color: #5a6c7d;
    }
    
    .subsection {
      margin-bottom: 25px;
    }
    
    .subsection-title {
      color: #34495e;
      font-size: 1.2em;
      font-weight: 600;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 3px solid #95a5a6;
    }
    
    .content {
      color: #444;
      line-height: 1.8;
      padding-left: 15px;
    }
    
    .content p {
      margin-bottom: 10px;
    }
    
    .content ul {
      list-style: none;
      padding-left: 0;
    }
    
    .content li {
      padding: 8px 0;
      padding-left: 30px;
      position: relative;
    }
    
    .content li:before {
      content: "▸";
      position: absolute;
      left: 10px;
      color: #3498db;
      font-weight: bold;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px;
      text-align: left;
      font-weight: 600;
      font-size: 0.95em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #ecf0f1;
      color: #555;
    }
    
    tbody tr:hover {
      background: #f8f9fa;
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .badge-high {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }
    
    .badge-medium {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }
    
    .badge-low {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      color: #555;
    }
    
    .badge-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .metadata {
      margin-top: 60px;
      padding: 30px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 8px;
      border-top: 4px solid #667eea;
    }
    
    .metadata h3 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 1.3em;
    }
    
    .metadata-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }
    
    .metadata-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .metadata-label {
      font-weight: 600;
      color: #7f8c8d;
      font-size: 0.85em;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    
    .metadata-value {
      color: #2c3e50;
      font-size: 0.95em;
    }
    
    .empty-state {
      color: #95a5a6;
      font-style: italic;
      padding: 20px;
      text-align: center;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    @media print {
      body {
        padding: 0;
        background: white;
      }
      
      .container {
        box-shadow: none;
        padding: 40px;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Deal Strategy Plan</h1>
      <div class="opportunity-name">${escapeHtml(opportunityName)}</div>
    </div>

    <!-- 1. Objetivo del Proyecto -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">1</span>
        Objetivo del Proyecto
      </h2>
      <div class="purpose-box">${escapeHtml(data.project_objective.purpose)}</div>
      
      <div class="subsection">
        <h3 class="subsection-title">Objetivo Estratégico</h3>
        <div class="content">
          <p>${escapeHtml(data.project_objective.strategic_objective) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Criterios de Éxito</h3>
        <div class="content">
          <p>${escapeHtml(data.project_objective.success_criteria) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      ${data.project_objective.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.project_objective.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 2. Use Case -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">2</span>
        Use Case
      </h2>
      <div class="purpose-box">${escapeHtml(data.use_case.purpose)}</div>
      
      <div class="subsection">
        <h3 class="subsection-title">Problema a Resolver</h3>
        <div class="content">
          <p>${escapeHtml(data.use_case.problem_to_solve) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Consecuencias Actuales</h3>
        <div class="content">
          <p>${escapeHtml(data.use_case.current_consequences) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Impacto en el Negocio</h3>
        <div class="content">
          <p>${escapeHtml(data.use_case.business_impact) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Nivel de Prioridad</h3>
        <div class="content">
          ${getBadgeForPriority(data.use_case.priority_level)}
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Justificación de Prioridad</h3>
        <div class="content">
          <p>${escapeHtml(data.use_case.priority_rationale) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      ${data.use_case.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.use_case.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 3. Bundles -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">3</span>
        Bundles
      </h2>
      <div class="purpose-box">${escapeHtml(data.bundles.purpose)}</div>
      
      <div class="subsection">
        <h3 class="subsection-title">Bundle Recomendado</h3>
        <div class="content">
          <p>${escapeHtml(data.bundles.recommended_bundle) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      ${data.bundles.bundle_options_considered?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Opciones Consideradas</h3>
          <table>
            <thead>
              <tr>
                <th>Bundle</th>
                <th>Razón de Fit</th>
              </tr>
            </thead>
            <tbody>
              ${data.bundles.bundle_options_considered.map((opt: any) => `
                <tr>
                  <td><strong>${escapeHtml(opt.bundle)}</strong></td>
                  <td>${escapeHtml(opt.fit_reason)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${data.bundles.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.bundles.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 4. Preliminary Solution Approach -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">4</span>
        Preliminary Solution Approach (High-Level)
      </h2>
      <div class="purpose-box">${escapeHtml(data.preliminary_solution_approach.purpose)}</div>
      
      <div class="subsection">
        <h3 class="subsection-title">Abordaje Recomendado</h3>
        <div class="content">
          <p>${escapeHtml(data.preliminary_solution_approach.recommended_approach) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Justificación del Abordaje</h3>
        <div class="content">
          <p>${escapeHtml(data.preliminary_solution_approach.approach_rationale) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      ${data.preliminary_solution_approach.assumptions?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Supuestos</h3>
          <div class="content">
            <ul>
              ${data.preliminary_solution_approach.assumptions.map((assumption: string) => 
                `<li>${escapeHtml(assumption)}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${data.preliminary_solution_approach.open_questions?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Preguntas Abiertas</h3>
          <div class="content">
            <ul>
              ${data.preliminary_solution_approach.open_questions.map((question: string) => 
                `<li>${escapeHtml(question)}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${data.preliminary_solution_approach.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.preliminary_solution_approach.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 5. Description of Functionalities -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">5</span>
        Description of Functionalities
      </h2>
      <div class="purpose-box">${escapeHtml(data.functionalities_description.purpose)}</div>
      
      ${data.functionalities_description.expected_functionalities?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Funcionalidades Esperadas</h3>
          <table>
            <thead>
              <tr>
                <th>Funcionalidad</th>
                <th>Descripción</th>
                <th>Valor de Negocio</th>
              </tr>
            </thead>
            <tbody>
              ${data.functionalities_description.expected_functionalities.map((func: any) => `
                <tr>
                  <td><strong>${escapeHtml(func.name)}</strong></td>
                  <td>${escapeHtml(func.description)}</td>
                  <td>${escapeHtml(func.business_value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">No se definieron funcionalidades esperadas</div>'}
      
      ${data.functionalities_description.out_of_scope?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Fuera de Alcance</h3>
          <div class="content">
            <ul>
              ${data.functionalities_description.out_of_scope.map((item: string) => 
                `<li>${escapeHtml(item)}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${data.functionalities_description.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.functionalities_description.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 6. Technical -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">6</span>
        Technical
      </h2>
      <div class="purpose-box">${escapeHtml(data.technical.purpose)}</div>
      
      <div class="subsection">
        <h3 class="subsection-title">Ambiente Cloud</h3>
        <div class="content">
          <p>${escapeHtml(data.technical.cloud_environment) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Experiencia Cloud</h3>
        <div class="content">
          <p>${escapeHtml(data.technical.cloud_experience) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      <div class="subsection">
        <h3 class="subsection-title">Responsable de Infraestructura</h3>
        <div class="content">
          <p>${escapeHtml(data.technical.infrastructure_owner) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      ${data.technical.required_data?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Datos Requeridos</h3>
          <table>
            <thead>
              <tr>
                <th>Tipo de Dato</th>
                <th>Disponibilidad</th>
                <th>Ubicación</th>
              </tr>
            </thead>
            <tbody>
              ${data.technical.required_data.map((d: any) => `
                <tr>
                  <td>${escapeHtml(d.data_type)}</td>
                  <td>${escapeHtml(d.availability)}</td>
                  <td>${escapeHtml(d.location)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${data.technical.data_gaps_or_risks?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Brechas o Riesgos de Datos</h3>
          <div class="content">
            <ul>
              ${data.technical.data_gaps_or_risks.map((risk: string) => 
                `<li>${escapeHtml(risk)}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${data.technical.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.technical.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 7. Competitiveness and Strategic Positioning -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">7</span>
        Competitiveness and Strategic Positioning
      </h2>
      <div class="purpose-box">${escapeHtml(data.competitiveness_and_strategic_positioning.purpose)}</div>
      
      ${data.competitiveness_and_strategic_positioning.competitors_or_alternatives?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Competidores o Alternativas</h3>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado/Rol</th>
                <th>Fortalezas</th>
                <th>Debilidades</th>
              </tr>
            </thead>
            <tbody>
              ${data.competitiveness_and_strategic_positioning.competitors_or_alternatives.map((comp: any) => `
                <tr>
                  <td><strong>${escapeHtml(comp.name)}</strong></td>
                  <td>${escapeHtml(comp.status_or_role)}</td>
                  <td>${escapeHtml(comp.strengths)}</td>
                  <td>${escapeHtml(comp.weaknesses)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${data.competitiveness_and_strategic_positioning.santex_advantages?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Ventajas de Santex</h3>
          <div class="content">
            <ul>
              ${data.competitiveness_and_strategic_positioning.santex_advantages.map((advantage: string) => 
                `<li>${escapeHtml(advantage)}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      <div class="subsection">
        <h3 class="subsection-title">Narrativa de Diferenciación</h3>
        <div class="content">
          <p>${escapeHtml(data.competitiveness_and_strategic_positioning.differentiation_narrative) || '<span class="empty-state">N/A</span>'}</p>
        </div>
      </div>
      
      ${data.competitiveness_and_strategic_positioning.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.competitiveness_and_strategic_positioning.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- 8. Roadmap Comercial / Próximos Pasos -->
    <div class="section">
      <h2 class="section-title">
        <span class="section-number">8</span>
        Roadmap Comercial / Próximos Pasos
      </h2>
      <div class="purpose-box">${escapeHtml(data.commercial_roadmap_next_steps.purpose)}</div>
      
      ${data.commercial_roadmap_next_steps.next_steps?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Próximos Pasos</h3>
          <table>
            <thead>
              <tr>
                <th>Paso</th>
                <th>Responsable</th>
                <th>Fecha Esperada</th>
                <th>Criterios de Salida</th>
              </tr>
            </thead>
            <tbody>
              ${data.commercial_roadmap_next_steps.next_steps.map((step: any) => `
                <tr>
                  <td>${escapeHtml(step.step)}</td>
                  <td>${escapeHtml(step.owner)}</td>
                  <td>${escapeHtml(step.expected_date_or_window)}</td>
                  <td>${escapeHtml(step.exit_criteria)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state">No se definieron próximos pasos</div>'}
      
      ${data.commercial_roadmap_next_steps.dependencies?.length > 0 ? `
        <div class="subsection">
          <h3 class="subsection-title">Dependencias</h3>
          <div class="content">
            <ul>
              ${data.commercial_roadmap_next_steps.dependencies.map((dep: string) => 
                `<li>${escapeHtml(dep)}</li>`
              ).join('')}
            </ul>
          </div>
        </div>
      ` : ''}
      
      ${data.commercial_roadmap_next_steps.notes ? `
        <div class="subsection">
          <h3 class="subsection-title">Notas</h3>
          <div class="content">
            <p>${escapeHtml(data.commercial_roadmap_next_steps.notes)}</p>
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Metadata -->
    <div class="metadata">
      <h3>Información del Documento</h3>
      <div class="metadata-grid">
        <div class="metadata-item">
          <div class="metadata-label">Opportunity ID</div>
          <div class="metadata-value">${escapeHtml(data.meta.opportunity_id)}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Inputs Utilizados</div>
          <div class="metadata-value">${data.meta.generated_from_inputs.map(escapeHtml).join(', ')}</div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Nivel de Confianza</div>
          <div class="metadata-value">
            <span class="badge badge-info">${escapeHtml(data.meta.confidence_level) || 'N/A'}</span>
          </div>
        </div>
        <div class="metadata-item">
          <div class="metadata-label">Fecha de Generación</div>
          <div class="metadata-value">${new Date().toLocaleString('es-ES', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</div>
        </div>
      </div>
      ${data.meta.missing_information_summary ? `
        <div class="metadata-item" style="margin-top: 15px; grid-column: 1 / -1;">
          <div class="metadata-label">Información Faltante</div>
          <div class="metadata-value">${escapeHtml(data.meta.missing_information_summary)}</div>
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>`;
}


Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Iniciando generación de DSP ===');

    // 1. Validar sesión del usuario
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Se requiere autenticación' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Autenticación inválida' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Usuario autenticado:', user.email);

    // Parse and validate request body
    const body = await req.json();
    const { opportunity_id } = requestSchema.parse(body);
    
    console.log('Generando DSP para opportunity_id:', opportunity_id);

    // 2. Validar que existe la oportunidad
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('*, client:clients(*)')
      .eq('opportunity_id', opportunity_id)
      .single();

    if (oppError || !opportunity) {
      console.error('Oportunidad no encontrada:', oppError);
      return new Response(
        JSON.stringify({ error: 'Oportunidad no encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Oportunidad encontrada:', opportunity.opportunity_name);

    // 3. Traer todos los inputs asociados
    const { data: inputs, error: inputsError } = await supabase
      .from('inputs')
      .select('*')
      .eq('opportunity_id', opportunity_id)
      .order('uploaded_at', { ascending: false });

    if (inputsError) {
      console.error('Error fetching inputs:', inputsError);
      return new Response(
        JSON.stringify({ error: 'Error al obtener los inputs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 4. Validar que hay inputs
    if (!inputs || inputs.length === 0) {
      console.log('No hay inputs para esta oportunidad');
      return new Response(
        JSON.stringify({ 
          error: 'No hay documentos cargados para esta oportunidad.',
          details: 'Por favor, cargue al menos un documento PDF antes de generar el DSP.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Encontrados ${inputs.length} inputs`);

    // 5. Descargar y extraer texto de cada PDF
    const corpus: string[] = [];
    const inputNames: string[] = [];

    for (const input of inputs) {
      console.log(`Procesando input: ${input.input_name}`);
      inputNames.push(input.input_name);

      try {
        // Download PDF from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('inputs-files')
          .download(input.storage_path);

        if (downloadError) {
          console.error(`Error descargando ${input.input_name}:`, downloadError);
          continue;
        }

        // Convert blob to Uint8Array
        const arrayBuffer = await fileData.arrayBuffer();
        const pdfBytes = new Uint8Array(arrayBuffer);

        // Extract text
        const text = await extractTextFromPDF(pdfBytes, input.input_name);
        
        if (text.trim()) {
          corpus.push(`\n\n=== INPUT: ${input.input_name} ===\n${text}`);
          console.log(`Texto extraído de ${input.input_name}: ${text.length} caracteres`);
        } else {
          console.warn(`No se pudo extraer texto de ${input.input_name}`);
        }
      } catch (error) {
        console.error(`Error procesando ${input.input_name}:`, error);
      }
    }

    // Validar que se extrajo texto
    const fullCorpus = corpus.join('\n');
    if (fullCorpus.trim().length < 100) {
      console.error('Corpus muy corto o vacío');
      return new Response(
        JSON.stringify({ 
          error: 'Los inputs no contienen texto suficiente para generar el DSP.',
          details: 'Los PDFs pueden estar vacíos, ser imágenes sin OCR, o tener formato no legible.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Corpus total: ${fullCorpus.length} caracteres`);

    // 6. Llamar a Lovable AI para generar el DSP JSON
    console.log('Generando DSP con AI...');
    const dspData = await generateDSPWithAI(fullCorpus, opportunity_id, inputNames);
    console.log('DSP generado exitosamente');

    // 7. Generar HTML del DSP
    console.log('Generando HTML...');
    const html = generateHTMLFromDSP(dspData, opportunity.opportunity_name);

    // 8. Crear bucket de artifacts si no existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const artifactsBucketExists = buckets?.some(b => b.name === 'artifacts-files');
    
    if (!artifactsBucketExists) {
      console.log('Creando bucket artifacts-files...');
      const { error: bucketError } = await supabase.storage.createBucket('artifacts-files', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      
      if (bucketError) {
        console.error('Error creando bucket:', bucketError);
      }
    }

    // 9. Calcular la versión (contar DSPs existentes + 1)
    const { data: existingDsps, error: countError } = await supabase
      .from('artifacts')
      .select('artifact_id', { count: 'exact' })
      .eq('opportunity_id', opportunity_id)
      .eq('artifact_type', 'DSP');
    
    const version = (existingDsps?.length || 0) + 1;
    console.log(`Generando DSP versión ${version}`);

    // 10. Guardar HTML en storage con formato: opportunities/{opportunity_id}/dsp-v{version}.html
    const storagePath = `opportunities/${opportunity_id}/dsp-v${version}.html`;

    console.log('Guardando HTML en storage:', storagePath);
    const { error: uploadError } = await supabase.storage
      .from('artifacts-files')
      .upload(storagePath, html, {
        contentType: 'text/html',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error subiendo HTML:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el HTML generado' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obtener URL signed (1 año de expiración)
    const { data: urlData } = await supabase.storage
      .from('artifacts-files')
      .createSignedUrl(storagePath, 31536000);

    const artifactUrl = urlData?.signedUrl || '';

    // 11. Insertar registro en artifacts
    console.log('Insertando registro en tabla artifacts...');
    const { data: artifact, error: insertError } = await supabase
      .from('artifacts')
      .insert({
        opportunity_id,
        artifact_name: 'Deal Strategy Plan',
        artifact_type: 'DSP',
        artifact_url: artifactUrl,
        generated_by: user.email,
        version,
        status: 'generated',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando artifact:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al registrar el artifact' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('=== DSP generado exitosamente ===');

    // 12. Retornar resultado
    return new Response(
      JSON.stringify({ 
        success: true,
        artifact_url: artifactUrl
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error inesperado:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ 
          error: 'Datos de solicitud inválidos', 
          details: error.errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
