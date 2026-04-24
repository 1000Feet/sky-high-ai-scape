import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BarChart3, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import AuditReportModal from './AuditReportModal';

interface Audit {
  id: string;
  lead_id: string | null;
  business_name: string;
  website_url: string;
  status: string;
  quick_verdict: string | null;
  overall_score: number | null;
  design_score: number | null;
  seo_score: number | null;
  mobile_score: number | null;
  full_report: string | null;
  created_at: string;
  completed_at: string | null;
}

const scoreBadgeClass = (score: number | null) => {
  if (!score) return 'bg-muted text-muted-foreground';
  if (score < 5) return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (score <= 7) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-green-500/20 text-green-400 border-green-500/30';
};

const AuditsTab: React.FC = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchAudits = async () => {
    try {
      const { data, error } = await (supabase.from('website_audits') as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setAudits(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAudits(); }, []);

  const filtered = useMemo(() => {
    if (!showLowOnly) return audits.filter(a => a.status === 'completed');
    return audits.filter(a => a.status === 'completed' && (a.overall_score ?? 10) < 5);
  }, [audits, showLowOnly]);

  const completedAudits = audits.filter(a => a.status === 'completed');
  const avgScore = completedAudits.length > 0
    ? (completedAudits.reduce((s, a) => s + (a.overall_score ?? 0), 0) / completedAudits.length).toFixed(1)
    : '—';
  const lowScoreCount = completedAudits.filter(a => (a.overall_score ?? 10) < 5).length;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[200px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />Website Audits</CardTitle>
        <CardDescription>Tutti gli audit completati</CardDescription>
        {/* Stats */}
        <div className="flex gap-4 mt-3">
          <div className="text-center p-2 rounded-lg bg-muted/50 border border-border flex-1">
            <div className="text-2xl font-bold text-primary">{completedAudits.length}</div>
            <div className="text-xs text-muted-foreground">Audit totali</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50 border border-border flex-1">
            <div className="text-2xl font-bold text-primary">{avgScore}</div>
            <div className="text-xs text-muted-foreground">Media score</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50 border border-border flex-1">
            <div className="text-2xl font-bold text-red-400">{lowScoreCount}</div>
            <div className="text-xs text-muted-foreground">Score &lt; 5 (hot leads)</div>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Checkbox checked={showLowOnly} onCheckedChange={(c) => setShowLowOnly(!!c)} />
          <label className="text-sm text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3" /> Mostra solo score &lt; 5
          </label>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nessun audit completato.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Overall</TableHead>
                  <TableHead>Design</TableHead>
                  <TableHead>SEO</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((audit) => (
                  <TableRow
                    key={audit.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => { setSelectedAudit(audit); setModalOpen(true); }}
                  >
                    <TableCell>
                      <div className="font-medium">{audit.business_name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{audit.website_url}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={scoreBadgeClass(audit.overall_score)}>
                        {audit.overall_score ?? '—'}/10
                      </Badge>
                    </TableCell>
                    <TableCell><span className="text-sm">{audit.design_score ?? '—'}</span></TableCell>
                    <TableCell><span className="text-sm">{audit.seo_score ?? '—'}</span></TableCell>
                    <TableCell><span className="text-sm">{audit.mobile_score ?? '—'}</span></TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(audit.completed_at || audit.created_at), 'dd/MM/yyyy')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AuditReportModal
        audit={selectedAudit}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </Card>
  );
};

export default AuditsTab;
