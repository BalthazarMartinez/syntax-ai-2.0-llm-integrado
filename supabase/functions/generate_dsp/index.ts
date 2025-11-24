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

    // Check PDF size (limit to ~4MB in base64)
    const maxSizeBytes = 3 * 1024 * 1024; // 3MB
    if (pdfBytes.length > maxSizeBytes) {
      console.warn(`PDF ${fileName} es demasiado grande (${pdfBytes.length} bytes), omitiendo extracción con AI`);
      return '';
    }

    // Convert PDF bytes to base64
    console.log(`Convirtiendo ${fileName} a base64 (${pdfBytes.length} bytes)...`);
    const base64Pdf = btoa(String.fromCharCode(...pdfBytes));
    console.log(`Base64 generado: ${base64Pdf.length} caracteres`);

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
            content: `Extract ALL text content from this PDF image. Return ONLY the extracted text, no commentary, no formatting, just the raw text content from the document.`
          },
          {
            role: 'user', 
            content: `data:application/pdf;base64,${base64Pdf}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status} en Lovable AI para ${fileName}:`, errorText.substring(0, 500));
      console.warn(`Omitiendo ${fileName} debido a error en AI`);
      return '';
    }

    const aiResponse = await response.json();
    const extractedText = aiResponse.choices?.[0]?.message?.content;

    if (!extractedText) {
      console.warn(`No se pudo extraer texto de ${fileName}`);
      return '';
    }

    console.log(`✓ Texto extraído de ${fileName}: ${extractedText.length} caracteres`);
    return extractedText;
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    console.warn(`Continuando sin ${fileName}...`);
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
6. Usar español en todos los campos de contenido
7. IMPORTANTE: Los arrays deben contener OBJETOS, NO strings simples
8. IMPORTANTE: Cada objeto en un array debe tener TODAS las propiedades requeridas`;

  const userPrompt = `Analiza el siguiente corpus de documentos y genera el Deal Strategy Plan en formato JSON:

${corpus}

Genera el JSON siguiendo este schema EXACTO. IMPORTANTE: Los arrays marcados con [OBJECTS] deben contener objetos, NO strings:

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
      "bundle_options_considered": [
        {
          "bundle": "nombre del bundle",
          "fit_reason": "razón por la que aplica"
        }
      ],
      "notes": ""
    },
    "preliminary_solution_approach": {
      "purpose": "Definir el abordaje inicial según claridad del proyecto y madurez tecnológica.",
      "recommended_approach": "",
      "approach_rationale": "",
      "assumptions": ["string", "string"],
      "open_questions": ["string", "string"],
      "notes": ""
    },
    "functionalities_description": {
      "purpose": "Listar funcionalidades iniciales esperadas, sin detalle técnico profundo.",
      "expected_functionalities": [
        {
          "name": "Nombre de la funcionalidad",
          "description": "Descripción detallada",
          "business_value": "Valor que aporta al negocio"
        }
      ],
      "out_of_scope": ["string", "string"],
      "notes": ""
    },
    "technical": {
      "purpose": "Evaluar infraestructura y disponibilidad de datos.",
      "cloud_environment": "",
      "cloud_experience": "",
      "infrastructure_owner": "",
      "required_data": [
        {
          "data_type": "Tipo de dato",
          "availability": "Disponibilidad actual",
          "location": "Ubicación del dato"
        }
      ],
      "data_gaps_or_risks": ["string", "string"],
      "notes": ""
    },
    "competitiveness_and_strategic_positioning": {
      "purpose": "Mapear el entorno competitivo y construir una narrativa diferencial.",
      "competitors_or_alternatives": [
        {
          "name": "Nombre del competidor",
          "status_or_role": "Estado o rol",
          "strengths": "Fortalezas",
          "weaknesses": "Debilidades"
        }
      ],
      "santex_advantages": ["string", "string"],
      "differentiation_narrative": "",
      "notes": ""
    },
    "commercial_roadmap_next_steps": {
      "purpose": "Establecer hitos comerciales y criterios de salida.",
      "next_steps": [
        {
          "step": "Descripción del paso",
          "owner": "Responsable",
          "expected_date_or_window": "Fecha esperada",
          "exit_criteria": "Criterios de salida"
        }
      ],
      "dependencies": ["string", "string"],
      "notes": ""
    },
    "meta": {
      "opportunity_id": "${opportunityId}",
      "generated_from_inputs": ${JSON.stringify(inputNames)},
      "confidence_level": "high/medium/low",
      "missing_information_summary": ""
    }
  }
}

