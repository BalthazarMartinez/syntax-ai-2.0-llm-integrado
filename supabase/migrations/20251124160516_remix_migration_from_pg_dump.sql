CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



SET default_table_access_method = heap;

--
-- Name: artifacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.artifacts (
    artifact_id integer NOT NULL,
    opportunity_id integer NOT NULL,
    artifact_name character varying(255) NOT NULL,
    artifact_url text NOT NULL,
    artifact_type character varying(50),
    generated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by character varying(255)
);


--
-- Name: artifacts_artifact_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.artifacts_artifact_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: artifacts_artifact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.artifacts_artifact_id_seq OWNED BY public.artifacts.artifact_id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    client_id integer NOT NULL,
    client_name character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: clients_client_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_client_id_seq OWNED BY public.clients.client_id;


--
-- Name: inputs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inputs (
    input_id integer NOT NULL,
    opportunity_id integer NOT NULL,
    input_name character varying(255) NOT NULL,
    storage_path text NOT NULL,
    file_size_kb integer,
    uploaded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    uploaded_by character varying(255)
);


--
-- Name: inputs_input_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inputs_input_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inputs_input_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inputs_input_id_seq OWNED BY public.inputs.input_id;


--
-- Name: opportunities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opportunities (
    opportunity_id integer NOT NULL,
    opportunity_name character varying(255) NOT NULL,
    description text,
    client_id integer NOT NULL,
    responsible_id integer NOT NULL,
    status character varying(50) DEFAULT 'OPEN'::character varying,
    generated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by character varying(255)
);


--
-- Name: opportunities_opportunity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.opportunities_opportunity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opportunities_opportunity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.opportunities_opportunity_id_seq OWNED BY public.opportunities.opportunity_id;


--
-- Name: responsibles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.responsibles (
    responsible_id integer NOT NULL,
    responsible_name character varying(255) NOT NULL,
    is_active boolean DEFAULT true
);


--
-- Name: responsibles_responsible_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.responsibles_responsible_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: responsibles_responsible_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.responsibles_responsible_id_seq OWNED BY public.responsibles.responsible_id;


--
-- Name: artifacts artifact_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artifacts ALTER COLUMN artifact_id SET DEFAULT nextval('public.artifacts_artifact_id_seq'::regclass);


--
-- Name: clients client_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN client_id SET DEFAULT nextval('public.clients_client_id_seq'::regclass);


--
-- Name: inputs input_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inputs ALTER COLUMN input_id SET DEFAULT nextval('public.inputs_input_id_seq'::regclass);


--
-- Name: opportunities opportunity_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities ALTER COLUMN opportunity_id SET DEFAULT nextval('public.opportunities_opportunity_id_seq'::regclass);


--
-- Name: responsibles responsible_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsibles ALTER COLUMN responsible_id SET DEFAULT nextval('public.responsibles_responsible_id_seq'::regclass);


--
-- Name: artifacts artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_pkey PRIMARY KEY (artifact_id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (client_id);


--
-- Name: inputs inputs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inputs
    ADD CONSTRAINT inputs_pkey PRIMARY KEY (input_id);


--
-- Name: opportunities opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_pkey PRIMARY KEY (opportunity_id);


--
-- Name: responsibles responsibles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.responsibles
    ADD CONSTRAINT responsibles_pkey PRIMARY KEY (responsible_id);


--
-- Name: idx_artifacts_opportunity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_artifacts_opportunity ON public.artifacts USING btree (opportunity_id);


--
-- Name: idx_inputs_opportunity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inputs_opportunity ON public.inputs USING btree (opportunity_id);


--
-- Name: idx_opportunities_client; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_client ON public.opportunities USING btree (client_id);


--
-- Name: idx_opportunities_responsible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_opportunities_responsible ON public.opportunities USING btree (responsible_id);


--
-- Name: artifacts artifacts_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE;


--
-- Name: inputs inputs_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inputs
    ADD CONSTRAINT inputs_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(opportunity_id) ON DELETE CASCADE;


--
-- Name: opportunities opportunities_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(client_id) ON DELETE RESTRICT;


--
-- Name: opportunities opportunities_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opportunities
    ADD CONSTRAINT opportunities_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.responsibles(responsible_id) ON DELETE SET NULL;


--
-- Name: artifacts Allow authenticated users full access to artifacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users full access to artifacts" ON public.artifacts TO authenticated USING (true) WITH CHECK (true);


--
-- Name: clients Allow authenticated users full access to clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users full access to clients" ON public.clients TO authenticated USING (true) WITH CHECK (true);


--
-- Name: inputs Allow authenticated users full access to inputs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users full access to inputs" ON public.inputs TO authenticated USING (true) WITH CHECK (true);


--
-- Name: opportunities Allow authenticated users full access to opportunities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users full access to opportunities" ON public.opportunities TO authenticated USING (true) WITH CHECK (true);


--
-- Name: responsibles Allow authenticated users full access to responsibles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated users full access to responsibles" ON public.responsibles TO authenticated USING (true) WITH CHECK (true);


--
-- Name: artifacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: inputs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inputs ENABLE ROW LEVEL SECURITY;

--
-- Name: opportunities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

--
-- Name: responsibles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.responsibles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


