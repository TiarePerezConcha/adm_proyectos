import { supabase } from '../services/supabaseClient';
import { Client, CRMDeal, Quote, ProspectEvaluation } from '../types';

/**
 * Servicio de Sincronización Automática Bidireccional con Supabase Cloud
 */

export async function syncClientToSupabase(client: Client) {
  try {
    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      country: client.country,
      source: client.source,
      created_at: client.createdAt || new Date().toISOString()
    });
    if (error) console.warn('Error en Supabase (clients):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncDealToSupabase(deal: CRMDeal) {
  try {
    const { error } = await supabase.from('crm_deals').upsert({
      id: deal.id,
      client_id: deal.clientId,
      client_name: deal.clientName,
      company: deal.company,
      email: deal.email,
      phone: deal.phone,
      title: deal.title,
      value_clp: deal.valueCLP,
      stage: deal.stage,
      meeting_date: deal.meetingDate,
      meet_link: deal.meetLink,
      notes: deal.notes,
      updated_at: deal.updatedAt || new Date().toISOString()
    });
    if (error) console.warn('Error en Supabase (crm_deals):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncQuoteToSupabase(quote: Quote) {
  try {
    const { error } = await supabase.from('quotes').upsert({
      id: quote.id,
      quote_number: quote.quoteNumber,
      client_id: quote.clientId,
      client_name: quote.clientName,
      client_company: quote.clientCompany,
      project_title: quote.projectTitle,
      subtitle: quote.subtitle,
      outcome: quote.outcome,
      services: quote.services,
      sprints: quote.sprints,
      total_clp: quote.totalCLP,
      payment_condition: quote.paymentCondition,
      payment_details: quote.paymentConditionDetails,
      tax_document: quote.taxDocument,
      delivery_time_days: quote.deliveryTimeDays,
      validity_days: quote.validityDays,
      status: quote.status,
      created_at: quote.createdAt || new Date().toISOString()
    });
    if (error) console.warn('Error en Supabase (quotes):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}

export async function syncEvaluationToSupabase(evaluation: ProspectEvaluation) {
  try {
    const { error } = await supabase.from('evaluations').upsert({
      id: evaluation.id,
      client_id: evaluation.clientId,
      client_name: evaluation.clientName,
      company: evaluation.company,
      business_model: evaluation.businessModel,
      current_platform: evaluation.currentPlatform,
      estimated_sales_clp: evaluation.estimatedMonthlySalesCLP,
      viability_decision: evaluation.viabilityDecision,
      viability_rationale: evaluation.viabilityRationale,
      score_level: evaluation.scoreLevel,
      budget_clp: evaluation.totalEstimatedBudgetCLP,
      nic_cost_clp: evaluation.nicCostCLP,
      hosting_option: evaluation.hostingOption,
      database_option: evaluation.databaseOption,
      foda: evaluation.foda,
      pestel: evaluation.pestel,
      created_at: evaluation.createdAt || new Date().toISOString()
    });
    if (error) console.warn('Error en Supabase (evaluations):', error.message);
  } catch (err) {
    console.warn('Fallo de red Supabase:', err);
  }
}