RECUERDA: Devuelve SOLO el JSON, sin \`\`\`json ni otros wrappers de markdown.`;

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

      console.log('Respuesta del AI (primeros 500 chars):', content.substring(0, 500));

      // Limpiar el contenido de markdown si existe
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Intentar parsear el JSON
      const parsedJSON = JSON.parse(jsonString);
      console.log('JSON parseado correctamente');

      // Validar contra el schema
      const validatedData = dspSchema.parse(parsedJSON);
      console.log('✓ JSON validado correctamente contra schema');
      
      return validatedData;

    } catch (error) {
      console.error(`Error en intento ${attempt}:`, error);
      
      if (attempt >= maxAttempts) {
        throw new Error('No se pudo estructurar el DSP después de múltiples intentos. Por favor, reintentar.');
      }

      // Si es el primer intento, intentar de nuevo con prompt correctivo
      if (attempt === 1 && error instanceof Error) {
        console.log('Reintentando con prompt correctivo...');
        
        // Extraer información del error de validación
        let errorDetails = error.message;
        if (error.name === 'ZodError') {
          errorDetails = `Error de validación de schema. Los siguientes campos tienen problemas:
          
${error.message}

CORRECCIONES NECESARIAS:
- "expected_functionalities" debe ser un array de OBJETOS con propiedades: name, description, business_value
  Ejemplo: [{"name": "Gestión de usuarios", "description": "Sistema de registro y autenticación", "business_value": "Mejora la seguridad"}]
  
- "required_data" debe ser un array de OBJETOS con propiedades: data_type, availability, location
  Ejemplo: [{"data_type": "Datos de clientes", "availability": "Disponible en CRM", "location": "Base de datos SQL"}]
  
- "next_steps" debe ser un array de OBJETOS con propiedades: step, owner, expected_date_or_window, exit_criteria
  Ejemplo: [{"step": "Reunión con stakeholders", "owner": "PM", "expected_date_or_window": "Semana 1", "exit_criteria": "Aprobación de requisitos"}]

NO uses strings simples en estos arrays. Usa OBJETOS con todas las propiedades requeridas.`;
        }
        
        // Modificar el userPrompt para el segundo intento
        const correctivePrompt = `${userPrompt}

CORRECCIÓN REQUERIDA - El intento anterior tuvo estos errores:
${errorDetails}

Por favor, genera el JSON nuevamente asegurando que TODOS los arrays que deben contener objetos efectivamente los contengan con todas sus propiedades.`;
        
        // Reintentar con el prompt correctivo en el siguiente ciclo
        continue;
      }
    }
  }

  throw new Error('No se pudo generar el DSP');
}

