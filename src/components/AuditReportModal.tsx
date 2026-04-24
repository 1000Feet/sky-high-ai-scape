import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, Mail, FileText } from 'lucide-react';

interface AuditData {
  id: string;
  business_name: string;
  website_url: string;
  quick_verdict: string | null;
  overall_score: number | null;
  design_score: number | null;
  seo_score: number | null;
  mobile_score: number | null;
  full_report: string | null;
  created_at: string;
  lead_email?: string | null;
}

interface AuditReportModalProps {
  audit: AuditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const scoreColor = (score: number | null) => {
  if (!score) return 'bg-muted';
  if (score < 5) return 'bg-red-500';
  if (score <= 7) return 'bg-yellow-500';
  return 'bg-green-500';
};

const scoreTextColor = (score: number | null) => {
  if (!score) return 'text-muted-foreground';
  if (score < 5) return 'text-red-500';
  if (score <= 7) return 'text-yellow-500';
  return 'text-green-500';
};

const ScoreCard = ({ label, score }: { label: string; score: number | null }) => (
  <div className="flex-1 p-3 rounded-lg border border-border bg-card">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className={`text-2xl font-bold ${scoreTextColor(score)}`}>
      {score ?? '—'}<span className="text-sm font-normal text-muted-foreground">/10</span>
    </div>
    <Progress value={(score ?? 0) * 10} className={`h-1.5 mt-2`} />
  </div>
);

const AuditReportModal: React.FC<AuditReportModalProps> = ({ audit, open, onOpenChange }) => {
  if (!audit) return null;

  const handleSendEmail = () => {
    if (audit.lead_email) {
      const subject = encodeURIComponent(`Website Audit Report - ${audit.business_name}`);
      const body = encodeURIComponent(
        `Hi,\n\nHere's your website audit report for ${audit.website_url}:\n\n${audit.quick_verdict}\n\nOverall Score: ${audit.overall_score}/10\nDesign: ${audit.design_score}/10\nSEO: ${audit.seo_score}/10\nMobile: ${audit.mobile_score}/10\n\n${audit.full_report || ''}`
      );
      window.open(`mailto:${audit.lead_email}?subject=${subject}&body=${body}`);
    }
  };

  const handleDownloadPdf = () => {
    const content = `
WEBSITE AUDIT REPORT
====================
Business: ${audit.business_name}
URL: ${audit.website_url}
Date: ${new Date(audit.created_at).toLocaleDateString()}

QUICK VERDICT
${audit.quick_verdict || 'N/A'}

SCORES
Overall: ${audit.overall_score ?? 'N/A'}/10
Design: ${audit.design_score ?? 'N/A'}/10
SEO: ${audit.seo_score ?? 'N/A'}/10
Mobile: ${audit.mobile_score ?? 'N/A'}/10

FULL REPORT
${audit.full_report || 'N/A'}
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${audit.business_name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {audit.business_name}
          </DialogTitle>
          <a href={audit.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
            {audit.website_url}
          </a>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh]">
          <div className="space-y-4 pr-4">
            {/* Quick Verdict */}
            {audit.quick_verdict && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Verdetto Rapido</h3>
                <p className="text-base leading-relaxed">{audit.quick_verdict}</p>
              </div>
            )}

            {/* Overall Score */}
            <div className="text-center py-4">
              <div className="text-xs text-muted-foreground mb-1">PUNTEGGIO COMPLESSIVO</div>
              <div className={`text-5xl font-bold ${scoreTextColor(audit.overall_score)}`}>
                {audit.overall_score ?? '—'}
                <span className="text-lg font-normal text-muted-foreground">/10</span>
              </div>
            </div>

            {/* Score Cards */}
            <div className="grid grid-cols-3 gap-3">
              <ScoreCard label="🎨 Design" score={audit.design_score} />
              <ScoreCard label="🔍 SEO" score={audit.seo_score} />
              <ScoreCard label="📱 Mobile" score={audit.mobile_score} />
            </div>

            {/* Full Report */}
            {audit.full_report && (
              <div className="p-4 rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Report Tecnico</h3>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{audit.full_report}</div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {audit.lead_email && (
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-1" />📧 Invia al Cliente
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <FileText className="h-4 w-4 mr-1" />📄 Download Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuditReportModal;
