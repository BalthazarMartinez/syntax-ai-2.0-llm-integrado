import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Opportunity } from "@/types/database";
import { Header } from "@/components/Header";

export default function Opportunities() {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [inputCounts, setInputCounts] = useState<Record<number, number>>({});
  const [artifactCounts, setArtifactCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      
      const { data: oppsData, error: oppsError } = await supabase
        .from("opportunities")
        .select(`
          *,
          client:clients(client_id, client_name, created_at),
          responsible:responsibles(responsible_id, responsible_name, is_active)
        `)
        .order("generated_at", { ascending: false });

      if (oppsError) throw oppsError;

      setOpportunities(oppsData || []);

      const { data: inputsData, error: inputsError } = await supabase
        .from("inputs")
        .select("opportunity_id");

      if (!inputsError && inputsData) {
        const counts: Record<number, number> = {};
        inputsData.forEach((input) => {
          counts[input.opportunity_id] = (counts[input.opportunity_id] || 0) + 1;
        });
        setInputCounts(counts);
      }

      const { data: artifactsData, error: artifactsError} = await supabase
        .from("artifacts")
        .select("opportunity_id");

      if (!artifactsError && artifactsData) {
        const counts: Record<number, number> = {};
        artifactsData.forEach((artifact) => {
          counts[artifact.opportunity_id] = (counts[artifact.opportunity_id] || 0) + 1;
        });
        setArtifactCounts(counts);
      }
    } catch (error: any) {
      toast({
        title: "Error loading opportunities",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) =>
    opp.opportunity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.client?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Generation Pipeline</h1>
          <Button onClick={() => navigate("/create-opportunity")}>
            <Plus className="h-4 w-4 mr-2" />
            New Generation Request
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Requests</CardTitle>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, client, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredOpportunities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No opportunities found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Responsible</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Inputs</TableHead>
                    <TableHead className="text-right">Artifacts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.map((opp) => (
                    <TableRow
                      key={opp.opportunity_id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/opportunity/${opp.opportunity_id}`)}
                    >
                      <TableCell className="font-medium">{opp.opportunity_name}</TableCell>
                      <TableCell>{opp.client?.client_name || "-"}</TableCell>
                      <TableCell>{opp.responsible?.responsible_name || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {opp.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {inputCounts[opp.opportunity_id] || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {artifactCounts[opp.opportunity_id] || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
