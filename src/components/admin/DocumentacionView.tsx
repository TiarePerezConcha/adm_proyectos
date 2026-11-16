import React, { useState } from 'react';
import {
  BookOpen,
  Shield,
  FileText,
  AlertTriangle,
  Server,
  Zap,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Lock,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
  BarChart3,
  Terminal,
  Activity,
  Briefcase,
  Users,
  Clock,
  HeartHandshake,
  FileUp,
  Trash2,
  Paperclip,
  DollarSign,
  Stamp,
  Printer,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { AppState, saveAppState } from '../../utils/storage';
import { MonitoredProject, ProjectExternalDoc } from '../../types';
import { supabase } from '../../services/supabaseClient';
import {
  syncDocumentationToSupabase,
  syncLegalRepToSupabase,
  syncClientToSupabase,
  syncDealToSupabase,
  syncMonitoredProjectToSupabase,
} from '../../services/supabaseSyncService';

interface DocumentacionViewProps {
  state: AppState;
  onUpdateState?: (newState: AppState) => void;
}

export const DocumentacionView: React.FC<DocumentacionViewProps> = ({ state, onUpdateState }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    state.monitoredProjects[0]?.id || 'all'
  );
  const [activeTab, setActiveTab] = useState<number>(1);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Estados interactivos para el generador de cláusula
  const selectedProj = state.monitoredProjects.find((p) => p.id === selectedProjectId);

  // Determinar tipo de propiedad: 'propio' | 'cliente' | 'solidario'
  const currentOwnership: 'propio' | 'cliente' | 'solidario' =
    selectedProj?.projectOwnershipType ||
    (selectedProj?.isPersonalProject || !selectedProj?.clientName || selectedProj?.clientName.toLowerCase().includes('propio')
      ? 'propio'
      : 'cliente');

  const [contractClientName, setContractClientName] = useState(
    selectedProj?.clientName || 'Cliente SpA'
  );
  const [contractUrl, setContractUrl] = useState(
    selectedProj?.url || 'https://conpi.cl'
  );
  const [contractTimeWindow, setContractTimeWindow] = useState('02:00 AM a 05:00 AM (Horario Valle)');
  const [contractTools, setContractTools] = useState('k6, OWASP ZAP, Lighthouse y Telemetría LSC');

  // Privacidad de Datos Legales (Sin datos duros en GitHub, almacenado localmente en navegador)
  const [contractProviderName, setContractProviderName] = useState<string>(() => {
    return localStorage.getItem('lsc_provider_name') || 'Tiare Pérez Concha';
  });
  const [contractProviderRUT, setContractProviderRUT] = useState<string>(() => {
    return localStorage.getItem('lsc_provider_rut') || '';
  });

  // Buscar cliente coincidente en state.clients o deals para pre-población automática
  const matchingClient = state.clients?.find(
    (c) =>
      c.id === selectedProj?.id ||
      (selectedProj?.clientName &&
        (c.name?.toLowerCase().includes(selectedProj.clientName.toLowerCase()) ||
          c.company?.toLowerCase().includes(selectedProj.clientName.toLowerCase()) ||
          selectedProj.clientName.toLowerCase().includes(c.company?.toLowerCase() || ''))) ||
      (selectedProj?.name &&
        (c.name?.toLowerCase().includes(selectedProj.name.toLowerCase()) ||
          c.company?.toLowerCase().includes(selectedProj.name.toLowerCase()) ||
          selectedProj.name.toLowerCase().includes(c.company?.toLowerCase() || '')))
  );

  const [contractClientType, setContractClientType] = useState<'persona_natural' | 'empresa'>(() => {
    return (
      (localStorage.getItem(`lsc_client_type_${selectedProj?.id}`) as any) ||
      selectedProj?.clientBilling?.clientType ||
      'empresa'
    );
  });

  const [contractClientRUT, setContractClientRUT] = useState<string>(() => {
    return localStorage.getItem(`lsc_client_rut_${selectedProj?.id}`) || '';
  });

  const [contractLegalRepName, setContractLegalRepName] = useState<string>(() => {
    return (
      localStorage.getItem(`lsc_legal_rep_name_${selectedProj?.id}`) ||
      selectedProj?.clientBilling?.legalRepresentativeName ||
      ''
    );
  });

  const [contractLegalRepRUT, setContractLegalRepRUT] = useState<string>(() => {
    return (
      localStorage.getItem(`lsc_legal_rep_rut_${selectedProj?.id}`) ||
      selectedProj?.clientBilling?.legalRepresentativeRUT ||
      ''
    );
  });

  const [contractClientEmail, setContractClientEmail] = useState<string>(() => {
    return (
      localStorage.getItem(`lsc_client_email_${selectedProj?.id}`) ||
      selectedProj?.clientBilling?.clientEmail ||
      matchingClient?.email ||
      (selectedProj?.clientName?.toLowerCase().includes('conpi') || selectedProj?.url?.includes('conpi.cl')
        ? 'contacto@conpi.cl'
        : '')
    );
  });

  const [contractClientPhone, setContractClientPhone] = useState<string>(() => {
    return (
      localStorage.getItem(`lsc_client_phone_${selectedProj?.id}`) ||
      selectedProj?.clientBilling?.clientPhone ||
      matchingClient?.phone ||
      ''
    );
  });

  const [rememberPrivateData, setRememberPrivateData] = useState<boolean>(true);

  const updateProjectClientBilling = (partialBilling: any) => {
    if (!selectedProj) return;
    const currentBilling = selectedProj.clientBilling || {
      clientName: contractClientName,
      totalQuoteCLP: contractValueCLP,
      paidCLP: 0,
      pendingCLP: contractValueCLP,
      taxDocument: contractTaxDoc,
      status: 'al_dia' as const,
    };
    const updatedBilling = { ...currentBilling, ...partialBilling };
    const updatedProjects = state.monitoredProjects.map((p) =>
      p.id === selectedProj.id ? { ...p, clientBilling: updatedBilling } : p
    );
    const newState: AppState = { ...state, monitoredProjects: updatedProjects };
    saveAppState(newState);
    if (onUpdateState) {
      onUpdateState(newState);
    }
  };

  const handleProviderNameChange = (val: string) => {
    setContractProviderName(val);
    if (rememberPrivateData) {
      localStorage.setItem('lsc_provider_name', val);
    }
  };

  const handleProviderRUTChange = (val: string) => {
    setContractProviderRUT(val);
    if (rememberPrivateData) {
      localStorage.setItem('lsc_provider_rut', val);
    }
  };

  const handleClientTypeChange = (type: 'persona_natural' | 'empresa') => {
    setContractClientType(type);
    if (rememberPrivateData && selectedProj) {
      localStorage.setItem(`lsc_client_type_${selectedProj.id}`, type);
    }
    updateProjectClientBilling({ clientType: type });
  };

  const handleClientNameChange = (val: string) => {
    setContractClientName(val);
    updateProjectClientBilling({ clientName: val });
  };

  const handleClientRUTChange = (val: string) => {
    setContractClientRUT(val);
    if (rememberPrivateData && selectedProj) {
      localStorage.setItem(`lsc_client_rut_${selectedProj.id}`, val);
    }
  };

  const handleLegalRepNameChange = (val: string) => {
    setContractLegalRepName(val);
    if (rememberPrivateData && selectedProj) {
      localStorage.setItem(`lsc_legal_rep_name_${selectedProj.id}`, val);
    }
    updateProjectClientBilling({ legalRepresentativeName: val });
  };

  const handleLegalRepRUTChange = (val: string) => {
    setContractLegalRepRUT(val);
    if (rememberPrivateData && selectedProj) {
      localStorage.setItem(`lsc_legal_rep_rut_${selectedProj.id}`, val);
    }
    updateProjectClientBilling({ legalRepresentativeRUT: val });
  };

  const handleClientEmailChange = (val: string) => {
    setContractClientEmail(val);
    if (rememberPrivateData && selectedProj) {
      localStorage.setItem(`lsc_client_email_${selectedProj.id}`, val);
    }
    updateProjectClientBilling({ clientEmail: val });
  };

  const handleClientPhoneChange = (val: string) => {
    setContractClientPhone(val);
    if (rememberPrivateData && selectedProj) {
      localStorage.setItem(`lsc_client_phone_${selectedProj.id}`, val);
    }
    updateProjectClientBilling({ clientPhone: val });
  };

  // Nombres y RUTs seguros para visualización (con placeholders limpios si están vacíos)
  const dispProviderName = contractProviderName.trim() || '[NOMBRE PRESTADORA]';
  const dispProviderRUT = contractProviderRUT.trim() || '[RUT PRESTADORA]';
  const dispClientName = contractClientName.trim() || '[NOMBRE CLIENTE / MANDANTE]';
  const dispClientRUT = contractClientRUT.trim() || '[RUT CLIENTE / MANDANTE]';
  const dispLegalRepName = contractLegalRepName.trim() || '[REPRESENTANTE LEGAL AUTORIZADO]';
  const dispLegalRepRUT = contractLegalRepRUT.trim() || '[RUT REP. LEGAL]';
  const dispClientEmail = contractClientEmail.trim() || '[CORREO DE CONTACTO]';
  const dispClientPhone = contractClientPhone.trim() || '[TELÉFONO DE CONTACTO]';

  // Configuración de Cotización & Valores Comerciales (Marco Legal Chile)
  const [includePricing, setIncludePricing] = useState<boolean>(currentOwnership === 'cliente');
  const matchingDeal = state.deals?.find(
    (d) =>
      d.id === selectedProj?.id ||
      d.title.toLowerCase() === selectedProj?.name.toLowerCase() ||
      (selectedProj?.clientName && d.clientName.toLowerCase().includes(selectedProj.clientName.toLowerCase()))
  );
  const matchingQuote = state.quotes?.find(
    (q) =>
      q.clientId === selectedProj?.id ||
      q.clientName.toLowerCase().includes(contractClientName.toLowerCase()) ||
      (selectedProj?.name && q.projectTitle.toLowerCase().includes(selectedProj.name.toLowerCase()))
  );
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  const handleSyncAllToSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      if (matchingClient || contractClientName) {
        await syncClientToSupabase({
          id: matchingClient?.id || `cli-${selectedProj?.id || Date.now()}`,
          name: contractClientName,
          company: contractClientName,
          email: contractClientEmail,
          phone: contractClientPhone,
          country: 'Chile',
          source: 'Documentación Legal',
          createdAt: new Date().toISOString(),
        });
      }

      if (contractClientType === 'empresa' && contractLegalRepName) {
        await syncLegalRepToSupabase({
          id: `rep-${selectedProj?.id || 'main'}`,
          clientId: matchingClient?.id || `cli-${selectedProj?.id || 'main'}`,
          name: contractLegalRepName,
          rut: contractLegalRepRUT,
          email: contractClientEmail,
          phone: contractClientPhone,
          position: 'Representante Legal Autorizado',
        });
      }

      if (selectedProj) {
        await syncMonitoredProjectToSupabase(selectedProj);
      }

      if (selectedProj) {
        await syncDocumentationToSupabase({
          id: `doc-${selectedProj.id}-contrato-maestro`,
          projectId: selectedProj.id,
          clientId: matchingClient?.id,
          legalRepId: contractClientType === 'empresa' ? `rep-${selectedProj.id}` : undefined,
          quoteId: matchingQuote?.id,
          dealId: matchingDeal?.id,
          docTitle: 'Contrato Maestro General de Servicios Digitales',
          docCategory: 'contrato_firmado',
          documentOwnershipType: currentOwnership,
          contentText: contratoMaestroConsolidado,
          totalCLP: contractValueCLP,
          taxDocument: contractTaxDoc,
          isSigned: false,
        });

        await syncDocumentationToSupabase({
          id: `doc-${selectedProj.id}-anexo-1`,
          projectId: selectedProj.id,
          clientId: matchingClient?.id,
          quoteId: matchingQuote?.id,
          dealId: matchingDeal?.id,
          docTitle: 'Anexo 1: Autorización Expresa de Pruebas de Carga y Seguridad',
          docCategory: 'anexo_autorizacion',
          documentOwnershipType: currentOwnership,
          contentText: anexo1Individual,
          totalCLP: contractValueCLP,
          taxDocument: contractTaxDoc,
          isSigned: false,
        });
      }

      showCopiedAlert('✓ Vinculación relacional y respaldo en Supabase Cloud completado');
    } catch (e) {
      console.warn('Error al respaldar en Supabase:', e);
      showCopiedAlert('Advertencia: Revisa la conexión con Supabase');
    } finally {
      setIsSyncingSupabase(false);
    }
  };
  const [contractValueCLP, setContractValueCLP] = useState<number>(
    selectedProj?.clientBilling?.totalQuoteCLP || matchingDeal?.valueCLP || 450000
  );
  const [contractPaymentTerms, setContractPaymentTerms] = useState<string>(
    '50% de anticipo al inicio de los trabajos y 50% contra entrega conforme del informe técnico final'
  );
  const [contractTaxDoc, setContractTaxDoc] = useState<'factura' | 'boleta' | 'exento'>(
    selectedProj?.clientBilling?.taxDocument || 'factura'
  );

  // Estados para Subir / Registrar "Otros Documentos & Archivos Externos"
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<ProjectExternalDoc['category']>('contrato_firmado');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [newDocFileUrl, setNewDocFileUrl] = useState('');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocFileSize, setNewDocFileSize] = useState('');

  // Notificación de copia
  const showCopiedAlert = (msg: string) => {
    setCopiedNotification(msg);
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  // Generador de PDF Real y Formal con Maquetación Legal Chilena
  const handlePrintToPDF = (docTitle: string, docText: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes en tu navegador para generar el PDF.');
      return;
    }

    const isMarkdownReport = docText.includes('# INFORME EJECUTIVO');

    // Construcción de firmas legal formal en HTML (dos columnas alineadas)
    const signaturesHtml = `
      <table class="signatures-table">
        <tr>
          <td class="sig-cell">
            <div class="sig-blank-space"></div>
            <div class="sig-rule"></div>
            <div class="sig-title">
              ${contractClientType === 'empresa' ? `p.p. ${dispClientName}` : dispClientName}
            </div>
            <div class="sig-field"><strong>RUT:</strong> ${dispClientRUT}</div>
            ${
              contractClientType === 'empresa'
                ? `
              <div class="sig-field"><strong>Rep. Legal:</strong> ${dispLegalRepName}</div>
              <div class="sig-field"><strong>RUT Rep. Legal:</strong> ${dispLegalRepRUT}</div>
              <div class="sig-field"><strong>Calidad:</strong> Representante Legal Autorizado</div>
            `
                : `
              <div class="sig-field"><strong>Calidad:</strong> Mandante / Titular Persona Natural</div>
            `
            }
            <div class="sig-field"><strong>Email:</strong> ${dispClientEmail}</div>
            <div class="sig-field"><strong>Tel:</strong> ${dispClientPhone}</div>
            <div class="sig-date">Santiago, ${new Date().toLocaleDateString('es-CL')}</div>
          </td>
          <td class="sig-cell">
            <div class="sig-blank-space"></div>
            <div class="sig-rule"></div>
            <div class="sig-title">${dispProviderName}</div>
            <div class="sig-field"><strong>RUT:</strong> ${dispProviderRUT}</div>
            <div class="sig-field"><strong>Calidad:</strong> Prestadora / Consultora Técnica de Software</div>
            <div class="sig-field"><strong>Organización:</strong> LSC Operations & Systems</div>
            <div class="sig-field"><strong>Jurisdicción:</strong> Santiago de Chile</div>
            <div class="sig-date">Santiago, ${new Date().toLocaleDateString('es-CL')}</div>
          </td>
        </tr>
      </table>
    `;

    // Procesamiento del cuerpo para que luzca como contrato auténtico notarial
    let bodyFormattedHtml = '';
    if (isMarkdownReport) {
      const lines = docText.split('\n');
      bodyFormattedHtml = lines
        .map((line) => {
          if (line.startsWith('# ')) return `<h1 class="report-h1">${line.replace('# ', '')}</h1>`;
          if (line.startsWith('## ')) return `<h2 class="report-h2">${line.replace('## ', '')}</h2>`;
          if (line.startsWith('---')) return `<hr class="report-divider"/>`;
          if (line.startsWith('* **')) {
            const clean = line.replace(/^\*\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<li class="report-li">${clean}</li>`;
          }
          if (line.trim().startsWith('* [ ]') || line.trim().startsWith('* [x]')) {
            const isChecked = line.includes('[x]');
            const textOnly = line.replace(/\*\s*\[[ x]\]\s*/, '');
            return `<div class="report-task"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled/> <span>${textOnly}</span></div>`;
          }
          if (line.trim()) {
            const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<p class="report-p">${formatted}</p>`;
          }
          return '';
        })
        .join('');
    } else {
      // Filtrar separadores ASCII y firmas crudas
      const cleanText = docText
        .split('FIRMAS Y COMPARECENCIA:')[0]
        .split('FIRMAS Y COMPARECENCIA FORMAL:')[0]
        .replace(/={10,}/g, '')
        .replace(/-{10,}/g, '')
        .trim();

      const paragraphs = cleanText.split('\n\n');
      bodyFormattedHtml = paragraphs
        .map((p) => {
          const trimmed = p.trim();
          if (!trimmed) return '';
          if (trimmed.startsWith('ANEXO N°') || trimmed.startsWith('CONTRATO MAESTRO')) {
            return `<h2 class="legal-annex-title">${trimmed}</h2>`;
          }
          if (
            trimmed.startsWith('PRIMERA:') ||
            trimmed.startsWith('SEGUNDA:') ||
            trimmed.startsWith('TERCERA:') ||
            trimmed.startsWith('CUARTA:') ||
            trimmed.startsWith('QUINTA:') ||
            trimmed.startsWith('SEXTA:') ||
            trimmed.startsWith('SÉPTIMA:') ||
            trimmed.startsWith('CLÁUSULA') ||
            /^[1-9]\.\s+[A-Z]/.test(trimmed)
          ) {
            const firstColon = trimmed.indexOf(':');
            if (firstColon !== -1) {
              const clauseTitle = trimmed.substring(0, firstColon + 1);
              const clauseBody = trimmed.substring(firstColon + 1);
              return `<div class="clause-block"><div class="clause-heading">${clauseTitle}</div><div class="clause-text">${clauseBody.replace(/\n/g, '<br/>')}</div></div>`;
            }
            return `<div class="clause-block"><div class="clause-heading">${trimmed.split('\n')[0]}</div><div class="clause-text">${trimmed.substring(trimmed.indexOf('\n') + 1).replace(/\n/g, '<br/>')}</div></div>`;
          }
          return `<p class="legal-paragraph">${trimmed.replace(/\n/g, '<br/>')}</p>`;
        })
        .join('');
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${docTitle} - República de Chile</title>
  <style>
    @page {
      size: letter;
      margin: 22mm 18mm 22mm 18mm;
      @bottom-right {
        content: "Página " counter(page);
        font-family: 'Times New Roman', Times, serif;
        font-size: 8.5pt;
        color: #4b5563;
      }
    }
    body {
      font-family: 'Times New Roman', Times, Georgia, "DejaVu Serif", serif;
      color: #111827;
      background: #ffffff;
      padding: 0;
      margin: 0;
      line-height: 1.6;
      font-size: 11pt;
      text-align: justify;
    }
    .official-header {
      text-align: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .republic-banner {
      font-size: 9.5pt;
      font-weight: bold;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      color: #374151;
      margin-bottom: 3px;
    }
    .legal-subtitle {
      font-size: 8pt;
      color: #4b5563;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin-bottom: 8px;
    }
    .doc-main-title {
      font-size: 13pt;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      margin: 6px 0;
      letter-spacing: 0.5px;
      line-height: 1.35;
    }
    .meta-summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 14px 0 20px 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 9pt;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
    }
    .meta-summary-table td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .meta-label {
      font-weight: bold;
      color: #334155;
      width: 25%;
    }
    .meta-value {
      color: #0f172a;
    }
    .legal-paragraph {
      margin-bottom: 14px;
      text-indent: 1.5em;
      line-height: 1.65;
    }
    .clause-block {
      margin-top: 16px;
      margin-bottom: 14px;
    }
    .clause-heading {
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      font-size: 10.5pt;
      margin-bottom: 4px;
    }
    .clause-text {
      text-indent: 1.5em;
      line-height: 1.6;
    }
    .legal-annex-title {
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      margin: 15px 0 10px 0;
      text-transform: uppercase;
      color: #0f172a;
    }
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .sig-cell {
      width: 50%;
      vertical-align: top;
      text-align: center;
      padding: 0 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .sig-blank-space {
      height: 60px;
    }
    .sig-rule {
      border-top: 1.5px solid #0f172a;
      width: 85%;
      margin: 0 auto 8px auto;
    }
    .sig-title {
      font-weight: bold;
      font-size: 10pt;
      color: #0f172a;
    }
    .sig-field {
      font-size: 8.5pt;
      color: #334155;
      margin-top: 2px;
      line-height: 1.35;
    }
    .sig-date {
      font-size: 8pt;
      color: #64748b;
      margin-top: 5px;
    }
    .official-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 8px;
      margin-top: 35px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 7.5pt;
      color: #64748b;
      text-align: center;
      line-height: 1.4;
    }
    .report-h1 { font-size: 14pt; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 6px; }
    .report-h2 { font-size: 12pt; color: #1e293b; margin-top: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .report-p { margin-bottom: 10px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 9.5pt; }
    .report-li { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 9.5pt; margin-bottom: 4px; }
    .report-task { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 9.5pt; margin: 4px 0; }
    .report-divider { border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="official-header">
    <div class="republic-banner">REPÚBLICA DE CHILE</div>
    <div class="legal-subtitle">DOCUMENTO OFICIAL DE AUDITORÍA Y GOBERNANZA TÉCNICA · VALIDEZ LEGAL LEY N° 19.799 & LEY N° 21.459</div>
    <div class="doc-main-title">${docTitle}</div>
  </div>

  <table class="meta-summary-table">
    <tr>
      <td class="meta-label">Plataforma / URL Auditada:</td>
      <td class="meta-value"><strong>${contractUrl}</strong></td>
      <td class="meta-label">Fecha Suscripción:</td>
      <td class="meta-value">${new Date().toLocaleDateString('es-CL')}</td>
    </tr>
    <tr>
      <td class="meta-label">Régimen Jurídico:</td>
      <td class="meta-value">
        ${
          currentOwnership === 'solidario'
            ? 'Voluntariado Solidario / Pro-Bono (Soberanía Técnica 100%)'
            : currentOwnership === 'cliente'
            ? `Comercial (${contractClientType === 'empresa' ? 'Empresa / Persona Jurídica' : 'Persona Natural'})`
            : 'Plataforma de Propiedad Propia'
        }
      </td>
      <td class="meta-label">Ciudad / Jurisdicción:</td>
      <td class="meta-value">Santiago de Chile</td>
    </tr>
    <tr>
      <td class="meta-label">Mandante / Cliente:</td>
      <td class="meta-value">
        <strong>${dispClientName}</strong> (RUT: ${dispClientRUT})<br/>
        ${contractClientType === 'empresa' ? `<em>Rep. Legal:</em> ${dispLegalRepName} (RUT: ${dispLegalRepRUT})<br/>` : ''}
        <em>Contacto:</em> ${dispClientEmail} · ${dispClientPhone}
      </td>
      <td class="meta-label">Prestadora Técnica:</td>
      <td class="meta-value">
        <strong>${dispProviderName}</strong> (RUT: ${dispProviderRUT})<br/>
        <em>Rol:</em> Auditora Técnica de Software & Consultora LSC
      </td>
    </tr>
    ${
      includePricing && currentOwnership === 'cliente'
        ? `
    <tr>
      <td class="meta-label">Condición Económica:</td>
      <td colspan="3" class="meta-value">
        <strong>$${contractValueCLP.toLocaleString('es-CL')} CLP</strong> (${contractTaxDoc.toUpperCase()}) — ${contractPaymentTerms}
      </td>
    </tr>
    `
        : ''
    }
  </table>

  <div class="document-body">
    ${bodyFormattedHtml}
  </div>

  ${!isMarkdownReport ? signaturesHtml : ''}

  <div class="official-footer">
    Documento oficial generado por el Sistema de Telemetría y Gestión de Proyectos LSC Admin.<br/>
    Conforme a las leyes de la República de Chile: Ley N° 19.799 (Firma Electrónica), Ley N° 21.459 (Delitos Informáticos) y Ley N° 19.628 (Protección de Datos Personales).
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Función para alternar el tipo de proyecto (propio, cliente, solidario) y persistirlo
  const handleSetOwnership = (type: 'propio' | 'cliente' | 'solidario') => {
    if (!selectedProj) return;
    const updated = state.monitoredProjects.map((p) =>
      p.id === selectedProj.id ? { ...p, projectOwnershipType: type } : p
    );
    const newState: AppState = { ...state, monitoredProjects: updated };
    saveAppState(newState);
    if (onUpdateState) {
      onUpdateState(newState);
    }
  };

  // Subir / Procesar archivo local a Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewDocFileName(file.name);
    const sizeKB = (file.size / 1024).toFixed(1);
    setNewDocFileSize(`${sizeKB} KB`);
    if (!newDocTitle) {
      setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setNewDocFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Guardar documento externo en el proyecto
  const handleAddExternalDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProj || (!newDocFileUrl && !newDocFileName && !newDocTitle)) return;

    const newDoc: ProjectExternalDoc = {
      id: `doc-${Date.now()}`,
      title: newDocTitle || newDocFileName || 'Documento sin título',
      category: newDocCategory,
      fileName: newDocFileName || 'archivo_externo.pdf',
      fileUrl: newDocFileUrl || '#',
      fileSize: newDocFileSize || 'N/A',
      date: new Date().toLocaleDateString('es-CL'),
      notes: newDocNotes || undefined,
    };

    const currentDocs = selectedProj.externalDocs || [];
    const updatedDocs = [newDoc, ...currentDocs];

    const updatedProjects = state.monitoredProjects.map((p) =>
      p.id === selectedProj.id ? { ...p, externalDocs: updatedDocs } : p
    );

    const newState: AppState = { ...state, monitoredProjects: updatedProjects };
    saveAppState(newState);
    if (onUpdateState) {
      onUpdateState(newState);
    }

    // Respaldar también en Supabase Cloud
    syncDocumentationToSupabase({
      id: newDoc.id,
      projectId: selectedProj.id,
      clientId: matchingClient?.id,
      docTitle: newDoc.title,
      docCategory: newDoc.category,
      fileName: newDoc.fileName,
      fileSize: newDoc.fileSize,
      notes: newDoc.notes,
    });

    // Limpiar formulario
    setNewDocTitle('');
    setNewDocNotes('');
    setNewDocFileUrl('');
    setNewDocFileName('');
    setNewDocFileSize('');
    showCopiedAlert('¡Documento registrado y respaldado exitosamente!');
  };

  // Eliminar documento externo
  const handleDeleteDoc = (docId: string) => {
    if (!selectedProj) return;
    const currentDocs = selectedProj.externalDocs || [];
    const updatedDocs = currentDocs.filter((d) => d.id !== docId);

    const updatedProjects = state.monitoredProjects.map((p) =>
      p.id === selectedProj.id ? { ...p, externalDocs: updatedDocs } : p
    );

    const newState: AppState = { ...state, monitoredProjects: updatedProjects };
    saveAppState(newState);
    if (onUpdateState) {
      onUpdateState(newState);
    }
    supabase.from('project_documentation').delete().eq('id', docId).then(() => {});
    showCopiedAlert('Documento eliminado.');
  };

  // Checklist interactivo de pre-vuelo (Pre-Flight)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    authSigned: false,
    hostingNotified: false,
    backupCompleted: false,
    stagingAvailable: false,
    offPeakScheduled: true,
    rollbackReady: false,
  });

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // -------------------------------------------------------------
  // GENERADORES DE DOCUMENTOS INDIVIDUALES (ANEXOS 1 AL 6)
  // -------------------------------------------------------------

  const textoComparecenciaCliente =
    contractClientType === 'empresa'
      ? `el CLIENTE: la empresa ${dispClientName}, Rol Único Tributario N° ${dispClientRUT}, representada por su Representante Legal don/doña ${dispLegalRepName}, Cédula de Identidad N° ${dispLegalRepRUT}, correo ${dispClientEmail}, fono ${dispClientPhone}, titular o administrador de ${contractUrl}`
      : `el CLIENTE: don/doña ${dispClientName}, Cédula de Identidad N° ${dispClientRUT}, correo ${dispClientEmail}, fono ${dispClientPhone}, titular o administrador de ${contractUrl}`;

  const textoComparecenciaPrestadora = `la PRESTADORA / AUDITORA: doña ${dispProviderName}, Cédula de Identidad N° ${dispProviderRUT}, consultora y desarrolladora de software`;

  const bloqueFirmas = `--------------------------------------------------------------------------------
FIRMAS Y COMPARECENCIA FORMAL:
--------------------------------------------------------------------------------
[FIRMA CLIENTE / MANDANTE]                  [FIRMA PRESTADORA / AUDITORA]
${
  contractClientType === 'empresa'
    ? `p.p. ${dispClientName}
RUT Empresa: ${dispClientRUT}
Rep. Legal: ${dispLegalRepName}
RUT Rep.: ${dispLegalRepRUT}
Email: ${dispClientEmail}
Tel: ${dispClientPhone}
Calidad: Representante Legal Autorizado`
    : `Nombre: ${dispClientName}
RUT: ${dispClientRUT}
Email: ${dispClientEmail}
Tel: ${dispClientPhone}
Calidad: Mandante Persona Natural`
}
                                            Nombre: ${dispProviderName}
                                            RUT: ${dispProviderRUT}
                                            Rol: Consultora / Auditora Técnica LSC
                                            Fecha: ${new Date().toLocaleDateString('es-CL')}
Fecha: ${new Date().toLocaleDateString('es-CL')}`;

  const anexo1Individual = `================================================================================
ANEXO N° 1: AUTORIZACIÓN EXPRESA PARA AUDITORÍA DE RENDIMIENTO Y SEGURIDAD INFORMÁTICA
(Regulado conforme a la Ley N° 21.459 sobre Delitos Informáticos en Chile)
================================================================================

En Santiago de Chile, a ${new Date().toLocaleDateString('es-CL')}, comparecen:
Por una parte, ${textoComparecenciaCliente}.
Y por la otra, ${textoComparecenciaPrestadora}.

Las partes suscriben el presente ANEXO INDIVIDUAL bajo las siguientes cláusulas:

PRIMERA: OBJETO DEL ANEXO
El CLIENTE otorga su consentimiento expreso, libre e informado a la PRESTADORA para ejecutar pruebas diagnósticas de carga, estrés controlado y evaluación de vulnerabilidades perimetrales sobre la infraestructura web del dominio ${contractUrl}. En virtud de los artículos 2°, 4° y 7° de la Ley N° 21.459, se deja constancia de que los accesos y pruebas cuentan con autorización legítima del titular del sistema informático.

SEGUNDA: CONDICIONES TÉCNICAS Y VENTANA HORARIA
Las evaluaciones se ejecutarán estrictamente bajo los siguientes parámetros:
- Ventana Horaria Autorizada: ${contractTimeWindow}
- Herramientas y Protocolos Autorizados: ${contractTools}
- Criterio de Aborto Preventivo: Si la latencia media supera 2.500 ms o la tasa de fallos excede el 5%, la prueba se detendrá inmediatamente.

TERCERA: EXENCIÓN Y LÍMITES DE RESPONSABILIDAD
El CLIENTE reconoce que el objetivo natural de la prueba es identificar el punto de quiebre de la plataforma. La PRESTADORA queda exenta de responsabilidad civil o comercial por indisponibilidades transitorias o suspensiones automáticas aplicadas por proveedores de hosting compartido.

${bloqueFirmas}`;

  const anexo2Individual = `================================================================================
ANEXO N° 2: DECLARACIÓN DE INFRAESTRUCTURA DE HOSTING Y LÍMITES OPERATIVOS (ToS)
================================================================================

PROYECTO: ${contractUrl}
CLIENTE: ${dispClientName} (RUT: ${dispClientRUT})
FECHA: ${new Date().toLocaleDateString('es-CL')}

1. ALCANCE DEL ENTORNO DE ALOJAMIENTO
El CLIENTE declara que el sitio opera bajo la infraestructura contratada a su nombre, reconociendo que los servidores de Hosting Compartido (cPanel / Apache / LiteSpeed) imponen límites estrictos de CPU (100% de 1 core), Memoria Física (Physical Memory Limit) y Procesos de Entrada (Entry Processes - EP).

2. PROTOCOLO ANTE PROVEEDORES DE HOSTING (ToS)
Las partes acuerdan que toda prueba en producción se iniciará con un escalamiento gradual (5 a 10 VUs iniciales). El CLIENTE asume la obligación de notificar a su proveedor de hosting en caso de requerirse pruebas que superen 50 peticiones por segundo concurrentes para evitar sanciones o bloqueos por cPHulk/Fail2Ban.

3. RECOMENDACIÓN DE ENTORNO STAGING
La PRESTADORA sugiere formalmente al CLIENTE habilitar un entorno réplica (Staging / VPS) para pruebas que requieran llevar el servidor al límite destructivo.

${bloqueFirmas}`;

  const anexo3Individual = `================================================================================
ANEXO N° 3: ESPECIFICACIONES TÉCNICAS DE MEDICIÓN, SLAS Y CRITERIOS DE ACEPTACIÓN
================================================================================

PROYECTO: ${contractUrl}
BENEFICIARIO / CLIENTE: ${dispClientName} (RUT: ${dispClientRUT})

Se deja constancia de las 5 métricas que gobernarán el informe técnico final y la aceptación del servicio:

1. LATENCIA Y TIEMPO DE RESPUESTA (P95 / P99):
   - Se medirá el tiempo de respuesta bajo carga normal y bajo estrés.
   - Umbral de éxito óptimo: P95 < 500 ms (Aprobación Googlebot y Core Web Vitals).
2. TASA MÁXIMA DE ERROR (HTTP 5xx / Timeouts):
   - La tasa de solicitudes no atendidas o caídas debe ser inferior al 1.0% en régimen normal.
3. CAPACIDAD DE RENDIMIENTO (RPS):
   - Identificación de las Peticiones por Segundo que la arquitectura procesa sin encolamiento.
4. MONITOREO DE SATURACIÓN DE RECURSOS:
   - Uso de CPU, memoria RAM y pool de conexiones a la base de datos (Postgres / MySQL).
5. IDENTIFICACIÓN DEL CUELLO DE BOTELLA:
   - Diagnóstico concluyente indicando si el límite radica en la base de datos, PHP, o el servidor web.

${bloqueFirmas}`;

  const anexo4Individual = `================================================================================
ANEXO N° 4: MATRIZ DE HERRAMIENTAS AUTORIZADAS Y PROTOCOLOS DE DIAGNÓSTICO
================================================================================

DOMINIO AUDITADO: ${contractUrl}
CLIENTE: ${dispClientName} (RUT: ${dispClientRUT})

El CLIENTE autoriza expresamente el despliegue y uso de las siguientes suites tecnológicas:
1. RENDIMIENTO & CARGA:
   - k6 (Grafana Labs): Inyección progresiva de peticiones vía scripts JavaScript.
   - Locust (Python): Generación distribuida de usuarios virtuales.
   - Google Lighthouse & GTmetrix: Auditoría de renderizado en frontend (FCP, LCP, CLS).
2. CIBERSEGURIDAD PREVENTIVA:
   - OWASP ZAP (Zed Attack Proxy): Escaneo preventivo de inyecciones y fallas de seguridad web.
   - Verificación de Cabeceras HTTP: Comprobación de HSTS, CSP y X-Frame-Options.
3. TELEMETRÍA Y MONITORIZACIÓN CONTINUA:
   - SDK JS LSC v2.1 (sendBeacon) y Uptime Kuma para detección instantánea de caídas.

${bloqueFirmas}`;

  const anexo5Individual = `================================================================================
ANEXO N° 5: ACUERDO DE MONITOREO CONTINUO, CASOS DE ESTUDIO Y PORTAFOLIO
================================================================================

PROYECTO: ${contractUrl}
CLIENTE: ${dispClientName} (RUT: ${dispClientRUT})

1. MODELO DE CONTINUIDAD OPERATIVA
Las partes acuerdan que tras la emisión del informe técnico inicial, la PRESTADORA podrá prestar servicios de telemetría y soporte recurrente bajo modalidad mensual.

2. DERECHO DE EXHIBICIÓN EN PORTAFOLIO (CASOS DE ÉXITO)
El CLIENTE autoriza a la PRESTADORA a incorporar los hallazgos técnicos, métricas de mejora de rendimiento y tiempos de respuesta en su portafolio comercial, siempre que:
a) Se disfracen o anonimicen datos sensibles o información personal de usuarios finales.
b) Se respete la reputación comercial del negocio o causa comunitaria.

${bloqueFirmas}`;

  const anexo6Individual = `================================================================================
ANEXO N° 6: ACUERDO DE CONFIDENCIALIDAD (NDA) Y POLÍTICA DE NO RETENCIÓN
(Conforme a la Ley N° 19.628 sobre Protección de la Vida Privada en Chile)
================================================================================

PROYECTO: ${contractUrl}
CLIENTE: ${dispClientName} (RUT: ${dispClientRUT})

1. CONFIDENCIALIDAD ESTRICTA
Toda información comercial, registros de clientes, credenciales temporales de base de datos o acceso a servidores cPanel transmitidos para la ejecución del servicio tendrán la calidad de secreto confidencial.

2. POLÍTICA DE NO RETENCIÓN DE CREDENCIALES
La PRESTADORA no almacenará en repositorios públicos ni compartirá con terceros ninguna contraseña sensible. Al concluir la auditoría técnica, el CLIENTE se compromete a revocar o modificar las contraseñas temporales suministradas.

3. DESTRUCCIÓN SEGURA
Los registros de tráfico brutos y dumps temporales de depuración serán eliminados una vez consolidado el informe final.

${bloqueFirmas}`;

  // -------------------------------------------------------------
  // DOCUMENTO MAESTRO COMPLETO (CONTRATO GENERAL CONSOLIDADO)
  // -------------------------------------------------------------

  const contratoMaestroConsolidado = `================================================================================
CONTRATO MAESTRO DE PRESTACIÓN DE SERVICIOS DIGITALES, AUDITORÍA DE RENDIMIENTO
Y GOBERNANZA TÉCNICA DE INFRAESTRUCTURA
================================================================================

En la ciudad de Santiago de Chile, a ${new Date().toLocaleDateString('es-CL')}, entre:

1. LA PRESTADORA: Doña ${dispProviderName}, desarrolladora de software y consultora de operaciones digitales, RUT N° ${dispProviderRUT}, con domicilio en Santiago, Chile; y

2. ${
    currentOwnership === 'solidario'
      ? 'LA ENTIDAD BENEFICIARIA (VOLUNTARIADO SOLIDARIO)'
      : contractClientType === 'empresa'
      ? 'EL CLIENTE (PERSONA JURÍDICA)'
      : 'EL CLIENTE (PERSONA NATURAL)'
  }: ${
    contractClientType === 'empresa'
      ? `la empresa ${dispClientName}, Rol Único Tributario N° ${dispClientRUT}, debidamente representada conforme a sus estatutos por don/doña ${dispLegalRepName}, Cédula Nacional de Identidad N° ${dispLegalRepRUT}, correo de contacto ${dispClientEmail}, teléfono ${dispClientPhone}`
      : `don/doña ${dispClientName}, Cédula Nacional de Identidad N° ${dispClientRUT}, correo de contacto ${dispClientEmail}, teléfono ${dispClientPhone}`
  }, en adelante también "la Contraparte" o "el MANDANTE".

Las partes acuerdan celebrar el presente Contrato Maestro de Servicios Técnicos, el cual se regirá por las leyes de la República de Chile (en particular la Ley N° 21.459 sobre Delitos Informáticos, Ley N° 19.628 de Protección de Datos Personales, y Ley N° 19.799 sobre Documentos y Firma Electrónica), y por las cláusulas que a continuación se estipulan:

--------------------------------------------------------------------------------
CLÁUSULA PRIMERA: OBJETO DEL CONTRATO
--------------------------------------------------------------------------------
La PRESTADORA se compromete a prestar a la Contraparte servicios integrales de ingeniería web, auditoría de rendimiento (Load & Stress Testing), diagnóstico preventivo de seguridad y configuración de telemetría continua sobre el dominio web:
${contractUrl}

--------------------------------------------------------------------------------
CLÁUSULA SEGUNDA: RÉGIMEN OPERATIVO Y NATURALEZA DEL PROYECTO
--------------------------------------------------------------------------------
${
  currentOwnership === 'solidario'
    ? `RÉGIMEN DE VOLUNTARIADO SOLIDARIO (PRO-BONO):
Se deja constancia formal de que el presente proyecto ha sido concebido e implementado en modalidad de voluntariado 100% gratuito y pro-bono, sin cobro de honorarios ni lucro comercial.
En consecuencia:
a) SOBERANÍA TÉCNICA 100% RESERVADA: La PRESTADORA retiene y ejerce la soberanía técnica plena sobre la arquitectura de código, decisiones de despliegue y pruebas de carga como si se tratase de una plataforma de propiedad propia.
b) EXENCIÓN TOTAL DE INDEMNIZACIONES: Al tratarse de una donación tecnológica sin contraprestación pecuniaria, la Contraparte exime plenamente a la PRESTADORA de indemnizaciones mercantiles o penalizaciones por indisponibilidad de proveedores de hosting externos.`
    : currentOwnership === 'cliente'
    ? `RÉGIMEN DE CLIENTE COMERCIAL:
El presente contrato constituye un acuerdo de prestación de servicios profesionales de consultoría técnica y auditoría. La Contraparte autoriza en forma expresa las pruebas técnicas requeridas para asegurar el cumplimiento de estándares de velocidad (Google Core Web Vitals) y ciberseguridad.`
    : `RÉGIMEN DE PLATAFORMA PROPIA:
La plataforma opera bajo el dominio y propiedad patrimonial directa de la PRESTADORA, con facultades irrestrictas de administración y auditoría continua.`
}

--------------------------------------------------------------------------------
CLÁUSULA TERCERA: PRECIO, FORMA DE PAGO Y CONDICIONES COMERCIALES
--------------------------------------------------------------------------------
${
  includePricing && currentOwnership === 'cliente'
    ? `1. HONORARIOS TOTALES ACORDADOS: El precio total por los servicios técnicos y emisión del informe ejecutivo asciende a la suma de $${contractValueCLP.toLocaleString('es-CL')} CLP (pesos chilenos).
2. DOCUMENTO TRIBUTARIO: Se emitirá ${contractTaxDoc.toUpperCase()} conforme a las normas vigentes del Servicio de Impuestos Internos (SII).
3. FORMA DE PAGO: ${contractPaymentTerms}.
4. MORA: El retardo en el pago devengará el interés máximo convencional legal permitido por la ley chilena.`
    : `ACUERDO OPERATIVO TÉCNICO (SIN ESPECIFICACIÓN DE PRECIO O PRO-BONO):
