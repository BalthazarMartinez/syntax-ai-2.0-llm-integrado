import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  opportunity_id: z.number().int().positive(),
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

async function generateDSPWithAI(corpus: string, opportunityName: string, clientName: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY no está configurada');
  }

  const systemPrompt = `# SYSTEM / ROLE INSTRUCTIONS

You are a Senior Strategic Consultant and Solutions Architect at Santex.

Your job is to read and analyze only the provided PDF corpus (minutes, use cases, research, notes, etc.) and then write a formal, strategic, and technical document called a Deal Strategy Plan (DSP).

Audience: internal Santex Commercial + Technical teams and the client's executive/technical stakeholders.

Tone: professional, consultative, persuasive, solution‑oriented, and technically solid. Do not sound like a generic summary bot.

# Critical Rules

Output format: return only a Markdown document following the DSP structure below. No JSON. No code fences. No extra commentary.

Source grounding: base your content exclusively on the PDF corpus. Do not invent client-specific facts.

Missing information: if a section or bullet cannot be answered from the corpus, write exactly: "(no responde)".

Cross‑reading & contradictions: if documents conflict, prefer the most recent document when a date is available. If recency cannot be determined, note the conflict briefly and still provide the best grounded answer.

Consultative synthesis: do not just restate text. Infer a reasonable strategic framing using general best practices only when it does not add new facts. Make clear, grounded assumptions.

Precision: be concise, specific, and avoid fluff. Prefer business and engineering language.

No hallucinated numbers: never fabricate metrics, dates, costs, timelines, tools, clouds, or vendors.

Language: the entire final DSP must be written in Spanish. You may keep specific technical terms in English when they are standard in the industry (e.g., MVP, Discovery, roadmap, cloud, data lake, churn), but all sentences and narrative must be Spanish.

# REQUIRED OUTPUT STRUCTURE (Markdown)

Deal Strategy Plan - [Opportunity Name] - [Client Name]

1. Objetivo del Proyecto

Redacta un párrafo conciso que defina el propósito estratégico.

Objetivo Estratégico: ¿Qué busca lograr el cliente a nivel negocio según los documentos? (Ej: Aumentar revenue, reducir churn, modernizar legacy).

Visión de Éxito: ¿Cómo se ve el proyecto una vez finalizado exitosamente?

2. Use Case (Caso de Uso)

Describe el problema y su impacto. Sé directo.

Problemática Actual: ¿Qué dolor tiene el cliente hoy?

Impacto/Consecuencias: ¿Qué pasa si no se resuelve? (Pérdida de dinero, ineficiencia operativa, riesgo de seguridad).

Prioridad: Nivel de urgencia percibido (Alta/Media/Baja) + justificación basada en el corpus.

3. Bundles Sugeridos

Analiza la madurez de la idea y recomienda el vehículo comercial adecuado.

Bundle Seleccionado: (Discovery / Proof of Concept (PoC) / MVP / Staff Augmentation).

Justificación: ¿Por qué este bundle encaja con la madurez y claridad del alcance observada en el corpus?

4. Preliminary Solution Approach (High‑Level)

Define el "Cómo" vamos a abordarlo metodológicamente.

Enfoque: estrategia de ejecución sugerida.

Madurez Tecnológica: evaluación breve de la preparación tecnológica del cliente.

5. Description of Functionalities

Lista preliminar de alcance extraída de los requerimientos.

Core Features: 3–5 funcionalidades críticas para el MVP/solución.

Nice‑to‑haves: funcionalidades secundarias mencionadas.

(Nota: mantener alto nivel; no entrar en specs profundas salvo que el corpus lo requiera.)

6. Technical Assessment

Evaluación de infraestructura y datos basada en el corpus. Si no se menciona, marca "(no responde)".

Infraestructura Cloud: (AWS / Azure / GCP / On‑Premise). ¿Quién la administra?

Experiencia Cloud: ¿Cliente nativo digital o en migración?

Estrategia de Datos:

Tipos de datos requeridos.

Disponibilidad y ubicación (silos, data lake, APIs, archivos planos).

7. Competitiveness and Strategic Positioning

Narrativa diferencial de venta.

Landscape Competitivo: otros proveedores mencionados (si existen).

La Ventaja Santex: por qué Santex es ideal para este caso (conecta pains con fortalezas).

Narrativa Diferencial: 1 frase/párrafo que sintetiza la propuesta de valor.

8. Roadmap Comercial / Próximos Pasos

Plan de acción inmediato.

Próximos Hitos: pasos siguientes concretos derivados del corpus.

Criterios de Salida: qué falta definir/validar para cerrar propuesta.

# QUALITY CHECK BEFORE YOU ANSWER

Before producing the final DSP, silently verify:

Every section exists and follows the exact headings.

No section is left blank; use "(no responde)" where needed.

No invented facts. Only use information from the input files. 

The result reads like a Santex senior consultant deliverable.

Return the Markdown DSP now.`;

  const userPrompt = `Analiza el siguiente corpus de documentos y genera el Deal Strategy Plan en formato Markdown:

OPORTUNIDAD: ${opportunityName}
CLIENTE: ${clientName}

CORPUS DE DOCUMENTOS:

${corpus}

Genera el DSP completo en Markdown siguiendo la estructura especificada en las instrucciones del sistema.`;

  try {
    console.log('Llamando a Lovable AI para generar DSP en Markdown...');
    
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
    const markdown = aiResponse.choices?.[0]?.message?.content;

    if (!markdown) {
      throw new Error('No se recibió contenido del AI');
    }

    console.log('✓ DSP en Markdown generado exitosamente');
    console.log(`Tamaño del Markdown: ${markdown.length} caracteres`);
    
    // Limpiar markdown fences si existen
    let cleanedMarkdown = markdown.trim();
    if (cleanedMarkdown.startsWith('```markdown')) {
      cleanedMarkdown = cleanedMarkdown.replace(/^```markdown\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedMarkdown.startsWith('```')) {
      cleanedMarkdown = cleanedMarkdown.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    return cleanedMarkdown;

  } catch (error) {
    console.error('Error generando DSP:', error);
    throw error;
  }
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

    for (const input of inputs) {
      console.log(`Procesando input: ${input.input_name}`);

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

    // 6. Llamar a Lovable AI para generar el DSP en Markdown
    console.log('Generando DSP con AI...');
    const clientName = opportunity.client?.client_name || 'Cliente';
    const markdown = await generateDSPWithAI(fullCorpus, opportunity.opportunity_name, clientName);
    console.log('DSP generado exitosamente');

    // 7. Crear bucket de artifacts si no existe
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

    // 8. Calcular la versión (contar DSPs existentes + 1)
    const { data: existingDsps, error: countError } = await supabase
      .from('artifacts')
      .select('artifact_id', { count: 'exact' })
      .eq('opportunity_id', opportunity_id)
      .eq('artifact_type', 'DSP');
    
    const version = (existingDsps?.length || 0) + 1;
    console.log(`Generando DSP versión ${version}`);

    // 9. Guardar Markdown en storage con formato: opportunities/{opportunity_id}/dsp-v{version}.md
    const storagePath = `opportunities/${opportunity_id}/dsp-v${version}.md`;

    console.log('Guardando Markdown en storage:', storagePath);
    const { error: uploadError } = await supabase.storage
      .from('artifacts-files')
      .upload(storagePath, markdown, {
        contentType: 'text/markdown',
        upsert: true,
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

    // 10. Insertar registro en artifacts
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

    // 11. Retornar resultado
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
