export type Client = {
  client_id: number;
  client_name: string;
  created_at: string;
};

export type Responsible = {
  responsible_id: number;
  responsible_name: string;
  is_active: boolean;
};

export type Opportunity = {
  opportunity_id: number;
  opportunity_name: string;
  description?: string | null;
  client_id: number;
  responsible_id?: number | null;
  status: string;
  generated_at: string;
  generated_by?: string | null;
  client?: Client;
  responsible?: Responsible;
};

export type InputFile = {
  input_id: number;
  opportunity_id: number;
  input_name: string;
  storage_path: string;
  file_size_kb?: number | null;
  uploaded_at: string;
  uploaded_by?: string | null;
};

export type Artifact = {
  artifact_id: number;
  opportunity_id: number;
  artifact_name: string;
  artifact_url: string;
  artifact_type?: string | null;
  generated_at: string;
  generated_by?: string | null;
};
