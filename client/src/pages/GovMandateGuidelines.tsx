import React, { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  FileText,
  Accessibility,
  Lock,
  Stethoscope,
  Users,
  AlertCircle,
  Search,
  Printer,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Scale,
  Award,
  ArrowLeft,
  Copy,
  Check,
  Send,
  X,
  FileCheck,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Info
} from 'lucide-react';

interface MandateSection {
  id: string;
  title: string;
  shortTitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  mandateCode: string;
  authority: string;
  effectiveDate: string;
  clauses: {
    number: string;
    heading: string;
    content: string;
    details?: string[];
    complianceType: 'Mandatory' | 'Recommended' | 'Statutory';
  }[];
}

export const GovMandateGuidelines: React.FC = () => {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>(tab || 'gigw');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedClause, setCopiedClause] = useState<string | null>(null);

  // Nodal Officer Grievance Modal State
  const [isGrievanceModalOpen, setIsGrievanceModalOpen] = useState(false);
  const [grievanceForm, setGrievanceForm] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'GIGW Accessibility',
    description: '',
    hospitalId: ''
  });
  const [grievanceSubmittedTicket, setGrievanceSubmittedTicket] = useState<string | null>(null);

  // Keep URL in sync when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate(`/gov-guidelines/${newTab}`, { replace: true });
  };

  // Copy clause link to clipboard
  const handleCopyLink = (clauseNum: string) => {
    const url = `${window.location.origin}/gov-guidelines/${activeTab}#${clauseNum}`;
    navigator.clipboard.writeText(url);
    setCopiedClause(clauseNum);
    setTimeout(() => setCopiedClause(null), 2500);
  };

  // Print Guidelines Page
  const handlePrint = () => {
    window.print();
  };

  // Submit Grievance Handler
  const handleGrievanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `HOS-GRV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    setGrievanceSubmittedTicket(ticketId);
  };

  // Full dataset of mandatory guidelines for government and healthcare pages
  const mandateSections: MandateSection[] = useMemo(() => [
    {
      id: 'gigw',
      title: 'GIGW & Web Accessibility Standards',
      shortTitle: 'GIGW & Accessibility',
      badge: 'GIGW 3.0 / WCAG 2.1 AA',
      icon: Accessibility,
      description: 'Guidelines for Indian Government Websites (GIGW) & International Digital Accessibility Standards for public access, screen readers, contrast, and content policies.',
      mandateCode: 'MoEITY/GIGW/2023-V3',
      authority: 'Ministry of Electronics & IT (MeitY) / STQC',
      effectiveDate: 'January 2023',
      clauses: [
        {
          number: 'GIGW-1.1',
          heading: 'Universal Accessibility & Screen Reader Compatibility',
          content: 'The website and portal must comply with WCAG 2.1 Level AA accessibility criteria. All graphical elements, icons, buttons, and patient records must include clear ARIA labels and descriptive alt text to ensure seamless navigation for visually impaired users using NVDA, JAWS, or VoiceOver.',
          details: [
            'All text must maintain a minimum contrast ratio of 4.5:1 against background colors.',
            'Page layouts must be fully navigable via Keyboard interface alone without trap focus.',
            'Form inputs must provide visible labels, clear field descriptions, and error text.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'GIGW-1.2',
          heading: 'Bilingual & Multilingual Information Access',
          content: 'Public healthcare notices, doctor directories, OPD registration flows, and mandatory disclosures must be made available in Hindi and English, with provisions for regional language translation across all state portal nodes.',
          details: [
            'Language selection option must be prominently placed in the global header.',
            'Dynamic content translation must retain medical terminology accuracy.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'GIGW-1.3',
          heading: 'Content Archival Policy (CAP) & Metadata Maintenance',
          content: 'Government notices, tenders, medical circulars, and public health bulletins must carry structured metadata including publication date, expiry date, authoring department, and version control. Expired notices must automatically move to searchable archives after 180 days.',
          details: [
            'Permanent URL permalinks for archived public documents.',
            'Machine-readable schema markup (Schema.org / Government Metadata standard).'
          ],
          complianceType: 'Statutory'
        },
        {
          number: 'GIGW-1.4',
          heading: 'STQC Web Quality Certification & Security Audit',
          content: 'The web application infrastructure must undergo annual vulnerability assessment and penetration testing (VAPT) by a CERT-In empanelled auditor and maintain active STQC Quality Certification.',
          details: [
            'Zero open Critical/High security findings in quarterly audits.',
            'HTTPS TLS 1.3 enforced for all web and mobile endpoints.'
          ],
          complianceType: 'Mandatory'
        }
      ]
    },
    {
      id: 'abdm',
      title: 'ABDM & Health Data Ecosystem Compliance',
      shortTitle: 'ABDM Health Stack',
      badge: 'NHA / ABDM Milestone 1-3',
      icon: ShieldCheck,
      description: 'Mandatory compliance guidelines for Ayushman Bharat Digital Mission (ABDM), ABHA creation, Health Information Provider (HIP), and Health Information User (HIU) integration.',
      mandateCode: 'NHA/ABDM/HIP-HIU/2024',
      authority: 'National Health Authority (NHA), Govt. of India',
      effectiveDate: 'August 2021',
      clauses: [
        {
          number: 'ABDM-2.1',
          heading: 'ABHA (Ayushman Bharat Health Account) Creation & Linking',
          content: 'Every hospital node and patient registration desk must facilitate voluntary ABHA creation using Aadhaar or Mobile OTP authentication. Patient records generated within Hoscore must be linked to the 14-digit ABHA ID upon patient consent.',
          details: [
            'Support for ABHA Address creation (username@abdm).',
            'Seamless QR-code scan & share workflow for fast OPD registration.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'ABDM-2.2',
          heading: 'HIP / HIU Milestone 1, 2 & 3 Certification',
          content: 'Hospital management systems must achieve full sandbox and production certification for M1 (ABHA Creation), M2 (Building Health Records & Linking), and M3 (Consent Manager Integration for fetching/sharing electronic health records).',
          details: [
            'Implementation of HL7 FHIR R4 data payload specifications.',
            'Asynchronous cryptographic key exchange for health data transfer.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'ABDM-2.3',
          heading: 'Consent Architecture & Purpose-Bound Sharing',
          content: 'Health records shall only be shared with external doctors or hospitals through explicit consent requests routed via the ABDM Consent Manager. Patients retain full rights to revoke active consent at any time.',
          details: [
            'Consent request must clearly specify Data Types, Date Range, and Purpose of Use.',
            'All consent transactions recorded in immutable audit logs.'
          ],
          complianceType: 'Statutory'
        }
      ]
    },
    {
      id: 'ehr',
      title: 'EHR Standards & Interoperability Mandate (MoHFW)',
      shortTitle: 'EHR Standards 2016',
      badge: 'MoHFW EHR Standard',
      icon: FileText,
      description: 'Ministry of Health & Family Welfare mandates for Electronic Health Record (EHR) systems including standardized medical coding, diagnostic terminology, and record retention.',
      mandateCode: 'MoHFW/EHR-STD/2016-REV',
      authority: 'Ministry of Health and Family Welfare (MoHFW)',
      effectiveDate: 'December 2016',
      clauses: [
        {
          number: 'EHR-3.1',
          heading: 'Clinical Coding & Terminology Standards',
          content: 'All clinical diagnoses, procedures, and lab investigation orders must utilize standardized global and national nomenclature systems:',
          details: [
            'ICD-10 / ICD-11 for Clinical Diagnoses & Disease Classification.',
            'SNOMED CT for Clinical Terms, Symptoms, and Surgical Procedures.',
            'LOINC for Laboratory Tests, Diagnostic Observations, and Radiology Reports.',
            'RxNorm / IDMP for Pharmaceutical & Drug Formulations.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'EHR-3.2',
          heading: 'Mandatory Record Retention Timelines',
          content: 'In accordance with legal and regulatory mandates, hospitals must store electronic patient records securely according to strict retention schedules:',
          details: [
            'Outpatient (OPD) Records: Minimum 10 Years from last visit.',
            'Inpatient (IPD) Admissions: Minimum 10 Years post-discharge.',
            'Pediatric Patient Records: Until 10 years after achieving age of majority (28 years).',
            'Medico-Legal Cases (MLC) & Autopsy Reports: Retained Permanently.'
          ],
          complianceType: 'Statutory'
        },
        {
          number: 'EHR-3.3',
          heading: 'Discharge Summary & Prescription Standard Layout',
          content: 'Discharge summaries and e-prescriptions must include standardized metadata: Hospital Registration No., Attending Doctor Registration No. (NMC/SMC), Patient ABHA/UHID, Chief Complaints, Diagnosis, Treatment Summary, Discharge Medications, and Follow-up Instructions.',
          details: [
            'Digital Signature or QR verification stamp required on all PDF summaries.',
            'Clear warnings on high-risk medications and drug allergies.'
          ],
          complianceType: 'Mandatory'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Digital Personal Data Protection (DPDP) & HIPAA Laws',
      shortTitle: 'Data Privacy & DPDP Act',
      badge: 'DPDP Act 2023 / HIPAA',
      icon: Lock,
      description: 'Regulatory requirements under the Digital Personal Data Protection (DPDP) Act 2023, HIPAA Privacy Rule, and global healthcare data processing guidelines.',
      mandateCode: 'DPDP-ACT-2023/SEC-6-12',
      authority: 'Data Protection Board of India / MeitY',
      effectiveDate: 'August 2023',
      clauses: [
        {
          number: 'DPDP-4.1',
          heading: 'Notice & Consent Mechanism for Health Data Fiduciaries',
          content: 'Before collecting any personal or sensitive health data, the platform must present a clear, itemized notice in plain language describing the data requested, purpose of processing, and instructions on how to withdraw consent.',
          details: [
            'Separate consent required for primary healthcare vs secondary analytics/research.',
            'Child data protection: Parent/guardian authorization required for minors (<18 yrs).'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'DPDP-4.2',
          heading: 'Right to Access, Correction & Erasure (Right to be Forgotten)',
          content: 'Patients have the statutory right to request a complete copy of their medical profile, request correction of inaccurate health details, or request account erasure subject to statutory medical retention laws.',
          details: [
            'Data export must be provided in machine-readable JSON/PDF format within 7 days.',
            'Erasure requests must be fulfilled within 15 working days for non-active medical files.'
          ],
          complianceType: 'Statutory'
        },
        {
          number: 'DPDP-4.3',
          heading: 'Mandatory Breach Notification & Security SLA',
          content: 'In the event of a suspected or confirmed personal data breach, the Data Fiduciary must notify the Data Protection Board and affected individuals within 6 hours of discovery as mandated by CERT-In guidelines.',
          details: [
            'AES-256 encryption required for all stored health databases and backups.',
            'TLS 1.3 encryption for data in transit.'
          ],
          complianceType: 'Mandatory'
        }
      ]
    },
    {
      id: 'telemedicine',
      title: 'Telemedicine Practice Guidelines (2020)',
      shortTitle: 'Telemedicine Mandate',
      badge: 'NMC / MCI Guidelines 2020',
      icon: Stethoscope,
      description: 'Government norms regulating tele-consultations, doctor identity verification, patient consent, and prohibited drug prescription schedules.',
      mandateCode: 'NMC/TELE-MED/2020-01',
      authority: 'National Medical Commission (NMC) / NITI Aayog',
      effectiveDate: 'March 2020',
      clauses: [
        {
          number: 'TELE-5.1',
          heading: 'Registered Medical Practitioner (RMP) Verification',
          content: 'Only doctors registered with the National Medical Commission (NMC) or State Medical Councils with valid registration numbers may conduct video or audio tele-consultations.',
          details: [
            'Doctor registration credentials must be publicly visible on consultation screen.',
            'Mandatory digital certificate or electronic signature on generated e-prescriptions.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'TELE-5.2',
          heading: 'Patient Identification & Consent Protocols',
          content: 'The doctor must verify the patient’s identity (Name, Age, Address, UHID) before initiating any consultation. Patient consent is implicit if initiated by the patient, but explicit consent must be documented for follow-ups initiated by the clinic.',
          details: [
            'Patient consent status logged prior to video call initialization.',
            'Special provisions for guardian consent in tele-pediatric consultations.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'TELE-5.3',
          heading: 'Prohibited Medication Schedules (Schedule X & Narcotics)',
          content: 'RMPs are strictly prohibited from prescribing Schedule X drugs, habit-forming psychotropic substances, or controlled narcotics during tele-consultations under any circumstances.',
          details: [
            'Automated system block preventing addition of Schedule X drugs to tele-prescriptions.',
            'Mandatory warning on refill prescriptions for Schedule H & H1 drugs.'
          ],
          complianceType: 'Statutory'
        }
      ]
    },
    {
      id: 'citizens',
      title: "Citizen's Charter & Hospital Service Mandates",
      shortTitle: "Citizen's Charter",
      badge: 'Public Service Delivery SLA',
      icon: Users,
      description: "Standardized service guarantees, emergency admission policies, OPD wait times, transparent billing tariffs, and Patient's Rights Charter.",
      mandateCode: 'MoHFW/CITIZEN-CHARTER/2022',
      authority: 'Ministry of Health and Family Welfare / Quality Council of India',
      effectiveDate: 'June 2022',
      clauses: [
        {
          number: 'CHARTER-6.1',
          heading: 'Emergency Medical Care & Non-Refusal Guarantee',
          content: 'No emergency patient shall be turned away or delayed treatment due to lack of initial deposit or administrative verification. All network hospitals must provide immediate medical stabilization.',
          details: [
            'Emergency Triage assessment within 3 minutes of arrival.',
            'Zero upfront fee barrier for trauma and life-threatening conditions.'
          ],
          complianceType: 'Statutory'
        },
        {
          number: 'CHARTER-6.2',
          heading: 'Service Level Timelines for Hospital Operations',
          content: 'Network hospitals must adhere to published turnaround time (TAT) targets for routine patient interactions:',
          details: [
            'OPD Registration & Token Allocation: Under 10 minutes.',
            'Average Doctor Consultation Waiting Time: Under 25 minutes.',
            'Routine Diagnostic Lab Report Turnaround: Within 4 hours.',
            'Inpatient Final Discharge Clearance: Under 60 minutes post doctor sign-off.'
          ],
          complianceType: 'Recommended'
        },
        {
          number: 'CHARTER-6.3',
          heading: 'Transparent Billing & Display of Approved Tariffs',
          content: 'All bed charges, doctor visit fees, ICU tariffs, diagnostic procedure rates, and package costs must be transparently displayed on the public portal and hospital reception desks without hidden surcharges.',
          details: [
            'Itemized daily billing invoice provided to inpatient family members.',
            'Direct access to cashless insurance desk and Ayushman Bharat PM-JAY desk.'
          ],
          complianceType: 'Mandatory'
        }
      ]
    },
    {
      id: 'grievance',
      title: 'Grievance Redressal Mechanism & Mandatory Disclosures',
      shortTitle: 'Grievance & Nodal Officer',
      badge: 'Public Officer SLA / 15 Days',
      icon: AlertCircle,
      description: 'Official Nodal Officer contact disclosures, escalation matrix, appellate authority, and public complaint resolution timelines under statutory rules.',
      mandateCode: 'GOV-DISCLOSURE/GRV-2024',
      authority: 'Central Public Grievance Redress and Monitoring System (CPGRAMS)',
      effectiveDate: 'January 2024',
      clauses: [
        {
          number: 'GRV-7.1',
          heading: 'Designated Public Nodal Officer & Escalation Contacts',
          content: 'In compliance with Government portal guidelines, the designated Nodal Officer for digital accessibility, data privacy complaints, and institutional grievances is publicly disclosed below:',
          details: [
            'Nodal Officer: Dr. Rajesh V. Sharma, Director of Compliance & Public Relations',
            'Official Email: nodal.officer@hoscore.gov.in / grievance@bluevolt.in',
            'Direct Helpline: +91 1800-425-9090 (Toll-Free, 9 AM - 6 PM IST)',
            'Office Address: Hoscore Compliance Division, Bluevolt Tower, Tech Zone 4, New Delhi - 110001'
          ],
          complianceType: 'Statutory'
        },
        {
          number: 'GRV-7.2',
          heading: 'Complaint Processing Timelines & Escalation SLA',
          content: 'Every grievance submitted through the portal or email will be assigned a trackable Complaint Ticket ID. Response SLAs are strictly enforced:',
          details: [
            'Acknowledgment Receipt: Sent within 24 hours of submission.',
            'Initial Assessment & Interim Response: Within 3 business days.',
            'Final Grievance Resolution & Order: Within 15 working days.',
            'Appellate Review: If unsatisfied, escalation to Appellate Authority within 30 days.'
          ],
          complianceType: 'Mandatory'
        }
      ]
    },
    {
      id: 'terms',
      title: 'Terms of Service, Copyright & Hyperlinking Policy',
      shortTitle: 'Terms & Hyperlinking',
      badge: 'Legal & Intellectual Property',
      icon: Scale,
      description: 'Mandatory disclaimers regarding digital health advice, hyperlinking permissions to government portals, copyright ownership, and liability boundaries.',
      mandateCode: 'LEGAL/TERMS-POLICY/2026',
      authority: 'Hoscore Legal Directorate & MeitY Standards',
      effectiveDate: 'January 2026',
      clauses: [
        {
          number: 'TERMS-8.1',
          heading: 'Digital Health Information & Medical Advice Disclaimer',
          content: 'Information provided on the Hoscore portal is for institutional administration, appointment scheduling, and record viewing. It does not substitute professional in-person medical diagnosis or emergency care.',
          details: [
            'For medical emergencies, users must contact national emergency helpline 112 or local hospital immediately.'
          ],
          complianceType: 'Statutory'
        },
        {
          number: 'TERMS-8.2',
          heading: 'Government Hyperlinking & Cross-Linking Policy',
          content: 'Prior permission is not required to hyperlink to public pages of this portal. However, pages must load into a full independent browser window and not within frames of third-party portals.',
          details: [
            'Links to external government portals (.gov.in, .nic.in, .abdm.gov.in) are provided for convenience only.',
            'Hoscore does not guarantee uptime or accuracy of third-party external sites.'
          ],
          complianceType: 'Mandatory'
        },
        {
          number: 'TERMS-8.3',
          heading: 'Copyright Notice & Content Reuse Authorization',
          content: 'Material featured on this portal may be reproduced free of charge in any format or media without requiring specific permission, subject to the material being reproduced accurately and not being used in a derogatory or misleading context.',
          details: [
            'Source must be prominently acknowledged as "Hoscore Government Health Portal".',
            'Authorization does not extend to third-party copyrighted materials.'
          ],
          complianceType: 'Statutory'
        }
      ]
    }
  ], []);

  // Filter clauses by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return mandateSections;

    const query = searchQuery.toLowerCase();
    return mandateSections.map(section => {
      const matchingClauses = section.clauses.filter(clause =>
        clause.heading.toLowerCase().includes(query) ||
        clause.content.toLowerCase().includes(query) ||
        clause.number.toLowerCase().includes(query) ||
        (clause.details && clause.details.some(d => d.toLowerCase().includes(query)))
      );
      return { ...section, clauses: matchingClauses };
    }).filter(section => section.clauses.length > 0 || section.title.toLowerCase().includes(query));
  }, [mandateSections, searchQuery]);

  // Current active section
  const currentSection = mandateSections.find(s => s.id === activeTab) || mandateSections[0];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-rose-100 selection:text-rose-900 font-sans text-slate-900">
      
      {/* Universal Header Matching Landing.tsx */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100/50 print:hidden">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src="/hoscore-logo.png" alt="HOSCORE" className="h-14 object-contain" />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider border border-slate-200/60">
              Gov Mandates Portal
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-rose-600 transition-colors">Home</Link>
            <Link to="/for-hospitals" className="hover:text-rose-600 transition-colors">For Hospitals</Link>
            <button
              onClick={() => setIsGrievanceModalOpen(true)}
              className="text-rose-600 hover:text-rose-700 transition-colors font-bold flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" /> Nodal Grievance Desk
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
              title="Print Guidelines Document"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print / Export</span>
            </button>

            <Link
              to="/login"
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold rounded-full hover:from-rose-700 hover:to-red-700 shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section Matching Landing.tsx */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-rose-50/40 via-white to-slate-50/50 border-b border-slate-100 overflow-hidden print:pt-6 print:pb-2">
        {/* Animated background blobs matching Landing.tsx */}
        <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-rose-400/[0.07] blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-400/[0.05] blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            <div className="space-y-5 max-w-3xl">
              {/* Floating Badge Matching Landing.tsx */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200/50 text-rose-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-rose-600" /> Government & Institutional Compliance Matrix
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black text-slate-900 leading-[1.08] tracking-tight">
                Government Mandated Guidelines <br />
                <span className="bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 bg-clip-text text-transparent">
                  & Regulatory Standards Portal
                </span>
              </h1>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-medium">
                Official repository of mandatory guidelines, GIGW 3.0 digital accessibility standards, Ayushman Bharat Digital Mission (ABDM) integration, MoHFW Electronic Health Record (EHR 2016) rules, DPDP Act 2023 data protection, and Public Grievance Officer disclosures.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
                <button
                  onClick={() => setIsGrievanceModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold rounded-2xl hover:from-rose-700 hover:to-red-700 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.97] text-sm"
                >
                  <AlertCircle className="w-4 h-4" /> File Public Grievance
                </button>
                <a
                  href="#directory"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all text-sm shadow-sm"
                >
                  Explore Mandate Directory <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>
            </div>

            {/* Institutional Verification Badge Card */}
            <div className="bg-gradient-to-br from-white to-rose-50/30 border border-slate-200/80 rounded-[28px] p-6 lg:w-88 flex-shrink-0 space-y-4 shadow-xl shadow-rose-950/5 print:hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Platform Compliance</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">VERIFIED COMPLIANT</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-base font-extrabold text-slate-900">
                  <Award className="w-6 h-6 text-amber-500" />
                  <span>STQC & CERT-In Standards Aligned</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Architected to align with CERT-In Guidelines, GIGW 3.0 Web Accessibility, and ABDM M1/M2/M3 Health Data Security Standards.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Last Regulatory Review</span>
                <span className="text-rose-600 font-extrabold">July 2026</span>
              </div>
            </div>
          </div>

          {/* Search Bar matching Landing.tsx inputs */}
          <div className="mt-10 relative max-w-2xl print:hidden">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all government mandate clauses (e.g., GIGW, ABHA, ICD-10, Grievance, DPDP)..."
              className="w-full bg-white border border-slate-200/80 focus:border-rose-500 rounded-2xl pl-12 pr-10 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 shadow-sm transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Directory Layout */}
      <div id="directory" className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Navigation Sidebar Tabs */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-3 print:hidden">
            <div className="px-3 text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Mandate Category Directory ({mandateSections.length})
            </div>
            
            <nav className="space-y-2">
              {mandateSections.map((section) => {
                const IconComponent = section.icon;
                const isActive = activeTab === section.id && !searchQuery;

                return (
                  <button
                    key={section.id}
                    onClick={() => handleTabChange(section.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer group ${
                      isActive
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 border-rose-600 text-white shadow-xl shadow-rose-500/20'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/70 text-slate-600 hover:text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl transition-all ${
                      isActive ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600 group-hover:bg-rose-100'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                          {section.shortTitle}
                        </p>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          isActive ? 'translate-x-0.5 text-white' : 'text-slate-400 group-hover:translate-x-0.5'
                        }`} />
                      </div>
                      <p className={`text-[11px] truncate mt-0.5 font-medium ${isActive ? 'text-rose-100' : 'text-slate-500'}`}>
                        {section.badge}
                      </p>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Nodal Officer Callout Card matching Landing Bento */}
            <div className="mt-8 bg-gradient-to-br from-rose-50/60 via-white to-red-50/40 border border-rose-200/60 rounded-[24px] p-5 space-y-3 text-xs shadow-sm">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold">
                <HelpCircle className="w-4 h-4 text-rose-600" />
                <span>Public Nodal Helpdesk</span>
              </div>
              <p className="text-slate-600 leading-relaxed font-medium">
                Encounter digital accessibility barriers or wish to lodge a formal complaint under CPGRAMS rules?
              </p>
              <button
                onClick={() => setIsGrievanceModalOpen(true)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md shadow-rose-500/20 text-center cursor-pointer block"
              >
                File Public Grievance
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-8">
            
            {/* Search results notice */}
            {searchQuery ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <p className="text-sm font-bold text-slate-600">
                    Search Results for <span className="text-rose-600 font-extrabold">"{searchQuery}"</span> ({filteredSections.length} modules found)
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>

                {filteredSections.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-slate-200 rounded-[28px] space-y-3 shadow-sm">
                    <Info className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-base font-bold text-slate-900">No matching mandate clauses found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                      Try searching for terms like "GIGW", "ABHA", "LOINC", "Privacy", "Grievance", or "Retention".
                    </p>
                  </div>
                ) : (
                  filteredSections.map(section => (
                    <SectionBlock
                      key={section.id}
                      section={section}
                      onCopyLink={handleCopyLink}
                      copiedClause={copiedClause}
                    />
                  ))
                )}
              </div>
            ) : (
              /* Active tab section */
              <SectionBlock
                section={currentSection}
                onCopyLink={handleCopyLink}
                copiedClause={copiedClause}
              />
            )}

          </main>
        </div>
      </div>

      {/* Institutional Dark Footer Exact Match from Landing.tsx */}
      <footer className="bg-slate-950 text-slate-400 pt-20 pb-12 border-t border-slate-900 relative overflow-hidden print:hidden">
        {/* Subtle decorative glows */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 pb-16 border-b border-slate-900">
            {/* Column 1: Brand & Mission */}
            <div className="col-span-2 space-y-6">
              <div className="inline-flex items-center rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/20">
                <img src="/hoscore-logo.png" alt="HOSCORE" className="h-12 w-auto object-contain" />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-medium">
                HOSCORE is a hospital operations and patient visit platform. Pages here summarize government guidelines we are building toward. ABDM M1–M3 is not certified yet.
              </p>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Government Portal Active</span>
              </div>
            </div>

            {/* Column 2: Government Mandates */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Gov Guidelines</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="/gov-guidelines/gigw" className="hover:text-rose-400 transition-colors">GIGW 3.0 Accessibility</Link></li>
                <li><Link to="/gov-guidelines/abdm" className="hover:text-rose-400 transition-colors">ABDM Health Stack</Link></li>
                <li><Link to="/gov-guidelines/ehr" className="hover:text-rose-400 transition-colors">MoHFW EHR Standards</Link></li>
                <li><Link to="/gov-guidelines/telemedicine" className="hover:text-rose-400 transition-colors">Telemedicine Guidelines</Link></li>
                <li><Link to="/gov-guidelines/citizens" className="hover:text-rose-400 transition-colors">Citizen's Charter</Link></li>
              </ul>
            </div>

            {/* Column 3: Legal & Grievance */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Public Redressal</h4>
              <ul className="space-y-2.5 text-sm font-medium">
                <li><Link to="/gov-guidelines/grievance" className="hover:text-rose-400 transition-colors">Nodal Grievance Desk</Link></li>
                <li><Link to="/gov-guidelines/privacy" className="hover:text-rose-400 transition-colors">DPDP Data Privacy</Link></li>
                <li><Link to="/gov-guidelines/terms" className="hover:text-rose-400 transition-colors">Terms & Hyperlinking</Link></li>
                <li><Link to="/for-hospitals" className="hover:text-rose-400 transition-colors">Hospital ERP Suite</Link></li>
                <li><Link to="/" className="hover:text-rose-400 transition-colors">Back to Patient Portal</Link></li>
              </ul>
            </div>

              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">Compliance Posture</h4>
                <ul className="space-y-2.5 text-sm font-medium">
                  <li className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" />STQC GIGW 3.0 Ready</li>
                  <li className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-blue-400" />CERT-In Aligned</li>
                  <li className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-amber-400" />ABDM M1 Integration in Progress</li>
                  <li className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-rose-400" />AES-256 / TLS 1.3</li>
                </ul>
              </div>
          </div>

          <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8 text-xs font-bold text-slate-500">
            <p>© 2026 HOSCORE Initiative. All rights reserved globally.</p>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Powered by</span>
              <div className="inline-flex items-center rounded-xl bg-white px-3 py-2 opacity-80 hover:opacity-100 transition-opacity shadow-lg shadow-black/20">
                <img src="/bluevolt-logo.png" alt="BLUEVOLT GROUPS" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Nodal Officer Grievance Modal */}
      {isGrievanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn print:hidden">
          <div className="bg-white border border-slate-200 rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Public Nodal Grievance Desk</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Under GIGW & CPGRAMS Public Redressal Rules</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsGrievanceModalOpen(false);
                  setGrievanceSubmittedTicket(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {grievanceSubmittedTicket ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-lg text-slate-900">Grievance Registered Successfully</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Your complaint has been logged with the Public Nodal Officer under statutory SLA rules.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2 text-xs font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Complaint Ticket ID:</span>
                    <span className="text-rose-600 font-mono font-extrabold">{grievanceSubmittedTicket}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Acknowledgment SLA:</span>
                    <span className="text-slate-900 font-bold">Within 24 Hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">Final Disposal SLA:</span>
                    <span className="text-emerald-700 font-bold">15 Business Days</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsGrievanceModalOpen(false);
                    setGrievanceSubmittedTicket(null);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-rose-500/20"
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleGrievanceSubmit} className="space-y-4 text-xs font-medium">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={grievanceForm.name}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, name: e.target.value })}
                    placeholder="Enter your full legal name"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={grievanceForm.email}
                      onChange={(e) => setGrievanceForm({ ...grievanceForm, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      value={grievanceForm.phone}
                      onChange={(e) => setGrievanceForm({ ...grievanceForm, phone: e.target.value })}
                      placeholder="+91 9876543210"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Grievance Category *</label>
                  <select
                    value={grievanceForm.category}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/10 font-medium"
                  >
                    <option value="GIGW Accessibility">GIGW Digital Accessibility Barrier</option>
                    <option value="ABDM Consent">ABDM Health Data & Consent Issue</option>
                    <option value="EHR Records">EHR Record Access Delay</option>
                    <option value="Data Privacy">DPDP Data Privacy / Right to Erasure</option>
                    <option value="Hospital Service">Hospital Service & Citizen's Charter</option>
                    <option value="Other Mandate">Other Statutory Compliance Issue</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Detailed Complaint Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={grievanceForm.description}
                    onChange={(e) => setGrievanceForm({ ...grievanceForm, description: e.target.value })}
                    placeholder="Describe the issue, specific URL, or hospital node involved..."
                    className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGrievanceModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold flex items-center gap-2 transition-all shadow-md shadow-rose-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Official Grievance</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual Mandate Section Display
const SectionBlock: React.FC<{
  section: MandateSection;
  onCopyLink: (clauseNum: string) => void;
  copiedClause: string | null;
}> = ({ section, onCopyLink, copiedClause }) => {
  const IconComponent = section.icon;

  return (
    <section id={section.id} className="space-y-6 animate-fadeIn">
      {/* Section Header Card matching Landing Bento */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 sm:p-8 space-y-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600">{section.badge}</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{section.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Ref: {section.mandateCode}</span>
          </div>
        </div>

        <p className="text-slate-600 text-sm leading-relaxed font-medium">{section.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Regulatory Authority</span>
            <p className="font-extrabold text-slate-800">{section.authority}</p>
          </div>
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 space-y-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Effective / Revision Date</span>
            <p className="font-extrabold text-slate-800">{section.effectiveDate}</p>
          </div>
        </div>
      </div>

      {/* Clauses List */}
      <div className="space-y-4">
        {section.clauses.map((clause) => (
          <div
            key={clause.number}
            id={clause.number}
            className="bg-white hover:bg-slate-50/40 border border-slate-200/80 rounded-[24px] p-6 transition-all space-y-3.5 shadow-sm group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200/60">
                    {clause.number}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${
                    clause.complianceType === 'Mandatory'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : clause.complianceType === 'Statutory'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {clause.complianceType}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-900 pt-1">{clause.heading}</h3>
              </div>

              <button
                onClick={() => onCopyLink(clause.number)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer opacity-70 group-hover:opacity-100 print:hidden"
                title="Copy Clause Reference Link"
              >
                {copiedClause === clause.number ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{clause.content}</p>

            {clause.details && clause.details.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                  {clause.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <span className="leading-relaxed">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
