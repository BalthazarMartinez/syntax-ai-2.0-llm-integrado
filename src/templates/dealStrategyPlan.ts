/**
 * Template para generar el Markdown del Deal Strategy Plan
 * El LLM genera el contenido JSON, este template define el formato Markdown
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
 * Genera el Markdown completo del Deal Strategy Plan a partir del JSON estructurado
 * @param dspData - Datos estructurados del DSP
 * @param opportunityName - Nombre de la oportunidad
 * @returns Markdown completo del documento
 */
export function generateDealStrategyPlanMarkdown(
  dspData: DSPData,
  opportunityName: string
): string {
  const data = dspData.deal_strategy_plan;

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
    data.bundles.bundle_options_considered.forEach(opt => {
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
    data.preliminary_solution_approach.assumptions.forEach(assumption => {
      md += `- ${assumption}\n`;
    });
    md += `\n`;
  }
  if (data.preliminary_solution_approach.open_questions?.length > 0) {
    md += `### Preguntas Abiertas\n\n`;
    data.preliminary_solution_approach.open_questions.forEach(question => {
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
    data.functionalities_description.expected_functionalities.forEach(func => {
      md += `| ${func.name} | ${func.description} | ${func.business_value} |\n`;
    });
    md += `\n`;
  }
  if (data.functionalities_description.out_of_scope?.length > 0) {
    md += `### Fuera de Alcance\n\n`;
    data.functionalities_description.out_of_scope.forEach(item => {
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
    data.technical.required_data.forEach(d => {
      md += `| ${d.data_type} | ${d.availability} | ${d.location} |\n`;
    });
    md += `\n`;
  }
  if (data.technical.data_gaps_or_risks?.length > 0) {
    md += `### Gaps o Riesgos de Datos\n\n`;
    data.technical.data_gaps_or_risks.forEach(risk => {
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
    data.competitiveness_and_strategic_positioning.competitors_or_alternatives.forEach(comp => {
      md += `| ${comp.name} | ${comp.status_or_role} | ${comp.strengths} | ${comp.weaknesses} |\n`;
    });
    md += `\n`;
  }
  if (data.competitiveness_and_strategic_positioning.santex_advantages?.length > 0) {
    md += `### Ventajas de Santex\n\n`;
    data.competitiveness_and_strategic_positioning.santex_advantages.forEach(adv => {
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
    data.commercial_roadmap_next_steps.next_steps.forEach(step => {
      md += `| ${step.step} | ${step.owner} | ${step.expected_date_or_window} | ${step.exit_criteria} |\n`;
    });
    md += `\n`;
  }
  if (data.commercial_roadmap_next_steps.dependencies?.length > 0) {
    md += `### Dependencias\n\n`;
    data.commercial_roadmap_next_steps.dependencies.forEach(dep => {
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
  data.meta.generated_from_inputs.forEach(input => {
    md += `- ${input}\n`;
  });
  md += `\n`;
  md += `**Confidence Level:** ${data.meta.confidence_level}\n\n`;
  md += `**Missing Information Summary:**\n\n`;
  md += `${data.meta.missing_information_summary}\n`;

  return md;
}
