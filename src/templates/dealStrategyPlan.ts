/**
 * Template fijo para generar el HTML del Deal Strategy Plan
 * El LLM solo genera el contenido JSON, este template define el formato
 */

export interface DSPData {
  deal_strategy_plan: {
    project_objective: {
      purpose: string;
      strategic_objective: string;
      success_criteria: string;
      notes: string;
    };
    use_case: {
      purpose: string;
      problem_to_solve: string;
      current_consequences: string;
      business_impact: string;
      priority_level: string;
      priority_rationale: string;
      notes: string;
    };
    bundles: {
      purpose: string;
      recommended_bundle: string;
      bundle_options_considered: Array<{
        bundle: string;
        fit_reason: string;
      }>;
      notes: string;
    };
    preliminary_solution_approach: {
      purpose: string;
      recommended_approach: string;
      approach_rationale: string;
      assumptions: string[];
      open_questions: string[];
      notes: string;
    };
    functionalities_description: {
      purpose: string;
      expected_functionalities: Array<{
        name: string;
        description: string;
        business_value: string;
      }>;
      out_of_scope: string[];
      notes: string;
    };
    technical: {
      purpose: string;
      cloud_environment: string;
      cloud_experience: string;
      infrastructure_owner: string;
      required_data: Array<{
        data_type: string;
        availability: string;
        location: string;
      }>;
      data_gaps_or_risks: string[];
      notes: string;
    };
    competitiveness_and_strategic_positioning: {
      purpose: string;
      competitors_or_alternatives: Array<{
        name: string;
        status_or_role: string;
        strengths: string;
        weaknesses: string;
      }>;
      santex_advantages: string[];
      differentiation_narrative: string;
      notes: string;
    };
    commercial_roadmap_next_steps: {
      purpose: string;
      next_steps: Array<{
        step: string;
        owner: string;
        expected_date_or_window: string;
        exit_criteria: string;
      }>;
      dependencies: string[];
      notes: string;
    };
    meta: {
      opportunity_id: string;
      generated_from_inputs: string[];
      confidence_level: string;
      missing_information_summary: string;
    };
  };
}

/**
 * Genera el HTML completo del Deal Strategy Plan a partir del JSON estructurado
 * @param dspData - Datos estructurados del DSP
 * @param opportunityName - Nombre de la oportunidad
 * @returns HTML completo del documento
 */
export function generateDealStrategyPlanHTML(
  dspData: DSPData,
  opportunityName: string
): string {
  const data = dspData.deal_strategy_plan;

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
              ${data.bundles.bundle_options_considered.map(opt => `
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
              ${data.preliminary_solution_approach.assumptions.map(assumption => 
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
              ${data.preliminary_solution_approach.open_questions.map(question => 
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
              ${data.functionalities_description.expected_functionalities.map(func => `
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
              ${data.functionalities_description.out_of_scope.map(item => 
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
              ${data.technical.required_data.map(d => `
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
              ${data.technical.data_gaps_or_risks.map(risk => 
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
              ${data.competitiveness_and_strategic_positioning.competitors_or_alternatives.map(comp => `
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
              ${data.competitiveness_and_strategic_positioning.santex_advantages.map(advantage => 
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
              ${data.commercial_roadmap_next_steps.next_steps.map(step => `
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
              ${data.commercial_roadmap_next_steps.dependencies.map(dep => 
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

/**
 * Escapa caracteres HTML para prevenir inyección
 */
function escapeHtml(text: string): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Genera el badge HTML apropiado según el nivel de prioridad
 */
function getBadgeForPriority(priority: string): string {
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
}