El presente documento regula exclusivamente las condiciones técnicas, operativas y de limitación de responsabilidad de la plataforma digital, rigiéndose las condiciones arancelarias por las cotizaciones o acuerdos anexos suscritos por separado.`
}

--------------------------------------------------------------------------------
CLÁUSULA CUARTA: AUTORIZACIÓN DE PRUEBAS DE ESTRÉS Y CIBERSEGURIDAD
(Cumplimiento Ley N° 21.459 de Delitos Informáticos)
--------------------------------------------------------------------------------
La Contraparte autoriza a la PRESTADORA a ejecutar pruebas de carga masiva y escaneos de seguridad preventiva mediante las herramientas ${contractTools}, en la ventana horaria: ${contractTimeWindow}.
Las partes reconocen que las pruebas buscan deliberadamente encontrar el punto de saturación y cuellos de botella de la infraestructura de hosting, por lo que la PRESTADORA no será responsable de interrupciones transitorias de servicio derivadas de la ejecución de estas pruebas.

--------------------------------------------------------------------------------
CLÁUSULA QUINTA: HOSTING Y LIMITACIONES DE INFRAESTRUCTURA
--------------------------------------------------------------------------------
La Contraparte reconoce que si el sitio opera en Hosting Compartido (cPanel / Apache), existen restricciones impuestas por el proveedor relativas a límites de procesos concurrentes (EP) y protección contra fuerza bruta (cPHulk / Fail2Ban). La PRESTADORA adoptará protocolos de escalamiento progresivo para mitigar riesgos de suspensión de cuenta.

--------------------------------------------------------------------------------
CLÁUSULA SEXTA: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS PERSONALES
(Ley N° 19.628 de Protección de la Vida Privada)
--------------------------------------------------------------------------------
Toda información transmitida entre las partes será confidencial. La PRESTADORA aplicará el principio de no retención de credenciales sensibles, debiendo la Contraparte modificar cualquier contraseña de prueba tras la entrega del informe.

--------------------------------------------------------------------------------
CLÁUSULA SÉPTIMA: LEGISLACIÓN APLICABLE Y JURISDICCIÓN
--------------------------------------------------------------------------------
Para todos los efectos legales y derivados de este contrato, las partes fijan su domicilio en la ciudad y comuna de Santiago, sometiéndose a la jurisdicción de sus Tribunales Ordinarios de Justicia.

${bloqueFirmas}`;

  // Cláusula / anexo actual a mostrar según la pestaña
  const getCurrentAnnexText = () => {
    switch (activeTab) {
      case 1:
        return anexo1Individual;
      case 2:
        return anexo2Individual;
      case 3:
        return anexo3Individual;
      case 4:
        return anexo4Individual;
      case 5:
        return anexo5Individual;
      case 6:
        return anexo6Individual;
      case 8:
        return contratoMaestroConsolidado;
      default:
        return anexo1Individual;
    }
  };

  const getCurrentAnnexTitle = () => {
    switch (activeTab) {
      case 1:
        return 'Anexo 1: Autorización Expresa de Pruebas de Carga y Seguridad';
      case 2:
        return 'Anexo 2: Declaración de Hosting y Límites Operativos';
      case 3:
        return 'Anexo 3: Especificaciones de Medición, KPIs y SLAs';
      case 4:
        return 'Anexo 4: Matriz de Herramientas y Protocolos Diagnósticos';
      case 5:
        return 'Anexo 5: Acuerdo de Monitoreo Continuo y Portafolio';
      case 6:
        return 'Anexo 6: Acuerdo de Confidencialidad NDA';
      case 8:
        return 'Contrato Maestro General de Servicios Digitales';
      default:
        return 'Documento Legal Oficial LSC';
    }
  };

  const reportTemplateMarkdown = `# INFORME EJECUTIVO DE AUDITORÍA DE RENDIMIENTO Y ESTRÉS
**Proyecto:** ${contractUrl}
**Tipo de Entorno:** ${currentOwnership === 'solidario' ? 'Proyecto Solidario / Voluntariado (Pro-Bono)' : currentOwnership === 'cliente' ? 'Sitio de Cliente Comercial' : 'Plataforma Propia'}
**Cliente / Beneficiario:** ${dispClientName}
**Fecha de Evaluación:** ${new Date().toLocaleDateString('es-CL')}
**Auditor Responsable:** ${dispProviderName} (LSC Operations)

---

## 1. RESUMEN EJECUTIVO
Se ejecutó una prueba de carga progresiva y estrés sobre el entorno en producción para validar la capacidad del servidor frente a picos de tráfico y asegurar que el tiempo de respuesta no perjudique el rastreo orgánico de Googlebot (Core Web Vitals).

* **Estado General:** [🟢 Aprobado / 🟡 Con Observaciones / 🔴 Crítico]
* **Capacidad Máxima Concurrente Soportada:** [Ej: 80 usuarios simultáneos / 120 RPS]
* **Latencia Promedio en Carga Normal:** [Ej: 240 ms]
* **Latencia P95 bajo Estrés:** [Ej: 1.150 ms]
* **Tasa de Errores HTTP:** [Ej: 0.0% en carga normal / 4.2% en pico máximo]

---

## 2. HALLAZGOS Y CUELLOS DE BOTELLA IDENTIFICADOS
1. **Base de Datos:** [Ej: Agotamiento del pool de conexiones tras superar 50 consultas concurrentes.]
2. **Servidor Web / Hosting:** [Ej: Hosting compartido cPanel con límite de procesos concurrentes (EP) configurado en 20.]
3. **Frontend y Caché:** [Ej: Ausencia de cabeceras de caché 'Cache-Control' en assets estáticos.]

---

## 3. IMPACTO DIRECTO EN POSICIONAMIENTO SEO & GOOGLEBOT
* Con una latencia inferior a 400 ms, Googlebot indexa la totalidad del catálogo sin reducir la tasa de rastreo.
* Se recomienda mantener el SLA superior al 98.0% para evitar penalizaciones en Google Search Console.

---

## 4. PLAN DE MITIGACIÓN & RECOMENDACIONES
* [ ] Implementar CDN de borde mediante Cloudflare (Plan Gratuito).
* [ ] Optimizar índices en tablas críticas de base de datos.
* [ ] Migrar de hosting compartido a VPS en caso de proyectar más de 200 visitas simultáneas en campañas.`;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-200 font-sans">
      {/* Toast de confirmación de copia */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 border border-emerald-400/30 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#202634] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight font-mono">
              DOCUMENTACIÓN TÉCNICA, LEGAL & PROTOCOLOS DE PRUEBA
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Marco legal regulatorio de Chile (Leyes 21.459, 19.628, 19.799), generación de PDFs, anexos individuales y contrato maestro consolidado.
          </p>
        </div>

        {/* Selector de Proyecto Monitoreado (Auto-descubierto desde Studio y Telemetría) */}
        <div className="flex items-center gap-2 bg-[#12151C] border border-[#202634] p-1.5 rounded-xl">
          <span className="text-[11px] text-slate-400 font-mono pl-2">Contexto Proyecto:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => {
              const newProjId = e.target.value;
              setSelectedProjectId(newProjId);
              const p = state.monitoredProjects.find((proj) => proj.id === newProjId);
              if (p) {
                setContractUrl(p.url || 'https://');
                setContractClientName(p.clientName || 'Cliente SpA');

                // Buscar cliente en state.clients
                const mc = state.clients?.find(
                  (c) =>
                    c.id === p.id ||
                    (p.clientName &&
                      (c.name?.toLowerCase().includes(p.clientName.toLowerCase()) ||
                        c.company?.toLowerCase().includes(p.clientName.toLowerCase()) ||
                        p.clientName.toLowerCase().includes(c.company?.toLowerCase() || ''))) ||
                    (p.name &&
                      (c.name?.toLowerCase().includes(p.name.toLowerCase()) ||
                        c.company?.toLowerCase().includes(p.name.toLowerCase()) ||
                        p.name.toLowerCase().includes(c.company?.toLowerCase() || '')))
                );

                const cType =
                  (localStorage.getItem(`lsc_client_type_${p.id}`) as any) ||
                  p.clientBilling?.clientType ||
                  'empresa';
                setContractClientType(cType);

                const cRut = localStorage.getItem(`lsc_client_rut_${p.id}`) || '';
                setContractClientRUT(cRut);

                const repName =
                  localStorage.getItem(`lsc_legal_rep_name_${p.id}`) ||
                  p.clientBilling?.legalRepresentativeName ||
                  '';
                setContractLegalRepName(repName);

                const repRut =
                  localStorage.getItem(`lsc_legal_rep_rut_${p.id}`) ||
                  p.clientBilling?.legalRepresentativeRUT ||
                  '';
                setContractLegalRepRUT(repRut);

                const email =
                  localStorage.getItem(`lsc_client_email_${p.id}`) ||
                  p.clientBilling?.clientEmail ||
                  mc?.email ||
                  (p.clientName?.toLowerCase().includes('conpi') || p.url?.includes('conpi.cl')
                    ? 'contacto@conpi.cl'
                    : '');
                setContractClientEmail(email);

                const phone =
                  localStorage.getItem(`lsc_client_phone_${p.id}`) ||
                  p.clientBilling?.clientPhone ||
                  mc?.phone ||
                  '';
                setContractClientPhone(phone);

                if (p.clientBilling?.totalQuoteCLP) {
                  setContractValueCLP(p.clientBilling.totalQuoteCLP);
                }
              }
            }}
            className="bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {state.monitoredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.projectOwnershipType ? p.projectOwnershipType.toUpperCase() : p.clientName || 'PROPIO'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Panel de Privacidad & Datos Legales de las Partes (Guardado 100% en Navegador, Cero Datos Duros en Git) */}
      <div className="bg-[#12151C] border border-[#202634] p-4 rounded-2xl space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202634] pb-2">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold text-xs">
              Datos Legales de las Partes (Protegidos en tu Navegador · Cero RUTs en GitHub):
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-slate-400 text-[10px] cursor-pointer">
            <input
              type="checkbox"
              checked={rememberPrivateData}
              onChange={(e) => setRememberPrivateData(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 focus:ring-0 bg-[#07090E]"
            />
            <span>Recordar de forma privada en este navegador</span>
          </label>
        </div>

        {/* Selector de Tipo de Cliente (Persona Natural vs Empresa) */}
        <div className="flex flex-wrap items-center gap-4 bg-[#0A0C10] p-2.5 rounded-xl border border-[#202634] text-[11px]">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wide">
            Naturaleza Jurídica del Cliente / Mandante:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white">
            <input
              type="radio"
              name="clientTypeRadio"
              value="empresa"
              checked={contractClientType === 'empresa'}
              onChange={() => handleClientTypeChange('empresa')}
              className="text-emerald-500 focus:ring-0 bg-[#161a24]"
            />
            <span className={contractClientType === 'empresa' ? 'text-emerald-400 font-bold' : ''}>
              Empresa / Persona Jurídica (con Representante Legal Autorizado)
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white">
            <input
              type="radio"
              name="clientTypeRadio"
              value="persona_natural"
              checked={contractClientType === 'persona_natural'}
              onChange={() => handleClientTypeChange('persona_natural')}
              className="text-emerald-500 focus:ring-0 bg-[#161a24]"
            />
            <span className={contractClientType === 'persona_natural' ? 'text-emerald-400 font-bold' : ''}>
              Persona Natural (Firma Directa)
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Si es Empresa */}
          {contractClientType === 'empresa' ? (
            <>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Razón Social Empresa Cliente *:</label>
                <input
                  type="text"
                  value={contractClientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  placeholder="Ej: CONPI Chile SpA"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">RUT Empresa Mandante *:</label>
                <input
                  type="text"
                  value={contractClientRUT}
                  onChange={(e) => handleClientRUTChange(e.target.value)}
                  placeholder="Ej: 76.543.210-K"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-amber-400 block mb-1">Representante Legal Autorizado *:</label>
                <input
                  type="text"
                  value={contractLegalRepName}
                  onChange={(e) => handleLegalRepNameChange(e.target.value)}
                  placeholder="Ej: Juan Pérez González"
                  className="w-full bg-[#0A0C10] border border-amber-500/30 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-amber-400 block mb-1">RUT Representante Legal *:</label>
                <input
                  type="text"
                  value={contractLegalRepRUT}
                  onChange={(e) => handleLegalRepRUTChange(e.target.value)}
                  placeholder="Ej: 15.678.901-2"
                  className="w-full bg-[#0A0C10] border border-amber-500/30 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Correo Electrónico Cliente *:</label>
                <input
                  type="email"
                  value={contractClientEmail}
                  onChange={(e) => handleClientEmailChange(e.target.value)}
                  placeholder="Ej: contacto@conpi.cl"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Teléfono Contacto Cliente *:</label>
                <input
                  type="text"
                  value={contractClientPhone}
                  onChange={(e) => handleClientPhoneChange(e.target.value)}
                  placeholder="Ej: +56 9 8765 4321"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* Si es Persona Natural */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Nombre Completo Cliente *:</label>
                <input
                  type="text"
                  value={contractClientName}
                  onChange={(e) => handleClientNameChange(e.target.value)}
                  placeholder="Ej: Juan Pérez González"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">RUT Cliente / Mandante *:</label>
                <input
                  type="text"
                  value={contractClientRUT}
                  onChange={(e) => handleClientRUTChange(e.target.value)}
                  placeholder="Ej: 15.678.901-2"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Correo Electrónico *:</label>
                <input
                  type="email"
                  value={contractClientEmail}
                  onChange={(e) => handleClientEmailChange(e.target.value)}
                  placeholder="Ej: cliente@gmail.com"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Teléfono Contacto *:</label>
                <input
                  type="text"
                  value={contractClientPhone}
                  onChange={(e) => handleClientPhoneChange(e.target.value)}
                  placeholder="Ej: +56 9 8765 4321"
                  className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          {/* Datos de la Consultora / Prestadora */}
          <div>
            <label className="text-[10px] text-emerald-400 block mb-1">Tu Nombre / Razón Consultora:</label>
            <input
              type="text"
              value={contractProviderName}
              onChange={(e) => handleProviderNameChange(e.target.value)}
              placeholder="Ej: Tiare Pérez Concha"
              className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-[10px] text-emerald-400 block mb-1">Tu RUT Consultora / Auditora:</label>
            <input
              type="text"
              value={contractProviderRUT}
              onChange={(e) => handleProviderRUTChange(e.target.value)}
              placeholder="Ej: 12.345.678-9 (Privado)"
              className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Selector de Tipo de Propiedad (3 Opciones: Propio / Cliente / Voluntariado-Solidario) */}
      <div className="bg-[#12151C] border border-[#202634] p-4 rounded-2xl space-y-3 font-mono text-xs shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202634] pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold text-xs uppercase tracking-wide">
              Régimen Jurídico & Operativo del Proyecto: <span className="text-emerald-400">{selectedProj?.name}</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Haz clic para alternar el régimen legal y adaptar automáticamente los contratos y anexos:
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Opción 1: Sitio Propio */}
          <button
            type="button"
            onClick={() => handleSetOwnership('propio')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentOwnership === 'propio'
                ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500'
                : 'bg-[#0A0C10] border-[#202634] text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  <span>1. Sitio Propio</span>
                </span>
                {currentOwnership === 'propio' && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.5 rounded-full font-bold">
                    ACTIVO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Plataforma interna personal. Control y derecho 100% absoluto. Pruebas continuas sin restricciones ni necesidad de contratos.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#1e2533] text-[10px] text-emerald-300 font-semibold">
              ✓ Cero riesgo legal · Libertad horaria total
            </div>
          </button>

          {/* Opción 2: Sitio de Cliente */}
          <button
            type="button"
            onClick={() => handleSetOwnership('cliente')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentOwnership === 'cliente'
                ? 'bg-amber-950/40 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                : 'bg-[#0A0C10] border-[#202634] text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>2. Sitio de Cliente (Comercial)</span>
                </span>
                {currentOwnership === 'cliente' && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full font-bold">
                    ACTIVO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sitio web de cliente con pago comercial. Requiere autorización firmada por escrito, ventana nocturna valle y resguardo de ToS del hosting.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#1e2533] text-[10px] text-amber-300 font-semibold">
              ⚠️ Protocolo formal · Ley 21.459 y valores de cotización
            </div>
          </button>

          {/* Opción 3: Proyecto Solidario / Voluntariado */}
          <button
            type="button"
            onClick={() => handleSetOwnership('solidario')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentOwnership === 'solidario'
                ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg ring-1 ring-purple-500'
                : 'bg-[#0A0C10] border-[#202634] text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5 text-purple-400">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>3. Voluntariado / Solidario (Pro-Bono)</span>
                </span>
                {currentOwnership === 'solidario' && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/50 px-2 py-0.5 rounded-full font-bold">
                    ACTIVO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Proyecto gratuito sin ganancias financieras. Al no existir cobro comercial, mantienes el <strong>derecho técnico y operativo 100% como si fuera propio</strong>.
              </p>
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#1e2533] text-[10px] text-purple-300 font-semibold">
              🤝 Soberanía 100% propia · Resguardo de causa comunitaria
            </div>
          </button>
        </div>
      </div>

      {/* Barra de Ajuste de Cotización & Valores Comerciales (Marco Legal Chile) */}
      <div className="bg-[#12151C] border border-[#202634] p-4 rounded-2xl space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#202634] pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold text-xs">
              Configuración de Cotización & Cláusula Económica (Valores en Moneda Nacional CLP)
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={includePricing}
              onChange={(e) => setIncludePricing(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 bg-[#07090E]"
            />
            <span className="text-[11px] font-semibold">
              {includePricing ? '✓ Especificar Valores de Cotización en el Contrato' : '⚪ Omitir Valores (Solo Acuerdo Operativo)'}
            </span>
          </label>
        </div>

        {includePricing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Monto Honorarios (CLP):</label>
              <input
                type="number"
                value={contractValueCLP}
                onChange={(e) => setContractValueCLP(Number(e.target.value))}
                className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-emerald-300 font-bold text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Condición de Pago:</label>
              <input
                type="text"
                value={contractPaymentTerms}
                onChange={(e) => setContractPaymentTerms(e.target.value)}
                className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Documento Tributario (SII):</label>
              <select
                value={contractTaxDoc}
                onChange={(e: any) => setContractTaxDoc(e.target.value)}
                className="w-full bg-[#0A0C10] border border-[#202634] rounded-lg px-2.5 py-1 text-slate-200 text-xs cursor-pointer"
              >
                <option value="factura">Factura Afecta a IVA (19%)</option>
                <option value="boleta">Boleta de Honorarios (Retención SII)</option>
                <option value="exento">Factura Exenta de IVA</option>
              </select>
            </div>
          </div>
        )}

        {/* Conexión Relacional en Vivo con Studio, CRM & Supabase Cloud */}
        <div className="bg-[#0A0C10] border border-[#202634] p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] pt-3">
          <div className="space-y-1">
            <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider">
              🔗 Conexión Relacional en Base de Datos (Supabase Cloud):
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono">
                Deal CRM: {matchingDeal ? `${matchingDeal.title} (${matchingDeal.stage})` : 'Sin deal vinculado'}
              </span>
              <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-mono">
                Cotización Studio: {matchingQuote ? `${matchingQuote.quoteNumber} ($${matchingQuote.totalCLP.toLocaleString('es-CL')} CLP)` : `$${contractValueCLP.toLocaleString('es-CL')} CLP (${contractTaxDoc.toUpperCase()})`}
              </span>
              <span className="bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md font-mono">
                Mandante: {dispClientName} {contractClientType === 'empresa' ? `(Rep: ${dispLegalRepName})` : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isSyncingSupabase}
            onClick={handleSyncAllToSupabase}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Server className="w-3.5 h-3.5" />
            <span>{isSyncingSupabase ? 'Sincronizando...' : 'Respaldar y Vincular en Supabase Cloud'}</span>
          </button>
        </div>
      </div>

      {/* Navegación por Pestañas: 6 Anexos Individuales + Checklists + Contrato Maestro + Otros Documentos */}
      <div className="flex flex-wrap gap-1.5 border-b border-[#202634] pb-2 font-mono text-xs">
        {[
          { id: 1, label: 'Anexo 1: Autorización Escrita' },
          { id: 2, label: 'Anexo 2: Límites de Hosting' },
          { id: 3, label: 'Anexo 3: KPIs y SLAs' },
          { id: 4, label: 'Anexo 4: Herramientas' },
          { id: 5, label: 'Anexo 5: Portafolio & Casos' },
          { id: 6, label: 'Anexo 6: NDA & Confidencialidad' },
          { id: 7, label: '7. Checklists & Plantillas' },
          { id: 8, label: '📄 Contrato Maestro Completo', highlight: true },
          { id: 9, label: '📁 Otros Documentos & PDFs', highlightBadge: (selectedProj?.externalDocs?.length || 0).toString() },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? tab.highlight
                  ? 'bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400'
                  : 'bg-emerald-600 text-white shadow-sm'
                : 'bg-[#12151C] text-slate-400 hover:text-white hover:bg-[#1a2130] border border-[#202634]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.highlightBadge && Number(tab.highlightBadge) > 0 && (
              <span className="bg-emerald-500/30 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {tab.highlightBadge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* PESTAÑAS 1 A 6: ANEXOS INDIVIDUALES FIRMABLES */}
      {/* ============================================================== */}
      {activeTab >= 1 && activeTab <= 6 && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-[#12151C] border border-[#202634] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202634] pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Stamp className="w-4 h-4 text-emerald-400" />
                  <span>Documento Individual Firmable: Anexo N° {activeTab}</span>
                </h2>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Este anexo individual puede ser firmado por separado por el cliente o entidad solidaria para un trámite específico.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePrintToPDF(getCurrentAnnexTitle(), getCurrentAnnexText())}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar como PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getCurrentAnnexText());
                    showCopiedAlert(`¡Anexo N° ${activeTab} copiado al portapapeles!`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0C10] hover:bg-[#1f2738] text-slate-200 border border-[#202634] rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Texto</span>
                </button>
              </div>
            </div>

            {/* Vista Previa del Anexo Firmable */}
            <pre className="bg-[#07090E] border border-[#1d2331] rounded-xl p-5 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto font-mono max-h-[460px] scrollbar-thin">
              {getCurrentAnnexText()}
            </pre>

            {/* Tarjeta Visual de Firmas Formales (Visual Signature Cards) */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Panel Visual de Firmas Electrónicas / Manuscritas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0A0C10] border border-[#202634] p-4 rounded-xl space-y-2 text-center">
                  <div className="h-14 flex items-end justify-center border-b border-dashed border-slate-700 pb-1.5">
                    <span className="text-[10px] text-slate-500 italic">[Espacio de Firma Digital / Rúbrica]</span>
                  </div>
                  <div className="text-[11px] font-bold text-white pt-1">
                    {contractClientType === 'empresa' ? `p.p. ${dispClientName}` : dispClientName}
                  </div>
                  <div className="text-[10px] text-slate-400">RUT: {dispClientRUT}</div>
                  {contractClientType === 'empresa' && (
                    <div className="text-[10px] text-slate-300">
                      <span className="text-amber-400">Rep. Legal:</span> {dispLegalRepName} (RUT: {dispLegalRepRUT})
                    </div>
                  )}
                  <div className="text-[9px] text-slate-500">
                    {dispClientEmail} · {dispClientPhone}
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold uppercase">
                    {currentOwnership === 'solidario'
                      ? 'Entidad Beneficiaria Solidaria'
                      : contractClientType === 'empresa'
                      ? 'Representante Legal Autorizado'
                      : 'Cliente / Mandante Persona Natural'}
                  </div>
                </div>

                <div className="bg-[#0A0C10] border border-[#202634] p-4 rounded-xl space-y-2 text-center">
                  <div className="h-14 flex items-end justify-center border-b border-dashed border-slate-700 pb-1.5">
                    <span className="text-[10px] text-slate-500 italic">[Espacio de Firma Digital / Rúbrica]</span>
                  </div>
                  <div className="text-[11px] font-bold text-white pt-1">{dispProviderName}</div>
                  <div className="text-[10px] text-slate-400">RUT: {dispProviderRUT}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">
                    Prestadora / Auditora Técnica LSC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 7: CHECKLISTS & PLANTILLA DE INFORME TÉCNICO */}
      {/* ============================================================== */}
      {activeTab === 7 && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-[#12151C] border border-[#202634] p-5 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>7. Checklists Pre-Vuelo & Plantilla de Informe Técnico</span>
            </h2>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Verifica cada punto antes de ejecutar cualquier prueba de carga o auditoría en producción:
            </p>

            {/* Checklist Pre-Flight */}
            <div className="bg-[#0A0C10] p-4 rounded-xl border border-[#202634] space-y-2">
              <span className="text-[11px] text-white font-bold block mb-2">Checklist de Seguridad Pre-Prueba:</span>
              {[
                {
                  key: 'authSigned',
                  label:
                    currentOwnership === 'solidario'
                      ? '1. Constancia de acuerdo solidario pro-bono con la comunidad / entidad.'
                      : currentOwnership === 'cliente'
                      ? '1. Autorización por escrito firmada o confirmada por correo por el cliente (Anexo 1).'
                      : '1. Verificación de propiedad y soberanía directa sobre el repositorio y servidor.',
                },
                { key: 'hostingNotified', label: '2. Verificación de tipo de hosting (cPanel vs VPS) y políticas de uso aceptable (Anexo 2).' },
                { key: 'backupCompleted', label: '3. Respaldo completo de la base de datos y archivos antes de iniciar la prueba.' },
                { key: 'stagingAvailable', label: '4. ¿Existe entorno staging? Si existe, priorizar la prueba allí primero.' },
                { key: 'offPeakScheduled', label: '5. Ventana horaria coordinada en horario valle de mínimo tráfico.' },
                { key: 'rollbackReady', label: '6. Protocolo de abortar la prueba inmediatamente si la latencia supera 2.000 ms.' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#161a24] cursor-pointer transition"
                >
                  <input
                    type="checkbox"
                    checked={checklist[item.key] || false}
                    onChange={() => toggleChecklist(item.key)}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-[#07090E]"
                  />
                  <span className={`text-[11px] ${checklist[item.key] ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Plantilla de Informe Técnico Completo */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold">
                  Plantilla de Informe Ejecutivo de Auditoría (Formato Markdown / Imprimible):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePrintToPDF('Informe Ejecutivo de Auditoría de Rendimiento', reportTemplateMarkdown)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(reportTemplateMarkdown);
                      showCopiedAlert('¡Plantilla de Informe copiada!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#0A0C10] hover:bg-[#1f2738] text-slate-300 border border-[#202634] rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copiar Texto</span>
                  </button>
                </div>
              </div>

              <pre className="bg-[#07090E] border border-[#1d2331] rounded-xl p-4 text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-96 scrollbar-thin">
                {reportTemplateMarkdown}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 8: CONTRATO MAESTRO COMPLETO (INTEGRAL CONSOLIDADO) */}
      {/* ============================================================== */}
      {activeTab === 8 && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-[#12151C] border border-[#202634] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202634] pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-indigo-400" />
                  <span>Contrato Maestro General de Servicios Digitales (Documento Completo)</span>
                </h2>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Consolida el cuerpo contractual principal y los 6 anexos en 1 solo documento integral listo para imprimir o firmar electrónicamente.
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handlePrintToPDF('Contrato Maestro General de Servicios Digitales', contratoMaestroConsolidado)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar como PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(contratoMaestroConsolidado);
                    showCopiedAlert('¡Contrato Maestro Completo copiado al portapapeles!');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copiar Contrato Maestro</span>
                </button>
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-800/40 p-3.5 rounded-xl text-[11px] text-slate-300 leading-relaxed space-y-1">
              <span className="text-indigo-300 font-bold block">⚖️ Respaldo en Marco Legal de Chile:</span>
              <p>
                Este contrato fue redactado conforme a la <strong>Ley 21.459</strong> (autorización legítima de pruebas informáticas), <strong>Ley 19.628</strong> (confidencialidad de datos) y <strong>Ley 19.799</strong> (eficacia jurídica de firma electrónica simple y avanzada). Es apto para firma digital con FirmaGob, DocuSign o firma manuscrita notariada.
              </p>
            </div>

            <pre className="bg-[#07090E] border border-[#1d2331] rounded-xl p-6 text-slate-200 text-[11px] leading-relaxed whitespace-pre-wrap overflow-x-auto font-mono max-h-[550px] scrollbar-thin">
              {contratoMaestroConsolidado}
            </pre>

            {/* Tarjeta Visual de Firmas Formales para el Contrato Maestro */}
            <div className="pt-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                Panel Formal de Suscripción y Firmas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0A0C10] border border-[#202634] p-4 rounded-xl space-y-2 text-center">
                  <div className="h-16 flex items-end justify-center border-b border-dashed border-slate-700 pb-2">
                    <span className="text-[10px] text-slate-500 italic">[Firma Digital / Rúbrica Cliente]</span>
                  </div>
                  <div className="text-[11px] font-bold text-white pt-1">
                    {contractClientType === 'empresa' ? `p.p. ${dispClientName}` : dispClientName}
                  </div>
                  <div className="text-[10px] text-slate-400">RUT: {dispClientRUT}</div>
                  {contractClientType === 'empresa' && (
                    <div className="text-[10px] text-slate-300">
                      <span className="text-amber-400">Rep. Legal:</span> {dispLegalRepName} (RUT: {dispLegalRepRUT})
                    </div>
                  )}
                  <div className="text-[9px] text-slate-500">
                    {dispClientEmail} · {dispClientPhone}
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold uppercase">
                    {currentOwnership === 'solidario'
                      ? 'Entidad Beneficiaria Solidaria'
                      : contractClientType === 'empresa'
                      ? 'Representante Legal Autorizado'
                      : 'Cliente / Mandante Persona Natural'}
                  </div>
                </div>

                <div className="bg-[#0A0C10] border border-[#202634] p-4 rounded-xl space-y-2 text-center">
                  <div className="h-16 flex items-end justify-center border-b border-dashed border-slate-700 pb-2">
                    <span className="text-[10px] text-slate-500 italic">[Firma Digital / Rúbrica Prestadora]</span>
                  </div>
                  <div className="text-[11px] font-bold text-white pt-1">{dispProviderName}</div>
                  <div className="text-[10px] text-slate-400">RUT: {dispProviderRUT}</div>
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase">
                    Prestadora / Auditora Técnica LSC
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 9: OTROS DOCUMENTOS & ARCHIVOS EXTERNOS (PDFS, FACTURAS, ETC.) */}
      {/* ============================================================== */}
      {activeTab === 9 && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-[#12151C] border border-[#202634] p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202634] pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-400" />
                  <span>Otros Documentos & Archivos Externos: {selectedProj?.name}</span>
                </h2>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Adjunta y respalda archivos PDF, contratos firmados escaneados, actas de entrega, cotizaciones o comprobantes de hosting para este proyecto.
                </span>
              </div>
            </div>

            {/* Formulario para Adjuntar / Registrar Nuevo Documento */}
            <form onSubmit={handleAddExternalDoc} className="bg-[#0A0C10] border border-[#202634] p-4 rounded-xl space-y-3">
              <span className="text-white font-bold text-xs flex items-center gap-1.5">
                <FileUp className="w-4 h-4 text-emerald-400" />
                <span>Registrar / Subir Nuevo Documento o PDF:</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Título del Documento *:</label>
                  <input
                    type="text"
                    required
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    placeholder="Ej: Contrato_Firmado_Conpi_2026.pdf"
                    className="w-full bg-[#161a24] border border-[#202634] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Categoría / Motivo *:</label>
                  <select
                    value={newDocCategory}
                    onChange={(e: any) => setNewDocCategory(e.target.value)}
                    className="w-full bg-[#161a24] border border-[#202634] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="contrato_firmado">Contrato Firmado / Anexo</option>
                    <option value="cotizacion_pdf">Cotización Aprobada en PDF</option>
                    <option value="factura">Factura / Boleta / Recibo</option>
                    <option value="hosting">Comprobante Hosting / NIC Chile</option>
                    <option value="acta_entrega">Acta de Entrega / Aceptación</option>
                    <option value="otro">Otro Documento Externo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Seleccionar Archivo (PDF, Img, Doc):</label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="w-full text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Notas u Observaciones del Documento:</label>
                <input
                  type="text"
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  placeholder="Ej: Copia firmada con firma electrónica simple recibida por correo el 16 de noviembre"
                  className="w-full bg-[#161a24] border border-[#202634] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar y Respaldar Documento</span>
                </button>
              </div>
            </form>

            {/* Listado de Documentos del Proyecto */}
            <div className="space-y-2 pt-2">
              <span className="text-white font-bold text-xs block">
                Archivos Registrados para {selectedProj?.name} ({(selectedProj?.externalDocs || []).length}):
              </span>

              {(!selectedProj?.externalDocs || selectedProj.externalDocs.length === 0) ? (
                <div className="bg-[#0A0C10] border border-dashed border-[#202634] p-8 rounded-xl text-center text-slate-500 space-y-1">
                  <Paperclip className="w-6 h-6 mx-auto text-slate-600" />
                  <p className="text-xs">No hay documentos externos registrados para este proyecto.</p>
                  <p className="text-[10px] text-slate-600">
                    Sube un PDF o contrato firmado en el formulario superior para mantener el respaldo centralizado.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedProj.externalDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-[#0A0C10] border border-[#202634] hover:border-emerald-500/40 p-3.5 rounded-xl flex items-start justify-between gap-3 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{doc.title}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700 uppercase">
                            {doc.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{doc.fileName}</span>
                          <span>•</span>
                          <span>{doc.fileSize}</span>
                          <span>•</span>
                          <span>{doc.date}</span>
                        </div>
                        {doc.notes && (
                          <p className="text-[11px] text-slate-400 italic pt-0.5 leading-relaxed">
                            "{doc.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.fileUrl && doc.fileUrl !== '#' && (
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 rounded-lg text-xs transition cursor-pointer"
                            title="Descargar / Ver Archivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1.5 bg-rose-600/20 text-rose-300 hover:bg-rose-600/40 rounded-lg text-xs transition cursor-pointer"
                          title="Eliminar Documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