// Note: In edge function, we inline the template to avoid external dependencies
// This is the same template as src/templates/dealStrategyPlan.ts
function generateMarkdownFromDSP(dsp: any, opportunityName: string): string {
  const data = dsp.deal_strategy_plan;

  let md = `# Deal Strategy Plan\n\n`;
  md += `**${opportunityName}**\n\n`;
  md += `---\n\n`;

  // 1. Objetivo del Proyecto
  md += `## 1. Objetivo del Proyecto\n\n`;
  md += `> ${data.project_objective.purpose}\n\n`;
  md += `### Objetivo Estratégico\n\n`;
  md += `${data.project_objective.strategic_objective || 'N/A'}\n\n`;
  md += `### Criterios de Éxito\n\n`;
  md += `${data.project_objective.success_criteria || 'N/A'}\n\n`;
  if (data.project_objective.notes) {
    md += `### Notas\n\n`;
    md += `${data.project_objective.notes}\n\n`;
  }
  md += `---\n\n`;

  // 2. Use Case
  md += `## 2. Use Case\n\n`;
  md += `> ${data.use_case.purpose}\n\n`;
  md += `### Problema a Resolver\n\n`;
  md += `${data.use_case.problem_to_solve || 'N/A'}\n\n`;
  md += `### Consecuencias Actuales\n\n`;
  md += `${data.use_case.current_consequences || 'N/A'}\n\n`;
  md += `### Impacto en el Negocio\n\n`;
  md += `${data.use_case.business_impact || 'N/A'}\n\n`;
  md += `### Nivel de Prioridad\n\n`;
  md += `**${data.use_case.priority_level}**\n\n`;
  md += `### Justificación de Prioridad\n\n`;
  md += `${data.use_case.priority_rationale || 'N/A'}\n\n`;
  if (data.use_case.notes) {
    md += `### Notas\n\n`;
    md += `${data.use_case.notes}\n\n`;
  }
  md += `---\n\n`;

  // 3. Bundles
  md += `## 3. Bundles\n\n`;
  md += `> ${data.bundles.purpose}\n\n`;
  md += `### Bundle Recomendado\n\n`;
  md += `${data.bundles.recommended_bundle || 'N/A'}\n\n`;
  if (data.bundles.bundle_options_considered?.length > 0) {
    md += `### Opciones Consideradas\n\n`;
    md += `| Bundle | Razón de Fit |\n`;
    md += `|--------|-------------|\n`;
    data.bundles.bundle_options_considered.forEach((opt: any) => {
      md += `| ${opt.bundle} | ${opt.fit_reason} |\n`;
    });
    md += `\n`;
  }
  if (data.bundles.notes) {
    md += `### Notas\n\n`;
    md += `${data.bundles.notes}\n\n`;
  }
  md += `---\n\n`;

  // 4. Enfoque Preliminar de Solución
  md += `## 4. Enfoque Preliminar de Solución\n\n`;
  md += `> ${data.preliminary_solution_approach.purpose}\n\n`;
  md += `### Enfoque Recomendado\n\n`;
  md += `${data.preliminary_solution_approach.recommended_approach || 'N/A'}\n\n`;
  md += `### Fundamentación del Enfoque\n\n`;
  md += `${data.preliminary_solution_approach.approach_rationale || 'N/A'}\n\n`;
  if (data.preliminary_solution_approach.assumptions?.length > 0) {
    md += `### Supuestos\n\n`;
    data.preliminary_solution_approach.assumptions.forEach((assumption: string) => {
      md += `- ${assumption}\n`;
    });
    md += `\n`;
  }
  if (data.preliminary_solution_approach.open_questions?.length > 0) {
    md += `### Preguntas Abiertas\n\n`;
    data.preliminary_solution_approach.open_questions.forEach((question: string) => {
      md += `- ${question}\n`;
    });
    md += `\n`;
  }
  if (data.preliminary_solution_approach.notes) {
    md += `### Notas\n\n`;
    md += `${data.preliminary_solution_approach.notes}\n\n`;
  }
  md += `---\n\n`;

  // 5. Descripción de Funcionalidades
  md += `## 5. Descripción de Funcionalidades\n\n`;
  md += `> ${data.functionalities_description.purpose}\n\n`;
  if (data.functionalities_description.expected_functionalities?.length > 0) {
    md += `### Funcionalidades Esperadas\n\n`;
    md += `| Funcionalidad | Descripción | Valor de Negocio |\n`;
    md += `|---------------|-------------|------------------|\n`;
    data.functionalities_description.expected_functionalities.forEach((func: any) => {
      md += `| ${func.name} | ${func.description} | ${func.business_value} |\n`;
    });
    md += `\n`;
  }
  if (data.functionalities_description.out_of_scope?.length > 0) {
    md += `### Fuera de Alcance\n\n`;
    data.functionalities_description.out_of_scope.forEach((item: string) => {
      md += `- ${item}\n`;
    });
    md += `\n`;
  }
  if (data.functionalities_description.notes) {
    md += `### Notas\n\n`;
    md += `${data.functionalities_description.notes}\n\n`;
  }
  md += `---\n\n`;

  // 6. Aspectos Técnicos
  md += `## 6. Aspectos Técnicos\n\n`;
  md += `> ${data.technical.purpose}\n\n`;
  md += `### Entorno Cloud\n\n`;
  md += `${data.technical.cloud_environment || 'N/A'}\n\n`;
  md += `### Experiencia Cloud\n\n`;
  md += `${data.technical.cloud_experience || 'N/A'}\n\n`;
  md += `### Propietario de Infraestructura\n\n`;
  md += `${data.technical.infrastructure_owner || 'N/A'}\n\n`;
  if (data.technical.required_data?.length > 0) {
    md += `### Datos Requeridos\n\n`;
    md += `| Tipo de Dato | Disponibilidad | Ubicación |\n`;
    md += `|--------------|----------------|----------|\n`;
    data.technical.required_data.forEach((d: any) => {
      md += `| ${d.data_type} | ${d.availability} | ${d.location} |\n`;
    });
    md += `\n`;
  }
  if (data.technical.data_gaps_or_risks?.length > 0) {
    md += `### Gaps o Riesgos de Datos\n\n`;
    data.technical.data_gaps_or_risks.forEach((risk: string) => {
      md += `- ${risk}\n`;
    });
    md += `\n`;
  }
  if (data.technical.notes) {
    md += `### Notas\n\n`;
    md += `${data.technical.notes}\n\n`;
  }
  md += `---\n\n`;

  // 7. Competitividad y Posicionamiento Estratégico
  md += `## 7. Competitividad y Posicionamiento Estratégico\n\n`;
  md += `> ${data.competitiveness_and_strategic_positioning.purpose}\n\n`;
  if (data.competitiveness_and_strategic_positioning.competitors_or_alternatives?.length > 0) {
    md += `### Competidores o Alternativas\n\n`;
    md += `| Nombre | Estado/Rol | Fortalezas | Debilidades |\n`;
    md += `|--------|------------|------------|-------------|\n`;
    data.competitiveness_and_strategic_positioning.competitors_or_alternatives.forEach((comp: any) => {
      md += `| ${comp.name} | ${comp.status_or_role} | ${comp.strengths} | ${comp.weaknesses} |\n`;
    });
    md += `\n`;
  }
  if (data.competitiveness_and_strategic_positioning.santex_advantages?.length > 0) {
    md += `### Ventajas de Santex\n\n`;
    data.competitiveness_and_strategic_positioning.santex_advantages.forEach((adv: string) => {
      md += `- ${adv}\n`;
    });
    md += `\n`;
  }
  md += `### Narrativa de Diferenciación\n\n`;
  md += `${data.competitiveness_and_strategic_positioning.differentiation_narrative || 'N/A'}\n\n`;
  if (data.competitiveness_and_strategic_positioning.notes) {
    md += `### Notas\n\n`;
    md += `${data.competitiveness_and_strategic_positioning.notes}\n\n`;
  }
  md += `---\n\n`;

  // 8. Roadmap Comercial y Siguientes Pasos
  md += `## 8. Roadmap Comercial y Siguientes Pasos\n\n`;
  md += `> ${data.commercial_roadmap_next_steps.purpose}\n\n`;
  if (data.commercial_roadmap_next_steps.next_steps?.length > 0) {
    md += `### Siguientes Pasos\n\n`;
    md += `| Paso | Responsable | Fecha Esperada | Criterios de Salida |\n`;
    md += `|------|-------------|----------------|---------------------|\n`;
    data.commercial_roadmap_next_steps.next_steps.forEach((step: any) => {
      md += `| ${step.step} | ${step.owner} | ${step.expected_date_or_window} | ${step.exit_criteria} |\n`;
    });
    md += `\n`;
  }
  if (data.commercial_roadmap_next_steps.dependencies?.length > 0) {
    md += `### Dependencias\n\n`;
    data.commercial_roadmap_next_steps.dependencies.forEach((dep: string) => {
      md += `- ${dep}\n`;
    });
    md += `\n`;
  }
  if (data.commercial_roadmap_next_steps.notes) {
    md += `### Notas\n\n`;
    md += `${data.commercial_roadmap_next_steps.notes}\n\n`;
  }
  md += `---\n\n`;

  // Metadata
  md += `## Metadata\n\n`;
  md += `**Opportunity ID:** ${data.meta.opportunity_id}\n\n`;
  md += `**Generated from inputs:**\n`;
  data.meta.generated_from_inputs.forEach((input: string) => {
    md += `- ${input}\n`;
  });
  md += `\n`;
  md += `**Confidence Level:** ${data.meta.confidence_level}\n\n`;
  md += `**Missing Information Summary:**\n\n`;
  md += `${data.meta.missing_information_summary}\n`;

  return md;
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

    // 7. Generar Markdown del DSP
    console.log('Generando Markdown...');
    const markdown = generateMarkdownFromDSP(dspData, opportunity.opportunity_name);

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

    // 10. Guardar Markdown en storage con formato: opportunities/{opportunity_id}/dsp-v{version}.md
    const storagePath = `opportunities/${opportunity_id}/dsp-v${version}.md`;

    console.log('Guardando Markdown en storage:', storagePath);
    const { error: uploadError } = await supabase.storage
      .from('artifacts-files')
      .upload(storagePath, markdown, {
        contentType: 'text/markdown',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error subiendo Markdown:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Error al guardar el Markdown generado' }),
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
