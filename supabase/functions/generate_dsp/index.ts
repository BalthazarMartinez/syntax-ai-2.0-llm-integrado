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
    // Import pdf-parse for Deno
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1');
    const data = await pdfParse.default(pdfBytes);
    return data.text || '';
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

function generateHTMLFromDSP(dsp: any, opportunityName: string): string {
  const data = dsp.deal_strategy_plan;
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deal Strategy Plan - ${opportunityName}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2c3e50;
      border-bottom: 4px solid #3498db;
      padding-bottom: 15px;
      margin-bottom: 30px;
    }
    h2 {
      color: #34495e;
      margin-top: 35px;
      margin-bottom: 20px;
      border-left: 4px solid #3498db;
      padding-left: 15px;
    }
    h3 {
      color: #7f8c8d;
      margin-top: 25px;
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 5px;
    }
    .purpose {
      font-style: italic;
      color: #7f8c8d;
      margin-bottom: 15px;
      padding: 10px;
      background: #ecf0f1;
      border-radius: 4px;
    }
    ul {
      margin-left: 20px;
    }
    li {
      margin-bottom: 10px;
    }
    .metadata {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ecf0f1;
      font-size: 0.9em;
      color: #7f8c8d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ecf0f1;
    }
    th {
      background-color: #3498db;
      color: white;
      font-weight: 600;
    }
    tr:hover {
      background-color: #f8f9fa;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 5px;
    }
    .badge-priority {
      background-color: #e74c3c;
      color: white;
    }
    .badge-info {
      background-color: #3498db;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Deal Strategy Plan</h1>
    <h2>${opportunityName}</h2>

    <div class="section">
      <h2>1. Objetivo del Proyecto</h2>
      <div class="purpose">${data.project_objective.purpose}</div>
      <h3>Objetivo Estratégico</h3>
      <p>${data.project_objective.strategic_objective || 'N/A'}</p>
      <h3>Criterios de Éxito</h3>
      <p>${data.project_objective.success_criteria || 'N/A'}</p>
      ${data.project_objective.notes ? `<h3>Notas</h3><p>${data.project_objective.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>2. Caso de Uso</h2>
      <div class="purpose">${data.use_case.purpose}</div>
      <h3>Problema a Resolver</h3>
      <p>${data.use_case.problem_to_solve || 'N/A'}</p>
      <h3>Consecuencias Actuales</h3>
      <p>${data.use_case.current_consequences || 'N/A'}</p>
      <h3>Impacto en el Negocio</h3>
      <p>${data.use_case.business_impact || 'N/A'}</p>
      <h3>Nivel de Prioridad</h3>
      <p><span class="badge badge-priority">${data.use_case.priority_level || 'N/A'}</span></p>
      <h3>Justificación de Prioridad</h3>
      <p>${data.use_case.priority_rationale || 'N/A'}</p>
      ${data.use_case.notes ? `<h3>Notas</h3><p>${data.use_case.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>3. Bundles</h2>
      <div class="purpose">${data.bundles.purpose}</div>
      <h3>Bundle Recomendado</h3>
      <p>${data.bundles.recommended_bundle || 'N/A'}</p>
      ${data.bundles.bundle_options_considered?.length > 0 ? `
        <h3>Opciones Consideradas</h3>
        <table>
          <tr>
            <th>Bundle</th>
            <th>Razón de Fit</th>
          </tr>
          ${data.bundles.bundle_options_considered.map((opt: any) => `
            <tr>
              <td>${opt.bundle}</td>
              <td>${opt.fit_reason}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      ${data.bundles.notes ? `<h3>Notas</h3><p>${data.bundles.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>4. Abordaje Preliminar de la Solución</h2>
      <div class="purpose">${data.preliminary_solution_approach.purpose}</div>
      <h3>Abordaje Recomendado</h3>
      <p>${data.preliminary_solution_approach.recommended_approach || 'N/A'}</p>
      <h3>Justificación del Abordaje</h3>
      <p>${data.preliminary_solution_approach.approach_rationale || 'N/A'}</p>
      ${data.preliminary_solution_approach.assumptions?.length > 0 ? `
        <h3>Supuestos</h3>
        <ul>${data.preliminary_solution_approach.assumptions.map((a: string) => `<li>${a}</li>`).join('')}</ul>
      ` : ''}
      ${data.preliminary_solution_approach.open_questions?.length > 0 ? `
        <h3>Preguntas Abiertas</h3>
        <ul>${data.preliminary_solution_approach.open_questions.map((q: string) => `<li>${q}</li>`).join('')}</ul>
      ` : ''}
      ${data.preliminary_solution_approach.notes ? `<h3>Notas</h3><p>${data.preliminary_solution_approach.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>5. Descripción de Funcionalidades</h2>
      <div class="purpose">${data.functionalities_description.purpose}</div>
      ${data.functionalities_description.expected_functionalities?.length > 0 ? `
        <h3>Funcionalidades Esperadas</h3>
        <table>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Valor de Negocio</th>
          </tr>
          ${data.functionalities_description.expected_functionalities.map((func: any) => `
            <tr>
              <td><strong>${func.name}</strong></td>
              <td>${func.description}</td>
              <td>${func.business_value}</td>
            </tr>
          `).join('')}
        </table>
      ` : '<p>N/A</p>'}
      ${data.functionalities_description.out_of_scope?.length > 0 ? `
        <h3>Fuera de Alcance</h3>
        <ul>${data.functionalities_description.out_of_scope.map((o: string) => `<li>${o}</li>`).join('')}</ul>
      ` : ''}
      ${data.functionalities_description.notes ? `<h3>Notas</h3><p>${data.functionalities_description.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>6. Aspectos Técnicos</h2>
      <div class="purpose">${data.technical.purpose}</div>
      <h3>Ambiente Cloud</h3>
      <p>${data.technical.cloud_environment || 'N/A'}</p>
      <h3>Experiencia Cloud</h3>
      <p>${data.technical.cloud_experience || 'N/A'}</p>
      <h3>Responsable de Infraestructura</h3>
      <p>${data.technical.infrastructure_owner || 'N/A'}</p>
      ${data.technical.required_data?.length > 0 ? `
        <h3>Datos Requeridos</h3>
        <table>
          <tr>
            <th>Tipo de Dato</th>
            <th>Disponibilidad</th>
            <th>Ubicación</th>
          </tr>
          ${data.technical.required_data.map((d: any) => `
            <tr>
              <td>${d.data_type}</td>
              <td>${d.availability}</td>
              <td>${d.location}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      ${data.technical.data_gaps_or_risks?.length > 0 ? `
        <h3>Brechas o Riesgos de Datos</h3>
        <ul>${data.technical.data_gaps_or_risks.map((r: string) => `<li>${r}</li>`).join('')}</ul>
      ` : ''}
      ${data.technical.notes ? `<h3>Notas</h3><p>${data.technical.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>7. Competitividad y Posicionamiento Estratégico</h2>
      <div class="purpose">${data.competitiveness_and_strategic_positioning.purpose}</div>
      ${data.competitiveness_and_strategic_positioning.competitors_or_alternatives?.length > 0 ? `
        <h3>Competidores o Alternativas</h3>
        <table>
          <tr>
            <th>Nombre</th>
            <th>Estado/Rol</th>
            <th>Fortalezas</th>
            <th>Debilidades</th>
          </tr>
          ${data.competitiveness_and_strategic_positioning.competitors_or_alternatives.map((comp: any) => `
            <tr>
              <td><strong>${comp.name}</strong></td>
              <td>${comp.status_or_role}</td>
              <td>${comp.strengths}</td>
              <td>${comp.weaknesses}</td>
            </tr>
          `).join('')}
        </table>
      ` : ''}
      ${data.competitiveness_and_strategic_positioning.santex_advantages?.length > 0 ? `
        <h3>Ventajas de Santex</h3>
        <ul>${data.competitiveness_and_strategic_positioning.santex_advantages.map((a: string) => `<li>${a}</li>`).join('')}</ul>
      ` : ''}
      <h3>Narrativa de Diferenciación</h3>
      <p>${data.competitiveness_and_strategic_positioning.differentiation_narrative || 'N/A'}</p>
      ${data.competitiveness_and_strategic_positioning.notes ? `<h3>Notas</h3><p>${data.competitiveness_and_strategic_positioning.notes}</p>` : ''}
    </div>

    <div class="section">
      <h2>8. Roadmap Comercial y Próximos Pasos</h2>
      <div class="purpose">${data.commercial_roadmap_next_steps.purpose}</div>
      ${data.commercial_roadmap_next_steps.next_steps?.length > 0 ? `
        <h3>Próximos Pasos</h3>
        <table>
          <tr>
            <th>Paso</th>
            <th>Responsable</th>
            <th>Fecha Esperada</th>
            <th>Criterios de Salida</th>
          </tr>
          ${data.commercial_roadmap_next_steps.next_steps.map((step: any) => `
            <tr>
              <td>${step.step}</td>
              <td>${step.owner}</td>
              <td>${step.expected_date_or_window}</td>
              <td>${step.exit_criteria}</td>
            </tr>
          `).join('')}
        </table>
      ` : '<p>N/A</p>'}
      ${data.commercial_roadmap_next_steps.dependencies?.length > 0 ? `
        <h3>Dependencias</h3>
        <ul>${data.commercial_roadmap_next_steps.dependencies.map((d: string) => `<li>${d}</li>`).join('')}</ul>
      ` : ''}
      ${data.commercial_roadmap_next_steps.notes ? `<h3>Notas</h3><p>${data.commercial_roadmap_next_steps.notes}</p>` : ''}
    </div>

    <div class="metadata">
      <h3>Metadata</h3>
      <p><strong>Opportunity ID:</strong> ${data.meta.opportunity_id}</p>
      <p><strong>Generado desde inputs:</strong> ${data.meta.generated_from_inputs.join(', ')}</p>
      <p><strong>Nivel de confianza:</strong> <span class="badge badge-info">${data.meta.confidence_level || 'N/A'}</span></p>
      <p><strong>Resumen de información faltante:</strong> ${data.meta.missing_information_summary || 'N/A'}</p>
      <p><strong>Generado:</strong> ${new Date().toLocaleString('es-ES')}</p>
    </div>
  </div>
</body>
</html>`;
}

async function convertHTMLToPDF(html: string): Promise<Uint8Array> {
  // Using jsPDF for PDF generation in Deno
  const { jsPDF } = await import('https://esm.sh/jspdf@2.5.1');
  const doc = new jsPDF({
    format: 'a4',
    unit: 'mm',
  });

  // Convert HTML to PDF (simplified - for production use puppeteer or similar)
  // This is a basic implementation - consider using html2pdf or puppeteer for better results
  doc.html(html, {
    callback: function (_doc: any) {
      // PDF generation complete
    },
    x: 10,
    y: 10,
    width: 190,
  });

  // Get PDF as Uint8Array
  const pdfOutput = doc.output('arraybuffer');
  return new Uint8Array(pdfOutput);
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

    // 8. Convertir HTML a PDF
    console.log('Convirtiendo HTML a PDF...');
    const pdfBytes = await convertHTMLToPDF(html);

    // 9. Crear bucket de artifacts si no existe
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

    // 10. Guardar PDF en storage
    const timestamp = new Date().getTime();
    const artifactFileName = `DSP_${opportunity_id}_${timestamp}.pdf`;
    const storagePath = `${opportunity_id}/${artifactFileName}`;

    console.log('Guardando PDF en storage:', storagePath);
    const { error: uploadError } = await supabase.storage
      .from('artifacts-files')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error subiendo PDF:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el PDF generado' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get public URL (or signed URL if bucket is private)
    const { data: urlData } = await supabase.storage
      .from('artifacts-files')
      .createSignedUrl(storagePath, 31536000); // 1 year expiration

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
        version: 1,
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
        artifact_url: artifactUrl,
        artifact_id: artifact.artifact_id,
        message: 'Deal Strategy Plan generado exitosamente'
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
