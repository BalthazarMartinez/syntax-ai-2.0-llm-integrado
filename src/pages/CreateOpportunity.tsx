import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Client, Responsible } from "@/types/database";
import { Header } from "@/components/Header";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CreateOpportunity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [responsibleOpen, setResponsibleOpen] = useState(false);

  const [formData, setFormData] = useState({
    opportunity_name: "",
    description: "",
    client_id: 0,
    client_name: "",
    responsible_id: 0,
    responsible_name: "",
  });

  useEffect(() => {
    fetchClients();
    fetchResponsibles();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("client_name");

    if (!error && data) {
      setClients(data);
    }
  };

  const fetchResponsibles = async () => {
    const { data, error } = await supabase
      .from("responsibles")
      .select("*")
      .eq("is_active", true)
      .order("responsible_name");

    if (!error && data) {
      setResponsibles(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.opportunity_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Opportunity name is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.client_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.responsible_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Responsible is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      let clientId = formData.client_id;

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({ client_name: formData.client_name.trim() })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.client_id;
      }

      let responsibleId = formData.responsible_id;

      if (!responsibleId) {
        const { data: newResponsible, error: responsibleError } = await supabase
          .from("responsibles")
          .insert({ responsible_name: formData.responsible_name.trim(), is_active: true })
          .select()
          .single();

        if (responsibleError) throw responsibleError;
        responsibleId = newResponsible.responsible_id;
      }

      const { error: oppError } = await supabase
        .from("opportunities")
        .insert({
          opportunity_name: formData.opportunity_name.trim(),
          description: formData.description.trim() || null,
          client_id: clientId,
          responsible_id: responsibleId,
          status: "OPEN",
          generated_by: (await supabase.auth.getUser()).data.user?.email || "system",
        });

      if (oppError) throw oppError;

      toast({
        title: "Success",
        description: "Generation request created successfully",
      });

      navigate("/opportunities");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-3xl mx-auto space-y-6 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/opportunities")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pipeline
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>New Generation Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="opportunity_name">Request Name *</Label>
                <Input
                  id="opportunity_name"
                  value={formData.opportunity_name}
                  onChange={(e) =>
                    setFormData({ ...formData, opportunity_name: e.target.value })
                  }
                  placeholder="Enter request name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter description (optional)"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Client *</Label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientOpen}
                      className="w-full justify-between"
                    >
                      {formData.client_name || "Select or type new client..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search or type new client..."
                        value={formData.client_name}
                        onValueChange={(value) =>
                          setFormData({ ...formData, client_name: value, client_id: 0 })
                        }
                      />
                      <CommandEmpty>
                        Press Enter to create "{formData.client_name}"
                      </CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.client_id}
                            value={client.client_name}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                client_id: client.client_id,
                                client_name: client.client_name,
                              });
                              setClientOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.client_id === client.client_id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {client.client_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Responsible *</Label>
                <Popover open={responsibleOpen} onOpenChange={setResponsibleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={responsibleOpen}
                      className="w-full justify-between"
                    >
                      {formData.responsible_name || "Select or type new responsible..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search or type new responsible..."
                        value={formData.responsible_name}
                        onValueChange={(value) =>
                          setFormData({ ...formData, responsible_name: value, responsible_id: 0 })
                        }
                      />
                      <CommandEmpty>
                        Press Enter to create "{formData.responsible_name}"
                      </CommandEmpty>
                      <CommandGroup>
                        {responsibles.map((responsible) => (
                          <CommandItem
                            key={responsible.responsible_id}
                            value={responsible.responsible_name}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                responsible_id: responsible.responsible_id,
                                responsible_name: responsible.responsible_name,
                              });
                              setResponsibleOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.responsible_id === responsible.responsible_id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {responsible.responsible_name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/opportunities")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Request"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
