import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, UserX, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Responsible } from "@/types/database";
import { Header } from "@/components/Header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function Responsibles() {
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newResponsibleName, setNewResponsibleName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResponsibles();
  }, []);

  const fetchResponsibles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("responsibles")
        .select("*")
        .order("responsible_name");

      if (error) throw error;
      setResponsibles(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading responsibles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResponsible = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newResponsibleName.trim()) {
      toast({
        title: "Validation Error",
        description: "Responsible name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from("responsibles")
        .insert({ 
          responsible_name: newResponsibleName.trim(),
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Responsible created successfully",
      });

      setNewResponsibleName("");
      setDialogOpen(false);
      fetchResponsibles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActiveStatus = async (responsibleId: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("responsibles")
        .update({ is_active: !currentStatus })
        .eq("responsible_id", responsibleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Responsible ${!currentStatus ? "activated" : "deactivated"} successfully`,
      });

      fetchResponsibles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-5xl mx-auto space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Responsible Management</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Responsible
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Responsible</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateResponsible} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible_name">Responsible Name</Label>
                  <Input
                    id="responsible_name"
                    value={newResponsibleName}
                    onChange={(e) => setNewResponsibleName(e.target.value)}
                    placeholder="Enter responsible name"
                    required
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Creating..." : "Create Responsible"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Responsibles</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : responsibles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No responsibles found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsibles.map((responsible) => (
                    <TableRow key={responsible.responsible_id}>
                      <TableCell className="font-medium">
                        {responsible.responsible_name}
                      </TableCell>
                      <TableCell>
                        {responsible.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toggleActiveStatus(
                              responsible.responsible_id,
                              responsible.is_active
                            )
                          }
                        >
                          {responsible.is_active ? (
                            <UserX className="h-4 w-4 text-destructive" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-primary" />
                          )}
                        </Button>
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
