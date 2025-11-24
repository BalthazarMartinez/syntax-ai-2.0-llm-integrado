import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Download, Trash2, FileText, Edit, Loader2, Check, ChevronsUpDown, Eye, Sparkles, Printer, ExternalLink, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Opportunity, InputFile, Artifact, Client, Responsible } from "@/types/database";
import { uploadInputFile, getSignedUrl, deleteInputFile } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [inputs, setInputs] = useState<InputFile[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);
  const [clientOpen, setClientOpen] = useState(false);
  const [responsibleOpen, setResponsibleOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    opportunity_name: "",
    description: "",
    client_id: 0,
    client_name: "",
    responsible_id: 0,
    responsible_name: "",
    status: "",
  });
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [generatingDSP, setGeneratingDSP] = useState(false);
  const [dspPreviewOpen, setDspPreviewOpen] = useState(false);
  const [dspPreviewUrl, setDspPreviewUrl] = useState<string | null>(null);
  const [dspTextPreviewOpen, setDspTextPreviewOpen] = useState(false);
  const [dspTextContent, setDspTextContent] = useState("");
  const [loadingDspText, setLoadingDspText] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOpportunityDetails();
      fetchClients();
      fetchResponsibles();
    }
  }, [id]);

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

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);

      const opportunityId = Number(id);

      const { data: oppData, error: oppError } = await supabase
        .from("opportunities")
        .select(`
          *,
          client:clients(client_id, client_name, created_at),
          responsible:responsibles(responsible_id, responsible_name, is_active)
        `)
        .eq("opportunity_id", opportunityId)
        .single();

      if (oppError) throw oppError;
      setOpportunity(oppData);
      
      // Initialize edit form data
      setEditFormData({
        opportunity_name: oppData.opportunity_name,
        description: oppData.description || "",
        client_id: oppData.client_id,
        client_name: oppData.client?.client_name || "",
        responsible_id: oppData.responsible_id || 0,
        responsible_name: oppData.responsible?.responsible_name || "",
        status: oppData.status || "OPEN",
      });

      const { data: inputsData, error: inputsError } = await supabase
        .from("inputs")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("uploaded_at", { ascending: false });

      if (!inputsError) setInputs(inputsData || []);

      const { data: artifactsData, error: artifactsError } = await supabase
        .from("artifacts")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("generated_at", { ascending: false });

      if (!artifactsError) setArtifacts(artifactsData || []);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      // Use the utility function to upload
      const result = await uploadInputFile(file, Number(id));

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Get user info and file size
      const user = await supabase.auth.getUser();
      const fileSizeKb = Math.round(file.size / 1024);

      // Insert record into database
      const { error: dbError } = await supabase
        .from("inputs")
        .insert({
          opportunity_id: Number(id),
          input_name: file.name,
          storage_path: result.storagePath!,
          file_size_kb: fileSizeKb,
          uploaded_by: user.data.user?.email || "system",
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      fetchOpportunityDetails();
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handlePreviewInput = async (input: InputFile) => {
    try {
      const signedUrl = await getSignedUrl(input.storage_path, 3600); // URL válida por 1 hora
      
      if (!signedUrl) {
        throw new Error("Failed to generate preview URL");
      }

      setPreviewUrl(signedUrl);
      setPreviewFileName(input.input_name);
      setPreviewDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDownloadInput = async (input: InputFile) => {
    try {
      const signedUrl = await getSignedUrl(input.storage_path);
      
      if (!signedUrl) {
        throw new Error("Failed to generate download URL");
      }

      // Fetch el archivo como blob
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error("Failed to download file");
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = input.input_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Download started",
        description: `Downloading ${input.input_name}`,
      });
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePrintArtifact = async (artifactUrl: string) => {
    try {
      // Open the HTML in a new window and trigger print
      const printWindow = window.open(artifactUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      } else {
        throw new Error("Failed to open print window");
      }
    } catch (error: any) {
      toast({
        title: "Print failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGenerateDSP = async () => {
    if (!id) return;
    
    try {
      setGeneratingDSP(true);
      
      toast({
        title: "Generating DSP",
        description: "This may take a few moments...",
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("You must be logged in to generate a DSP");
      }

      const response = await supabase.functions.invoke('generate_dsp', {
        body: { opportunity_id: Number(id) },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to generate DSP");
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || "Failed to generate DSP");
      }

      toast({
        title: "Success",
        description: "Deal Strategy Plan generated successfully",
      });

      // Refresh artifacts list
      await fetchOpportunityDetails();
    } catch (error: any) {
      console.error("DSP generation error:", error);
      toast({
        title: "Generation failed",
        description: error.message || "An error occurred while generating the DSP",
        variant: "destructive",
      });
    } finally {
      setGeneratingDSP(false);
    }
  };

  const handlePreviewDSP = (artifactUrl: string) => {
    setDspPreviewUrl(artifactUrl);
    setDspPreviewOpen(true);
  };

  const handlePreviewDSPText = async (artifactUrl: string) => {
    try {
      setLoadingDspText(true);
      
      // Fetch the HTML content
      const response = await fetch(artifactUrl);
      if (!response.ok) {
        throw new Error("Failed to fetch DSP content");
      }
      
      const htmlContent = await response.text();
      
      // Parse HTML and extract text preserving structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, "text/html");
      let textContent = doc.body.innerText || doc.body.textContent || "";
      
      // Normalize multiple line breaks to maximum 2
      textContent = textContent.replace(/\n{3,}/g, "\n\n");
      
      setDspTextContent(textContent);
      setDspTextPreviewOpen(true);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingDspText(false);
    }
  };

  const handleCopyDSPText = async () => {
    try {
      await navigator.clipboard.writeText(dspTextContent);
      toast({
        title: "Copied",
        description: "DSP text copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.opportunity_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Opportunity name is required",
        variant: "destructive",
      });
      return;
    }

    if (!editFormData.client_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client is required",
        variant: "destructive",
      });
      return;
    }

    if (!editFormData.responsible_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Responsible is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      let clientId = editFormData.client_id;

      if (!clientId) {
        const { data: newClient, error: clientError } = await supabase
          .from("clients")
          .insert({ client_name: editFormData.client_name.trim() })
          .select()
          .single();

        if (clientError) throw clientError;
        clientId = newClient.client_id;
      }

      let responsibleId = editFormData.responsible_id;

      if (!responsibleId) {
        const { data: newResponsible, error: responsibleError } = await supabase
          .from("responsibles")
          .insert({ responsible_name: editFormData.responsible_name.trim(), is_active: true })
          .select()
          .single();

        if (responsibleError) throw responsibleError;
        responsibleId = newResponsible.responsible_id;
      }

      const { error: updateError } = await supabase
        .from("opportunities")
        .update({
          opportunity_name: editFormData.opportunity_name.trim(),
          description: editFormData.description.trim() || null,
          client_id: clientId,
          responsible_id: responsibleId,
          status: editFormData.status,
        })
        .eq("opportunity_id", Number(id));

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      });

      setEditDialogOpen(false);
      fetchOpportunityDetails();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInput = async (inputId: number, storagePath: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      // Delete from storage using utility function
      const storageDeleted = await deleteInputFile(storagePath);
      
      if (!storageDeleted) {
        throw new Error("Failed to delete file from storage");
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("inputs")
        .delete()
        .eq("input_id", inputId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchOpportunityDetails();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">
            Opportunity not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto space-y-6 p-6">
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
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{opportunity.opportunity_name}</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1 mt-2">
                  <p><strong>Client:</strong> {opportunity.client?.client_name}</p>
                  <p><strong>Responsible:</strong> {opportunity.responsible?.responsible_name}</p>
                  <p><strong>Status:</strong> {opportunity.status}</p>
                  {opportunity.description && (
                    <p className="mt-2">{opportunity.description}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Source Material (Inputs)</CardTitle>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploading && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {inputs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No files uploaded yet
                </div>
              ) : (
                <div className="space-y-2">
                  {inputs.map((input) => (
                    <div
                      key={input.input_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{input.input_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {input.file_size_kb} KB
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewInput(input)}
                          title="Preview PDF"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadInput(input)}
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteInput(input.input_id, input.storage_path)
                          }
                          title="Delete PDF"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Artifacts (Output)</CardTitle>
                <Button
                  size="sm"
                  onClick={handleGenerateDSP}
                  disabled={generatingDSP || inputs.length === 0}
                >
                  {generatingDSP ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate DSP
                    </>
                  )}
                </Button>
              </div>
              {inputs.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Upload at least one input document to generate a DSP
                </p>
              )}
            </CardHeader>
            <CardContent>
              {artifacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No artifacts generated yet
                </div>
              ) : (
                <div className="space-y-2">
                  {artifacts.map((artifact) => (
                    <div
                      key={artifact.artifact_id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{artifact.artifact_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {artifact.artifact_type || "Document"} {artifact.version && `v${artifact.version}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <TooltipProvider>
                          {artifact.artifact_type === "DSP" ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePreviewDSPText(artifact.artifact_url)}
                                      disabled={!artifact.artifact_url || loadingDspText}
                                      title="Preview as text"
                                    >
                                      {loadingDspText ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Eye className="h-4 w-4 mr-2" />
                                      )}
                                      Preview
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!artifact.artifact_url && (
                                  <TooltipContent>
                                    <p>Artifact not available</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => window.open(artifact.artifact_url, "_blank")}
                                      disabled={!artifact.artifact_url}
                                      title="Download HTML"
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                {!artifact.artifact_url && (
                                  <TooltipContent>
                                    <p>Artifact not available</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(artifact.artifact_url, "_blank")}
                                title="View"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePrintArtifact(artifact.artifact_url)}
                                title="Print"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-5xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>{previewFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-[calc(85vh-120px)]"
                title="PDF Preview"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={async () => {
                if (previewUrl) {
                  try {
                    const response = await fetch(previewUrl);
                    if (!response.ok) {
                      throw new Error("Failed to download file");
                    }
                    
                    const blob = await response.blob();
                    const blobUrl = URL.createObjectURL(blob);
                    
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = previewFileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(blobUrl);
                    
                    toast({
                      title: "Download started",
                      description: `Downloading ${previewFileName}`,
                    });
                  } catch (error) {
                    toast({
                      title: "Download failed",
                      description: "Could not download the file",
                      variant: "destructive",
                    });
                  }
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="edit_opportunity_name">Opportunity Name *</Label>
              <Input
                id="edit_opportunity_name"
                value={editFormData.opportunity_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, opportunity_name: e.target.value })
                }
                placeholder="Enter opportunity name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
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
                    type="button"
                  >
                    {editFormData.client_name || "Select or type new client..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new client..."
                      value={editFormData.client_name}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, client_name: value, client_id: 0 })
                      }
                    />
                    <CommandEmpty>
                      Press Enter to create "{editFormData.client_name}"
                    </CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.client_id}
                          value={client.client_name}
                          onSelect={() => {
                            setEditFormData({
                              ...editFormData,
                              client_id: client.client_id,
                              client_name: client.client_name,
                            });
                            setClientOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              editFormData.client_id === client.client_id
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
                    type="button"
                  >
                    {editFormData.responsible_name || "Select or type new responsible..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput
                      placeholder="Search or type new responsible..."
                      value={editFormData.responsible_name}
                      onValueChange={(value) =>
                        setEditFormData({ ...editFormData, responsible_name: value, responsible_id: 0 })
                      }
                    />
                    <CommandEmpty>
                      Press Enter to create "{editFormData.responsible_name}"
                    </CommandEmpty>
                    <CommandGroup>
                      {responsibles.map((responsible) => (
                        <CommandItem
                          key={responsible.responsible_id}
                          value={responsible.responsible_name}
                          onSelect={() => {
                            setEditFormData({
                              ...editFormData,
                              responsible_id: responsible.responsible_id,
                              responsible_name: responsible.responsible_name,
                            });
                            setResponsibleOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              editFormData.responsible_id === responsible.responsible_id
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

            <div className="space-y-2">
              <Label htmlFor="edit_status">Status *</Label>
              <Input
                id="edit_status"
                value={editFormData.status}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, status: e.target.value })
                }
                placeholder="Enter status"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DSP Preview Dialog */}
      <Dialog open={dspPreviewOpen} onOpenChange={setDspPreviewOpen}>
        <DialogContent className="max-w-7xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>Deal Strategy Plan Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border">
            {dspPreviewUrl && (
              <iframe
                src={dspPreviewUrl}
                className="w-full h-[calc(90vh-120px)]"
                title="DSP Preview"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDspPreviewOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (dspPreviewUrl) {
                  window.open(dspPreviewUrl, '_blank');
                }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              onClick={() => {
                if (dspPreviewUrl) {
                  handlePrintArtifact(dspPreviewUrl);
                }
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print to PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DSP Text Preview Dialog */}
      <Dialog open={dspTextPreviewOpen} onOpenChange={setDspTextPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Deal Strategy Plan Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {dspTextContent}
            </pre>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDspTextPreviewOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleCopyDSPText}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
