--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: admin; Type: SCHEMA; Schema: -; Owner: locod_user
--

CREATE SCHEMA admin;


ALTER SCHEMA admin OWNER TO locod_user;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: locod_user
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO locod_user;

--
-- Name: queue; Type: SCHEMA; Schema: -; Owner: locod_user
--

CREATE SCHEMA queue;


ALTER SCHEMA queue OWNER TO locod_user;

--
-- Name: sites; Type: SCHEMA; Schema: -; Owner: locod_user
--

CREATE SCHEMA sites;


ALTER SCHEMA sites OWNER TO locod_user;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: admin_action_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.admin_action_enum AS ENUM (
    'assign',
    'start',
    'complete',
    'reject',
    'update',
    'cancel'
);


ALTER TYPE public.admin_action_enum OWNER TO locod_user;

--
-- Name: billing_status_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.billing_status_enum AS ENUM (
    'pending',
    'billed',
    'paid',
    'refunded'
);


ALTER TYPE public.billing_status_enum OWNER TO locod_user;

--
-- Name: priority_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.priority_enum AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
);


ALTER TYPE public.priority_enum OWNER TO locod_user;

--
-- Name: request_status_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.request_status_enum AS ENUM (
    'pending',
    'assigned',
    'processing',
    'completed',
    'rejected'
);


ALTER TYPE public.request_status_enum OWNER TO locod_user;

--
-- Name: request_type_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.request_type_enum AS ENUM (
    'services',
    'hero',
    'about',
    'testimonials',
    'faq',
    'seo'
);


ALTER TYPE public.request_type_enum OWNER TO locod_user;

--
-- Name: wizard_status_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.wizard_status_enum AS ENUM (
    'draft',
    'in_progress',
    'completed',
    'cancelled',
    'expired'
);


ALTER TYPE public.wizard_status_enum OWNER TO locod_user;

--
-- Name: wizard_step_enum; Type: TYPE; Schema: public; Owner: locod_user
--

CREATE TYPE public.wizard_step_enum AS ENUM (
    'business_info',
    'template_selection',
    'design_preferences',
    'content_creation',
    'ai_generation',
    'customization',
    'review',
    'deployment'
);


ALTER TYPE public.wizard_step_enum OWNER TO locod_user;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: locod_user
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO locod_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: admin; Owner: locod_user
--

CREATE TABLE admin.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action character varying(100) NOT NULL,
    admin_user_id uuid NOT NULL,
    target_user_id uuid,
    target_resource character varying(100),
    metadata jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE admin.audit_logs OWNER TO locod_user;

--
-- Name: TABLE audit_logs; Type: COMMENT; Schema: admin; Owner: locod_user
--

COMMENT ON TABLE admin.audit_logs IS 'Audit trail for all admin actions performed in the system';


--
-- Name: COLUMN audit_logs.action; Type: COMMENT; Schema: admin; Owner: locod_user
--

COMMENT ON COLUMN admin.audit_logs.action IS 'Type of action performed (e.g., user_created, session_terminated)';


--
-- Name: COLUMN audit_logs.admin_user_id; Type: COMMENT; Schema: admin; Owner: locod_user
--

COMMENT ON COLUMN admin.audit_logs.admin_user_id IS 'ID of the admin user who performed the action';


--
-- Name: COLUMN audit_logs.target_user_id; Type: COMMENT; Schema: admin; Owner: locod_user
--

COMMENT ON COLUMN admin.audit_logs.target_user_id IS 'ID of the user affected by the action (if applicable)';


--
-- Name: COLUMN audit_logs.target_resource; Type: COMMENT; Schema: admin; Owner: locod_user
--

COMMENT ON COLUMN admin.audit_logs.target_resource IS 'Type of resource affected (e.g., user, session, dashboard)';


--
-- Name: COLUMN audit_logs.metadata; Type: COMMENT; Schema: admin; Owner: locod_user
--

COMMENT ON COLUMN admin.audit_logs.metadata IS 'Additional context data for the action';


--
-- Name: customers; Type: TABLE; Schema: auth; Owner: locod_user
--

CREATE TABLE auth.customers (
    id uuid NOT NULL,
    company_name character varying(255),
    phone character varying(50),
    address text,
    subscription_tier character varying(50) DEFAULT 'free'::character varying,
    site_quota integer DEFAULT 1,
    storage_quota_mb integer DEFAULT 100,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE auth.customers OWNER TO locod_user;

--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: locod_user
--

CREATE TABLE auth.sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(500) NOT NULL,
    refresh_token character varying(500),
    ip_address inet,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    device_info character varying(500),
    is_active boolean DEFAULT true,
    last_active_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE auth.sessions OWNER TO locod_user;

--
-- Name: COLUMN sessions.device_info; Type: COMMENT; Schema: auth; Owner: locod_user
--

COMMENT ON COLUMN auth.sessions.device_info IS 'Device information for session tracking';


--
-- Name: COLUMN sessions.is_active; Type: COMMENT; Schema: auth; Owner: locod_user
--

COMMENT ON COLUMN auth.sessions.is_active IS 'Whether the session is currently active';


--
-- Name: COLUMN sessions.last_active_at; Type: COMMENT; Schema: auth; Owner: locod_user
--

COMMENT ON COLUMN auth.sessions.last_active_at IS 'Timestamp of last activity for this session';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: locod_user
--

CREATE TABLE auth.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    role character varying(50) DEFAULT 'customer'::character varying,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE auth.users OWNER TO locod_user;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: locod_user
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    details jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.activity_logs OWNER TO locod_user;

--
-- Name: admin_activity_log; Type: TABLE; Schema: public; Owner: locod_user
--

CREATE TABLE public.admin_activity_log (
    id integer NOT NULL,
    admin_id integer NOT NULL,
    action public.admin_action_enum NOT NULL,
    target_type character varying(50) NOT NULL,
    target_id integer NOT NULL,
    details jsonb,
    ip_address inet,
    user_agent text,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_activity_log OWNER TO locod_user;

--
-- Name: TABLE admin_activity_log; Type: COMMENT; Schema: public; Owner: locod_user
--

COMMENT ON TABLE public.admin_activity_log IS 'Audit trail for all admin actions';


--
-- Name: admin_activity_log_id_seq; Type: SEQUENCE; Schema: public; Owner: locod_user
--

CREATE SEQUENCE public.admin_activity_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_activity_log_id_seq OWNER TO locod_user;

--
-- Name: admin_activity_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: locod_user
--

ALTER SEQUENCE public.admin_activity_log_id_seq OWNED BY public.admin_activity_log.id;


--
-- Name: ai_request_history; Type: TABLE; Schema: public; Owner: locod_user
--

CREATE TABLE public.ai_request_history (
    id integer NOT NULL,
    request_id integer NOT NULL,
    previous_status public.request_status_enum,
    new_status public.request_status_enum NOT NULL,
    changed_by integer NOT NULL,
    change_reason text,
    details jsonb,
    "timestamp" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_request_history OWNER TO locod_user;

--
-- Name: TABLE ai_request_history; Type: COMMENT; Schema: public; Owner: locod_user
--

COMMENT ON TABLE public.ai_request_history IS 'History of status changes for AI requests';


--
-- Name: ai_request_history_id_seq; Type: SEQUENCE; Schema: public; Owner: locod_user
--

CREATE SEQUENCE public.ai_request_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_request_history_id_seq OWNER TO locod_user;

--
-- Name: ai_request_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: locod_user
--

ALTER SEQUENCE public.ai_request_history_id_seq OWNED BY public.ai_request_history.id;


--
-- Name: ai_requests; Type: TABLE; Schema: public; Owner: locod_user
--

CREATE TABLE public.ai_requests (
    id integer NOT NULL,
    site_id character varying(255) NOT NULL,
    customer_id integer NOT NULL,
    request_type public.request_type_enum NOT NULL,
    status public.request_status_enum DEFAULT 'pending'::public.request_status_enum NOT NULL,
    admin_id integer,
    request_data jsonb NOT NULL,
    generated_content jsonb,
    processing_notes text,
    created_at timestamp without time zone DEFAULT now(),
    assigned_at timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    estimated_cost numeric(10,2),
    actual_cost numeric(10,2),
    business_type character varying(100),
    terminology text,
    priority public.priority_enum DEFAULT 'normal'::public.priority_enum,
    wizard_session_id character varying(255),
    admin_comments text,
    billing_status public.billing_status_enum DEFAULT 'pending'::public.billing_status_enum,
    customer_feedback integer,
    customer_notes text,
    feedback_at timestamp without time zone,
    revision_count integer DEFAULT 0,
    client_ip inet,
    user_agent text,
    processing_duration integer,
    error_message text,
    retry_count integer DEFAULT 0,
    expires_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ai_requests OWNER TO locod_user;

--
-- Name: TABLE ai_requests; Type: COMMENT; Schema: public; Owner: locod_user
--

COMMENT ON TABLE public.ai_requests IS 'Main table for AI content generation requests';


--
-- Name: ai_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: locod_user
--

CREATE SEQUENCE public.ai_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_requests_id_seq OWNER TO locod_user;

--
-- Name: ai_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: locod_user
--

ALTER SEQUENCE public.ai_requests_id_seq OWNED BY public.ai_requests.id;


--
-- Name: typeorm_migrations; Type: TABLE; Schema: public; Owner: locod_user
--

CREATE TABLE public.typeorm_migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);


ALTER TABLE public.typeorm_migrations OWNER TO locod_user;

--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: locod_user
--

CREATE SEQUENCE public.typeorm_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.typeorm_migrations_id_seq OWNER TO locod_user;

--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: locod_user
--

ALTER SEQUENCE public.typeorm_migrations_id_seq OWNED BY public.typeorm_migrations.id;


--
-- Name: website_wizard_sessions; Type: TABLE; Schema: public; Owner: locod_user
--

CREATE TABLE public.website_wizard_sessions (
    id character varying(255) NOT NULL,
    session_name character varying(255),
    status public.wizard_status_enum DEFAULT 'draft'::public.wizard_status_enum NOT NULL,
    current_step public.wizard_step_enum DEFAULT 'business_info'::public.wizard_step_enum NOT NULL,
    completed_steps text DEFAULT ''::text NOT NULL,
    progress_percentage integer DEFAULT 0 NOT NULL,
    business_info jsonb,
    template_selection jsonb,
    design_preferences jsonb,
    content_data jsonb,
    ai_generation_requests jsonb,
    customization_settings jsonb,
    final_configuration jsonb,
    deployment_config jsonb,
    generated_site_id character varying(255),
    expires_at timestamp without time zone NOT NULL,
    last_activity_at timestamp without time zone NOT NULL,
    estimated_completion_time integer,
    customer_id character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.website_wizard_sessions OWNER TO locod_user;

--
-- Name: ai_requests; Type: TABLE; Schema: queue; Owner: locod_user
--

CREATE TABLE queue.ai_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    site_id uuid,
    request_type character varying(50) NOT NULL,
    request_data jsonb NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    assigned_to uuid,
    priority integer DEFAULT 5,
    prompt text,
    result jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone
);


ALTER TABLE queue.ai_requests OWNER TO locod_user;

--
-- Name: sites; Type: TABLE; Schema: sites; Owner: locod_user
--

CREATE TABLE sites.sites (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_id uuid NOT NULL,
    site_id character varying(100) NOT NULL,
    site_name character varying(255) NOT NULL,
    domain character varying(255),
    business_type character varying(100),
    status character varying(50) DEFAULT 'created'::character varying,
    config jsonb,
    deployment_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deployed_at timestamp with time zone,
    build_logs text
);


ALTER TABLE sites.sites OWNER TO locod_user;

--
-- Name: templates; Type: TABLE; Schema: sites; Owner: locod_user
--

CREATE TABLE sites.templates (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(255),
    description text,
    business_types text[],
    config jsonb,
    preview_image character varying(500),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE sites.templates OWNER TO locod_user;

--
-- Name: admin_activity_log id; Type: DEFAULT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.admin_activity_log ALTER COLUMN id SET DEFAULT nextval('public.admin_activity_log_id_seq'::regclass);


--
-- Name: ai_request_history id; Type: DEFAULT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.ai_request_history ALTER COLUMN id SET DEFAULT nextval('public.ai_request_history_id_seq'::regclass);


--
-- Name: ai_requests id; Type: DEFAULT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.ai_requests ALTER COLUMN id SET DEFAULT nextval('public.ai_requests_id_seq'::regclass);


--
-- Name: typeorm_migrations id; Type: DEFAULT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.typeorm_migrations ALTER COLUMN id SET DEFAULT nextval('public.typeorm_migrations_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: admin; Owner: locod_user
--

COPY admin.audit_logs (id, action, admin_user_id, target_user_id, target_resource, metadata, ip_address, user_agent, created_at) FROM stdin;
e51515c0-8340-4c03-91c4-65dcebf34c45	dashboard_accessed	df68d3e6-8ba6-4216-9363-f0bdb6de3162	\N	dashboard	\N	::ffff:80.214.114.85	axios/1.11.0	2025-08-16 08:50:18.981631+00
cc909f1c-974b-4297-9c93-ee0113b7212c	dashboard_accessed	df68d3e6-8ba6-4216-9363-f0bdb6de3162	\N	dashboard	\N	::ffff:80.214.114.85	axios/1.11.0	2025-08-16 08:50:19.552455+00
a41fd136-069a-45ea-9a53-fbb86681e337	dashboard_accessed	df68d3e6-8ba6-4216-9363-f0bdb6de3162	\N	dashboard	\N	::ffff:80.214.114.85	axios/1.11.0	2025-08-16 08:52:01.783478+00
40dbbdef-f15c-4884-b696-0bdfbbc3c33a	dashboard_accessed	df68d3e6-8ba6-4216-9363-f0bdb6de3162	\N	dashboard	\N	::ffff:80.214.114.85	axios/1.11.0	2025-08-16 08:52:02.291349+00
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: auth; Owner: locod_user
--

COPY auth.customers (id, company_name, phone, address, subscription_tier, site_quota, storage_quota_mb, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: locod_user
--

COPY auth.sessions (id, user_id, token, refresh_token, ip_address, user_agent, expires_at, created_at, device_info, is_active, last_active_at) FROM stdin;
ae353124-d3ed-4387-b192-5d3dda4285ef	d79c433a-4a48-4036-ac85-b2c239c4f704	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJlbWFpbCI6ImZpeGVkLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUyOTc3NDAsImV4cCI6MTc1NTI5ODY0MH0.ffxn9X401zXGdqsZ9l4qs8RS5sJoji9Z942ecmXgVNg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJpYXQiOjE3NTUyOTc3NDAsImV4cCI6MTc1NTkwMjU0MH0.hm2UkIBDctVVYRBVQIBwyIoOYVHrXvD0W2Stb--vUrQ	\N	\N	2025-08-22 22:42:20.234+00	2025-08-15 22:42:20.235781+00	\N	t	2025-08-16 08:41:00.569108+00
a640f699-92c9-4403-b05a-0160d2f42b04	d79c433a-4a48-4036-ac85-b2c239c4f704	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJlbWFpbCI6ImZpeGVkLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUyOTc3OTksImV4cCI6MTc1NTI5ODY5OX0.hzXNr1gULig0FXPkHUORO9KFa9KUf9_tQqFdwv-KttI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJpYXQiOjE3NTUyOTc3OTksImV4cCI6MTc1NTkwMjU5OX0.vm6C00LyUgLNyEQS3yUxRGB7iE_SDvoQhMOCaQunhtU	::1	curl/8.5.0	2025-08-22 22:43:19.661+00	2025-08-15 22:43:19.66284+00	\N	t	2025-08-16 08:41:00.569108+00
7703fbb0-e5a2-46b3-aac0-149d7858c1bb	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1Mjk4MjA1LCJleHAiOjE3NTUyOTkxMDV9.11er9mHmEq9L3hXsCHvJOega2ruVm1O_ELFi-7ueogg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUyOTgyMDUsImV4cCI6MTc1NTkwMzAwNX0.V-DFfaK793vV3xY8M_Man7kT0H5O5h8LzWNl1irf25g	\N	\N	2025-08-22 22:50:05.09+00	2025-08-15 22:50:05.09123+00	\N	t	2025-08-16 08:41:00.569108+00
c9694916-45f5-4b02-9897-59d1f89422bd	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1Mjk4MzM3LCJleHAiOjE3NTUyOTkyMzd9.NhWKxR-mEd6d8UVP4ZmctYJqpF6AejDVvQfDATCm22s	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUyOTgzMzcsImV4cCI6MTc1NTkwMzEzN30.-rbHFaJcNW4Mvu1svak5rvzTAdbbNKy_y2h5zEOnqUg	::1	curl/8.5.0	2025-08-22 22:52:17.198+00	2025-08-15 22:52:17.199097+00	\N	t	2025-08-16 08:41:00.569108+00
fcae5594-4d18-4918-ace6-88465ba185d0	51ccf8ad-7379-43f1-bd9e-810b63165da9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWNjZjhhZC03Mzc5LTQzZjEtYmQ5ZS04MTBiNjMxNjVkYTkiLCJlbWFpbCI6InRlc3R1c2VyMDAzQHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzAyMTk3LCJleHAiOjE3NTUzMDMwOTd9.3EZcUv8r77BoH778Q5F1kNVXUrtAobk6zKTbVE-knjY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MWNjZjhhZC03Mzc5LTQzZjEtYmQ5ZS04MTBiNjMxNjVkYTkiLCJpYXQiOjE3NTUzMDIxOTcsImV4cCI6MTc1NTkwNjk5N30.5e0Hm5KF-QHWpYyeRdp_AqO8CqLlB824S9-MIXKJ7ss	\N	\N	2025-08-22 23:56:37.579+00	2025-08-15 23:56:37.5801+00	\N	t	2025-08-16 08:41:00.569108+00
ee46e000-9a2c-43e1-a572-bce0b6a247b4	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzAyMjAxLCJleHAiOjE3NTUzMDMxMDF9.t0O-u7NwGouhskNyT4n1M_S7jrhGFfwLQiwUgkaBQ6A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMDIyMDEsImV4cCI6MTc1NTkwNzAwMX0.TNfzGdf3Qhbsk_XzVvxh9WGI_QsnH99QmrYLuZc_Ayk	::ffff:80.214.114.85	curl/8.8.0	2025-08-22 23:56:41.58+00	2025-08-15 23:56:41.580967+00	\N	t	2025-08-16 08:41:00.569108+00
489a634a-9b8d-4463-8926-be9f1c4612dc	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzMzODU0LCJleHAiOjE3NTUzMzQ3NTR9.W_hQb-VRGrvE3o9QTMl_RTpxKy2RgPdnWP2yC2QzlS0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzM4NTQsImV4cCI6MTc1NTkzODY1NH0.9R93MP653IAuYCUClEKAUTRZDZmVyDjfMdQ2qnu-NMM	::1	curl/8.5.0	2025-08-23 08:44:14.918+00	2025-08-16 08:44:14.921011+00	\N	t	2025-08-16 08:44:14.921011+00
74dacb42-712d-468b-9010-07eaff79fd85	9ff376a8-7956-4672-b2d7-b6de363f785d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZmYzNzZhOC03OTU2LTQ2NzItYjJkNy1iNmRlMzYzZjc4NWQiLCJlbWFpbCI6InRlc3QtYXV0aC0xNzU1MzM0MDk4NjEwQHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzM0MTIwLCJleHAiOjE3NTUzMzUwMjB9.CGqbdMHX0kMLSR-YQHz7krJGAoIdGTmdLV04nPqkI7E	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZmYzNzZhOC03OTU2LTQ2NzItYjJkNy1iNmRlMzYzZjc4NWQiLCJpYXQiOjE3NTUzMzQxMjAsImV4cCI6MTc1NTkzODkyMH0.6mQpFKmzdXkEIOasKpZa-yS4-oS3adIWdkwu48IKCp8	\N	\N	2025-08-23 08:48:40.139+00	2025-08-16 08:48:40.140439+00	\N	t	2025-08-16 08:48:40.140439+00
13c7bfd9-01bc-4648-b076-56157ee4e531	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzM0MTIwLCJleHAiOjE3NTUzMzUwMjB9.kzksuiZK9eQh3k9cW6fMe7xXZQDOpG9FR6qvi1qGp2k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzQxMjAsImV4cCI6MTc1NTkzODkyMH0.B2tCv6euFf1XI-0AevkoWPhzjUMIHlx8JlWaId1RXhc	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:48:40.464+00	2025-08-16 08:48:40.465793+00	\N	t	2025-08-16 08:48:40.465793+00
db24a7ac-f2f6-41eb-823f-2c41bb613a69	d79c433a-4a48-4036-ac85-b2c239c4f704	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJlbWFpbCI6ImZpeGVkLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzMzQxMjAsImV4cCI6MTc1NTMzNTAyMH0.7ProsX0T1hmO5TsmDnUjRhzcyZfeKa04RhA84eAYV8E	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJpYXQiOjE3NTUzMzQxMjAsImV4cCI6MTc1NTkzODkyMH0.2F8hH4YVPA6hm7E-Bq2gY7HRjRuFGOy-7VlbGz2pEhg	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:48:40.643+00	2025-08-16 08:48:40.64366+00	\N	t	2025-08-16 08:48:40.64366+00
c76424a4-9b8f-45e9-9392-5cbc29d743f0	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzM0MTQxLCJleHAiOjE3NTUzMzUwNDF9.2EwdWa3aaLMLZNNk66KqgcHqF4ZwZW6ObF6Ob8m9o-Q	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzQxNDEsImV4cCI6MTc1NTkzODk0MX0.B5EPpva_rggN_yI81EGVe8eUb_hBKv8GWOHsyXQyTQA	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:49:01.092+00	2025-08-16 08:49:01.093013+00	\N	t	2025-08-16 08:49:01.093013+00
5ee5ac10-d5ac-4a9e-8127-4fee5f17e742	a2f5bac5-668d-45a0-a030-bbeef9025ce6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMmY1YmFjNS02NjhkLTQ1YTAtYTAzMC1iYmVlZjkwMjVjZTYiLCJlbWFpbCI6InRlc3QtYXV0aC0xNzU1MzM0MTk2NTgyQHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzM0MjE4LCJleHAiOjE3NTUzMzUxMTh9.ZAWBBVP7T_x9SaE7J_ITw3jVzaVmcbyanjrSvrGZa1U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMmY1YmFjNS02NjhkLTQ1YTAtYTAzMC1iYmVlZjkwMjVjZTYiLCJpYXQiOjE3NTUzMzQyMTgsImV4cCI6MTc1NTkzOTAxOH0.Abq6quMMjYJxVfmcQmaVJ9SojzrdWFs0FEp32F2tjLQ	\N	\N	2025-08-23 08:50:18.078+00	2025-08-16 08:50:18.078955+00	\N	t	2025-08-16 08:50:18.078955+00
c65755ab-7d4b-4c4c-b73b-fd64e3e2217f	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzM0MjE4LCJleHAiOjE3NTUzMzUxMTh9.p_OA_Ec6Us9Mjjctb-gYJjhVDILEj-XJB6TiFOZ7e40	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzQyMTgsImV4cCI6MTc1NTkzOTAxOH0.KqDBKHcmWsdJp0nBZNgYF3JuMyAYzlVp1NE4by99Gn0	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:50:18.409+00	2025-08-16 08:50:18.410308+00	\N	t	2025-08-16 08:50:18.410308+00
832ca960-363c-4e9c-929b-171ce90409f3	d79c433a-4a48-4036-ac85-b2c239c4f704	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJlbWFpbCI6ImZpeGVkLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzMzQyMTgsImV4cCI6MTc1NTMzNTExOH0.okIghLy_wLcOEhJmEOKK2D0PoYh-aGsjEyivJUZ3wEM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJpYXQiOjE3NTUzMzQyMTgsImV4cCI6MTc1NTkzOTAxOH0.CIViFIJeCFoYQlQz8pF2hRc7vW2G54uSDuG9DXh7AZE	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:50:18.582+00	2025-08-16 08:50:18.583294+00	\N	t	2025-08-16 08:50:18.583294+00
b5e34441-da3b-42f1-8170-b89002e564a6	3f7729f6-fcc3-41b7-a559-099a3777b3c6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjc3MjlmNi1mY2MzLTQxYjctYTU1OS0wOTlhMzc3N2IzYzYiLCJlbWFpbCI6Inhzcy10ZXN0QHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzM0MjE5LCJleHAiOjE3NTUzMzUxMTl9.44r6XFwProRZugnf05YBjIROPsGXY2y9fUQb8OWRcGY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZjc3MjlmNi1mY2MzLTQxYjctYTU1OS0wOTlhMzc3N2IzYzYiLCJpYXQiOjE3NTUzMzQyMTksImV4cCI6MTc1NTkzOTAxOX0.lKkxaNFMijbd7tCPT5UaaXw5tI03rTOZ9S2faQFwegs	\N	\N	2025-08-23 08:50:19.935+00	2025-08-16 08:50:19.936471+00	\N	t	2025-08-16 08:50:19.936471+00
3b0b7ed4-f9c1-4983-a935-eec4a72ed9f6	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzM0MjIwLCJleHAiOjE3NTUzMzUxMjB9.UiBq3y4iHEzF1Il9FMFDbc7CEiHnz6ZS9zb9GyjLeTU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzQyMjAsImV4cCI6MTc1NTkzOTAyMH0.s7mh1wuu8-_kUICeByIXZKl-OjVSQBEx6xRA-p_kfSA	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:50:20.113+00	2025-08-16 08:50:20.114294+00	\N	t	2025-08-16 08:50:20.114294+00
910bb6c7-0f58-495e-8083-1d6f2f54e9ab	acabacb4-ecce-49db-8731-418c32715ebc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhY2FiYWNiNC1lY2NlLTQ5ZGItODczMS00MThjMzI3MTVlYmMiLCJlbWFpbCI6InRlc3QtYXV0aC0xNzU1MzM0MjMwMDQ5QHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzM0MjUxLCJleHAiOjE3NTUzMzUxNTF9.0bs8YuNz-NhD-yN5DDdHnprzg6mXCFSzRJGgw0DGgaE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhY2FiYWNiNC1lY2NlLTQ5ZGItODczMS00MThjMzI3MTVlYmMiLCJpYXQiOjE3NTUzMzQyNTEsImV4cCI6MTc1NTkzOTA1MX0.neiqmCDHncmZXWHEMLBM5J1dg4Q-AU27usz-8Kelo1g	\N	\N	2025-08-23 08:50:51.576+00	2025-08-16 08:50:51.577321+00	\N	t	2025-08-16 08:50:51.577321+00
4ae4b54a-44b7-4a3d-a4d2-d105cb7ff313	5c37ae12-9d29-4d9d-a1dc-2e6feaabf5d3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzM3YWUxMi05ZDI5LTRkOWQtYTFkYy0yZTZmZWFhYmY1ZDMiLCJlbWFpbCI6InRlc3QtYXV0aC0xNzU1MzM0Mjk5MzE3QHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzM0MzIwLCJleHAiOjE3NTUzMzUyMjB9.9ucFsob5GiFVI2uuzLm4JB2EdkG7KKMbEbIqADk_edQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzM3YWUxMi05ZDI5LTRkOWQtYTFkYy0yZTZmZWFhYmY1ZDMiLCJpYXQiOjE3NTUzMzQzMjAsImV4cCI6MTc1NTkzOTEyMH0.Ixzb5G2-8RxqUOX_El67jEniwqiEAHEiGI8vXCp6uFs	\N	\N	2025-08-23 08:52:00.876+00	2025-08-16 08:52:00.877725+00	\N	t	2025-08-16 08:52:00.877725+00
b9ab59c8-6a35-4dae-9adb-91333b51f088	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzM0MzIxLCJleHAiOjE3NTUzMzUyMjF9.3TH0utJdV2HdzrrFnx5RbQoXPBy5gk_DFR4VuwZ9vL0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzQzMjEsImV4cCI6MTc1NTkzOTEyMX0.rR74iRkYTBbgFSSFgG7PALU_pn8u1neDt6zia6OeK7o	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:52:01.194+00	2025-08-16 08:52:01.195194+00	\N	t	2025-08-16 08:52:01.195194+00
e39d237b-82df-4dd4-9f74-5d290964de21	d79c433a-4a48-4036-ac85-b2c239c4f704	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJlbWFpbCI6ImZpeGVkLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzMzQzMjEsImV4cCI6MTc1NTMzNTIyMX0.5YZxuBqJI_k9AG0-cUv7nK6OT8A_rxMYvPcNSoOOwUE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNzljNDMzYS00YTQ4LTQwMzYtYWM4NS1iMmMyMzljNGY3MDQiLCJpYXQiOjE3NTUzMzQzMjEsImV4cCI6MTc1NTkzOTEyMX0.Uq_V74l4GhnIXU2iD0hPjP8i4qOrY31Xq7p0ICuw-04	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:52:01.36+00	2025-08-16 08:52:01.361573+00	\N	t	2025-08-16 08:52:01.361573+00
91af674e-b9f4-4a67-9464-a27c062e040b	df68d3e6-8ba6-4216-9363-f0bdb6de3162	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJlbWFpbCI6Im5ld2FkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1MzM0MzIyLCJleHAiOjE3NTUzMzUyMjJ9.hDKdgMj1lKBWhqFW9GWlKDguRP3p8rUksBaXwXdH3bU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZjY4ZDNlNi04YmE2LTQyMTYtOTM2My1mMGJkYjZkZTMxNjIiLCJpYXQiOjE3NTUzMzQzMjIsImV4cCI6MTc1NTkzOTEyMn0.Efmcl84Dxm_IGNDE8iWA6cHHBTT992OmOuAba9id5Pg	::ffff:80.214.114.85	axios/1.11.0	2025-08-23 08:52:02.735+00	2025-08-16 08:52:02.736236+00	\N	t	2025-08-16 08:52:02.736236+00
809d8cdf-3e2e-4655-8a80-0def4e0a0de5	2af39e41-6d8a-402f-a271-16f3b904032d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYWYzOWU0MS02ZDhhLTQwMmYtYTI3MS0xNmYzYjkwNDAzMmQiLCJlbWFpbCI6InFhLXRlc3QtMTc1NTM0OTE1NTAwMUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM0OTE3NywiZXhwIjoxNzU1MzUwMDc3fQ.gS75t6j27G5H341Smpiqo9sVwtzB6Aj0quLR-84vT9A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYWYzOWU0MS02ZDhhLTQwMmYtYTI3MS0xNmYzYjkwNDAzMmQiLCJpYXQiOjE3NTUzNDkxNzcsImV4cCI6MTc1NTk1Mzk3N30.3RjRjcmleX3YTfYSy3vK5jJOD18XtlRlug4gkcsHXa4	\N	\N	2025-08-23 12:59:37.199+00	2025-08-16 12:59:37.20065+00	\N	t	2025-08-16 12:59:37.20065+00
3bf32801-b859-4801-bd1a-7397481d64d0	eda0705a-f096-4b3b-a306-01e5d77fa6ff	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGEwNzA1YS1mMDk2LTRiM2ItYTMwNi0wMWU1ZDc3ZmE2ZmYiLCJlbWFpbCI6Inhzcy10ZXN0LTE3NTUzNDkxNTYwNTlAdGVzdC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNDkxNzcsImV4cCI6MTc1NTM1MDA3N30.yW8kxM1CiOBtXgWHveK93kU51oJkGXgjWp9rgJQzrpU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZGEwNzA1YS1mMDk2LTRiM2ItYTMwNi0wMWU1ZDc3ZmE2ZmYiLCJpYXQiOjE3NTUzNDkxNzcsImV4cCI6MTc1NTk1Mzk3N30.Sh8jtpL24zNel8Tq8OEENS8jpItL-F4oOK7dYeBJXSI	\N	\N	2025-08-23 12:59:37.766+00	2025-08-16 12:59:37.767023+00	\N	t	2025-08-16 12:59:37.767023+00
b203d983-5b69-401e-8f2d-e52be43fdf16	c6f08722-2d2f-4fb6-9366-51db6dbd3ec2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmYwODcyMi0yZDJmLTRmYjYtOTM2Ni01MWRiNmRiZDNlYzIiLCJlbWFpbCI6ImRlYnVnLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNDkxODksImV4cCI6MTc1NTM1MDA4OX0.Q1ZILArQulL0tVJaCgAvSPNpZKK8PToq1jAnjj71Fxs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmYwODcyMi0yZDJmLTRmYjYtOTM2Ni01MWRiNmRiZDNlYzIiLCJpYXQiOjE3NTUzNDkxODksImV4cCI6MTc1NTk1Mzk4OX0.N9RZva7tenhGvV6CR8ecF4rdvvkSOjes8dPDWf-PVGg	\N	\N	2025-08-23 12:59:49.976+00	2025-08-16 12:59:49.97687+00	\N	t	2025-08-16 12:59:49.97687+00
e2372b17-7ee9-497a-89e1-474ce387223a	c6f08722-2d2f-4fb6-9366-51db6dbd3ec2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmYwODcyMi0yZDJmLTRmYjYtOTM2Ni01MWRiNmRiZDNlYzIiLCJlbWFpbCI6ImRlYnVnLXRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNDkxOTQsImV4cCI6MTc1NTM1MDA5NH0.ePuFumjhTxcIenqhTYCbmsPQvLrNIsz9zmL3c_h9uco	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmYwODcyMi0yZDJmLTRmYjYtOTM2Ni01MWRiNmRiZDNlYzIiLCJpYXQiOjE3NTUzNDkxOTQsImV4cCI6MTc1NTk1Mzk5NH0.XEz80re8ajHPlscoDN0o6jXa40xFbd_hn2fmoanu-ZQ	::ffff:80.214.114.85	curl/8.8.0	2025-08-23 12:59:54.978+00	2025-08-16 12:59:54.979146+00	\N	t	2025-08-16 12:59:54.979146+00
787e83e7-d67f-4e8a-9faa-be90407fff46	a0dfd725-2e49-43dc-9168-94bc1c3953cf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMGRmZDcyNS0yZTQ5LTQzZGMtOTE2OC05NGJjMWMzOTUzY2YiLCJlbWFpbCI6InVuaXF1ZTE3NTUzNDk2MjZAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNDk2NDgsImV4cCI6MTc1NTM1MDU0OH0.k7YVIiTTxo8qGowbWdF9uma3Rq6EVAXK59TvYnR760c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMGRmZDcyNS0yZTQ5LTQzZGMtOTE2OC05NGJjMWMzOTUzY2YiLCJpYXQiOjE3NTUzNDk2NDgsImV4cCI6MTc1NTk1NDQ0OH0.EL-_I1S_I7n8mOF6ySAgWcPSgIJG07IIslhbwPPNWqw	\N	\N	2025-08-23 13:07:28.303+00	2025-08-16 13:07:28.304075+00	\N	t	2025-08-16 13:07:28.304075+00
f62bcfba-3311-4ae1-b4b4-259984ec5c3b	0bdf3e90-2be7-4e5c-8d5e-e968c4e4d3ae	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYmRmM2U5MC0yYmU3LTRlNWMtOGQ1ZS1lOTY4YzRlNGQzYWUiLCJlbWFpbCI6InFhdGVzdDFAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTAxNjMsImV4cCI6MTc1NTM1MTA2M30.O_iqw2YfkEHkdE_5-LGu9iFJhnP_6OHpUNPv3WEsnDY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYmRmM2U5MC0yYmU3LTRlNWMtOGQ1ZS1lOTY4YzRlNGQzYWUiLCJpYXQiOjE3NTUzNTAxNjMsImV4cCI6MTc1NTk1NDk2M30.i6E2Fdc-KmFN__8m7Rtju1xOh8Gqfm_PkyL4hUezngQ	\N	\N	2025-08-23 13:16:03.007+00	2025-08-16 13:16:03.007783+00	\N	t	2025-08-16 13:16:03.007783+00
e4360183-6022-44fd-bad6-e6a6044d6f14	f428de01-bdbd-4489-b833-38dadee5b342	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDI4ZGUwMS1iZGJkLTQ0ODktYjgzMy0zOGRhZGVlNWIzNDIiLCJlbWFpbCI6InFhdGVzdDJAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTAxNzEsImV4cCI6MTc1NTM1MTA3MX0.rbhZ3jtXBq6DS2PCukMFctTX-gqXdEIgR22AUp5A_kI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDI4ZGUwMS1iZGJkLTQ0ODktYjgzMy0zOGRhZGVlNWIzNDIiLCJpYXQiOjE3NTUzNTAxNzEsImV4cCI6MTc1NTk1NDk3MX0.7pXRQ5wgEyiEFIBQcqo9nr9i76QuC2dnj7A5YSfxhbw	\N	\N	2025-08-23 13:16:11.45+00	2025-08-16 13:16:11.451642+00	\N	t	2025-08-16 13:16:11.451642+00
c083903d-66e9-45bc-b263-9c197e8d82b3	0bdf3e90-2be7-4e5c-8d5e-e968c4e4d3ae	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYmRmM2U5MC0yYmU3LTRlNWMtOGQ1ZS1lOTY4YzRlNGQzYWUiLCJlbWFpbCI6InFhdGVzdDFAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTAxODgsImV4cCI6MTc1NTM1MTA4OH0.h1EPwhH5YIUC0FDwx1BqhP0AKIqmjcR7ZJ5X40a8Fmw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYmRmM2U5MC0yYmU3LTRlNWMtOGQ1ZS1lOTY4YzRlNGQzYWUiLCJpYXQiOjE3NTUzNTAxODgsImV4cCI6MTc1NTk1NDk4OH0.LlxK7R16Eqvsz3JdFE-rL7Vi_z7PfeKlQECPqGVtFQc	::ffff:80.215.67.205	curl/8.8.0	2025-08-23 13:16:28.396+00	2025-08-16 13:16:28.397191+00	\N	t	2025-08-16 13:16:28.397191+00
afbceb31-d09b-44da-bad2-177ab1bba6bc	f428de01-bdbd-4489-b833-38dadee5b342	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDI4ZGUwMS1iZGJkLTQ0ODktYjgzMy0zOGRhZGVlNWIzNDIiLCJlbWFpbCI6InFhdGVzdDJAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTAyOTMsImV4cCI6MTc1NTM1MTE5M30.i2aSyyj32XkUZRQOCk3dF5IIaWSPVD_q8bAjMfGJbH0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDI4ZGUwMS1iZGJkLTQ0ODktYjgzMy0zOGRhZGVlNWIzNDIiLCJpYXQiOjE3NTUzNTAyOTMsImV4cCI6MTc1NTk1NTA5M30.AhQ5W_HYF6wy7OLewWn4msDlWxAsFDHe4cXWWSJ2-Qc	::ffff:80.215.67.205	curl/8.8.0	2025-08-23 13:18:13.978+00	2025-08-16 13:18:13.978629+00	\N	t	2025-08-16 13:18:13.978629+00
94ddfa7e-3991-41a0-8dbb-5e9321d475e4	a4bc6dd4-1ca2-45b0-873f-332c537d91fa	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNGJjNmRkNC0xY2EyLTQ1YjAtODczZi0zMzJjNTM3ZDkxZmEiLCJlbWFpbCI6InZlcnlsb25nZW1haWxhZGRyZXNzdGhhdGV4Y2VlZHNub3JtYWxsaW1pdHNAdmVyeWxvbmdkb21haW5uYW1ldGhhdGNvdWxkYmV1c2VkaW5yZWFsd29ybGRzY2VuYXJpb3MuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzUwMzA4LCJleHAiOjE3NTUzNTEyMDh9.csabx5qntU2UKcXjO9ypPqt5t-BPY_xpayr5AveYnrA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhNGJjNmRkNC0xY2EyLTQ1YjAtODczZi0zMzJjNTM3ZDkxZmEiLCJpYXQiOjE3NTUzNTAzMDgsImV4cCI6MTc1NTk1NTEwOH0.cHtWADelUcRk_p1IE7ENmo3oIPH0rTagKuQgyXyXJL4	\N	\N	2025-08-23 13:18:28.759+00	2025-08-16 13:18:28.760168+00	\N	t	2025-08-16 13:18:28.760168+00
60404371-02c5-4237-b55e-af59f333afa4	5221af3c-a766-4410-8296-494ac78fa2d8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjIxYWYzYy1hNzY2LTQ0MTAtODI5Ni00OTRhYzc4ZmEyZDgiLCJlbWFpbCI6InRlc3Qtc3BlY2lhbEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM1MDMyNiwiZXhwIjoxNzU1MzUxMjI2fQ.T4cwzfmTonDjDdOLGx7KpH7anCVjaSPWWvt1JWnChBU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1MjIxYWYzYy1hNzY2LTQ0MTAtODI5Ni00OTRhYzc4ZmEyZDgiLCJpYXQiOjE3NTUzNTAzMjYsImV4cCI6MTc1NTk1NTEyNn0.1-irjrgKxPmHWADqxy7dA2b2kqFThXLoTqaFGZdUJWk	\N	\N	2025-08-23 13:18:46.837+00	2025-08-16 13:18:46.838387+00	\N	t	2025-08-16 13:18:46.838387+00
e09ab904-ee57-4257-aee4-8e4c1364c6d5	be1bbc0a-32c1-4650-9246-bb0c846abad3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZTFiYmMwYS0zMmMxLTQ2NTAtOTI0Ni1iYjBjODQ2YWJhZDMiLCJlbWFpbCI6InRlc3QtZml4ZWRAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTEyMTYsImV4cCI6MTc1NTM1MjExNn0.Wv7gGMdVxT3425WYAnOt_LoyslBV9J0HLooH3U64FBc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiZTFiYmMwYS0zMmMxLTQ2NTAtOTI0Ni1iYjBjODQ2YWJhZDMiLCJpYXQiOjE3NTUzNTEyMTYsImV4cCI6MTc1NTk1NjAxNn0.kIMjkWapnbR7Es9qTJCGlG5GWHQ1c0CFDtGVz2aE4uk	\N	\N	2025-08-23 13:33:36.709+00	2025-08-16 13:33:36.711665+00	\N	t	2025-08-16 13:33:36.711665+00
7bacbe32-5470-4f55-af00-640d690e826b	cbd8bbe5-0b83-4317-a88b-7e870c36b014	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmQ4YmJlNS0wYjgzLTQzMTctYTg4Yi03ZTg3MGMzNmIwMTQiLCJlbWFpbCI6Im1vY2hlcmthQGdtYWlsLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM1Mzc4MiwiZXhwIjoxNzU1MzU0NjgyfQ.HbIkyJWz5XKl_y3TG_z2qNV7IlnyhTd856MYPYz_E7I	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmQ4YmJlNS0wYjgzLTQzMTctYTg4Yi03ZTg3MGMzNmIwMTQiLCJpYXQiOjE3NTUzNTM3ODIsImV4cCI6MTc1NTk1ODU4Mn0.dmRJb_6_PdrrAmZQeA-J_vHIz6K5aFiUk8xSrLvgf7w	\N	\N	2025-08-23 14:16:22.442+00	2025-08-16 14:16:22.443317+00	\N	t	2025-08-16 14:16:22.443317+00
e44d7fe4-afaf-4d3b-8def-28a28ba728f9	cbd8bbe5-0b83-4317-a88b-7e870c36b014	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmQ4YmJlNS0wYjgzLTQzMTctYTg4Yi03ZTg3MGMzNmIwMTQiLCJlbWFpbCI6Im1vY2hlcmthQGdtYWlsLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM1Mzc4OSwiZXhwIjoxNzU1MzU0Njg5fQ.EeDfE1ThRoySUDRSznQt_7Y4lWwaGK9dC6sSj68rpLE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmQ4YmJlNS0wYjgzLTQzMTctYTg4Yi03ZTg3MGMzNmIwMTQiLCJpYXQiOjE3NTUzNTM3ODksImV4cCI6MTc1NTk1ODU4OX0.QesPIedJuXp41RmLJDJB_6IO_tlY0eKcvcwPKMoTTbU	::ffff:80.215.67.205	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0	2025-08-23 14:16:29.632+00	2025-08-16 14:16:29.6337+00	\N	t	2025-08-16 14:16:29.6337+00
6971c8a2-9ed9-4cb3-8af4-db5e41cb59ff	cbd8bbe5-0b83-4317-a88b-7e870c36b014	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmQ4YmJlNS0wYjgzLTQzMTctYTg4Yi03ZTg3MGMzNmIwMTQiLCJlbWFpbCI6Im1vY2hlcmthQGdtYWlsLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM1NDg0MiwiZXhwIjoxNzU1MzU1NzQyfQ.WBsrR1amUGrklUq-nhYX10vSAa1MHq5VMPY7sfGoaLw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmQ4YmJlNS0wYjgzLTQzMTctYTg4Yi03ZTg3MGMzNmIwMTQiLCJpYXQiOjE3NTUzNTQ4NDIsImV4cCI6MTc1NTk1OTY0Mn0.l4BF4OYNttBn3kZEuBf5P5MtXcgb5koJ7g532X49L3g	\N	\N	2025-08-23 14:34:02.557+00	2025-08-16 14:34:02.55832+00	\N	t	2025-08-16 14:34:02.55832+00
bfb54753-7144-4644-b761-97beaf11635e	78326bfd-f9e2-4b90-afab-af0c8004348b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODMyNmJmZC1mOWUyLTRiOTAtYWZhYi1hZjBjODAwNDM0OGIiLCJlbWFpbCI6ImZyb250ZW5kX3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTYwMjAsImV4cCI6MTc1NTM1NjkyMH0.pSILF32gpuUaRP50uj9IUt7Uqu_NGvTfnTMat4K1u64	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODMyNmJmZC1mOWUyLTRiOTAtYWZhYi1hZjBjODAwNDM0OGIiLCJpYXQiOjE3NTUzNTYwMjAsImV4cCI6MTc1NTk2MDgyMH0.cfVtzAUeQ_pw255Yzbz36mqkYoRnroBiFRYO4Ldj-6E	\N	\N	2025-08-23 14:53:40.813+00	2025-08-16 14:53:40.814397+00	\N	t	2025-08-16 14:53:40.814397+00
3c3cf6e6-7578-4a2b-830b-aba416b3e996	78326bfd-f9e2-4b90-afab-af0c8004348b	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODMyNmJmZC1mOWUyLTRiOTAtYWZhYi1hZjBjODAwNDM0OGIiLCJlbWFpbCI6ImZyb250ZW5kX3Rlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTYwNjksImV4cCI6MTc1NTM1Njk2OX0.oRPCk1OTIRWji0J03YWGz2bH8GDkvJoY5_0z2INugOM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ODMyNmJmZC1mOWUyLTRiOTAtYWZhYi1hZjBjODAwNDM0OGIiLCJpYXQiOjE3NTUzNTYwNjksImV4cCI6MTc1NTk2MDg2OX0.qi8t1gX7Bk6kg_OIFQl0gxeONcubgSjXrKeiE7-cK_k	::ffff:80.215.67.205	curl/8.8.0	2025-08-23 14:54:29.92+00	2025-08-16 14:54:29.921474+00	\N	t	2025-08-16 14:54:29.921474+00
b69b20a8-b768-4ce1-a0ab-1c74b4b8a6aa	f68102d9-7daa-4529-b8ba-d17391b966e3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNjgxMDJkOS03ZGFhLTQ1MjktYjhiYS1kMTczOTFiOTY2ZTMiLCJlbWFpbCI6InFhLXRlc3QtMTc1NTM1ODg3NTc4M0BleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM1ODg5NywiZXhwIjoxNzU1MzU5Nzk3fQ.Zzxnmq6vG4wk_hoHtc6-7iV1x1OF50otZVI8Ah6azjk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNjgxMDJkOS03ZGFhLTQ1MjktYjhiYS1kMTczOTFiOTY2ZTMiLCJpYXQiOjE3NTUzNTg4OTcsImV4cCI6MTc1NTk2MzY5N30.TMkIR1stTdPk1LOZjHnopcf05V5dK29Yd_Wt_moUzoc	\N	\N	2025-08-23 15:41:37.643+00	2025-08-16 15:41:37.643702+00	\N	t	2025-08-16 15:41:37.643702+00
9b24b294-7f8f-4f65-baae-e1667952352a	9967772d-4fe4-4d86-8977-78dd30cb00c1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTY3NzcyZC00ZmU0LTRkODYtODk3Ny03OGRkMzBjYjAwYzEiLCJlbWFpbCI6InFhLXRlc3QtMjAyNTA4MTZAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNTg5NTQsImV4cCI6MTc1NTM1OTg1NH0.KOAMyPtF3mCjuPMLkWxne73SVP1Yj2265VBzifKn5XA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTY3NzcyZC00ZmU0LTRkODYtODk3Ny03OGRkMzBjYjAwYzEiLCJpYXQiOjE3NTUzNTg5NTQsImV4cCI6MTc1NTk2Mzc1NH0.rWMFYzxMC5ecorYZRk6XEFxACtGLJJ3w3jKkdXBXpx4	\N	\N	2025-08-23 15:42:34.392+00	2025-08-16 15:42:34.393311+00	\N	t	2025-08-16 15:42:34.393311+00
f4f24ed6-9381-4610-8219-d8a30a5c0632	b9c68a87-d197-448b-b4ed-d935cea5ad66	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOWM2OGE4Ny1kMTk3LTQ0OGItYjRlZC1kOTM1Y2VhNWFkNjYiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzU4OTU0LCJleHAiOjE3NTUzNTk4NTR9.KnDi8KyzoPgVivHDnB8HmlEs08oSIL9bYNe_587yMus	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiOWM2OGE4Ny1kMTk3LTQ0OGItYjRlZC1kOTM1Y2VhNWFkNjYiLCJpYXQiOjE3NTUzNTg5NTQsImV4cCI6MTc1NTk2Mzc1NH0.pWSd17AyvjpBiF53_dD5dU0Gf39jX29_p8Cjuiqbnj0	\N	\N	2025-08-23 15:42:34.802+00	2025-08-16 15:42:34.802666+00	\N	t	2025-08-16 15:42:34.802666+00
198d2311-dd44-4d4c-9928-da5e85d66bb6	ab69e819-1209-451c-8fe3-d1729e9af52c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYjY5ZTgxOS0xMjA5LTQ1MWMtOGZlMy1kMTcyOWU5YWY1MmMiLCJlbWFpbCI6InFhLWNvbXByZWhlbnNpdmUtMTc1NTM1OTA1NDAxOEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM1OTA3NSwiZXhwIjoxNzU1MzU5OTc1fQ._PYVfJ61vctGeunCSLxB-ejBNZI0Y_1Sb72VWJe4rug	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhYjY5ZTgxOS0xMjA5LTQ1MWMtOGZlMy1kMTcyOWU5YWY1MmMiLCJpYXQiOjE3NTUzNTkwNzUsImV4cCI6MTc1NTk2Mzg3NX0.BEA7iW0CZDPGpTrlszHvPnxYumVXl3_9I2bZ4Ocv6fU	\N	\N	2025-08-23 15:44:35.707+00	2025-08-16 15:44:35.708286+00	\N	t	2025-08-16 15:44:35.708286+00
7f688dd4-ee05-4cf9-8b1e-956699634966	b0c05b26-5c11-4518-82cf-74e08e5edfd0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMGMwNWIyNi01YzExLTQ1MTgtODJjZi03NGUwOGU1ZWRmZDAiLCJlbWFpbCI6InBlcmYtdGVzdC0xNzU1MzU5MDU1NTIyQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzU5MDc3LCJleHAiOjE3NTUzNTk5Nzd9.Qd6gUDI3khS9jAbaysq-EiDEpZbLBWjsKywCJ0d2ZIo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMGMwNWIyNi01YzExLTQ1MTgtODJjZi03NGUwOGU1ZWRmZDAiLCJpYXQiOjE3NTUzNTkwNzcsImV4cCI6MTc1NTk2Mzg3N30.-ddkC7pVq809eSHa8EN_ImSJins2PGrZK-sc8kUY5G0	\N	\N	2025-08-23 15:44:37.174+00	2025-08-16 15:44:37.174772+00	\N	t	2025-08-16 15:44:37.174772+00
387ec78e-2973-4539-b0d6-e3fc2819803a	b4e92af8-7063-4698-b5ad-62f21278dff3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGU5MmFmOC03MDYzLTQ2OTgtYjVhZC02MmYyMTI3OGRmZjMiLCJlbWFpbCI6InRlc3QtZml4LTE3NTUzNjA1NTVAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNjA1NzcsImV4cCI6MTc1NTM2MTQ3N30.bohRgXrt5a5IGQ2Y1guszg5gXetMrB_sNAkCNHHyb94	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGU5MmFmOC03MDYzLTQ2OTgtYjVhZC02MmYyMTI3OGRmZjMiLCJpYXQiOjE3NTUzNjA1NzcsImV4cCI6MTc1NTk2NTM3N30.LfRtG366PeQawm8B78iTJmXt1FLqM2lU0PXj8784Zys	\N	\N	2025-08-23 16:09:37.726+00	2025-08-16 16:09:37.72696+00	\N	t	2025-08-16 16:09:37.72696+00
a777458e-6297-4476-bb36-24107f4554f6	b4e92af8-7063-4698-b5ad-62f21278dff3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGU5MmFmOC03MDYzLTQ2OTgtYjVhZC02MmYyMTI3OGRmZjMiLCJlbWFpbCI6InRlc3QtZml4LTE3NTUzNjA1NTVAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNjA1ODQsImV4cCI6MTc1NTM2MTQ4NH0.YSRoYLz6UxUM63G9_E6zA_EYvYxONL5s0HOGmGTPMiE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNGU5MmFmOC03MDYzLTQ2OTgtYjVhZC02MmYyMTI3OGRmZjMiLCJpYXQiOjE3NTUzNjA1ODQsImV4cCI6MTc1NTk2NTM4NH0.5pixFRGYL5IXNNR8mpb9e7s5gSAMxjG8z2ZX6fC_ixE	::ffff:80.215.67.205	curl/8.8.0	2025-08-23 16:09:44.611+00	2025-08-16 16:09:44.61199+00	\N	t	2025-08-16 16:09:44.61199+00
1d009a91-8a55-4dfc-a8cc-c4489fd09134	660a6e06-2dde-40e2-a684-a17f561e555a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhNmUwNi0yZGRlLTQwZTItYTY4NC1hMTdmNTYxZTU1NWEiLCJlbWFpbCI6Im1vY2hlcmthMkBnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNjI1OTMsImV4cCI6MTc1NTM2MzQ5M30.diG6hLSs67ud2RzG0sciSjqfJLXGkBwHTi__1Xcgeio	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhNmUwNi0yZGRlLTQwZTItYTY4NC1hMTdmNTYxZTU1NWEiLCJpYXQiOjE3NTUzNjI1OTMsImV4cCI6MTc1NTk2NzM5M30.NDXuKgBaBvJRaqqcbR3JFw1UZ-eCpFSyi4Q-gTG8Tzc	\N	\N	2025-08-23 16:43:13.675+00	2025-08-16 16:43:13.676367+00	\N	t	2025-08-16 16:43:13.676367+00
ee954795-274f-4a87-a581-6e3882d647a2	660a6e06-2dde-40e2-a684-a17f561e555a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhNmUwNi0yZGRlLTQwZTItYTY4NC1hMTdmNTYxZTU1NWEiLCJlbWFpbCI6Im1vY2hlcmthMkBnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTUzNjI1OTcsImV4cCI6MTc1NTM2MzQ5N30.koipNrp-0mwzzsuo-Wg1IDxI1h263gGNp9rq5hxoip8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhNmUwNi0yZGRlLTQwZTItYTY4NC1hMTdmNTYxZTU1NWEiLCJpYXQiOjE3NTUzNjI1OTcsImV4cCI6MTc1NTk2NzM5N30.MB-LlTdNqD5AqGWz6srZH0dvuFniNSqusYfHL39X82U	::ffff:80.215.67.205	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-23 16:43:17.977+00	2025-08-16 16:43:17.978008+00	\N	t	2025-08-16 16:43:17.978008+00
e561f5de-6f5d-4afa-9cca-d73b5be10e4d	18b343ab-871e-44d6-9423-2775c2a2fd65	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOGIzNDNhYi04NzFlLTQ0ZDYtOTQyMy0yNzc1YzJhMmZkNjUiLCJlbWFpbCI6InByb2R1Y3Rpb24tdGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTM2Mzg1MSwiZXhwIjoxNzU1MzY0NzUxfQ.0Yv9B8SH2F8Qnl_-HlWWDXkylA5NYLLyJZ8IkDbYtXM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOGIzNDNhYi04NzFlLTQ0ZDYtOTQyMy0yNzc1YzJhMmZkNjUiLCJpYXQiOjE3NTUzNjM4NTEsImV4cCI6MTc1NTk2ODY1MX0.nK7ylI47xt5zVUiFEkv1tK70j8ZXoOuC_PUfLkmn9ms	\N	\N	2025-08-23 17:04:11.857+00	2025-08-16 17:04:11.857683+00	\N	t	2025-08-16 17:04:11.857683+00
dfc65d0d-d171-46a3-a095-aa9d2f90d15e	62bfffde-67bf-4f29-9416-ccf4f22ea823	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MmJmZmZkZS02N2JmLTRmMjktOTQxNi1jY2Y0ZjIyZWE4MjMiLCJlbWFpbCI6Im1sb2NoZWdAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzcyOTgxLCJleHAiOjE3NTUzNzM4ODF9.1a8Hww5o5Mdwmf88_ULJq-m6pqFiNSf7oJVR3eDzEQk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MmJmZmZkZS02N2JmLTRmMjktOTQxNi1jY2Y0ZjIyZWE4MjMiLCJpYXQiOjE3NTUzNzI5ODEsImV4cCI6MTc1NTk3Nzc4MX0.aNSxWJbaVXZXC4GYqTh5uPqQ_v97g6oKsl_IK1UxaZg	\N	\N	2025-08-23 19:36:21.884+00	2025-08-16 19:36:21.884713+00	\N	t	2025-08-16 19:36:21.884713+00
ec644457-ce41-4949-96e6-5dd50d0b1106	90a60996-a997-4f23-b461-a1278dbb160c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MGE2MDk5Ni1hOTk3LTRmMjMtYjQ2MS1hMTI3OGRiYjE2MGMiLCJlbWFpbCI6Im1jaGVya2FAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzczMDA2LCJleHAiOjE3NTUzNzM5MDZ9.DivHaIisTSYFIj5VR1ep0eDABxXDzk_xDrlu8AeToeA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MGE2MDk5Ni1hOTk3LTRmMjMtYjQ2MS1hMTI3OGRiYjE2MGMiLCJpYXQiOjE3NTUzNzMwMDYsImV4cCI6MTc1NTk3NzgwNn0.RME_ZmW-_BE2D6ReJO06j2ZgR8XuGiU00hH8ASUrYgw	\N	\N	2025-08-23 19:36:46.069+00	2025-08-16 19:36:46.07041+00	\N	t	2025-08-16 19:36:46.07041+00
cdb4d15d-2c9b-4c9c-9a2b-055f1b1da456	90a60996-a997-4f23-b461-a1278dbb160c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MGE2MDk5Ni1hOTk3LTRmMjMtYjQ2MS1hMTI3OGRiYjE2MGMiLCJlbWFpbCI6Im1jaGVya2FAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1MzczMDE4LCJleHAiOjE3NTUzNzM5MTh9.baPAqSOhuK0jKICa4o-YNfkI2ZNZdXaTUYE4vOfC9VU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MGE2MDk5Ni1hOTk3LTRmMjMtYjQ2MS1hMTI3OGRiYjE2MGMiLCJpYXQiOjE3NTUzNzMwMTgsImV4cCI6MTc1NTk3NzgxOH0.SS33AdeY2ZDlOnvpa7kmGV7pimYhIGK1KwPr05Pkuqc	::ffff:80.215.67.205	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0	2025-08-23 19:36:58.464+00	2025-08-16 19:36:58.464741+00	\N	t	2025-08-16 19:36:58.464741+00
fb5775c4-a22a-4219-a35a-908d991337ba	3b23afd0-398c-4bdd-9f46-c2766d313a18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYjIzYWZkMC0zOThjLTRiZGQtOWY0Ni1jMjc2NmQzMTNhMTgiLCJlbWFpbCI6InN0YWZmLTE3NTUzODU5NDE4ODdAbG9jb2QtYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1Mzg1OTYzLCJleHAiOjE3NTUzODY4NjN9.-vn1reS3rcdJzLTjkoJnDI1Q9yTBhpfPfDINetML7LQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYjIzYWZkMC0zOThjLTRiZGQtOWY0Ni1jMjc2NmQzMTNhMTgiLCJpYXQiOjE3NTUzODU5NjMsImV4cCI6MTc1NTk5MDc2M30.z_2OnzFG4Tz2DKo234hurjkuU1BwrvoQRrLpgv_HmxA	\N	\N	2025-08-23 23:12:43.949+00	2025-08-16 23:12:43.950662+00	\N	t	2025-08-16 23:12:43.950662+00
135a645f-e2bd-495f-8de6-07c8bd6920f3	3b23afd0-398c-4bdd-9f46-c2766d313a18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYjIzYWZkMC0zOThjLTRiZGQtOWY0Ni1jMjc2NmQzMTNhMTgiLCJlbWFpbCI6InN0YWZmLTE3NTUzODU5NDE4ODdAbG9jb2QtYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1Mzg1OTY0LCJleHAiOjE3NTUzODY4NjR9.D_GNz9vkIgHkSImFprk2Fr5LwckV-fDGM2Mk-5WYkCQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYjIzYWZkMC0zOThjLTRiZGQtOWY0Ni1jMjc2NmQzMTNhMTgiLCJpYXQiOjE3NTUzODU5NjQsImV4cCI6MTc1NTk5MDc2NH0.ym38WidXnxD3YYd4BFAJqrC0VqsrgylMhBNTxSk9qTE	::ffff:80.215.67.205	axios/1.11.0	2025-08-23 23:12:44.179+00	2025-08-16 23:12:44.18031+00	\N	t	2025-08-16 23:12:44.18031+00
84fa33ed-27fa-41bb-aa9d-41772c45a426	84e7b3eb-5e59-4160-b70e-4102827e00bd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGU3YjNlYi01ZTU5LTQxNjAtYjcwZS00MTAyODI3ZTAwYmQiLCJlbWFpbCI6InN0YWZmLTE3NTUzODYwMDExMzVAbG9jb2QtYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1Mzg2MDIzLCJleHAiOjE3NTUzODY5MjN9.wH3I_fx_8pgYkVTV32ALBTz_dBFaKP0rDeK5vWyFI5w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGU3YjNlYi01ZTU5LTQxNjAtYjcwZS00MTAyODI3ZTAwYmQiLCJpYXQiOjE3NTUzODYwMjMsImV4cCI6MTc1NTk5MDgyM30.AGeOxBZJpHpefZ1eGOoXnqwsF7YmepUiAxEOTEUalIg	\N	\N	2025-08-23 23:13:43.106+00	2025-08-16 23:13:43.107236+00	\N	t	2025-08-16 23:13:43.107236+00
bc33a509-1ed1-471a-8b6c-caee005547b8	84e7b3eb-5e59-4160-b70e-4102827e00bd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGU3YjNlYi01ZTU5LTQxNjAtYjcwZS00MTAyODI3ZTAwYmQiLCJlbWFpbCI6InN0YWZmLTE3NTUzODYwMDExMzVAbG9jb2QtYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1Mzg2MDUyLCJleHAiOjE3NTUzODY5NTJ9.FKhXI-BmvbhgGEEFkHTV8phogs10D_PrKJN7CY3Igpg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NGU3YjNlYi01ZTU5LTQxNjAtYjcwZS00MTAyODI3ZTAwYmQiLCJpYXQiOjE3NTUzODYwNTIsImV4cCI6MTc1NTk5MDg1Mn0.SPsJE_8QJePpLz5CJ2mifJ2to-D7Q5mlwVD30ywf5Co	::ffff:80.215.67.205	axios/1.11.0	2025-08-23 23:14:12.869+00	2025-08-16 23:14:12.869836+00	\N	t	2025-08-16 23:14:12.869836+00
948393ef-b387-4070-b220-bb7e68fc9a52	05359ee5-e3e6-4085-89d6-3df46e74198f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTM1OWVlNS1lM2U2LTQwODUtODlkNi0zZGY0NmU3NDE5OGYiLCJlbWFpbCI6ImFkbWluQGxvZ2VuLmxvY29kLWFpLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQzODk4NCwiZXhwIjoxNzU1NDM5ODg0fQ.qV8mSi8PCzQRvPLclB7gvXmDejo1RRzL5Rv5vk5Bq-w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTM1OWVlNS1lM2U2LTQwODUtODlkNi0zZGY0NmU3NDE5OGYiLCJpYXQiOjE3NTU0Mzg5ODQsImV4cCI6MTc1NjA0Mzc4NH0.4_6mXclPLHmaBXh5N2oZKSMTbWKE14wwqCcF79wi6Z0	\N	\N	2025-08-24 13:56:24.745+00	2025-08-17 13:56:24.746211+00	\N	t	2025-08-17 13:56:24.746211+00
0cdaba1b-620e-49b5-9a72-80dcb6dabeaf	05359ee5-e3e6-4085-89d6-3df46e74198f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTM1OWVlNS1lM2U2LTQwODUtODlkNi0zZGY0NmU3NDE5OGYiLCJlbWFpbCI6ImFkbWluQGxvZ2VuLmxvY29kLWFpLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQzODk5NSwiZXhwIjoxNzU1NDM5ODk1fQ.2GMuyUcbeM9W7K-gyD0xzNAH05cfLFykPLS873bnYI4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTM1OWVlNS1lM2U2LTQwODUtODlkNi0zZGY0NmU3NDE5OGYiLCJpYXQiOjE3NTU0Mzg5OTUsImV4cCI6MTc1NjA0Mzc5NX0.ZXonEZqCWYi8-L8OMlI_NeQcBSYBLU9Q4ZedhZKiJB8	::ffff:78.246.105.98	curl/8.8.0	2025-08-24 13:56:35.556+00	2025-08-17 13:56:35.556926+00	\N	t	2025-08-17 13:56:35.556926+00
b719ae44-0640-40fb-b8ad-a30199d0caa0	05359ee5-e3e6-4085-89d6-3df46e74198f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTM1OWVlNS1lM2U2LTQwODUtODlkNi0zZGY0NmU3NDE5OGYiLCJlbWFpbCI6ImFkbWluQGxvZ2VuLmxvY29kLWFpLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQzOTUxMCwiZXhwIjoxNzU1NDQwNDEwfQ.OjxEN8xFUv0ndTUGrN0aOtG9tTUohmHdqD4opaMOSSs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNTM1OWVlNS1lM2U2LTQwODUtODlkNi0zZGY0NmU3NDE5OGYiLCJpYXQiOjE3NTU0Mzk1MTAsImV4cCI6MTc1NjA0NDMxMH0.of6MeXKatR-iOG-nYY_Kpz7Q20rqYprL6uddugHJwFw	::ffff:78.246.105.98	axios/1.11.0	2025-08-24 14:05:10.107+00	2025-08-17 14:05:10.108492+00	\N	t	2025-08-17 14:05:10.108492+00
d8653231-2e6e-4457-83dc-dcc2334dc98c	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQyNzM1LCJleHAiOjE3NTU0NDM2MzV9.4sZ10wXU_x3otCC1dCajG5k_soeUaAY3WbeoSpCefVA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDI3MzUsImV4cCI6MTc1NjA0NzUzNX0.8wgFCekUIsyioHfkIkNp05qR-SLLCZfzmSSrcDz6Ax8	::1	curl/8.5.0	2025-08-24 14:58:55.653+00	2025-08-17 14:58:55.654374+00	\N	t	2025-08-17 14:58:55.654374+00
8ca403d7-58bc-432a-a296-e570dad5eaef	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQyNzkzLCJleHAiOjE3NTU0NDM2OTN9.kW_CDyCshKrw2aLPNBX9zKWlPZVyFDBZCmOyixqR4L4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDI3OTMsImV4cCI6MTc1NjA0NzU5M30.vvfnHw7qZtYv_PjzLn_E5CGxu-D-FPnaaWApKaEDwXw	::ffff:172.21.0.2	curl/8.8.0	2025-08-24 14:59:53.241+00	2025-08-17 14:59:53.241622+00	\N	t	2025-08-17 14:59:53.241622+00
2b857e0e-1e81-41c8-950b-847bedc0bef9	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQzMTI5LCJleHAiOjE3NTU0NDQwMjl9._OwVHXGvDf7lfGjiVZM42wwG1wyAJ6fblaA89I55ftc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDMxMjksImV4cCI6MTc1NjA0NzkyOX0.ynY9LAdg_VW7zXxM20Q90cS6A8S6yh6d_R72v1ht3lg	::ffff:172.21.0.2	axios/1.11.0	2025-08-24 15:05:29.642+00	2025-08-17 15:05:29.642602+00	\N	t	2025-08-17 15:05:29.642602+00
020fc25f-c6cb-4d4a-afe8-50a3093fb072	862278ba-fd2d-439c-ac80-63b3d3cc8dae	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NjIyNzhiYS1mZDJkLTQzOWMtYWM4MC02M2IzZDNjYzhkYWUiLCJlbWFpbCI6ImR1cGxpY2F0ZUB0ZXN0LmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ1NDAwMywiZXhwIjoxNzU1NDU0OTAzfQ.tD2egFjyuBbQjLvCiQrTNAn_o1oMXU4s6JamrXglybU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NjIyNzhiYS1mZDJkLTQzOWMtYWM4MC02M2IzZDNjYzhkYWUiLCJpYXQiOjE3NTU0NTQwMDMsImV4cCI6MTc1NjA1ODgwM30.vWeq3fzhti7TuKMgemTUTiGHY4iSJzjroNalSy29KX0	\N	\N	2025-08-24 18:06:43.634+00	2025-08-17 18:06:43.635934+00	\N	t	2025-08-17 18:06:43.635934+00
a99e232f-a393-420c-832d-768ad36d5f09	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQzMTc3LCJleHAiOjE3NTU0NDQwNzd9.K7DfiJvI1wH7mmgmFF5xDvnesqObsdptsgnSEO7tsJ4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDMxNzcsImV4cCI6MTc1NjA0Nzk3N30.SeKP16pgBCEdIfjRE-oCw7SUwAahj7a6TfJZv3U1y3E	::ffff:172.21.0.2	axios/1.11.0	2025-08-24 15:06:17.029+00	2025-08-17 15:06:17.029777+00	\N	t	2025-08-17 15:06:17.029777+00
53dd1adf-a3eb-46f9-85a0-04feb19a9185	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQzMzA5LCJleHAiOjE3NTU0NDQyMDl9.DRUYBdjwTV0zGZaxM80Gv4mn95590xH6e_y-F9tinCs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDMzMDksImV4cCI6MTc1NjA0ODEwOX0.1-BksGEZS15kZnWX6KxyCTyE7-y4y4i_zHULndFB7ME	::ffff:172.21.0.2	axios/1.11.0	2025-08-24 15:08:29.039+00	2025-08-17 15:08:29.040142+00	\N	t	2025-08-17 15:08:29.040142+00
7e5ec5b1-e90e-4b38-8964-58f9d0ffc842	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQzNjYzLCJleHAiOjE3NTU0NDQ1NjN9.OPdt1VXlKSbZENz3U86xT_29Gyg-FF-4fvLOPZKTUX4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDM2NjMsImV4cCI6MTc1NjA0ODQ2M30.c7g3cNWjKx3Lhhh618hfWuKvv7eDS3l3R3Dly1nIaAo	::ffff:172.21.0.2	curl/8.8.0	2025-08-24 15:14:23.051+00	2025-08-17 15:14:23.051948+00	\N	t	2025-08-17 15:14:23.051948+00
0d9eed3b-a753-44b9-af87-780529f0959d	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQ0NzQxLCJleHAiOjE3NTU0NDU2NDF9.o2UwTqCr8_nA4OQgJdCwV3AWOty5flwOGqTvOOw5n7E	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDQ3NDEsImV4cCI6MTc1NjA0OTU0MX0.6X4Gzu2Alnb0oZzJ69qY4sne0nP-RN5VW0M8oPmJgBg	::ffff:172.21.0.2	curl/8.8.0	2025-08-24 15:32:21.604+00	2025-08-17 15:32:21.604624+00	\N	t	2025-08-17 15:32:21.604624+00
24cd5587-1e3c-4896-a2f2-f5d455aeefc4	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQ2NTU1LCJleHAiOjE3NTU0NDc0NTV9.TOXTgUCJMx_iTAQml4PQIW11voV1qd-vLFa-p_z5HRk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDY1NTUsImV4cCI6MTc1NjA1MTM1NX0.6qy6-mV9b2F5v7M_gmSQYZINDLJPCbg_vHFGI2c5B_s	::ffff:172.21.0.2	curl/8.8.0	2025-08-24 16:02:35.71+00	2025-08-17 16:02:35.710781+00	\N	t	2025-08-17 16:02:35.710781+00
e6aa2d7a-7921-47f7-90a7-ba39fb88b45c	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQ4NjQ0LCJleHAiOjE3NTU0NDk1NDR9.2B-580lrEoTViFb2FT0iFlkop86ADWhhRVVQZjsurSs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDg2NDQsImV4cCI6MTc1NjA1MzQ0NH0.FHW4WChJERWcUi31mN1gkCLTiB_FKWvyZ_T--PJMN2U	::ffff:78.246.105.98	curl/8.8.0	2025-08-24 16:37:24.298+00	2025-08-17 16:37:24.298924+00	\N	t	2025-08-17 16:37:24.298924+00
915bb7c0-dbd8-480f-ab86-aebda423f79a	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQ4NjY3LCJleHAiOjE3NTU0NDk1Njd9.i2D2gR_mbWINyy9EaBT1vrYQDVwRzQ2oAp0_92v6pQA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDg2NjcsImV4cCI6MTc1NjA1MzQ2N30.Vf4MuonDMXku4XGUGV9szpyyNZZ7Ovk7P5uxV7NJDeo	::ffff:172.21.0.2	curl/8.8.0	2025-08-24 16:37:47.963+00	2025-08-17 16:37:47.96412+00	\N	t	2025-08-17 16:37:47.96412+00
5944dfbe-5a18-4624-b927-705611f16fb1	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDQ5MTU1LCJleHAiOjE3NTU0NTAwNTV9.vakhgXVXSZzvmkby4RlLmv73-oJWOOC35caMbqDmPrs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NDkxNTUsImV4cCI6MTc1NjA1Mzk1NX0.g_1zqb5PnednxE16grhBiz7cUgFHSjqLXrYXnFZ147g	::ffff:172.21.0.2	curl/8.8.0	2025-08-24 16:45:55.783+00	2025-08-17 16:45:55.783563+00	\N	t	2025-08-17 16:45:55.783563+00
ae1e668f-4fd2-417f-bcb2-5f5338ed1e08	07fde21f-d591-4437-9157-41e3b012f373	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJlbWFpbCI6ImFkbWluQGxvY29kLmFpIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDUxODM1LCJleHAiOjE3NTU0NTI3MzV9.fkg9FzuTrJbVOaXomqIASGGTbNDYGoT6NLbn3VMbZGs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwN2ZkZTIxZi1kNTkxLTQ0MzctOTE1Ny00MWUzYjAxMmYzNzMiLCJpYXQiOjE3NTU0NTE4MzUsImV4cCI6MTc1NjA1NjYzNX0.GC7mdeN1QzCm63RzzDlFhFgD9LKrOKcCiVZFFp54eCY	::ffff:78.246.105.98	curl/8.8.0	2025-08-24 17:30:35.669+00	2025-08-17 17:30:35.669691+00	\N	t	2025-08-17 17:30:35.669691+00
0d7c43d1-3f2c-41a3-bd6a-d95e263937b7	41a829ad-b0f3-46ea-8690-df61d4350dd8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MWE4MjlhZC1iMGYzLTQ2ZWEtODY5MC1kZjYxZDQzNTBkZDgiLCJlbWFpbCI6Im5ld3VzZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NTM2MDMsImV4cCI6MTc1NTQ1NDUwM30.xLJzdcrFgtCmkzQJmfJtJ1xAkS1C9lYclJ3phdDe_qM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MWE4MjlhZC1iMGYzLTQ2ZWEtODY5MC1kZjYxZDQzNTBkZDgiLCJpYXQiOjE3NTU0NTM2MDMsImV4cCI6MTc1NjA1ODQwM30.LMMz-3f-2L7dGir2LOwmiutrriHKnd7IazO_uR6A4v0	\N	\N	2025-08-24 18:00:03.504+00	2025-08-17 18:00:03.505506+00	\N	t	2025-08-17 18:00:03.505506+00
13335ce4-7f83-4c3d-8b1b-8a469a17909c	f47e9666-70ce-42ad-8b02-b328f0804969	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdlOTY2Ni03MGNlLTQyYWQtOGIwMi1iMzI4ZjA4MDQ5NjkiLCJlbWFpbCI6InRlc3QxNzU1NDUzODg2QGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NDUzODg3LCJleHAiOjE3NTU0NTQ3ODd9.eBs32_rbytRr5qJ-0qNjZNG5wTucgddxmj2Z7NjusKg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNDdlOTY2Ni03MGNlLTQyYWQtOGIwMi1iMzI4ZjA4MDQ5NjkiLCJpYXQiOjE3NTU0NTM4ODcsImV4cCI6MTc1NjA1ODY4N30.XG5F0oCVZF2QqjyjkX3VpU4RhFKsqJPj6IFAGtfDIKM	\N	\N	2025-08-24 18:04:47.061+00	2025-08-17 18:04:47.061586+00	\N	t	2025-08-17 18:04:47.061586+00
9471a6b4-acdf-4da4-afbf-3bf03f988ec6	4739bdfd-e036-4c74-8d32-c012ad756214	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzM5YmRmZC1lMDM2LTRjNzQtOGQzMi1jMDEyYWQ3NTYyMTQiLCJlbWFpbCI6InVzZXIxNzU1NDUzODk0QHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NDUzODk0LCJleHAiOjE3NTU0NTQ3OTR9.UZ1podlfBf4oFmkQYzGT8Bg0nZmamhhVzDF8QEfCjOI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzM5YmRmZC1lMDM2LTRjNzQtOGQzMi1jMDEyYWQ3NTYyMTQiLCJpYXQiOjE3NTU0NTM4OTQsImV4cCI6MTc1NjA1ODY5NH0.ndb44QwiFMUQTdcXzLhXxFyORIJaMBVTgMV7e2dK_Qw	\N	\N	2025-08-24 18:04:54.681+00	2025-08-17 18:04:54.682781+00	\N	t	2025-08-17 18:04:54.682781+00
6f4dcbe6-a683-4291-a35c-9776df53226c	862278ba-fd2d-439c-ac80-63b3d3cc8dae	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NjIyNzhiYS1mZDJkLTQzOWMtYWM4MC02M2IzZDNjYzhkYWUiLCJlbWFpbCI6ImR1cGxpY2F0ZUB0ZXN0LmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ1MzkwNywiZXhwIjoxNzU1NDU0ODA3fQ.zugncmrjM5f_pG2zoOQOld711sgBW8NbG_3F_2XyVJ4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NjIyNzhiYS1mZDJkLTQzOWMtYWM4MC02M2IzZDNjYzhkYWUiLCJpYXQiOjE3NTU0NTM5MDcsImV4cCI6MTc1NjA1ODcwN30.wtXyI9cEycExl1Pulo8llg812MvHXuMY1DpdhekC16A	\N	\N	2025-08-24 18:05:07.206+00	2025-08-17 18:05:07.206822+00	\N	t	2025-08-17 18:05:07.206822+00
a0cc6160-fd9b-4fca-817b-b4940dd6af30	aeda00d9-5c8a-425d-81c1-bc82c2a9a1fe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZWRhMDBkOS01YzhhLTQyNWQtODFjMS1iYzgyYzJhOWExZmUiLCJlbWFpbCI6InBlcmY0XzE3NTU0NTQwMTU3MTkwNzc1NDBAdGVzdC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NTQwMTUsImV4cCI6MTc1NTQ1NDkxNX0.Zr46ZDGij8nv2G6aRRvn3r1qCUAM4nTrhqg_iBHdtU8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZWRhMDBkOS01YzhhLTQyNWQtODFjMS1iYzgyYzJhOWExZmUiLCJpYXQiOjE3NTU0NTQwMTUsImV4cCI6MTc1NjA1ODgxNX0.pn43O96tBBHmC6LwzU-p_nd-pGU_H4REP36c4n9YAmE	\N	\N	2025-08-24 18:06:55.855+00	2025-08-17 18:06:55.855863+00	\N	t	2025-08-17 18:06:55.855863+00
6e7fb9ca-ef6c-4e38-a317-6b44b0850254	478c2e1b-ecbe-43bb-bea7-ffb61f1da643	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzhjMmUxYi1lY2JlLTQzYmItYmVhNy1mZmI2MWYxZGE2NDMiLCJlbWFpbCI6InBlcmYzXzE3NTU0NTQwMTU3MTA3NzcyMjBAdGVzdC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NTQwMTUsImV4cCI6MTc1NTQ1NDkxNX0.rEdgKiDllDaQs_obghLXUmvWgy74zWFGYrE6rgROckI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NzhjMmUxYi1lY2JlLTQzYmItYmVhNy1mZmI2MWYxZGE2NDMiLCJpYXQiOjE3NTU0NTQwMTUsImV4cCI6MTc1NjA1ODgxNX0.UUbEeCMUN-aufTZWasdxN9v6iZl39pXb2nmqWvWrOhs	\N	\N	2025-08-24 18:06:55.858+00	2025-08-17 18:06:55.859055+00	\N	t	2025-08-17 18:06:55.859055+00
ddd02d3e-a351-4ab1-8a40-674265e6379c	da55929b-b1df-4a1f-ac65-18cbd4f0bd33	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYTU1OTI5Yi1iMWRmLTRhMWYtYWM2NS0xOGNiZDRmMGJkMzMiLCJlbWFpbCI6InBlcmYxXzE3NTU0NTQwMTU3MDgxODczNjZAdGVzdC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NTQwMTUsImV4cCI6MTc1NTQ1NDkxNX0.2GWGB04SmhgO8N6oUd2ITwSBL-YRmDW8-mSksO_107Q	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkYTU1OTI5Yi1iMWRmLTRhMWYtYWM2NS0xOGNiZDRmMGJkMzMiLCJpYXQiOjE3NTU0NTQwMTUsImV4cCI6MTc1NjA1ODgxNX0.u4hoC0nXEN4P9_4wlhhhjnVI8UAhCPoEkHS9baghptM	\N	\N	2025-08-24 18:06:55.866+00	2025-08-17 18:06:55.86639+00	\N	t	2025-08-17 18:06:55.86639+00
0247659f-c861-4298-b8c1-de8132785fe6	c4df2221-ff93-4fd0-a7a2-4c48594a220f	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNGRmMjIyMS1mZjkzLTRmZDAtYTdhMi00YzQ4NTk0YTIyMGYiLCJlbWFpbCI6InBlcmZ0ZXN0X2ZpbmFsQHRlc3QuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NDU0MjU4LCJleHAiOjE3NTU0NTUxNTh9.GF_-rwBQxu3H6v4Idq5Ym5LlRSL-qvLVhOpsRJTPlhg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNGRmMjIyMS1mZjkzLTRmZDAtYTdhMi00YzQ4NTk0YTIyMGYiLCJpYXQiOjE3NTU0NTQyNTgsImV4cCI6MTc1NjA1OTA1OH0.7cRLBlU5E-IMG2Q117FV8HVnC9yvyDBoJTBZC-Jjqag	\N	\N	2025-08-24 18:10:58.178+00	2025-08-17 18:10:58.179173+00	\N	t	2025-08-17 18:10:58.179173+00
0e05061d-a709-4cd7-9200-11907b24b45c	660a6e06-2dde-40e2-a684-a17f561e555a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhNmUwNi0yZGRlLTQwZTItYTY4NC1hMTdmNTYxZTU1NWEiLCJlbWFpbCI6Im1vY2hlcmthMkBnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NTUyOTcsImV4cCI6MTc1NTQ1NjE5N30.k8gwCTV_VLF-c30MN7fuyKual41fGBk-RUUabLULbXo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NjBhNmUwNi0yZGRlLTQwZTItYTY4NC1hMTdmNTYxZTU1NWEiLCJpYXQiOjE3NTU0NTUyOTcsImV4cCI6MTc1NjA2MDA5N30.ziQ5HetyxIwdksMiQVjWB1ZSaEwq0gzngDzfd__LrLk	\N	\N	2025-08-24 18:28:17.719+00	2025-08-17 18:28:17.720209+00	\N	t	2025-08-17 18:28:17.720209+00
d7918334-f50b-476d-8838-8a21a62f2a84	90a60996-a997-4f23-b461-a1278dbb160c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MGE2MDk5Ni1hOTk3LTRmMjMtYjQ2MS1hMTI3OGRiYjE2MGMiLCJlbWFpbCI6Im1jaGVya2FAZ21haWwuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NDU1MzQyLCJleHAiOjE3NTU0NTYyNDJ9.Oxn96N8q8dkK01sHYfQllL6p52XYkRaxd1K-0c3pINw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5MGE2MDk5Ni1hOTk3LTRmMjMtYjQ2MS1hMTI3OGRiYjE2MGMiLCJpYXQiOjE3NTU0NTUzNDIsImV4cCI6MTc1NjA2MDE0Mn0.pis9KBmvbBcYJxu5lmV9O9Nqi1s31JMR7zrUdZJkfKA	\N	\N	2025-08-24 18:29:02.19+00	2025-08-17 18:29:02.190877+00	\N	t	2025-08-17 18:29:02.190877+00
62eaacf9-029d-4164-bce9-dc48bf798f3d	9db9a0d3-07ce-4eee-9543-5abd3d468eef	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGI5YTBkMy0wN2NlLTRlZWUtOTU0My01YWJkM2Q0NjhlZWYiLCJlbWFpbCI6InRlc3QrMTc1NTQ1NjM2NUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ1NjM2NSwiZXhwIjoxNzU1NDU3MjY1fQ.v5xy4GUmC4DyIOY8n8A6Psj5sR_F0o75JqvtzDzEDIk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGI5YTBkMy0wN2NlLTRlZWUtOTU0My01YWJkM2Q0NjhlZWYiLCJpYXQiOjE3NTU0NTYzNjUsImV4cCI6MTc1NjA2MTE2NX0.hOiIJ8wNphGV5X8-zjrH0Whzweo_I6xE9CbaN6eHY5E	\N	\N	2025-08-24 18:46:05.224+00	2025-08-17 18:46:05.225339+00	\N	t	2025-08-17 18:46:05.225339+00
1abd582d-382c-474b-94bc-df120af1cd4e	9db9a0d3-07ce-4eee-9543-5abd3d468eef	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGI5YTBkMy0wN2NlLTRlZWUtOTU0My01YWJkM2Q0NjhlZWYiLCJlbWFpbCI6InRlc3QrMTc1NTQ1NjM2NUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ1NjM3NywiZXhwIjoxNzU1NDU3Mjc3fQ.EXBf8BpgRubWw15O9-GqSx95A5ThS2mMCfZwMyo3rmk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGI5YTBkMy0wN2NlLTRlZWUtOTU0My01YWJkM2Q0NjhlZWYiLCJpYXQiOjE3NTU0NTYzNzcsImV4cCI6MTc1NjA2MTE3N30.IY-WPtYyZbBX5RmUSGrkja8hEcP8miNkcFd5Z37NtCo	::ffff:172.21.0.3	curl/8.5.0	2025-08-24 18:46:17.38+00	2025-08-17 18:46:17.380706+00	\N	t	2025-08-17 18:46:17.380706+00
e345c1a5-d88d-4138-9393-d660e3c06cfd	9db9a0d3-07ce-4eee-9543-5abd3d468eef	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGI5YTBkMy0wN2NlLTRlZWUtOTU0My01YWJkM2Q0NjhlZWYiLCJlbWFpbCI6InRlc3QrMTc1NTQ1NjM2NUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ1NjQ2OCwiZXhwIjoxNzU1NDU3MzY4fQ.-gWNvD_siUJ47Qjv8LOM725wy2r41-bAfxm4dbLQEAo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGI5YTBkMy0wN2NlLTRlZWUtOTU0My01YWJkM2Q0NjhlZWYiLCJpYXQiOjE3NTU0NTY0NjgsImV4cCI6MTc1NjA2MTI2OH0.uGGBWXSBaTqWw1w53dWH8xdb8qzEwMHibwYTPC9cCCc	\N	\N	2025-08-24 18:47:48.128+00	2025-08-17 18:47:48.129661+00	\N	t	2025-08-17 18:47:48.129661+00
2b858d45-5ffd-49ad-ad69-b096a70e7a19	2e22a4b0-eb54-4672-b239-195d2ba9114c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTIyYTRiMC1lYjU0LTQ2NzItYjIzOS0xOTVkMmJhOTExNGMiLCJlbWFpbCI6InRlc3R1c2VyQGF1ZGl0LmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ2NDk2NiwiZXhwIjoxNzU1NDY1ODY2fQ.T1Y2jIKt_cHipfptnaGAMJL4Tmv3TPoAPBpz1dwCP4k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTIyYTRiMC1lYjU0LTQ2NzItYjIzOS0xOTVkMmJhOTExNGMiLCJpYXQiOjE3NTU0NjQ5NjYsImV4cCI6MTc1NjA2OTc2Nn0.sGcjqVObXmG6TuM7jP3VejPmVs-w4HFFEAQeMOzUZBk	\N	\N	2025-08-24 21:09:26.301+00	2025-08-17 21:09:26.302165+00	\N	t	2025-08-17 21:09:26.302165+00
4564310c-5d03-4fe2-b0ec-23ac3db75f04	2e22a4b0-eb54-4672-b239-195d2ba9114c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTIyYTRiMC1lYjU0LTQ2NzItYjIzOS0xOTVkMmJhOTExNGMiLCJlbWFpbCI6InRlc3R1c2VyQGF1ZGl0LmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ2NDk3MSwiZXhwIjoxNzU1NDY1ODcxfQ.QCSOKFfWucrKLfULLFr-91VsG4FoiFTCn15SJZtA2p0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTIyYTRiMC1lYjU0LTQ2NzItYjIzOS0xOTVkMmJhOTExNGMiLCJpYXQiOjE3NTU0NjQ5NzEsImV4cCI6MTc1NjA2OTc3MX0.ZMaDDoK-btZyTgNQfsP8HhokhYoUxuA7xGRzF1HWbdk	::ffff:162.55.213.90	curl/8.5.0	2025-08-24 21:09:31.303+00	2025-08-17 21:09:31.304168+00	\N	t	2025-08-17 21:09:31.304168+00
23ea85d7-1d3e-4e49-aaa0-bbc2fca93cc1	2e22a4b0-eb54-4672-b239-195d2ba9114c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTIyYTRiMC1lYjU0LTQ2NzItYjIzOS0xOTVkMmJhOTExNGMiLCJlbWFpbCI6InRlc3R1c2VyQGF1ZGl0LmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ2NTI0MCwiZXhwIjoxNzU1NDY2MTQwfQ.Js0FKxW5DKpSbH8d3OWDjbsx9cTP-WHri1glLwNtnzA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyZTIyYTRiMC1lYjU0LTQ2NzItYjIzOS0xOTVkMmJhOTExNGMiLCJpYXQiOjE3NTU0NjUyNDAsImV4cCI6MTc1NjA3MDA0MH0.P73N5wVlLl70Ng4ecmjL7jxrH9xfO2NuoD4tsKqJDw0	\N	\N	2025-08-24 21:14:00.738+00	2025-08-17 21:14:00.738759+00	\N	t	2025-08-17 21:14:00.738759+00
ea1358b4-8f9e-4675-ae38-4fe78156d81c	091d1181-f375-4710-b2b6-6512a00ff4f7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTFkMTE4MS1mMzc1LTQ3MTAtYjJiNi02NTEyYTAwZmY0ZjciLCJlbWFpbCI6InRlc3QtMTc1NTQ2NTc5MTMxMUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ2NTc5MSwiZXhwIjoxNzU1NDY2NjkxfQ.OWr6WFFXydvpOjVa8Pu4aThW7vbwSEDRZC7IhvFJWes	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwOTFkMTE4MS1mMzc1LTQ3MTAtYjJiNi02NTEyYTAwZmY0ZjciLCJpYXQiOjE3NTU0NjU3OTEsImV4cCI6MTc1NjA3MDU5MX0.zlAeA5k1Tn-LoYo4NwMBDFnGAjhDQE87DwT5TF5LtJA	\N	\N	2025-08-24 21:23:11.397+00	2025-08-17 21:23:11.397988+00	\N	t	2025-08-17 21:23:11.397988+00
289c195a-e57c-4c96-af62-8057a2cdb1ef	d1f170a4-a467-4c96-b79d-1e65cee36ad4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMWYxNzBhNC1hNDY3LTRjOTYtYjc5ZC0xZTY1Y2VlMzZhZDQiLCJlbWFpbCI6InRlc3Qtc2luZ2xlLTE3NTU0NjU4MDY5ODZAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NjU4MDcsImV4cCI6MTc1NTQ2NjcwN30.mN-0F-kjXvdlm5O44DavhX4FOs0oOmWyKLN0b0Xg4tY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMWYxNzBhNC1hNDY3LTRjOTYtYjc5ZC0xZTY1Y2VlMzZhZDQiLCJpYXQiOjE3NTU0NjU4MDcsImV4cCI6MTc1NjA3MDYwN30.6AOqK7k2mumtDvBcy0zQ52rnkPvC9wnRa3YsiG4aBzc	\N	\N	2025-08-24 21:23:27.118+00	2025-08-17 21:23:27.119222+00	\N	t	2025-08-17 21:23:27.119222+00
7e75a8f2-dbcf-4e18-a921-91c42074c172	bb9f9c5b-6d36-4095-a5af-65bebb93e0c7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYjlmOWM1Yi02ZDM2LTQwOTUtYTVhZi02NWJlYmI5M2UwYzciLCJlbWFpbCI6InRlc3Qtc2luZ2xlLTE3NTU0NjU4MjM1MjNAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NjU4MjMsImV4cCI6MTc1NTQ2NjcyM30.TmKOFl3Dev73BT_Wlh_0tzdUKSPtl0cTHfLHYH2VvKs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYjlmOWM1Yi02ZDM2LTQwOTUtYTVhZi02NWJlYmI5M2UwYzciLCJpYXQiOjE3NTU0NjU4MjMsImV4cCI6MTc1NjA3MDYyM30.fwt_Ao_PVBdYn4zRfE5wxa9_0WCHtYCP0GlCgw2GAE8	\N	\N	2025-08-24 21:23:43.62+00	2025-08-17 21:23:43.621197+00	\N	t	2025-08-17 21:23:43.621197+00
678e0954-52d1-4136-9647-2651ecc40626	c57c8b47-0712-4aca-a017-416033f10edf	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNTdjOGI0Ny0wNzEyLTRhY2EtYTAxNy00MTYwMzNmMTBlZGYiLCJlbWFpbCI6InRlc3Qtc2luZ2xlLTE3NTU0NjU5MTYwMjlAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU0NjU5MTYsImV4cCI6MTc1NTQ2NjgxNn0.nuu2vc6AQ-XBgouBgBROohZ9nhzGqtLYXdhBtI-gSe8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNTdjOGI0Ny0wNzEyLTRhY2EtYTAxNy00MTYwMzNmMTBlZGYiLCJpYXQiOjE3NTU0NjU5MTYsImV4cCI6MTc1NjA3MDcxNn0.p1fcifS1Eo40txvCPnk3JOoxMrk5FxosgQanD22bkGs	\N	\N	2025-08-24 21:25:16.168+00	2025-08-17 21:25:16.169946+00	\N	t	2025-08-17 21:25:16.169946+00
e691e9d2-682c-4331-802e-6541789d9545	aec590c2-5b01-4a9a-ab0c-0c211dfaf6ac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZWM1OTBjMi01YjAxLTRhOWEtYWIwYy0wYzIxMWRmYWY2YWMiLCJlbWFpbCI6InRlc3QyQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NDY2NzkwLCJqdGkiOiI4NGUxMDdkNC05ZjkyLTQ3YTItYTQ5Ni04ODQyNGMxMjVhZjYiLCJleHAiOjE3NTU0Njc2OTB9.vKBJmzzdKna5EJBrBwkmEwbiewZQW_Twk-VT4gmrtkE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZWM1OTBjMi01YjAxLTRhOWEtYWIwYy0wYzIxMWRmYWY2YWMiLCJpYXQiOjE3NTU0NjY3OTAsIm5vbmNlIjoiZWIzMzY3MDctN2UyNy00MWNjLThkMjYtZmQ0YTI3NGNiMDJlIiwidXNlcklkIjoiYWVjNTkwYzItNWIwMS00YTlhLWFiMGMtMGMyMTFkZmFmNmFjIiwiZXhwIjoxNzU2MDcxNTkwfQ.wMczRiLMSqTLpyTzm6_nSkfLdx7nIpODK81Ng5zJbMc	\N	\N	2025-08-24 21:39:50.23+00	2025-08-17 21:39:50.210196+00	\N	t	2025-08-17 21:39:50.210196+00
be8d9f2a-8ce8-41c1-aa70-d0fcd10834ca	68013abb-6f7f-403b-8d82-625995e78cc9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODAxM2FiYi02ZjdmLTQwM2ItOGQ4Mi02MjU5OTVlNzhjYzkiLCJlbWFpbCI6InRlc3QtcWEtMTc1NTQ3MDE0NkBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ3MDE0NiwianRpIjoiZDJjYjAxZjItYjQ1ZS00Y2E1LTk3NGYtZDY1OTI2YzA0MGM4IiwiZXhwIjoxNzU1NDcxMDQ2fQ.KXr0FfRSTU-ZhHhOzOLPh0g_Dna2j2e5WjU8WFpBEkY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODAxM2FiYi02ZjdmLTQwM2ItOGQ4Mi02MjU5OTVlNzhjYzkiLCJpYXQiOjE3NTU0NzAxNDYsIm5vbmNlIjoiNDY1ZGRhZWMtMzE5OS00MTg5LTgxNWItOTdkMzNjZjdkYjNhIiwidXNlcklkIjoiNjgwMTNhYmItNmY3Zi00MDNiLThkODItNjI1OTk1ZTc4Y2M5IiwiZXhwIjoxNzU2MDc0OTQ2fQ.wmUSS10jRolJ_OcoKPmnG6bFTk9YUsNdY3OI6eERVkI	\N	\N	2025-08-24 22:35:46.483+00	2025-08-17 22:35:46.483946+00	\N	t	2025-08-17 22:35:46.483946+00
f0f48228-7ed7-49dd-8cb3-eac5fdf7171f	68013abb-6f7f-403b-8d82-625995e78cc9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODAxM2FiYi02ZjdmLTQwM2ItOGQ4Mi02MjU5OTVlNzhjYzkiLCJlbWFpbCI6InRlc3QtcWEtMTc1NTQ3MDE0NkBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTQ3MDMzNiwianRpIjoiMTM0YWZhYjYtZTJkNC00MTc4LWFiMzctZDg3YjQ0ZmE5YzJjIiwiZXhwIjoxNzU1NDcxMjM2fQ.TRgVMqqd1kS6AhWaKVl62ZdOHgYvZdXlaNmGrEg9F5Q	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2ODAxM2FiYi02ZjdmLTQwM2ItOGQ4Mi02MjU5OTVlNzhjYzkiLCJpYXQiOjE3NTU0NzAzMzYsIm5vbmNlIjoiZjBiODFjNGMtODMzMy00NjllLTkyMjAtM2YzNjQwMjhhYzk0IiwidXNlcklkIjoiNjgwMTNhYmItNmY3Zi00MDNiLThkODItNjI1OTk1ZTc4Y2M5IiwiZXhwIjoxNzU2MDc1MTM2fQ.P2PCyQvAv0FFG2HnfXhA2SiFVSas0MDwF_QEETVdkZ4	::ffff:162.55.213.90	curl/8.5.0	2025-08-24 22:38:56.607+00	2025-08-17 22:38:56.591471+00	\N	t	2025-08-17 22:38:56.591471+00
b7bae492-9712-4a2d-80e0-d739170f8279	c5effa69-fe60-419f-8e91-119b4c91f408	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNWVmZmE2OS1mZTYwLTQxOWYtOGU5MS0xMTliNGM5MWY0MDgiLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUxMTE1NEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUxMTE1NCwianRpIjoiYzNmYzc4OGUtNWRjNi00ZTIwLTkyYTUtNzY5ZDdjNWExY2YyIiwiZXhwIjoxNzU1NTEyMDU0fQ.wWuOVmtxHSuejteS1ECEHq1sJoQ28vbR7VXDY49JXxo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNWVmZmE2OS1mZTYwLTQxOWYtOGU5MS0xMTliNGM5MWY0MDgiLCJpYXQiOjE3NTU1MTExNTQsIm5vbmNlIjoiMmY4ZWZiNzYtYWEzMy00MTkyLTkzZDUtNjFhYjg1MTBmYWViIiwidXNlcklkIjoiYzVlZmZhNjktZmU2MC00MTlmLThlOTEtMTE5YjRjOTFmNDA4IiwiZXhwIjoxNzU2MTE1OTU0fQ.zszXnyV6fC89LcesISqgwMSQ-qC-6zmnwyPtj9r8PO4	\N	\N	2025-08-25 09:59:14.731+00	2025-08-18 09:59:14.732122+00	\N	t	2025-08-18 09:59:14.732122+00
9565797a-c358-4ac9-b9d3-6385d542ad20	e07b7507-e91e-4da0-bd53-beb175545459	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMDdiNzUwNy1lOTFlLTRkYTAtYmQ1My1iZWIxNzU1NDU0NTkiLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUxMjg3N0BleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUxMjg3OCwianRpIjoiNzQ0OWI1Y2ItNjhkYy00YzhhLTkzZWItMWNkNWQxOGJmMTA4IiwiZXhwIjoxNzU1NTEzNzc4fQ.BQmslZoO1k4eWEaz_yPZAkgX0dmX3_wlNCuHdam-By4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMDdiNzUwNy1lOTFlLTRkYTAtYmQ1My1iZWIxNzU1NDU0NTkiLCJpYXQiOjE3NTU1MTI4NzgsIm5vbmNlIjoiN2UxMGZlM2YtNzkwMC00YTE5LWI2Y2QtNDc0ZWFlYjAyZjU5IiwidXNlcklkIjoiZTA3Yjc1MDctZTkxZS00ZGEwLWJkNTMtYmViMTc1NTQ1NDU5IiwiZXhwIjoxNzU2MTE3Njc4fQ.l1OzOXR7G6kRYAr0lOaxoN3c_T0Ycm_lfecnaDFteOs	\N	\N	2025-08-25 10:27:58.011+00	2025-08-18 10:27:58.011797+00	\N	t	2025-08-18 10:27:58.011797+00
b40371a2-240d-41f1-93b0-3319089168ea	8fe18983-1a19-488b-8fa7-4991d522533a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZmUxODk4My0xYTE5LTQ4OGItOGZhNy00OTkxZDUyMjUzM2EiLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUxMzY2NEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUxMzY2NCwianRpIjoiZDQ4MmIwMjktNzU5My00ODIwLWEwNzgtYTM2ZTEzMDk2YjFjIiwiZXhwIjoxNzU1NTE0NTY0fQ.EnTsMftRQOHCFaD6RwrLwJeeg2YaopwVMCBNRokfG6k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZmUxODk4My0xYTE5LTQ4OGItOGZhNy00OTkxZDUyMjUzM2EiLCJpYXQiOjE3NTU1MTM2NjQsIm5vbmNlIjoiMjAyZmRiZTItMjM4NS00YWVlLTg0ZGMtZTgyYWU2N2Y0YWJhIiwidXNlcklkIjoiOGZlMTg5ODMtMWExOS00ODhiLThmYTctNDk5MWQ1MjI1MzNhIiwiZXhwIjoxNzU2MTE4NDY0fQ.i4BLPwQX4wAxDSmmZw1mB7gF53iSMGRkD8WUfFl_TDs	\N	\N	2025-08-25 10:41:04.864+00	2025-08-18 10:41:04.864541+00	\N	t	2025-08-18 10:41:04.864541+00
fa8f5ea4-b944-4557-a983-45269b6099bc	3e4b33f4-b144-4b9a-82f0-509bb74e94fe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTRiMzNmNC1iMTQ0LTRiOWEtODJmMC01MDliYjc0ZTk0ZmUiLCJlbWFpbCI6InRlc3QuY3VzdG9tZXIucG9ydGFsQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTE0MDQyLCJqdGkiOiJkZDRmYzYzOC1jYmRmLTRhZGYtYjY0ZC00OTBhYjQ1ZjM2ZDEiLCJleHAiOjE3NTU1MTQ5NDJ9.hdYqFfYQe-ctKMzNGVahFJm_8PLFHY-ICXSuZ56mGAg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTRiMzNmNC1iMTQ0LTRiOWEtODJmMC01MDliYjc0ZTk0ZmUiLCJpYXQiOjE3NTU1MTQwNDIsIm5vbmNlIjoiNzlhYWMyYTUtNzBiMC00NWM5LWJkMzAtMDhmMjU5NDc3MGMwIiwidXNlcklkIjoiM2U0YjMzZjQtYjE0NC00YjlhLTgyZjAtNTA5YmI3NGU5NGZlIiwiZXhwIjoxNzU2MTE4ODQyfQ.yedrQDirYB-L6zUSUsR4lbhPfNzvefEswNDwg0gDhgM	\N	\N	2025-08-25 10:47:22.161+00	2025-08-18 10:47:22.161496+00	\N	t	2025-08-18 10:47:22.161496+00
e4f79868-3c74-4c19-9787-96080f7ee0cf	3e4b33f4-b144-4b9a-82f0-509bb74e94fe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTRiMzNmNC1iMTQ0LTRiOWEtODJmMC01MDliYjc0ZTk0ZmUiLCJlbWFpbCI6InRlc3QuY3VzdG9tZXIucG9ydGFsQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTE0MDQ1LCJqdGkiOiJiMGE2NzNlZi02M2VjLTQxZjktOTlhMy1mZWFkZmE1ZmQyYmEiLCJleHAiOjE3NTU1MTQ5NDV9.IhLj4R80DFhTASuIvVr8Cnj71EqFSJvbwVbLFfSb_90	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzZTRiMzNmNC1iMTQ0LTRiOWEtODJmMC01MDliYjc0ZTk0ZmUiLCJpYXQiOjE3NTU1MTQwNDUsIm5vbmNlIjoiNGY0NWRjNDItMWM3NS00YzcxLWEwMjktNmIwM2U3NWE3MWY2IiwidXNlcklkIjoiM2U0YjMzZjQtYjE0NC00YjlhLTgyZjAtNTA5YmI3NGU5NGZlIiwiZXhwIjoxNzU2MTE4ODQ1fQ.am8Vqx2Ii9uqWs9r6f1AaoO0TXFgWXhrbsGN-vmJPh4	127.0.0.1	curl/8.5.0	2025-08-25 10:47:25.836+00	2025-08-18 10:47:25.836763+00	\N	t	2025-08-18 10:47:25.836763+00
f72c09a7-60e1-4919-992d-d8f6389f56b4	a077ec6a-178a-42a7-8750-2326568c17de	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDc3ZWM2YS0xNzhhLTQyYTctODc1MC0yMzI2NTY4YzE3ZGUiLCJlbWFpbCI6InRlc3RjdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUxNTM0NCwianRpIjoiOTU5MGJmYWEtZDViNi00YzRkLWJmMmQtMmZkMDdmOGFhMTcwIiwiZXhwIjoxNzU1NTE2MjQ0fQ.ttdnjqFtz57lnzPct6o5AJL0usBXu6fdqaLVmfRYERg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDc3ZWM2YS0xNzhhLTQyYTctODc1MC0yMzI2NTY4YzE3ZGUiLCJpYXQiOjE3NTU1MTUzNDQsIm5vbmNlIjoiY2NkOTI5ODYtODE0Yy00YTIwLTkyNDUtMWY1NWY3OGNkOWJmIiwidXNlcklkIjoiYTA3N2VjNmEtMTc4YS00MmE3LTg3NTAtMjMyNjU2OGMxN2RlIiwiZXhwIjoxNzU2MTIwMTQ0fQ.C-7T2dHpR8mT8KoW-vVhXS_ndPZkTDXBkcYHZO1rttU	\N	\N	2025-08-25 11:09:04.266+00	2025-08-18 11:09:04.267701+00	\N	t	2025-08-18 11:09:04.267701+00
d18bac71-6da5-454e-8492-79e4ce5c917c	a077ec6a-178a-42a7-8750-2326568c17de	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDc3ZWM2YS0xNzhhLTQyYTctODc1MC0yMzI2NTY4YzE3ZGUiLCJlbWFpbCI6InRlc3RjdXN0b21lckBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUxNTM1MSwianRpIjoiNzdhOWQyMWQtZjI2OC00OWJhLThlYjYtODhiZGEwNjYyY2Y1IiwiZXhwIjoxNzU1NTE2MjUxfQ.0dA6BsaIL8pNaloYXges2PomWwuNzAHuqCt6Q4B4uKw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMDc3ZWM2YS0xNzhhLTQyYTctODc1MC0yMzI2NTY4YzE3ZGUiLCJpYXQiOjE3NTU1MTUzNTEsIm5vbmNlIjoiZmM5NmUxNzMtYWNkMy00NWYxLTg1ZDYtNzI3MWFiNThkYjE0IiwidXNlcklkIjoiYTA3N2VjNmEtMTc4YS00MmE3LTg3NTAtMjMyNjU2OGMxN2RlIiwiZXhwIjoxNzU2MTIwMTUxfQ.v4bojssGdLlY2iIN8UvxTNdKO2mV_k0Nm_A4xpZc6Gs	127.0.0.1	curl/8.5.0	2025-08-25 11:09:11.114+00	2025-08-18 11:09:11.115481+00	\N	t	2025-08-18 11:09:11.115481+00
69e394ee-59d3-4133-8980-7edc584fa591	8333cd96-0bc6-4ccb-8fc7-3d2f86672552	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzMzY2Q5Ni0wYmM2LTRjY2ItOGZjNy0zZDJmODY2NzI1NTIiLCJlbWFpbCI6Im5ld3VzZXIxNzU1NTIzMjY1QGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTIzMjY1LCJqdGkiOiIyMGYyOGRjMy0yMWRjLTQ1NWMtYWQ5Mi1jNjUzYjVhYTBlNTQiLCJleHAiOjE3NTU1MjQxNjV9.a4TCOYLUhYjvDkIf_d5u2CPhbnFJWX96S8CkuvUKu6U	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4MzMzY2Q5Ni0wYmM2LTRjY2ItOGZjNy0zZDJmODY2NzI1NTIiLCJpYXQiOjE3NTU1MjMyNjUsIm5vbmNlIjoiZmNhYzcyNzEtMjZjYy00NDg2LWI0YjYtNmQ0YzdmZDdlMmRlIiwidXNlcklkIjoiODMzM2NkOTYtMGJjNi00Y2NiLThmYzctM2QyZjg2NjcyNTUyIiwiZXhwIjoxNzU2MTI4MDY1fQ.t5qBERmaxpkoi3vm0W0zGZpE-LwFqdMtfkCswiejy0k	\N	\N	2025-08-25 13:21:05.189+00	2025-08-18 13:21:05.189749+00	\N	t	2025-08-18 13:21:05.189749+00
908a8a67-ff7b-45dd-8160-f120ea771d5d	c6ad1ec8-9718-45f2-a523-24aac7c82947	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmFkMWVjOC05NzE4LTQ1ZjItYTUyMy0yNGFhYzdjODI5NDciLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUyMzM1ODc3M0BleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyMzM1OCwianRpIjoiN2FkMzc3YmQtMWJlZC00YjM5LWFhM2MtM2M4MjQyYTJjODkwIiwiZXhwIjoxNzU1NTI0MjU4fQ.rGsNDl97xpwh6U-FgNqBC3ZSiNynw0GZY0WaFQAVMZE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmFkMWVjOC05NzE4LTQ1ZjItYTUyMy0yNGFhYzdjODI5NDciLCJpYXQiOjE3NTU1MjMzNTgsIm5vbmNlIjoiOTI5YjgxMTgtYmU5Ni00ZmFiLThkZjQtNDlkYjk3MzBkNTI3IiwidXNlcklkIjoiYzZhZDFlYzgtOTcxOC00NWYyLWE1MjMtMjRhYWM3YzgyOTQ3IiwiZXhwIjoxNzU2MTI4MTU4fQ.A_pjvIqYzJM6LDhxJu5r7tgcIOx_WJf8-_xmV9QQdBU	\N	\N	2025-08-25 13:22:38.857+00	2025-08-18 13:22:38.857958+00	\N	t	2025-08-18 13:22:38.857958+00
9c15d0bc-3ed1-4dc2-993e-8d271a55b322	c6ad1ec8-9718-45f2-a523-24aac7c82947	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmFkMWVjOC05NzE4LTQ1ZjItYTUyMy0yNGFhYzdjODI5NDciLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUyMzM1ODc3M0BleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyMzM1OCwianRpIjoiNTRkNTFhNDEtOWFkYi00ZWNhLTg5MWMtYWEyZWY1NmE5NGJiIiwiZXhwIjoxNzU1NTI0MjU4fQ.1m1Gi2z0I5tOQvqGO6RQGoKD5zV_farv2n2qVkfEV_w	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNmFkMWVjOC05NzE4LTQ1ZjItYTUyMy0yNGFhYzdjODI5NDciLCJpYXQiOjE3NTU1MjMzNTgsIm5vbmNlIjoiZTliNjNlMmQtNmZlZS00MDlmLWE4ZDAtZjg4MDU3MTYyMTQxIiwidXNlcklkIjoiYzZhZDFlYzgtOTcxOC00NWYyLWE1MjMtMjRhYWM3YzgyOTQ3IiwiZXhwIjoxNzU2MTI4MTU4fQ.NiJfiM5U7KD2zJIU4w-yj5naioM7yQSDkC77kd0_zR4	162.55.213.90	axios/1.11.0	2025-08-25 13:22:38.947+00	2025-08-18 13:22:38.948198+00	\N	t	2025-08-18 13:22:38.948198+00
592385ab-bc5f-4dc4-b92a-ae1da9cbf839	ef0f294f-d6af-4698-a607-05cd5d7d22b3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjBmMjk0Zi1kNmFmLTQ2OTgtYTYwNy0wNWNkNWQ3ZDIyYjMiLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUyMzM4MDQ5NEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyMzM4MCwianRpIjoiNGE5ZmQyZjktZGJkMS00YjMyLThlODUtNjRhZWRhZGU0OGIyIiwiZXhwIjoxNzU1NTI0MjgwfQ.d9UARGofZG62GngtcYXX4x3yYKEAnsj-p1DUB22C1Nc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjBmMjk0Zi1kNmFmLTQ2OTgtYTYwNy0wNWNkNWQ3ZDIyYjMiLCJpYXQiOjE3NTU1MjMzODAsIm5vbmNlIjoiOTlkYjVjZjQtODBlOS00OWIwLWE3NzgtYWYxM2IyM2ZkMDg1IiwidXNlcklkIjoiZWYwZjI5NGYtZDZhZi00Njk4LWE2MDctMDVjZDVkN2QyMmIzIiwiZXhwIjoxNzU2MTI4MTgwfQ.Oelue-ZeHG6bta-V4SJY3tIJn3pYE-OQxo1mXQ994Lo	\N	\N	2025-08-25 13:23:00.601+00	2025-08-18 13:23:00.602108+00	\N	t	2025-08-18 13:23:00.602108+00
abbbfeae-4d63-4384-9f08-10325cd0e129	ef0f294f-d6af-4698-a607-05cd5d7d22b3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjBmMjk0Zi1kNmFmLTQ2OTgtYTYwNy0wNWNkNWQ3ZDIyYjMiLCJlbWFpbCI6InRlc3R1c2VyMTc1NTUyMzM4MDQ5NEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyMzM4MiwianRpIjoiY2M4YzQ3ODEtYTk4Zi00OTYwLThlMjctMTU4MWNjMzQ3ZGZhIiwiZXhwIjoxNzU1NTI0MjgyfQ.dJkiA8gDA3xBf4gK5mDLVi2vWR6sQPdxP8DD1AyWBms	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjBmMjk0Zi1kNmFmLTQ2OTgtYTYwNy0wNWNkNWQ3ZDIyYjMiLCJpYXQiOjE3NTU1MjMzODIsIm5vbmNlIjoiN2I5NzA0ZDEtMmJkNC00NjI2LTk5YzEtY2M3ZTY1N2MyMTBlIiwidXNlcklkIjoiZWYwZjI5NGYtZDZhZi00Njk4LWE2MDctMDVjZDVkN2QyMmIzIiwiZXhwIjoxNzU2MTI4MTgyfQ.Z0o2sQBLZL12xtlJl5YmTSNElARYpV0l8W0XLsI_98I	162.55.213.90	axios/1.11.0	2025-08-25 13:23:02.756+00	2025-08-18 13:23:02.757371+00	\N	t	2025-08-18 13:23:02.757371+00
cf320037-292b-4c76-b0b3-4f7c2081e12f	27828d5b-4d2f-4b25-9494-31260584e4db	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzgyOGQ1Yi00ZDJmLTRiMjUtOTQ5NC0zMTI2MDU4NGU0ZGIiLCJlbWFpbCI6ImZpbmFsdGVzdDE3NTU1MjM0MDY2MDBAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1MjM0MDYsImp0aSI6ImJlZTJlYzkwLTJmODktNDJkOS1iMTM5LTE3YmM5YmY2ODg3MyIsImV4cCI6MTc1NTUyNDMwNn0.wYGNzu5LSLPNkCUcdhLtLubvRj_mebgK_Lvc-XkfJUs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzgyOGQ1Yi00ZDJmLTRiMjUtOTQ5NC0zMTI2MDU4NGU0ZGIiLCJpYXQiOjE3NTU1MjM0MDYsIm5vbmNlIjoiOGY1MDUwYWUtNWM5NS00M2RlLTgzNDAtZTIwMTNiM2MyYjMwIiwidXNlcklkIjoiMjc4MjhkNWItNGQyZi00YjI1LTk0OTQtMzEyNjA1ODRlNGRiIiwiZXhwIjoxNzU2MTI4MjA2fQ.EYH6gDyvyME_yTuAZE-gSF-1-8PCurJ6pXF_ICD8_QU	\N	\N	2025-08-25 13:23:26.756+00	2025-08-18 13:23:26.757144+00	\N	t	2025-08-18 13:23:26.757144+00
65a6922d-9e55-4aed-89d0-692f13d9ecbe	27828d5b-4d2f-4b25-9494-31260584e4db	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzgyOGQ1Yi00ZDJmLTRiMjUtOTQ5NC0zMTI2MDU4NGU0ZGIiLCJlbWFpbCI6ImZpbmFsdGVzdDE3NTU1MjM0MDY2MDBAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1MjM0MDksImp0aSI6Ijk3Mzc4OTk1LWI2YzgtNDQ1MS05ODBjLTZjMGM2ZmQzM2Y1NCIsImV4cCI6MTc1NTUyNDMwOX0.LhNetRGa3k8QkekkvTfGcYmRL9ynAmSAxDpNp1cjKlg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzgyOGQ1Yi00ZDJmLTRiMjUtOTQ5NC0zMTI2MDU4NGU0ZGIiLCJpYXQiOjE3NTU1MjM0MDksIm5vbmNlIjoiYzk0NTNhN2ItZjA1MS00ZjBhLTgzMGUtMTc1NWViZDJkZGMyIiwidXNlcklkIjoiMjc4MjhkNWItNGQyZi00YjI1LTk0OTQtMzEyNjA1ODRlNGRiIiwiZXhwIjoxNzU2MTI4MjA5fQ.B_WIGX-XhilNfxnNNn5fAGUkdOTildphUfuV5xbysQE	162.55.213.90	axios/1.11.0	2025-08-25 13:23:29.909+00	2025-08-18 13:23:29.91043+00	\N	t	2025-08-18 13:23:29.91043+00
0ca023e9-a2b0-45a8-9b9c-9e8e5bf261d8	f525a5ba-91e6-40ea-99ff-978d1db2ffc1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNTI1YTViYS05MWU2LTQwZWEtOTlmZi05NzhkMWRiMmZmYzEiLCJlbWFpbCI6Im5ld3VzZXIxNzU1NTIzODg0QGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTIzODg0LCJqdGkiOiI5ZjcxNzVkZS0xM2ZjLTRjMGMtOWE3ZC1mNzQ5MzA1YzBlZTgiLCJleHAiOjE3NTU1MjQ3ODR9.nbxVtYBNLkUvKJ56dWjZI68kFEArZwja2UUOu_fZBAU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmNTI1YTViYS05MWU2LTQwZWEtOTlmZi05NzhkMWRiMmZmYzEiLCJpYXQiOjE3NTU1MjM4ODQsIm5vbmNlIjoiZDE3Yzc4N2UtNWYxMi00MzE0LWIyYzAtMzA5NDQ4MGM1ZmQ2IiwidXNlcklkIjoiZjUyNWE1YmEtOTFlNi00MGVhLTk5ZmYtOTc4ZDFkYjJmZmMxIiwiZXhwIjoxNzU2MTI4Njg0fQ.zkwHXubKLjIgHJajcf_bQvFePnAHx4_6J4UgulL3NOE	\N	\N	2025-08-25 13:31:24.644+00	2025-08-18 13:31:24.64492+00	\N	t	2025-08-18 13:31:24.64492+00
9dd698ff-f356-413b-b5ea-8fcd698792ab	e171af6d-d774-4a19-9b5b-2039de0325d1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTcxYWY2ZC1kNzc0LTRhMTktOWI1Yi0yMDM5ZGUwMzI1ZDEiLCJlbWFpbCI6Imdlc3Rpb25AbG9jb2QtYWkuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI1NDQ1LCJqdGkiOiIyYzY2MDM2ZS00OGRmLTRkZDktYmZmZC0wMzkxZWRmZmM2MzIiLCJleHAiOjE3NTU1MjYzNDV9.Mp8f6SHmFam82iyZEy3l5DGgz5GPtxhcdMdlx2tiJCE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMTcxYWY2ZC1kNzc0LTRhMTktOWI1Yi0yMDM5ZGUwMzI1ZDEiLCJpYXQiOjE3NTU1MjU0NDUsIm5vbmNlIjoiYzdkZjcxMmYtZWZhMC00Njg3LWJjY2MtMjk4MjZjODFmZTRjIiwidXNlcklkIjoiZTE3MWFmNmQtZDc3NC00YTE5LTliNWItMjAzOWRlMDMyNWQxIiwiZXhwIjoxNzU2MTMwMjQ1fQ.KC2dXOcNi0QjYLG2HKHKoxsfUpplPm9pzmp-QSTRIVg	\N	\N	2025-08-25 13:57:25.238+00	2025-08-18 13:57:25.239086+00	\N	t	2025-08-18 13:57:25.239086+00
5421a457-87f6-438f-a938-4282689a949b	b213b8dc-ac96-451f-b76c-3c8616a61fda	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMjEzYjhkYy1hYzk2LTQ1MWYtYjc2Yy0zYzg2MTZhNjFmZGEiLCJlbWFpbCI6InRlc3RhcGlAcGxheXdyaWdodC50ZXN0Iiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI1NzY0LCJqdGkiOiI5ODI1OGE3MS1iZmMxLTQ0NTktOTc2MS1lZTAxNzY1ODcxYmIiLCJleHAiOjE3NTU1MjY2NjR9.IRm4G60rVX8SfI2PnTlS4kh1CmxHzEHCgbt17YX8uE8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiMjEzYjhkYy1hYzk2LTQ1MWYtYjc2Yy0zYzg2MTZhNjFmZGEiLCJpYXQiOjE3NTU1MjU3NjQsIm5vbmNlIjoiMTkwMWI2YTItODQ1NC00Y2Q2LWE1NGEtYjY1YjM0NTg2MDJiIiwidXNlcklkIjoiYjIxM2I4ZGMtYWM5Ni00NTFmLWI3NmMtM2M4NjE2YTYxZmRhIiwiZXhwIjoxNzU2MTMwNTY0fQ.k77SjMp9Mph1mwEzaRhg1ozRVuuBZXV0biHtsfHQSBI	\N	\N	2025-08-25 14:02:44.938+00	2025-08-18 14:02:44.938646+00	\N	t	2025-08-18 14:02:44.938646+00
98428c92-bd2f-4f57-b1e3-4884ad6355fc	aed746c2-5950-4294-9abf-ab3ca65684d0	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZWQ3NDZjMi01OTUwLTQyOTQtOWFiZi1hYjNjYTY1Njg0ZDAiLCJlbWFpbCI6InRlc3QxNzU1NTI1Nzg3MTUybm4wYmdtQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTc4NywianRpIjoiNzMwZTI0OTctMTQ0Yy00ZjlmLWIyN2UtN2VjZGM0ZmE5ZWM1IiwiZXhwIjoxNzU1NTI2Njg3fQ.eu5csmSMnqtjR2xOFaTsPK2-eGOHWGcgWe6zdMc4yVA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZWQ3NDZjMi01OTUwLTQyOTQtOWFiZi1hYjNjYTY1Njg0ZDAiLCJpYXQiOjE3NTU1MjU3ODcsIm5vbmNlIjoiOGFiM2QwZWEtZDMwZC00YjljLThkYTctODdkOTZlOGNkNTgyIiwidXNlcklkIjoiYWVkNzQ2YzItNTk1MC00Mjk0LTlhYmYtYWIzY2E2NTY4NGQwIiwiZXhwIjoxNzU2MTMwNTg3fQ.p9KgH3xA58r80qjuIJwUOMezWGbPg8w7mTUWWRt3KUc	\N	\N	2025-08-25 14:03:07.227+00	2025-08-18 14:03:07.227994+00	\N	t	2025-08-18 14:03:07.227994+00
72a791f1-b5f0-455c-b551-e09becb42c51	4b502788-3dfe-4255-9188-27028c951af9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YjUwMjc4OC0zZGZlLTQyNTUtOTE4OC0yNzAyOGM5NTFhZjkiLCJlbWFpbCI6InRlc3QxNzU1NTI1Nzg2NTkzMHljNmxjQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTc4NywianRpIjoiNTMzMmUzYzktNjliNS00MTQyLWE2OGQtZWIyZDM1MDk0YmQ1IiwiZXhwIjoxNzU1NTI2Njg3fQ.guQJJ5EyXfGItAywmpPQhwHUlBwI5tv92uU-Wc2vqZs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YjUwMjc4OC0zZGZlLTQyNTUtOTE4OC0yNzAyOGM5NTFhZjkiLCJpYXQiOjE3NTU1MjU3ODcsIm5vbmNlIjoiMTBmZmQxYzUtZWE2Ny00ZmIwLWI5ZjYtMTI2OWEwM2YwN2QxIiwidXNlcklkIjoiNGI1MDI3ODgtM2RmZS00MjU1LTkxODgtMjcwMjhjOTUxYWY5IiwiZXhwIjoxNzU2MTMwNTg3fQ.GnvxnIYwI3A9GK0Byk6HICl6jMh8Q85XGf8C9gcDJy0	\N	\N	2025-08-25 14:03:07.936+00	2025-08-18 14:03:07.936536+00	\N	t	2025-08-18 14:03:07.936536+00
1e4d6134-db32-4cda-b2b0-4a8da85916da	4c5188bf-1fee-4f56-82e8-d697f9901333	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YzUxODhiZi0xZmVlLTRmNTYtODJlOC1kNjk3Zjk5MDEzMzMiLCJlbWFpbCI6InRlc3QxNzU1NTI1Nzg3MzM3eDNuMGxqQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTc4OCwianRpIjoiMmYyZGJjNWQtZjNjOS00YWRiLTk1NDItM2QxOTI3NWQzYTM4IiwiZXhwIjoxNzU1NTI2Njg4fQ.sQVFEd5LEfPzKVLLj_wvSYa3ETnw9Wn0AynRcQPHHKQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YzUxODhiZi0xZmVlLTRmNTYtODJlOC1kNjk3Zjk5MDEzMzMiLCJpYXQiOjE3NTU1MjU3ODgsIm5vbmNlIjoiN2I2MmFkYzgtMTQ4MC00MWIwLWFmM2EtOTBkYjhlYjIxMjk0IiwidXNlcklkIjoiNGM1MTg4YmYtMWZlZS00ZjU2LTgyZTgtZDY5N2Y5OTAxMzMzIiwiZXhwIjoxNzU2MTMwNTg4fQ.TLhpfLxKXTzzwYC8csRmYJNmjvRTvSWi9eqFbuM2co0	\N	\N	2025-08-25 14:03:08.665+00	2025-08-18 14:03:08.66592+00	\N	t	2025-08-18 14:03:08.66592+00
c99d01e8-2f94-4e7f-833d-a45005c4b53f	9294b01e-35b2-45fb-8054-fb54137f59a4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5Mjk0YjAxZS0zNWIyLTQ1ZmItODA1NC1mYjU0MTM3ZjU5YTQiLCJlbWFpbCI6InRlc3QxNzU1NTI1Nzg5MzMxYnVhMGlyQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTc5NSwianRpIjoiMDJlNjMzNDYtZGRjMC00ODcyLTgwYmQtNDUzNzJkZDg4YjcwIiwiZXhwIjoxNzU1NTI2Njk1fQ.ECpgBHEwoEfAT_pnM9hL2gTm54ZmPMWeF5_E-KFoE1s	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5Mjk0YjAxZS0zNWIyLTQ1ZmItODA1NC1mYjU0MTM3ZjU5YTQiLCJpYXQiOjE3NTU1MjU3OTUsIm5vbmNlIjoiN2NmNDViYTctNDU5My00MmEyLTlmM2MtOGRjNWUzZjJlODQzIiwidXNlcklkIjoiOTI5NGIwMWUtMzViMi00NWZiLTgwNTQtZmI1NDEzN2Y1OWE0IiwiZXhwIjoxNzU2MTMwNTk1fQ.Rf-FX8AyDEouAmvgxI1nTzF7qW5BNv3rcDICNpH7duE	\N	\N	2025-08-25 14:03:15.807+00	2025-08-18 14:03:15.807313+00	\N	t	2025-08-18 14:03:15.807313+00
5c1e016f-e649-45a6-887e-9d9789c646fc	8f412d26-a04b-43e8-b1a6-98aac9075115	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjQxMmQyNi1hMDRiLTQzZTgtYjFhNi05OGFhYzkwNzUxMTUiLCJlbWFpbCI6InRlc3QxNzU1NTI1ODcwNDMycTJpNmM2QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTg3MCwianRpIjoiNGRjYzRkMTMtNjRlOC00Y2QxLTg2YjktODE5MDE3ZDMzZmVjIiwiZXhwIjoxNzU1NTI2NzcwfQ.WNuhaKw9-jCUTqNEGkO-i9Lo9q9hA7H6e-GLV9Y6V5Q	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZjQxMmQyNi1hMDRiLTQzZTgtYjFhNi05OGFhYzkwNzUxMTUiLCJpYXQiOjE3NTU1MjU4NzAsIm5vbmNlIjoiM2JhNWE1ZTAtZGRiNS00ODRkLWI2M2YtMzc5ZTBjODE1MzI2IiwidXNlcklkIjoiOGY0MTJkMjYtYTA0Yi00M2U4LWIxYTYtOThhYWM5MDc1MTE1IiwiZXhwIjoxNzU2MTMwNjcwfQ.6qduTud5z-slNPBjbYcAI2uFtB0hfpWqXy7NODMwJQw	\N	\N	2025-08-25 14:04:30.515+00	2025-08-18 14:04:30.515449+00	\N	t	2025-08-18 14:04:30.515449+00
cee08294-0edf-49d6-ae2a-3045444a84ae	c3107abd-7e92-45bf-a757-13dbd7c795c6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMzEwN2FiZC03ZTkyLTQ1YmYtYTc1Ny0xM2RiZDdjNzk1YzYiLCJlbWFpbCI6InRlc3QxNzU1NTI1ODcwMTIybW9kdnFoQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTg3MSwianRpIjoiYmI4NmY1OTEtYWQ2MS00YWQ0LTg3OGMtMjE5NDc2ZWQxYjU2IiwiZXhwIjoxNzU1NTI2NzcxfQ.T2DqA8m1tpbDa4NVXhBIpPUVLOBJQURkYiwS-RSOFa8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMzEwN2FiZC03ZTkyLTQ1YmYtYTc1Ny0xM2RiZDdjNzk1YzYiLCJpYXQiOjE3NTU1MjU4NzEsIm5vbmNlIjoiYmJiNWY5YjYtYWFkMy00NmNhLTg5YTgtMzI4MzliOTI1Y2Y5IiwidXNlcklkIjoiYzMxMDdhYmQtN2U5Mi00NWJmLWE3NTctMTNkYmQ3Yzc5NWM2IiwiZXhwIjoxNzU2MTMwNjcxfQ.rt_lc4nyf-aa017cFd1pzd2TmFGprqq3GtKoyeNK6xk	\N	\N	2025-08-25 14:04:31.406+00	2025-08-18 14:04:31.407347+00	\N	t	2025-08-18 14:04:31.407347+00
81ea6c57-3cd7-4f5e-99ab-14384e7de52a	2c59e6ec-bfaa-48fd-9494-619932cf1235	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYzU5ZTZlYy1iZmFhLTQ4ZmQtOTQ5NC02MTk5MzJjZjEyMzUiLCJlbWFpbCI6InRlc3QxNzU1NTI1ODcwNzMydDNrZTJxQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTg3MSwianRpIjoiNDljOTJjNmQtZDQzNS00ZjQwLTk5MzktMWYxYmMxOWQyODRhIiwiZXhwIjoxNzU1NTI2NzcxfQ.oXQYVaXMegDmav2WpEx50fazZXRdBFRVJ_K3HQjfNjE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyYzU5ZTZlYy1iZmFhLTQ4ZmQtOTQ5NC02MTk5MzJjZjEyMzUiLCJpYXQiOjE3NTU1MjU4NzEsIm5vbmNlIjoiNzlmZjNkNjMtNDUwNy00NmNmLTgyNzAtYmQzNDRjZWZlNzgzIiwidXNlcklkIjoiMmM1OWU2ZWMtYmZhYS00OGZkLTk0OTQtNjE5OTMyY2YxMjM1IiwiZXhwIjoxNzU2MTMwNjcxfQ.RpUjFTZ9c-Bmc930100Q19rPkyiA0vNvX3JFXno9ZUk	\N	\N	2025-08-25 14:04:31.913+00	2025-08-18 14:04:31.914602+00	\N	t	2025-08-18 14:04:31.914602+00
7174c7e6-2861-4fd0-a09e-b4cc04480542	0e4b0fe2-f78e-46a6-874b-3fa5ec954629	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTRiMGZlMi1mNzhlLTQ2YTYtODc0Yi0zZmE1ZWM5NTQ2MjkiLCJlbWFpbCI6InRlc3QxNzU1NTI1ODc2NjkyOXBlZWN2QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNTg4MywianRpIjoiZmNlZGU5ZjAtNzQ5Ni00MTExLWIxZTgtODJkZTBjMTU1MjgwIiwiZXhwIjoxNzU1NTI2NzgzfQ.Lkkd1tFlZjmJO80EnaBPmdqgE0o5eVMOyJ9N33ECNsE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTRiMGZlMi1mNzhlLTQ2YTYtODc0Yi0zZmE1ZWM5NTQ2MjkiLCJpYXQiOjE3NTU1MjU4ODMsIm5vbmNlIjoiNTVjMDAwNDctNmUwNi00MzE2LWFjNzgtZjk5NGQxY2M4NGRjIiwidXNlcklkIjoiMGU0YjBmZTItZjc4ZS00NmE2LTg3NGItM2ZhNWVjOTU0NjI5IiwiZXhwIjoxNzU2MTMwNjgzfQ.GCAAMCxIcAaISogkVdkg-Q92gLhVdfk_Kt24cQMipBQ	\N	\N	2025-08-25 14:04:43.286+00	2025-08-18 14:04:43.286863+00	\N	t	2025-08-18 14:04:43.286863+00
fea7f2c7-3d19-4ad8-905f-0587b841e960	69223f81-e66c-4f26-bb40-44775bd11df7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTIyM2Y4MS1lNjZjLTRmMjYtYmI0MC00NDc3NWJkMTFkZjciLCJlbWFpbCI6InRlc3QxNzU1NTI2MDI0MzYycHE4bzB4QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjAyNCwianRpIjoiZDlmNzdkNTktYzQ2Zi00NjY3LWE4YmEtM2VjNzdjYzczNzBmIiwiZXhwIjoxNzU1NTI2OTI0fQ.ji9Lcduw_uasX3wBMwGjF12Gf_jwFLvrRWOQ68j-w0I	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTIyM2Y4MS1lNjZjLTRmMjYtYmI0MC00NDc3NWJkMTFkZjciLCJpYXQiOjE3NTU1MjYwMjQsIm5vbmNlIjoiNDdiZTEyNmItNDI1ZC00ZDRiLWFiMzUtNjc3NzJkMGY1Y2Y2IiwidXNlcklkIjoiNjkyMjNmODEtZTY2Yy00ZjI2LWJiNDAtNDQ3NzViZDExZGY3IiwiZXhwIjoxNzU2MTMwODI0fQ.jAeR4i3ImAJ_R9MYrnQOzdsBvA-HXwoU5WpBaZW1GFM	\N	\N	2025-08-25 14:07:04.448+00	2025-08-18 14:07:04.448362+00	\N	t	2025-08-18 14:07:04.448362+00
7b97b719-89f5-44c6-a4aa-ffa7c89fd618	8dbade99-a2cb-4974-9687-b991c8827ab4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZGJhZGU5OS1hMmNiLTQ5NzQtOTY4Ny1iOTkxYzg4MjdhYjQiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDI0MTA5Z3duMGQxQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjAyNSwianRpIjoiNDY0ZTliMTMtYzEyYS00OTZkLWFlNTktNTJjZmM2ZThhOWU0IiwiZXhwIjoxNzU1NTI2OTI1fQ.O9-8KGZlaifbFLm0JiDFFBoSEZUmKyVCAjGbFNS1Ka4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZGJhZGU5OS1hMmNiLTQ5NzQtOTY4Ny1iOTkxYzg4MjdhYjQiLCJpYXQiOjE3NTU1MjYwMjUsIm5vbmNlIjoiZDcyOThmZWEtNzIzNC00OWZiLTlmNzgtMzg5NjM4YzZlNTMyIiwidXNlcklkIjoiOGRiYWRlOTktYTJjYi00OTc0LTk2ODctYjk5MWM4ODI3YWI0IiwiZXhwIjoxNzU2MTMwODI1fQ.kZbYX7Uy4dh-RrrbQwxoxKPpwcP-pYKPJsMdkD8vCoo	\N	\N	2025-08-25 14:07:05.318+00	2025-08-18 14:07:05.319078+00	\N	t	2025-08-18 14:07:05.319078+00
16f3fbe8-60bd-430d-a71e-2f4a32f7a31a	7055eeff-8c1b-4f89-9393-a05d43445328	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDU1ZWVmZi04YzFiLTRmODktOTM5My1hMDVkNDM0NDUzMjgiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDI0NjAxZWVnbm55QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjAyNSwianRpIjoiZjczODAwZTItN2I5YS00ODIyLWI0OGEtMDJmNmE1NTk2Zjg5IiwiZXhwIjoxNzU1NTI2OTI1fQ.XW1-FQ2BijByLVa1FrA_4c2_y2xfRi3SeOErBpBZ4PM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDU1ZWVmZi04YzFiLTRmODktOTM5My1hMDVkNDM0NDUzMjgiLCJpYXQiOjE3NTU1MjYwMjUsIm5vbmNlIjoiNjBlNjNiZmEtNDM0Ny00MDA4LWExNDgtZjM4ZmM3ZjY1N2Y3IiwidXNlcklkIjoiNzA1NWVlZmYtOGMxYi00Zjg5LTkzOTMtYTA1ZDQzNDQ1MzI4IiwiZXhwIjoxNzU2MTMwODI1fQ.IdriIl1B4ET4eakH8KhHklatjCcuLShVN7_a3FklB0s	\N	\N	2025-08-25 14:07:05.859+00	2025-08-18 14:07:05.859652+00	\N	t	2025-08-18 14:07:05.859652+00
e17db42a-ea3b-4bcc-a8eb-a0c4b8600fcb	9874e76f-3f5c-4b22-8055-69c54da94d38	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc0ZTc2Zi0zZjVjLTRiMjItODA1NS02OWM1NGRhOTRkMzgiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDI2NDAzeTVua2c0QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjAzMywianRpIjoiZTM5ZGY3OGQtN2FiNC00NTg0LThiNTEtMWU5MmFhNWY0NjM5IiwiZXhwIjoxNzU1NTI2OTMzfQ.GiwO2DA7X6g9RNbGcD_if6vkWHmpu6EQ2M_Z4vkpb7k	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc0ZTc2Zi0zZjVjLTRiMjItODA1NS02OWM1NGRhOTRkMzgiLCJpYXQiOjE3NTU1MjYwMzMsIm5vbmNlIjoiODljZDFkYTUtYjYzNS00MmFlLTkzOTEtMGQ5ZjI3OGNjNzYwIiwidXNlcklkIjoiOTg3NGU3NmYtM2Y1Yy00YjIyLTgwNTUtNjljNTRkYTk0ZDM4IiwiZXhwIjoxNzU2MTMwODMzfQ.19sdMxCUM7zx_7uKUBHRF7jAVEiJYeqPrBDFGz_Sdh8	\N	\N	2025-08-25 14:07:13.068+00	2025-08-18 14:07:13.06821+00	\N	t	2025-08-18 14:07:13.06821+00
5e3e5734-c05a-40fc-b6c6-ddf84070ed08	54a3b3d7-ecc5-4708-9746-504f0afc18ac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGEzYjNkNy1lY2M1LTQ3MDgtOTc0Ni01MDRmMGFmYzE4YWMiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDQyNjczbTdyN2NzQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA0MiwianRpIjoiZTM5YTc1MjAtYjQ4YS00NTQyLWE3OWUtNjU0ZTlmMzBkNTY0IiwiZXhwIjoxNzU1NTI2OTQyfQ.3nsWNl_Lm5HwqJVqc_pvjMlqkA3qHV64a1Hr3W3_HDw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NGEzYjNkNy1lY2M1LTQ3MDgtOTc0Ni01MDRmMGFmYzE4YWMiLCJpYXQiOjE3NTU1MjYwNDIsIm5vbmNlIjoiYmNjNjhlMmItODM3NC00ZGRmLTkyMDktZDk2MGY5NjE1ZDFiIiwidXNlcklkIjoiNTRhM2IzZDctZWNjNS00NzA4LTk3NDYtNTA0ZjBhZmMxOGFjIiwiZXhwIjoxNzU2MTMwODQyfQ.9DVXajePYt28DylTlGUDI0FcY4jG_CWSKmYpAW3i4JY	\N	\N	2025-08-25 14:07:22.748+00	2025-08-18 14:07:22.749182+00	\N	t	2025-08-18 14:07:22.749182+00
808a4f0e-56c5-4d09-bf99-6f5357d22db2	42b9d23e-fae8-484e-8382-9688e34651d4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MmI5ZDIzZS1mYWU4LTQ4NGUtODM4Mi05Njg4ZTM0NjUxZDQiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDQyNjQ1ZWtqOHB5QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA0NCwianRpIjoiZjQzZjFkNTctYzRiOC00ZDc1LWEwNzMtZjU2ZWMxYzllYmJiIiwiZXhwIjoxNzU1NTI2OTQ0fQ.4tclshkD5QG7xL2X5e1zCOmiLUbxtFhJJ8jjnTaJrTQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MmI5ZDIzZS1mYWU4LTQ4NGUtODM4Mi05Njg4ZTM0NjUxZDQiLCJpYXQiOjE3NTU1MjYwNDQsIm5vbmNlIjoiOTFmZGQwZGUtZTlkOC00ODUxLTk1YTUtMTlmZDFiNmM4NWYzIiwidXNlcklkIjoiNDJiOWQyM2UtZmFlOC00ODRlLTgzODItOTY4OGUzNDY1MWQ0IiwiZXhwIjoxNzU2MTMwODQ0fQ._guEEs8XYDzz__cPufurE1yNN6Fv2B_Uv5IJcBc8-38	\N	\N	2025-08-25 14:07:24.039+00	2025-08-18 14:07:24.039997+00	\N	t	2025-08-18 14:07:24.039997+00
6a7ce01c-51c0-4798-8a5f-8a01c5fbfc22	e0c5ec72-83dc-43c6-bad4-82206b4d323a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMGM1ZWM3Mi04M2RjLTQzYzYtYmFkNC04MjIwNmI0ZDMyM2EiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDQzMTg5cnJoNWdqQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA0NCwianRpIjoiYTEyMjNjOGYtZGY2Ny00ZjdkLTgyMjQtNDJhY2FlOThiMjBiIiwiZXhwIjoxNzU1NTI2OTQ0fQ.pxIX9fTpckx8Z7VTj3NlPJXgpDUt1Bhd9ID9qc7ha9Y	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlMGM1ZWM3Mi04M2RjLTQzYzYtYmFkNC04MjIwNmI0ZDMyM2EiLCJpYXQiOjE3NTU1MjYwNDQsIm5vbmNlIjoiYmJlMmUzNzYtYmM2ZS00Zjc5LWI3MWQtZmQ3MDY3ZjNmZWUzIiwidXNlcklkIjoiZTBjNWVjNzItODNkYy00M2M2LWJhZDQtODIyMDZiNGQzMjNhIiwiZXhwIjoxNzU2MTMwODQ0fQ.eCgwewbzeNU9wcQBYRV8tJ9upcB70F2WL545lkOw6rw	\N	\N	2025-08-25 14:07:24.691+00	2025-08-18 14:07:24.691476+00	\N	t	2025-08-18 14:07:24.691476+00
b55afb46-7ca5-4781-a250-9a34dc83d656	02958cb8-3b2a-4243-8428-17fe512d3559	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMjk1OGNiOC0zYjJhLTQyNDMtODQyOC0xN2ZlNTEyZDM1NTkiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDcwNDY4NzAyaXpnQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA3MCwianRpIjoiOGY4Y2IzYzUtYmNmZC00OTNlLTgzMWEtMmZjZjRlNWI2YjUyIiwiZXhwIjoxNzU1NTI2OTcwfQ.EagWdkOtBKaF9OWYUtTgF3NkllUXcVbihWNz66jFxu8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMjk1OGNiOC0zYjJhLTQyNDMtODQyOC0xN2ZlNTEyZDM1NTkiLCJpYXQiOjE3NTU1MjYwNzAsIm5vbmNlIjoiYTFiNmIzN2EtNGU0NS00ZmZiLWEzNjItZGUwYWMxNWRhMzdkIiwidXNlcklkIjoiMDI5NThjYjgtM2IyYS00MjQzLTg0MjgtMTdmZTUxMmQzNTU5IiwiZXhwIjoxNzU2MTMwODcwfQ.dF6-WMIEtcuajXtPghXotKTOgkd1J0oeJlaitM0hSak	\N	\N	2025-08-25 14:07:50.553+00	2025-08-18 14:07:50.553268+00	\N	t	2025-08-18 14:07:50.553268+00
68d50986-89cf-4a10-8ceb-d71024371d37	45ab32d7-4b37-42ff-bfce-b9217c573555	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NWFiMzJkNy00YjM3LTQyZmYtYmZjZS1iOTIxN2M1NzM1NTUiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDY5MjM3dDhqc2dwQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA3MSwianRpIjoiMjAxYzVjMzMtOTg5My00ZTdlLTk2NWQtM2IyYTJlM2Y3ZTExIiwiZXhwIjoxNzU1NTI2OTcxfQ.UwGQx193zZe-YSoI1sJs75K1KWyRzobqFacd_tHA5xY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NWFiMzJkNy00YjM3LTQyZmYtYmZjZS1iOTIxN2M1NzM1NTUiLCJpYXQiOjE3NTU1MjYwNzEsIm5vbmNlIjoiOWY1YTgyNTctNWNiMS00OTdiLWE4OTMtNTkzMGI5OTgxYWE3IiwidXNlcklkIjoiNDVhYjMyZDctNGIzNy00MmZmLWJmY2UtYjkyMTdjNTczNTU1IiwiZXhwIjoxNzU2MTMwODcxfQ.xIKa1tcurydOBBuWdFlzNTvZ3Rk0hkFw2VVuPksNdXk	\N	\N	2025-08-25 14:07:51.249+00	2025-08-18 14:07:51.249714+00	\N	t	2025-08-18 14:07:51.249714+00
5951a313-9600-47d5-b26a-82cabddbfc8d	8456f295-87f1-4698-b7ca-ce61e699a710	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NDU2ZjI5NS04N2YxLTQ2OTgtYjdjYS1jZTYxZTY5OWE3MTAiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDg3OTAxZjNlcG1tQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA4OSwianRpIjoiZDFkMjdmNWEtYjliYi00NDc2LWI4OWItODY2MGMzNmVmYTEzIiwiZXhwIjoxNzU1NTI2OTg5fQ.EelO7Oy71pCHLwawp8PEzsxtddSjdHO0HYRg_kuJ1tQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4NDU2ZjI5NS04N2YxLTQ2OTgtYjdjYS1jZTYxZTY5OWE3MTAiLCJpYXQiOjE3NTU1MjYwODksIm5vbmNlIjoiYWEwMDY1NmYtMzk0Yy00ZjM1LWEyOWQtMWEzYzI0ZDkxNjNiIiwidXNlcklkIjoiODQ1NmYyOTUtODdmMS00Njk4LWI3Y2EtY2U2MWU2OTlhNzEwIiwiZXhwIjoxNzU2MTMwODg5fQ.tSN1rZeee0gAz2mcNy6E3IcnGGiGQjK6Ra2DZCGmIys	\N	\N	2025-08-25 14:08:09.158+00	2025-08-18 14:08:09.158375+00	\N	t	2025-08-18 14:08:09.158375+00
97ffd704-2209-429d-a0ff-4688348e2df1	ccab5091-dbc0-467b-adbb-3ab820014ec7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjY2FiNTA5MS1kYmMwLTQ2N2ItYWRiYi0zYWI4MjAwMTRlYzciLCJlbWFpbCI6InRlc3QxNzU1NTI2MDg5MDk4bmE5NXVoQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA4OSwianRpIjoiMTU0NjdjN2QtNzA4OS00OTExLWJlNGItMTUwYTI3YTI0MjQ0IiwiZXhwIjoxNzU1NTI2OTg5fQ.2DuB7auPT2m1zVYamAAt1fTFY4BPdxNiXZSyPl5xnh8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjY2FiNTA5MS1kYmMwLTQ2N2ItYWRiYi0zYWI4MjAwMTRlYzciLCJpYXQiOjE3NTU1MjYwODksIm5vbmNlIjoiNmVkNmIwZjgtMGVkMS00OTBmLTlmMzktMDY3Nzk5NmUzYmMzIiwidXNlcklkIjoiY2NhYjUwOTEtZGJjMC00NjdiLWFkYmItM2FiODIwMDE0ZWM3IiwiZXhwIjoxNzU2MTMwODg5fQ.fo_1oU71Lt7-urdlc273ceMHak8xOdsGbbJoU7T3VW0	\N	\N	2025-08-25 14:08:09.179+00	2025-08-18 14:08:09.180241+00	\N	t	2025-08-18 14:08:09.180241+00
632e4680-abcf-4a59-a371-3d8c87e32e6f	8e9d2466-fde3-4017-9fb2-5f1e9d40f206	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTlkMjQ2Ni1mZGUzLTQwMTctOWZiMi01ZjFlOWQ0MGYyMDYiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDg5Mzg0YXVrdTJiQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjA5MCwianRpIjoiM2YxMWYwZmYtODM3ZC00OWY5LTllNDUtMzk5Y2M4Yzk3NWNiIiwiZXhwIjoxNzU1NTI2OTkwfQ.CkBPGRVWDhDWf38SvTFhExsTbT4ZaVcwrhemlMdInOI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4ZTlkMjQ2Ni1mZGUzLTQwMTctOWZiMi01ZjFlOWQ0MGYyMDYiLCJpYXQiOjE3NTU1MjYwOTAsIm5vbmNlIjoiMzg2NTk5NDItNmI2Yi00N2UwLWE4N2YtYzg2OGUyN2NmYjQ3IiwidXNlcklkIjoiOGU5ZDI0NjYtZmRlMy00MDE3LTlmYjItNWYxZTlkNDBmMjA2IiwiZXhwIjoxNzU2MTMwODkwfQ.rN3fNs-jsP1GFwWnxSD-TW5yswEXHzjay6UUxf8COfY	\N	\N	2025-08-25 14:08:10.634+00	2025-08-18 14:08:10.63484+00	\N	t	2025-08-18 14:08:10.63484+00
53363766-7ef7-4e2c-87ef-96610c585d6f	3a6e99c9-5153-4e10-a649-144e523552fe	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYTZlOTljOS01MTUzLTRlMTAtYTY0OS0xNDRlNTIzNTUyZmUiLCJlbWFpbCI6InRlc3QxNzU1NTI2MDk0NTU0MDZtdmp5QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjEwMCwianRpIjoiYmFlMjU4YzktYWExMi00NTViLTg3YjktYjdhMzhkNGFiNjgyIiwiZXhwIjoxNzU1NTI3MDAwfQ.6PMX2zK4pwJvuaK5px-_yvVYghNWKO8UAGTev6noIqQ	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYTZlOTljOS01MTUzLTRlMTAtYTY0OS0xNDRlNTIzNTUyZmUiLCJpYXQiOjE3NTU1MjYxMDAsIm5vbmNlIjoiZDgwMzViMTUtNWE2Ni00MDQzLWIxZjYtNmZjMzk2MTA2OTA5IiwidXNlcklkIjoiM2E2ZTk5YzktNTE1My00ZTEwLWE2NDktMTQ0ZTUyMzU1MmZlIiwiZXhwIjoxNzU2MTMwOTAwfQ.TwHt3ZecxIgKNNYEsBkMPqUiYP0TZNRUBJk7L4b_A5A	\N	\N	2025-08-25 14:08:20.968+00	2025-08-18 14:08:20.968755+00	\N	t	2025-08-18 14:08:20.968755+00
38e59c52-6935-4c23-a927-369898a3b7ee	e56ab44a-e2e1-4d8f-b2ed-5d850926e0e6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTZhYjQ0YS1lMmUxLTRkOGYtYjJlZC01ZDg1MDkyNmUwZTYiLCJlbWFpbCI6InRlc3QxNzU1NTI2MTA3ODQ5cThldzNnQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjEwNywianRpIjoiOGRhYmEwOTUtYTIzNy00YTZmLTlkYWEtNDAwM2MwNDRiYzM5IiwiZXhwIjoxNzU1NTI3MDA3fQ.y9E8x7WgHK3_a82Us2jhYOeojng6Q05A6-sskwCKKLY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNTZhYjQ0YS1lMmUxLTRkOGYtYjJlZC01ZDg1MDkyNmUwZTYiLCJpYXQiOjE3NTU1MjYxMDcsIm5vbmNlIjoiZjUxOWM4M2ItZGIzNC00ZjRlLThlNDUtYjY5ZDQ4Nzg1ZGYwIiwidXNlcklkIjoiZTU2YWI0NGEtZTJlMS00ZDhmLWIyZWQtNWQ4NTA5MjZlMGU2IiwiZXhwIjoxNzU2MTMwOTA3fQ.YGXmLzhKLg9XxxBSRQJIENGOQP8TCCEUKM7nh5Xspts	\N	\N	2025-08-25 14:08:27.937+00	2025-08-18 14:08:27.937375+00	\N	t	2025-08-18 14:08:27.937375+00
c00b2993-a279-4c59-b48a-5785df47c596	a0f8b020-150b-4331-970a-d3940772e945	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMGY4YjAyMC0xNTBiLTQzMzEtOTcwYS1kMzk0MDc3MmU5NDUiLCJlbWFpbCI6InRlc3QxNzU1NTI2MTA2MjEwZHhoMnR2QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjEwNywianRpIjoiZjFmYmZlMzUtNTE3OC00ZDdiLTk5ZjYtYzE4OWY2ZmJjYjZlIiwiZXhwIjoxNzU1NTI3MDA3fQ.l4kjsMRgQXRIF7XKB2pTYafv1HYKQEGksAdcJTAhatk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMGY4YjAyMC0xNTBiLTQzMzEtOTcwYS1kMzk0MDc3MmU5NDUiLCJpYXQiOjE3NTU1MjYxMDcsIm5vbmNlIjoiNTY4MzFiYjUtMDk1Ni00ZTZjLWJlMGYtMWJhOGFkNzI1NmFiIiwidXNlcklkIjoiYTBmOGIwMjAtMTUwYi00MzMxLTk3MGEtZDM5NDA3NzJlOTQ1IiwiZXhwIjoxNzU2MTMwOTA3fQ.fdZf5Ss8tjLy9ixmw6m8gEBLM7zSRlKXmFmH208kwMM	\N	\N	2025-08-25 14:08:27.973+00	2025-08-18 14:08:27.973522+00	\N	t	2025-08-18 14:08:27.973522+00
3e1fd734-728b-412c-b65e-3aa54566735a	d1773c89-2e75-46a9-b775-0986ab2b4cc6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMTc3M2M4OS0yZTc1LTQ2YTktYjc3NS0wOTg2YWIyYjRjYzYiLCJlbWFpbCI6InRlc3QxNzU1NTI2MTA4NDExMDZsanM5QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjExMCwianRpIjoiMjQ3MDk0MjMtM2Y1My00ZjE1LWE4YmYtZmJiZjUwOWEyOGQ3IiwiZXhwIjoxNzU1NTI3MDEwfQ.BR_LeWDzDMztkxXS7hYTd1R1xWZ4vssVz391-9qBn4A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkMTc3M2M4OS0yZTc1LTQ2YTktYjc3NS0wOTg2YWIyYjRjYzYiLCJpYXQiOjE3NTU1MjYxMTAsIm5vbmNlIjoiNjBhNjFmMzMtMzMxZC00NDY2LTgyYjYtNjlmOGNjNWI5MzY5IiwidXNlcklkIjoiZDE3NzNjODktMmU3NS00NmE5LWI3NzUtMDk4NmFiMmI0Y2M2IiwiZXhwIjoxNzU2MTMwOTEwfQ.jLKKBAcZIvNLVlpKQVddciKBDhlEqAROzwOdczyFT_E	\N	\N	2025-08-25 14:08:30.25+00	2025-08-18 14:08:30.25075+00	\N	t	2025-08-18 14:08:30.25075+00
8010d279-5636-46ca-a845-0bd14c8f64aa	1454252c-773b-4536-9318-343286f1022e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDU0MjUyYy03NzNiLTQ1MzYtOTMxOC0zNDMyODZmMTAyMmUiLCJlbWFpbCI6InRlc3QxMjNAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1MjYxNDgsImp0aSI6IjYzZjlmM2QwLTEyNzUtNGQzOC05NDg2LWNkN2VmMDQyNzg1NyIsImV4cCI6MTc1NTUyNzA0OH0.Q844G6dDVTJLZF8xtlvXI24Eq25PdHT4EqVWW8qrscU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNDU0MjUyYy03NzNiLTQ1MzYtOTMxOC0zNDMyODZmMTAyMmUiLCJpYXQiOjE3NTU1MjYxNDgsIm5vbmNlIjoiN2NhNGNkMjEtYTA1Yy00NzNjLTg1NGMtYWExYTEwYWM2ZDA3IiwidXNlcklkIjoiMTQ1NDI1MmMtNzczYi00NTM2LTkzMTgtMzQzMjg2ZjEwMjJlIiwiZXhwIjoxNzU2MTMwOTQ4fQ.nkQd6MHzuv8ab8X3GTGHUcfmIv3e3fe_wbtTZGm9vcw	\N	\N	2025-08-25 14:09:08.145+00	2025-08-18 14:09:08.146453+00	\N	t	2025-08-18 14:09:08.146453+00
b15a409c-f0a4-4223-9841-c5b406369832	429e1428-b21d-4cc8-a365-bb3e5987bedc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MjllMTQyOC1iMjFkLTRjYzgtYTM2NS1iYjNlNTk4N2JlZGMiLCJlbWFpbCI6InRlc3QxNzU1NTI2MTk4NTM0Y3YwOHBpQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjE5OSwianRpIjoiY2ZhMzFlNGEtZWUzMi00YTg5LTgxNjMtYmY0Mjg4NTM5MzhmIiwiZXhwIjoxNzU1NTI3MDk5fQ.YiIJ9399_MX-GGI-KwjgrbYkUeDIUTq4VKdyy7UUuxs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MjllMTQyOC1iMjFkLTRjYzgtYTM2NS1iYjNlNTk4N2JlZGMiLCJpYXQiOjE3NTU1MjYxOTksIm5vbmNlIjoiMDA4NTdlY2UtZmFiNy00Nzk4LWIzMmQtY2NlY2I4OWYzZTJlIiwidXNlcklkIjoiNDI5ZTE0MjgtYjIxZC00Y2M4LWEzNjUtYmIzZTU5ODdiZWRjIiwiZXhwIjoxNzU2MTMwOTk5fQ.MkhAkth0SkZs2-p9SAZzLnSQCz8nwe-CblIpLt7rPMs	\N	\N	2025-08-25 14:09:59.809+00	2025-08-18 14:09:59.809698+00	\N	t	2025-08-18 14:09:59.809698+00
bc7e1d7b-6224-4ea5-bde9-cb1ffe8659ea	40726093-db96-4392-94e8-bd87b362db84	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MDcyNjA5My1kYjk2LTQzOTItOTRlOC1iZDg3YjM2MmRiODQiLCJlbWFpbCI6InRlc3QxNzU1NTI2MjMwMjEzN3V4dTlvQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjIzMSwianRpIjoiMTJhNGRjYTItMDc0Yi00ZmQ2LWI4MmYtOTAyNmQyNjUzZTVkIiwiZXhwIjoxNzU1NTI3MTMxfQ.YmnyMfeaMZ_Wkt0JCGuveYY9AHrOikleRnzaCs0HIso	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MDcyNjA5My1kYjk2LTQzOTItOTRlOC1iZDg3YjM2MmRiODQiLCJpYXQiOjE3NTU1MjYyMzEsIm5vbmNlIjoiMTU4NjQ3MDAtNGJiMi00YzI1LWJjMTYtMDRmYTNlNmQ3ZDA2IiwidXNlcklkIjoiNDA3MjYwOTMtZGI5Ni00MzkyLTk0ZTgtYmQ4N2IzNjJkYjg0IiwiZXhwIjoxNzU2MTMxMDMxfQ.kAlc2OtZmn9st17axVGeNlJ8HM9MhLOvKKuYjj8N9Ig	\N	\N	2025-08-25 14:10:31.437+00	2025-08-18 14:10:31.438005+00	\N	t	2025-08-18 14:10:31.438005+00
90520836-453a-415e-9544-bcbfc83746ae	c1de923e-0e06-454a-996b-3cf1b6d17620	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMWRlOTIzZS0wZTA2LTQ1NGEtOTk2Yi0zY2YxYjZkMTc2MjAiLCJlbWFpbCI6Imdlc3Rpb24xQGxvY29kLWFpLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjM0NCwianRpIjoiMDJkODdkZTctZDVmMy00ZjQ1LTg4OGUtNGVhZGI2MGZhODNiIiwiZXhwIjoxNzU1NTI3MjQ0fQ.L73Xd3szWWx5PJwjNTrdUbt9PmFhto_eP_9mPAkRBZw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMWRlOTIzZS0wZTA2LTQ1NGEtOTk2Yi0zY2YxYjZkMTc2MjAiLCJpYXQiOjE3NTU1MjYzNDQsIm5vbmNlIjoiZDFlYmQwMDQtN2E5OC00YzJiLTgyOGUtMjZlZWY1YmQ5OTNmIiwidXNlcklkIjoiYzFkZTkyM2UtMGUwNi00NTRhLTk5NmItM2NmMWI2ZDE3NjIwIiwiZXhwIjoxNzU2MTMxMTQ0fQ.IoRUEKp0x4wuCwH283Vj_27tnOGK5mCIZO2g_FCTsc4	\N	\N	2025-08-25 14:12:24.733+00	2025-08-18 14:12:24.734384+00	\N	t	2025-08-18 14:12:24.734384+00
c28b9bb8-049c-4edc-b698-b3a82ae568d4	9c7f1dac-cd26-4f05-9515-e89350db4abd	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YzdmMWRhYy1jZDI2LTRmMDUtOTUxNS1lODkzNTBkYjRhYmQiLCJlbWFpbCI6Im1vY2hlcmthMUBnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1MjYzODAsImp0aSI6IjIzOTUzYTVmLTM3MDYtNDg0MS1iMTAwLTI3ZjRhYjBmYjA4MiIsImV4cCI6MTc1NTUyNzI4MH0.tOmh1lhUKbR1fi-9v-BLYwTVbgNY-X9lpDi7IG3ErgE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5YzdmMWRhYy1jZDI2LTRmMDUtOTUxNS1lODkzNTBkYjRhYmQiLCJpYXQiOjE3NTU1MjYzODAsIm5vbmNlIjoiNTgyNzc1ZjgtZTgwMi00ZDdkLWE4MDYtMzUxODBmMTQ5MmU5IiwidXNlcklkIjoiOWM3ZjFkYWMtY2QyNi00ZjA1LTk1MTUtZTg5MzUwZGI0YWJkIiwiZXhwIjoxNzU2MTMxMTgwfQ.2AVOCjvQOtIRHuAU2LUJhSnCDOjmZkNFwORQsIYjS0M	\N	\N	2025-08-25 14:13:00.239+00	2025-08-18 14:13:00.21102+00	\N	t	2025-08-18 14:13:00.21102+00
96bbaa58-3cbe-44d7-940d-95adb5aacc1c	22db1b76-9a7d-4b95-998e-0733b4f71d7c	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMmRiMWI3Ni05YTdkLTRiOTUtOTk4ZS0wNzMzYjRmNzFkN2MiLCJlbWFpbCI6Im1vY2hlcmthM0BnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1MjY0MTAsImp0aSI6ImFmMWFjYjcwLTVlOWQtNDU3Ny04MzFjLWMxMGJhNTJkOTkzMiIsImV4cCI6MTc1NTUyNzMxMH0.BZpNkvupFM6J0sem-q_2B0nZt-bIyqjRZXXkixASxAU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMmRiMWI3Ni05YTdkLTRiOTUtOTk4ZS0wNzMzYjRmNzFkN2MiLCJpYXQiOjE3NTU1MjY0MTAsIm5vbmNlIjoiYTE4OTU4NGQtYzkxZS00MDFkLWFhNWYtOGJkYWYxNzYyZWJiIiwidXNlcklkIjoiMjJkYjFiNzYtOWE3ZC00Yjk1LTk5OGUtMDczM2I0ZjcxZDdjIiwiZXhwIjoxNzU2MTMxMjEwfQ.a5I49N9pFhLlswpaSdaS2rnLj_sJq5YdWebBrNoDuv4	\N	\N	2025-08-25 14:13:30.957+00	2025-08-18 14:13:30.957642+00	\N	t	2025-08-18 14:13:30.957642+00
f3775437-6da3-45e8-a550-f2d5c7c663c5	2184df7d-cfc0-4ef7-813e-3631458ce376	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMTg0ZGY3ZC1jZmMwLTRlZjctODEzZS0zNjMxNDU4Y2UzNzYiLCJlbWFpbCI6InRlc3QuMTc1NTUyNjkxOTMwNUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjkxOSwianRpIjoiOGI0NWNlMjgtNjdlOS00Zjc0LWI5NWEtZGU4MjMyYTg3MTg0IiwiZXhwIjoxNzU1NTI3ODE5fQ.DAKrF6OYqFyCYUP0CoPDWVBandQ7eWopOPIv4BC0Iiw	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMTg0ZGY3ZC1jZmMwLTRlZjctODEzZS0zNjMxNDU4Y2UzNzYiLCJpYXQiOjE3NTU1MjY5MTksIm5vbmNlIjoiYTFkMTQwZGYtZmNjYy00MDAwLWIxNjUtMjVhMjNjYWM4M2Y5IiwidXNlcklkIjoiMjE4NGRmN2QtY2ZjMC00ZWY3LTgxM2UtMzYzMTQ1OGNlMzc2IiwiZXhwIjoxNzU2MTMxNzE5fQ.bSRryijf_nfR5uC7y1uWmnr9uigx0kVrV7rsZhzwUYE	\N	\N	2025-08-25 14:21:59.429+00	2025-08-18 14:21:59.430066+00	\N	t	2025-08-18 14:21:59.430066+00
410324bc-a219-4954-9389-5f658a8419a2	5ae6c1d3-7bd9-4832-ad58-8ea01b73b2eb	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YWU2YzFkMy03YmQ5LTQ4MzItYWQ1OC04ZWEwMWI3M2IyZWIiLCJlbWFpbCI6ImR1cGxpY2F0ZUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjkxOSwianRpIjoiZjAzODkxZDAtZGMyZC00YTRlLTg2MmYtNzM1ZmJjM2QxOGUzIiwiZXhwIjoxNzU1NTI3ODE5fQ.jHAt_zTbNLK-cau4nNecI7jxfEVP5Q6NmujeWzBpIwc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YWU2YzFkMy03YmQ5LTQ4MzItYWQ1OC04ZWEwMWI3M2IyZWIiLCJpYXQiOjE3NTU1MjY5MTksIm5vbmNlIjoiZjFlODA4ODgtYWFlNC00OTg4LWEzMTQtMjNiODhlYzczNTg4IiwidXNlcklkIjoiNWFlNmMxZDMtN2JkOS00ODMyLWFkNTgtOGVhMDFiNzNiMmViIiwiZXhwIjoxNzU2MTMxNzE5fQ.0IZD-xF5uvBNsrvkeJ6Zy7ECWW-SOnAfipiBLqzCgj4	\N	\N	2025-08-25 14:21:59.57+00	2025-08-18 14:21:59.57205+00	\N	t	2025-08-18 14:21:59.57205+00
3d9d1bba-6c67-4081-9923-5c0e53163887	16f52476-f0f9-4bc3-9b1a-9847e49c1fa6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNmY1MjQ3Ni1mMGY5LTRiYzMtOWIxYS05ODQ3ZTQ5YzFmYTYiLCJlbWFpbCI6InRlc3QuMTc1NTUyNjkzODI0MkBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNjkzOCwianRpIjoiMTZhYWIwYzctOWI5ZC00NjVhLTlmMjEtNTE1NzJkNjg3OWU0IiwiZXhwIjoxNzU1NTI3ODM4fQ.NXlWttcePdnXUD-1efZ3DkrrY2pcN_6_NqPYZa3QsyE	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNmY1MjQ3Ni1mMGY5LTRiYzMtOWIxYS05ODQ3ZTQ5YzFmYTYiLCJpYXQiOjE3NTU1MjY5MzgsIm5vbmNlIjoiYzI1M2U3MjUtZjkzZC00YjgzLTk4NGQtZThlOGQwNDY2MTMwIiwidXNlcklkIjoiMTZmNTI0NzYtZjBmOS00YmMzLTliMWEtOTg0N2U0OWMxZmE2IiwiZXhwIjoxNzU2MTMxNzM4fQ.5tuPB-5PMw1g67c4Jdjoo3M-OVlFheTPVX5iMbx5hBQ	\N	\N	2025-08-25 14:22:18.357+00	2025-08-18 14:22:18.358367+00	\N	t	2025-08-18 14:22:18.358367+00
8e3d6ac4-fa34-4da2-bc45-b6a2b35f9206	16c462ae-94cd-4090-b021-43232ad80eb8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNmM0NjJhZS05NGNkLTQwOTAtYjAyMS00MzIzMmFkODBlYjgiLCJlbWFpbCI6ImUyZS4xNzU1NTI2OTM5NjU1QGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI2OTQwLCJqdGkiOiIyZDg3NTRkYi02NmQ4LTQxM2YtOGJiYi1hMjJmMjcwOTU3ZjMiLCJleHAiOjE3NTU1Mjc4NDB9.q-3ghSWjTNXevxGqiwxlsTK3ugHwYo9SjL5hcgi-K3A	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNmM0NjJhZS05NGNkLTQwOTAtYjAyMS00MzIzMmFkODBlYjgiLCJpYXQiOjE3NTU1MjY5NDAsIm5vbmNlIjoiNjFhYzdmOTYtNTViZS00ZjBlLWJiODgtNTBhYTkxNzc5NDAwIiwidXNlcklkIjoiMTZjNDYyYWUtOTRjZC00MDkwLWIwMjEtNDMyMzJhZDgwZWI4IiwiZXhwIjoxNzU2MTMxNzQwfQ.3xlyTK1MO21Rs0xWyzMtsVOEYI_eqK12e_pqqBs3nHk	\N	\N	2025-08-25 14:22:20.034+00	2025-08-18 14:22:20.035244+00	\N	t	2025-08-18 14:22:20.035244+00
b0a143a1-8910-4a20-b907-e774e8d7a88a	1e70c1c4-4a71-46db-a03c-21c2237ca8ef	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZTcwYzFjNC00YTcxLTQ2ZGItYTAzYy0yMWMyMjM3Y2E4ZWYiLCJlbWFpbCI6ImNvbmN1cnJlbnQuMi4xNzU1NTI2OTUwMDAwQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI2OTUwLCJqdGkiOiI4MjQxODYyMi1jYTM2LTQyYjEtYTYxMS0xMjk3MzFkZTQ3MDUiLCJleHAiOjE3NTU1Mjc4NTB9.Z_UxtLl5W74lXeLnOC8ZTQ3p2lamgK_SIWym4a6OBd4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxZTcwYzFjNC00YTcxLTQ2ZGItYTAzYy0yMWMyMjM3Y2E4ZWYiLCJpYXQiOjE3NTU1MjY5NTAsIm5vbmNlIjoiMmYxYTI5ZDgtYmZiNC00MDJmLWJkYzAtOGY5OTU2YjI1NDFkIiwidXNlcklkIjoiMWU3MGMxYzQtNGE3MS00NmRiLWEwM2MtMjFjMjIzN2NhOGVmIiwiZXhwIjoxNzU2MTMxNzUwfQ.qQFf5G1UIMvOXxg97Y3myOMEdTDW7mgLhyhy7nmDIsE	\N	\N	2025-08-25 14:22:30.159+00	2025-08-18 14:22:30.159559+00	\N	t	2025-08-18 14:22:30.159559+00
2c5596a0-65a1-4e47-8dcb-b2bf497111cc	7ccb2e7f-a887-480b-b754-36a7b2045730	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3Y2NiMmU3Zi1hODg3LTQ4MGItYjc1NC0zNmE3YjIwNDU3MzAiLCJlbWFpbCI6ImNvbmN1cnJlbnQuMC4xNzU1NTI2OTQ5OTk1QGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI2OTUwLCJqdGkiOiIwYzdiOGFhZS1iYzAxLTQyOTgtYmQzOS00YWZhOTU2YjE0YzIiLCJleHAiOjE3NTU1Mjc4NTB9.sVhmj_vYYQVOVSVxrkPzE1PDgIPs_I3tNUDeuUkI8m8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3Y2NiMmU3Zi1hODg3LTQ4MGItYjc1NC0zNmE3YjIwNDU3MzAiLCJpYXQiOjE3NTU1MjY5NTAsIm5vbmNlIjoiOWM3ZWE5ZTQtMTRmOC00NTVmLWE2NTMtMDk1YzA1MDQwZDljIiwidXNlcklkIjoiN2NjYjJlN2YtYTg4Ny00ODBiLWI3NTQtMzZhN2IyMDQ1NzMwIiwiZXhwIjoxNzU2MTMxNzUwfQ.oCRpCFTvHTjJhGS9f29VQ9dZFsJdCXqB-zazJxJYXAk	\N	\N	2025-08-25 14:22:30.16+00	2025-08-18 14:22:30.160911+00	\N	t	2025-08-18 14:22:30.160911+00
32b99740-2a35-493d-b809-3434fe5f2c64	ed03f736-5589-49e9-bf4d-35c5ec5a4450	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZDAzZjczNi01NTg5LTQ5ZTktYmY0ZC0zNWM1ZWM1YTQ0NTAiLCJlbWFpbCI6ImNvbmN1cnJlbnQuMS4xNzU1NTI2OTQ5OTk4QGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI2OTUwLCJqdGkiOiI2MGY2M2QzNC0zMzQ3LTQ2YWQtYjliOC04OWI0YzlmZWFiYWYiLCJleHAiOjE3NTU1Mjc4NTB9.vnEQ8K_5IAsyllSLnKQgyTAd-0EFVnKfQd232ULvrSo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZDAzZjczNi01NTg5LTQ5ZTktYmY0ZC0zNWM1ZWM1YTQ0NTAiLCJpYXQiOjE3NTU1MjY5NTAsIm5vbmNlIjoiMTkwMTljN2QtZGFiYy00YzI1LTg3NjktYTU5NDc5M2EzNjdlIiwidXNlcklkIjoiZWQwM2Y3MzYtNTU4OS00OWU5LWJmNGQtMzVjNWVjNWE0NDUwIiwiZXhwIjoxNzU2MTMxNzUwfQ.ob56ia-iGs7CFY46ePKsUblpbIG_2RqxBJvDQSYf1HA	\N	\N	2025-08-25 14:22:30.169+00	2025-08-18 14:22:30.169829+00	\N	t	2025-08-18 14:22:30.169829+00
10fa84bb-6f91-43d7-b073-43fb2b8a81c7	272bf142-8701-4072-8d46-bbb5bb408fac	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzJiZjE0Mi04NzAxLTQwNzItOGQ0Ni1iYmI1YmI0MDhmYWMiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI3MjAxLCJqdGkiOiI0OTQ1MmQxNS0yY2Q1LTQ5ZjMtODg3NC1kNDA4OTgwZWUzYTAiLCJleHAiOjE3NTU1MjgxMDF9.qIwi7nH-bhfgMPwMe1yaA5hwQ_pEyBCsD19QMHH0ePI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNzJiZjE0Mi04NzAxLTQwNzItOGQ0Ni1iYmI1YmI0MDhmYWMiLCJpYXQiOjE3NTU1MjcyMDEsIm5vbmNlIjoiMzAzNjM4ODEtNmI2Yy00Y2Y1LTlhMmQtNDM5YzA3NWY1Mjc5IiwidXNlcklkIjoiMjcyYmYxNDItODcwMS00MDcyLThkNDYtYmJiNWJiNDA4ZmFjIiwiZXhwIjoxNzU2MTMyMDAxfQ.HRJ3OfwuUqf7bWiW9OA62SHxbw9F43lXa6YZH4v12Rg	\N	\N	2025-08-25 14:26:41.996+00	2025-08-18 14:26:41.998102+00	\N	t	2025-08-18 14:26:41.998102+00
9da92034-9647-494e-aa2c-3a15408a324c	4584948e-c0c9-494c-ae18-39aab60c9399	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTg0OTQ4ZS1jMGM5LTQ5NGMtYWUxOC0zOWFhYjYwYzkzOTkiLCJlbWFpbCI6InRlc3R1c2VyMUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNzI3OSwianRpIjoiZGQyYzZhNmEtNDcyYS00ZmU3LWE1OTQtMzU5NjYxYzE2NTRlIiwiZXhwIjoxNzU1NTI4MTc5fQ.L62B97G0LrWB7zaOk0jhAmY3ZlZ0d56q-l4-3I9jnTA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NTg0OTQ4ZS1jMGM5LTQ5NGMtYWUxOC0zOWFhYjYwYzkzOTkiLCJpYXQiOjE3NTU1MjcyNzksIm5vbmNlIjoiZjBjNDk4NTAtYzlkNC00OGU2LTg0MTItYjBlNWFkYmE5OTZjIiwidXNlcklkIjoiNDU4NDk0OGUtYzBjOS00OTRjLWFlMTgtMzlhYWI2MGM5Mzk5IiwiZXhwIjoxNzU2MTMyMDc5fQ.t6jbkTelmf8XBUEq0Omn0Ea_GK1fJ2rf3eAat-iebbw	\N	\N	2025-08-25 14:27:59.031+00	2025-08-18 14:27:59.031994+00	\N	t	2025-08-18 14:27:59.031994+00
878ddb50-2534-4517-8348-9bc6d2cdf0be	a96b35fd-7e0e-4e0c-a951-29808953097a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOTZiMzVmZC03ZTBlLTRlMGMtYTk1MS0yOTgwODk1MzA5N2EiLCJlbWFpbCI6InRlc3R1c2VyMkBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNzI3OSwianRpIjoiNmMwYjNkYjItZmIxMS00OGYwLWI4YjEtMGU2ODkwMzk2YWM5IiwiZXhwIjoxNzU1NTI4MTc5fQ.2l8v8CGCYER_VyIlx0Fugg83lsB2NYErjJI_DmuJvio	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhOTZiMzVmZC03ZTBlLTRlMGMtYTk1MS0yOTgwODk1MzA5N2EiLCJpYXQiOjE3NTU1MjcyNzksIm5vbmNlIjoiM2UwZDYzMzQtYmM0NS00MzNlLTgyZGEtM2IyZjE0MDQwMzQzIiwidXNlcklkIjoiYTk2YjM1ZmQtN2UwZS00ZTBjLWE5NTEtMjk4MDg5NTMwOTdhIiwiZXhwIjoxNzU2MTMyMDc5fQ.vmOFBEtQRcOa6k2m0L_H5Y57hMyi_It82njWUw3CH10	\N	\N	2025-08-25 14:27:59.228+00	2025-08-18 14:27:59.228403+00	\N	t	2025-08-18 14:27:59.228403+00
bd912fbd-de28-418d-b570-aef6d6c91a5d	c2d0e805-9d29-4af4-b875-ee7ebc6266d6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMmQwZTgwNS05ZDI5LTRhZjQtYjg3NS1lZTdlYmM2MjY2ZDYiLCJlbWFpbCI6InRlc3R1c2VyM0BleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNzI3OSwianRpIjoiMzgwMTMwMTktZmUyNy00YzU2LTg4Y2ItMjJiYzE5OGJmZDUwIiwiZXhwIjoxNzU1NTI4MTc5fQ.2PNWEQzgrLHJ2xgxXcZCmq40QcQ6VlO-LSKFaBgKmOo	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjMmQwZTgwNS05ZDI5LTRhZjQtYjg3NS1lZTdlYmM2MjY2ZDYiLCJpYXQiOjE3NTU1MjcyNzksIm5vbmNlIjoiMmI4ZjdlM2EtYTc4NS00MjlmLWJhNDktNjZhNjgyMDhlZjRjIiwidXNlcklkIjoiYzJkMGU4MDUtOWQyOS00YWY0LWI4NzUtZWU3ZWJjNjI2NmQ2IiwiZXhwIjoxNzU2MTMyMDc5fQ.6gwlS-Hokw424uUlcUwN0YyoXBSs2M4sqW3w5k-1vc8	\N	\N	2025-08-25 14:27:59.444+00	2025-08-18 14:27:59.444632+00	\N	t	2025-08-18 14:27:59.444632+00
92b625a8-8533-4f2f-aff5-0633a91e8719	5d5818c0-470c-48e3-bd60-766393cac62d	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZDU4MThjMC00NzBjLTQ4ZTMtYmQ2MC03NjYzOTNjYWM2MmQiLCJlbWFpbCI6InRlc3R1c2VyNEBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNzI3OSwianRpIjoiZjk2N2ViNzktMDY5My00Yzg5LWI2YTgtNjgzNDNlZTcxZmZmIiwiZXhwIjoxNzU1NTI4MTc5fQ.G0ZlV8Le_ScdxCfNhJ69YIIvAEhK_rJlQxyJ3IVDd84	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1ZDU4MThjMC00NzBjLTQ4ZTMtYmQ2MC03NjYzOTNjYWM2MmQiLCJpYXQiOjE3NTU1MjcyNzksIm5vbmNlIjoiYzFlNTQwYTQtOTUyOS00OTAwLTlhNzEtYzQyN2Q4ZWY4OThkIiwidXNlcklkIjoiNWQ1ODE4YzAtNDcwYy00OGUzLWJkNjAtNzY2MzkzY2FjNjJkIiwiZXhwIjoxNzU2MTMyMDc5fQ.vl4h8lu6kU0_D2XSt0adCxirx8kJ0axvzO34LV7Xq4o	\N	\N	2025-08-25 14:27:59.64+00	2025-08-18 14:27:59.641242+00	\N	t	2025-08-18 14:27:59.641242+00
1b9517fa-a678-4376-a1b9-64fb37b2bf93	695f2692-22a8-4795-9c11-70c23de2aaf7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTVmMjY5Mi0yMmE4LTQ3OTUtOWMxMS03MGMyM2RlMmFhZjciLCJlbWFpbCI6InRlc3R1c2VyNUBleGFtcGxlLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNzI3OSwianRpIjoiNGIwNTI5MGMtMTMyYS00YWM2LThiNWYtOWYzZjM5NDljYzBiIiwiZXhwIjoxNzU1NTI4MTc5fQ.cmUhOu5m4LEPDYF7JZCWW97Wva17ekYBDc_AlNF3SjU	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTVmMjY5Mi0yMmE4LTQ3OTUtOWMxMS03MGMyM2RlMmFhZjciLCJpYXQiOjE3NTU1MjcyNzksIm5vbmNlIjoiOGU3ZGExMDQtYWQ0YS00YmMzLTg5YzMtZTU4MGFlNGMxZWUyIiwidXNlcklkIjoiNjk1ZjI2OTItMjJhOC00Nzk1LTljMTEtNzBjMjNkZTJhYWY3IiwiZXhwIjoxNzU2MTMyMDc5fQ.Kk9lrI_sKmis9P_3rFL8saW2p5wjw-SjoacSAwXkMT4	\N	\N	2025-08-25 14:27:59.835+00	2025-08-18 14:27:59.836264+00	\N	t	2025-08-18 14:27:59.836264+00
419b2e96-f5c8-4694-8811-41ad4847f804	cfdf6c77-29ec-4744-8812-87472ce2cf4e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZmRmNmM3Ny0yOWVjLTQ3NDQtODgxMi04NzQ3MmNlMmNmNGUiLCJlbWFpbCI6InRlc3RmaXgxNzU1NTI3NTMyQGV4YW1wbGUuY29tIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzU1NTI3NTMyLCJqdGkiOiJjYzc1N2FlZi1hNjcyLTQyMDUtYWE5OS05YzU5ZDAzMzA1ZjIiLCJleHAiOjE3NTU1Mjg0MzJ9.UPZ9rjJGuUVBPwpfCYcdcuwWHoN5LQDlZqUOn73zFAk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjZmRmNmM3Ny0yOWVjLTQ3NDQtODgxMi04NzQ3MmNlMmNmNGUiLCJpYXQiOjE3NTU1Mjc1MzIsIm5vbmNlIjoiMjcwZWRhNGUtNzA4My00MmI2LWIxMGUtOGU3ZWJhMWQ4NjZjIiwidXNlcklkIjoiY2ZkZjZjNzctMjllYy00NzQ0LTg4MTItODc0NzJjZTJjZjRlIiwiZXhwIjoxNzU2MTMyMzMyfQ.KiT_T3pznU7rVAkmTTluyTOnGCa2hafiUyuqHxyJyH4	\N	\N	2025-08-25 14:32:12.351+00	2025-08-18 14:32:12.35177+00	\N	t	2025-08-18 14:32:12.35177+00
83db3502-8db8-4fd1-a39a-6b4f65ac1b3c	8f86a663-fa59-49d2-950a-e523f4d5914a	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4Zjg2YTY2My1mYTU5LTQ5ZDItOTUwYS1lNTIzZjRkNTkxNGEiLCJlbWFpbCI6InRlc3R1c2VyMTE3NTU1Mjc1ODY4NDVAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1Mjc1ODYsImp0aSI6ImZjMzBjN2ZiLTU4ZWQtNGViYS1iMzc5LWViYTk5ZTdiMzI0OCIsImV4cCI6MTc1NTUyODQ4Nn0.PtQ5iPmrho5QK4RlgLRlJwLv_w5PN-V6p80eFfQFUQI	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4Zjg2YTY2My1mYTU5LTQ5ZDItOTUwYS1lNTIzZjRkNTkxNGEiLCJpYXQiOjE3NTU1Mjc1ODYsIm5vbmNlIjoiMjQ3NmZlZjMtODA3ZS00NmQxLWFhNGYtMmIxNTMyMDZmMjExIiwidXNlcklkIjoiOGY4NmE2NjMtZmE1OS00OWQyLTk1MGEtZTUyM2Y0ZDU5MTRhIiwiZXhwIjoxNzU2MTMyMzg2fQ.vMiZPUPh7eEGWDF5YVE-6omYIlF_79HQBARpgnt-01M	\N	\N	2025-08-25 14:33:06.954+00	2025-08-18 14:33:06.955109+00	\N	t	2025-08-18 14:33:06.955109+00
fd2bc98a-f36d-480c-bc72-19783e55907c	0e56747e-1a09-43d0-8593-02763e201de6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTU2NzQ3ZS0xYTA5LTQzZDAtODU5My0wMjc2M2UyMDFkZTYiLCJlbWFpbCI6InRlc3R1c2VyMjE3NTU1Mjc1ODc5NjRAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1Mjc1ODgsImp0aSI6IjIyNzYyZWM1LTUzYjAtNGRlMS04MzA2LTA3YWYxZTQyMjAzZiIsImV4cCI6MTc1NTUyODQ4OH0.zHMYpuzYBllHSxLL8aXqkXZUIfBPqvAF9qsSkIfGNmM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZTU2NzQ3ZS0xYTA5LTQzZDAtODU5My0wMjc2M2UyMDFkZTYiLCJpYXQiOjE3NTU1Mjc1ODgsIm5vbmNlIjoiNjI4MDlkZGUtM2I4Ny00ZTQ3LTljODItZTYyYjk5MGEyNjcyIiwidXNlcklkIjoiMGU1Njc0N2UtMWEwOS00M2QwLTg1OTMtMDI3NjNlMjAxZGU2IiwiZXhwIjoxNzU2MTMyMzg4fQ.CMesFUl-EgSLvkNCi01NWnpygNgecYKzaRglVMwn6Mw	\N	\N	2025-08-25 14:33:08.084+00	2025-08-18 14:33:08.085072+00	\N	t	2025-08-18 14:33:08.085072+00
b0e0b321-331f-4026-81ce-31b23a82d70b	22f49f5e-a6f4-497b-911b-9d0bfae91a5e	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMmY0OWY1ZS1hNmY0LTQ5N2ItOTExYi05ZDBiZmFlOTFhNWUiLCJlbWFpbCI6InRlc3R1c2VyMzE3NTU1Mjc1ODkwOTNAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1Mjc1ODksImp0aSI6IjEyMjg0NzRkLTRmOGEtNDgyMi1hNDg2LWVkMDExYzNiYzA1NSIsImV4cCI6MTc1NTUyODQ4OX0.hSrqZcZxjKOByHsI_HzC2qPCH3U5297TKIqvDqusKBY	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMmY0OWY1ZS1hNmY0LTQ5N2ItOTExYi05ZDBiZmFlOTFhNWUiLCJpYXQiOjE3NTU1Mjc1ODksIm5vbmNlIjoiODg0NjIzOWEtMDI4Zi00Y2M5LWExNDktZjAzMDRlZjM2OWVjIiwidXNlcklkIjoiMjJmNDlmNWUtYTZmNC00OTdiLTkxMWItOWQwYmZhZTkxYTVlIiwiZXhwIjoxNzU2MTMyMzg5fQ.38mFOCLsTGmKVHhOJDIja5PyXWaOTyLyNKJOWcFNs8w	\N	\N	2025-08-25 14:33:09.224+00	2025-08-18 14:33:09.224673+00	\N	t	2025-08-18 14:33:09.224673+00
3db70213-c371-46ee-bc2c-0c5f350f70cf	7028fb33-12e6-4ff0-b697-dc86d7d95772	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDI4ZmIzMy0xMmU2LTRmZjAtYjY5Ny1kYzg2ZDdkOTU3NzIiLCJlbWFpbCI6InRlc3R1c2VyNDE3NTU1Mjc1OTAyMjlAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1Mjc1OTAsImp0aSI6ImZkNzFhZDcwLTk0MWMtNDdjYi04YmE4LWE4ZjFiMzc3ZDgxZiIsImV4cCI6MTc1NTUyODQ5MH0.pUtOEt5K02DrAQY9F4t9MEVLUxlUWcSBlL1qPKhU9gM	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3MDI4ZmIzMy0xMmU2LTRmZjAtYjY5Ny1kYzg2ZDdkOTU3NzIiLCJpYXQiOjE3NTU1Mjc1OTAsIm5vbmNlIjoiOTBlMDVkYWItZjFkYS00ZGQ2LWFlYWQtMjI4YmFjMWRjMTQ5IiwidXNlcklkIjoiNzAyOGZiMzMtMTJlNi00ZmYwLWI2OTctZGM4NmQ3ZDk1NzcyIiwiZXhwIjoxNzU2MTMyMzkwfQ.BJLycgAn4GJP4-P-Kk71vhfOq8ML6ee4tk0SEeIBIR4	\N	\N	2025-08-25 14:33:10.344+00	2025-08-18 14:33:10.345158+00	\N	t	2025-08-18 14:33:10.345158+00
e0b21126-5c22-4431-a482-338943595642	c888c057-89b6-4abf-b9c9-68ef24a52d17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODg4YzA1Ny04OWI2LTRhYmYtYjljOS02OGVmMjRhNTJkMTciLCJlbWFpbCI6InRlc3R1c2VyNTE3NTU1Mjc1OTEzNTNAZXhhbXBsZS5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1Mjc1OTEsImp0aSI6IjZjZmQzYjQ1LWEwY2ItNGU4OC04NmI1LTc5OTc2NWQzOGUwOSIsImV4cCI6MTc1NTUyODQ5MX0.6UdABl6qXqWsMrlCqMOFXccfL7eI85uGE0sTUUXuoIg	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODg4YzA1Ny04OWI2LTRhYmYtYjljOS02OGVmMjRhNTJkMTciLCJpYXQiOjE3NTU1Mjc1OTEsIm5vbmNlIjoiYWQ0Yjg0ZGUtODFjYS00M2U5LWJhZjgtZWFlMmJlZGNjYjAyIiwidXNlcklkIjoiYzg4OGMwNTctODliNi00YWJmLWI5YzktNjhlZjI0YTUyZDE3IiwiZXhwIjoxNzU2MTMyMzkxfQ.8fmJTcMtd05rIAsHmv6VYs9WXuRW0wafw-_C2vjMpgc	\N	\N	2025-08-25 14:33:11.471+00	2025-08-18 14:33:11.471887+00	\N	t	2025-08-18 14:33:11.471887+00
3c5cac42-7065-4715-ae25-e240362269f3	e5fe1346-93ca-425c-924c-efb7e6401484	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNWZlMTM0Ni05M2NhLTQyNWMtOTI0Yy1lZmI3ZTY0MDE0ODQiLCJlbWFpbCI6InRlc3QxNzU1NTI3NTk5OTUybXRienF5QHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyNzYwMSwianRpIjoiMTI5Y2FkMTQtODU5MC00ZDkxLWE4NmQtNDRlODI2MTUxZWI4IiwiZXhwIjoxNzU1NTI4NTAxfQ.JbI-pOEwTTIu-OY76VHsJcs9Ns4Tbu8dQk8c29s55Gk	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNWZlMTM0Ni05M2NhLTQyNWMtOTI0Yy1lZmI3ZTY0MDE0ODQiLCJpYXQiOjE3NTU1Mjc2MDEsIm5vbmNlIjoiY2Y3YTM0NzctODkxZC00YjMwLTg5MDktYjIzNjA5N2ViOGJlIiwidXNlcklkIjoiZTVmZTEzNDYtOTNjYS00MjVjLTkyNGMtZWZiN2U2NDAxNDg0IiwiZXhwIjoxNzU2MTMyNDAxfQ.OgZeyfaOxaphld4UwvArg_9PWsS-LS7kIbZAxmPO26A	\N	\N	2025-08-25 14:33:21.145+00	2025-08-18 14:33:21.14618+00	\N	t	2025-08-18 14:33:21.14618+00
d14770ca-3d6a-4f5a-80cf-ae1396a31946	00e17658-ef14-49cc-9e5d-45cfa2586e19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMGUxNzY1OC1lZjE0LTQ5Y2MtOWU1ZC00NWNmYTI1ODZlMTkiLCJlbWFpbCI6Im1vY2hlcmthOUBnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1Mjc3NTgsImp0aSI6IjkyZGRmODk5LTM3ZjItNDhkNC05M2RhLTQzZDJmMmM5OWJhZCIsImV4cCI6MTc1NTUyODY1OH0.lDFSdL0lADubyJP-5N29hK96nCkSZRPDZShRI9zVkXA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMGUxNzY1OC1lZjE0LTQ5Y2MtOWU1ZC00NWNmYTI1ODZlMTkiLCJpYXQiOjE3NTU1Mjc3NTgsIm5vbmNlIjoiYzlkMTgzZmQtZDZkYy00ZjAzLWJjOGItYmU5NTdkM2RhNDYyIiwidXNlcklkIjoiMDBlMTc2NTgtZWYxNC00OWNjLTllNWQtNDVjZmEyNTg2ZTE5IiwiZXhwIjoxNzU2MTMyNTU4fQ.6_XmOrG_PU5tIdBmysxWJ6D0OntQgONsH8IsOrTJLrI	\N	\N	2025-08-25 14:35:58.286+00	2025-08-18 14:35:58.2875+00	\N	t	2025-08-18 14:35:58.2875+00
9fb66c2a-33ba-4c6c-a66b-a3a8cf3277ca	5c6de5b8-058f-430e-931f-e79e8990d216	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzZkZTViOC0wNThmLTQzMGUtOTMxZi1lNzllODk5MGQyMTYiLCJlbWFpbCI6InRlc3QxNzU1NTI4MDI5MTc1bnNjajkzQHBsYXl3cmlnaHQudGVzdCIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyODAzMCwianRpIjoiODBjODJlMTUtMDdjMC00ZjU5LWFlMzgtNzZiYjUzMTVkMmNiIiwiZXhwIjoxNzU1NTI4OTMwfQ.kLvIycm_8iPRTD_J1khEljPMf7SDbgWOLO8rqGJJEcs	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1YzZkZTViOC0wNThmLTQzMGUtOTMxZi1lNzllODk5MGQyMTYiLCJpYXQiOjE3NTU1MjgwMzAsIm5vbmNlIjoiNGUxYjI1ZjUtNTI5Mi00NzM2LTk4ZDgtNTI5NmFhNTA1ZGY2IiwidXNlcklkIjoiNWM2ZGU1YjgtMDU4Zi00MzBlLTkzMWYtZTc5ZTg5OTBkMjE2IiwiZXhwIjoxNzU2MTMyODMwfQ.sVD2sLs2bVY76nIBETPzAlAbtn9XIhlitBcR-Ln7ueE	\N	\N	2025-08-25 14:40:30.84+00	2025-08-18 14:40:30.84055+00	\N	t	2025-08-18 14:40:30.84055+00
68fdfef7-aadc-4621-b3ba-347bdef56af7	ad46b5cb-7ee5-414b-a64c-053395e7d918	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZDQ2YjVjYi03ZWU1LTQxNGItYTY0Yy0wNTMzOTVlN2Q5MTgiLCJlbWFpbCI6Im1vY2hlcmthTUBnbWFpbC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1MjgxMDAsImp0aSI6ImZmZmJiNzlmLWRmYzEtNDA2MS05ZjY0LTk1ZDMyZjQzNDhmMCIsImV4cCI6MTc1NTUyOTAwMH0.u-EFpAVvWOrEPn_yuGbf3Qa5cy3zSPYb1BxiW6Sc3sc	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZDQ2YjVjYi03ZWU1LTQxNGItYTY0Yy0wNTMzOTVlN2Q5MTgiLCJpYXQiOjE3NTU1MjgxMDAsIm5vbmNlIjoiY2I1ZTYyYjctNmM4My00M2VlLWEyZTEtOTkyNTlhZWY3MjlhIiwidXNlcklkIjoiYWQ0NmI1Y2ItN2VlNS00MTRiLWE2NGMtMDUzMzk1ZTdkOTE4IiwiZXhwIjoxNzU2MTMyOTAwfQ.ykRemu5-9Ge9qEbuyo0dtURCVvp4ez7TFM5LWac-7j8	\N	\N	2025-08-25 14:41:40.785+00	2025-08-18 14:41:40.785396+00	\N	t	2025-08-18 14:41:40.785396+00
04f5e02b-745c-4db9-a9bd-956a1b4e2b6b	6ae02838-605d-404d-98db-0fe35ca171e1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWUwMjgzOC02MDVkLTQwNGQtOThkYi0wZmUzNWNhMTcxZTEiLCJlbWFpbCI6Imdlc3Rpb24zQGxvY29kLWFpLmNvbSIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc1NTUyOTExOCwianRpIjoiMjM5NzE1OWEtMjlmNy00MDgyLWE0NDEtYThlMjY2YTYwYjcwIiwiZXhwIjoxNzU1NTMwMDE4fQ.cSZbnD_eKbTEzb6Uc2aJ6v6NR0FtWVC4pYKyf96kAwA	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2YWUwMjgzOC02MDVkLTQwNGQtOThkYi0wZmUzNWNhMTcxZTEiLCJpYXQiOjE3NTU1MjkxMTgsIm5vbmNlIjoiOWY5YjdiMmUtY2QwNi00YzI2LTg0MTktYzAxZmJkYTY1MmY2IiwidXNlcklkIjoiNmFlMDI4MzgtNjA1ZC00MDRkLTk4ZGItMGZlMzVjYTE3MWUxIiwiZXhwIjoxNzU2MTMzOTE4fQ.OiDiIHxwXoAry4r_69UKv6gUISskG00P3TkzZHTdwpY	172.21.0.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	2025-08-25 14:58:38.166+00	2025-08-18 14:58:38.166815+00	\N	t	2025-08-18 14:58:38.166815+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: locod_user
--

COPY auth.users (id, email, password_hash, first_name, last_name, role, is_active, email_verified, created_at, updated_at) FROM stdin;
2a1866f4-a2fb-4b4b-ac13-f40e1ccb1edf	test@example.com	\\b\\0\\/Gvw2/Y7LOvDheFDC.jXaDjGHr8ueVF8w4j5yG3Em	\N	\N	customer	t	f	2025-08-14 19:56:56.471202+00	2025-08-15 21:32:28.129585+00
05359ee5-e3e6-4085-89d6-3df46e74198f	admin@logen.locod-ai.com	$2b$10$nZpFzwLdalLgOVNajeCh7.DJlORxtC0oXrctTSzjmZekbnmPvfPNa	System	Administrator	customer	t	f	2025-08-17 13:56:24.738482+00	2025-08-17 13:56:24.738482+00
d79c433a-4a48-4036-ac85-b2c239c4f704	fixed-test@example.com	$2b$10$7mxpgVCd8Br5ezquFvdmq.3rfPfZdnx7qQjwETphP.VXqJ7eeK.QS	Fixed	User	customer	t	f	2025-08-15 22:42:20.213727+00	2025-08-15 22:42:20.213727+00
c4df2221-ff93-4fd0-a7a2-4c48594a220f	perftest_final@test.com	$2b$10$W2SSDxFO4uyJ02bQynoCoOJShFMgpFwOkUv0fQ1kfGN2h.OVWsDAe	Test	User	customer	t	f	2025-08-17 18:10:58.173916+00	2025-08-17 18:10:58.173916+00
df68d3e6-8ba6-4216-9363-f0bdb6de3162	newadmin@locod.ai	$2b$10$LVXBRAxpwPiTlxIGjU8TzOPhE.AvRB0AwxAiy5OBDnKaHtT6d1V6u	New	Admin	admin	t	f	2025-08-15 22:50:05.081038+00	2025-08-15 22:51:31.267936+00
51ccf8ad-7379-43f1-bd9e-810b63165da9	testuser003@test.com	$2b$10$DFOM1jlA2b3X0cKShyV6L.uaPwdP7iQ/PRWY/m1r3bH6qsrARpjVe	\N	\N	customer	t	f	2025-08-15 23:56:37.570084+00	2025-08-15 23:56:37.570084+00
9ff376a8-7956-4672-b2d7-b6de363f785d	test-auth-1755334098610@test.com	$2b$10$oSTuhDpzmVzfDNGuMtm.2OBAQFwyferHM11LN9uln.pZtEEj8/5a2	Test	User	customer	t	f	2025-08-16 08:48:40.129492+00	2025-08-16 08:48:40.129492+00
a2f5bac5-668d-45a0-a030-bbeef9025ce6	test-auth-1755334196582@test.com	$2b$10$UOUL.MxFMiuTx6JRyr1fL.22ZnsJGpSJIEuDNapaHS9n9iygZXDPK	Test	User	customer	t	f	2025-08-16 08:50:18.069281+00	2025-08-16 08:50:18.069281+00
3f7729f6-fcc3-41b7-a559-099a3777b3c6	xss-test@test.com	$2b$10$dcjzbKlY6lMCQ6yvQv1AW.WDgHKcdNuw9RpuV5y/ycsh1wY5ILNGq	<script>alert("xss")</script>	Test	customer	t	f	2025-08-16 08:50:19.926826+00	2025-08-16 08:50:19.926826+00
acabacb4-ecce-49db-8731-418c32715ebc	test-auth-1755334230049@test.com	$2b$10$7w8GtQfI4FMYYW47JA3jLOct2X8.Cn9CLK12MPtijD7wnj0tgYwhO	Test	User	customer	t	f	2025-08-16 08:50:51.56954+00	2025-08-16 08:50:51.56954+00
5c37ae12-9d29-4d9d-a1dc-2e6feaabf5d3	test-auth-1755334299317@test.com	$2b$10$FSeN5DjKwu6t2Vdt.vlAHO1khNO2.OCReJr8b3Z2oUy8XiP3eb/Vy	Test	User	customer	t	f	2025-08-16 08:52:00.867872+00	2025-08-16 08:52:00.867872+00
2af39e41-6d8a-402f-a271-16f3b904032d	qa-test-1755349155001@example.com	$2b$10$rQtS07U7CAJsOKF6.2FtUOcs9rLLHNcOmLoXXM.3HT3YAPjO2k50u	QA	Tester	customer	t	f	2025-08-16 12:59:37.182443+00	2025-08-16 12:59:37.182443+00
eda0705a-f096-4b3b-a306-01e5d77fa6ff	xss-test-1755349156059@test.com	$2b$10$mwq.aIJKkWQA0WeVJbrUFejRPO9ZDVIkQenXZoWiN2dOy0wRlzDsO	<script>alert("XSS")</script>	Test	customer	t	f	2025-08-16 12:59:37.760461+00	2025-08-16 12:59:37.760461+00
c6f08722-2d2f-4fb6-9366-51db6dbd3ec2	debug-test@example.com	$2b$10$6yirJYdnQgMpVw/EA5XH/eDZFz0l55JUTVLTXTl4yMyteBiYiXjwm	Debug	Test	customer	t	f	2025-08-16 12:59:49.968147+00	2025-08-16 12:59:49.968147+00
a0dfd725-2e49-43dc-9168-94bc1c3953cf	unique1755349626@example.com	$2b$10$QSYPk72rCslWWsmPWhZ/7.bBdgGq50HUZ2qyMB4Txkv6gKs6n.d2y	\N	\N	customer	t	f	2025-08-16 13:07:28.295591+00	2025-08-16 13:07:28.295591+00
0bdf3e90-2be7-4e5c-8d5e-e968c4e4d3ae	qatest1@example.com	$2b$10$3yL9k9hYxKmLPA5fGfq.luc/lrqkj.kOQ6VrNxpSdk6FrGzdnFxyS	QA	Tester	customer	t	f	2025-08-16 13:16:02.999843+00	2025-08-16 13:16:02.999843+00
f428de01-bdbd-4489-b833-38dadee5b342	qatest2@example.com	$2b$10$K3sc5Wcovu6r0YopSuw5wu8/vJWzDeK.XsUZ4KwI6BhFeTgmhJ.B6	\N	\N	customer	t	f	2025-08-16 13:16:11.444311+00	2025-08-16 13:16:11.444311+00
a4bc6dd4-1ca2-45b0-873f-332c537d91fa	verylongemailaddressthatexceedsnormallimits@verylongdomainnamethatcouldbeusedinrealworldscenarios.com	$2b$10$c5f.0yMRqbvEoomv1abjruAv36aVyc9VAbt2H4Nfc1XzNqOopqF/a	VeryLongFirstNameThatExceedsTypicalLimitsForFirstNameFields	VeryLongLastNameThatExceedsTypicalLimitsForLastNameFields	customer	t	f	2025-08-16 13:18:28.753226+00	2025-08-16 13:18:28.753226+00
5221af3c-a766-4410-8296-494ac78fa2d8	test-special@example.com	$2b$10$kDK436OgcnvJ48gj4htbCONtWKepGoyp3RuiIdMY9/IGUSa9WKgk.	Jos�	Garc�a-Fern�ndez	customer	t	f	2025-08-16 13:18:46.830462+00	2025-08-16 13:18:46.830462+00
be1bbc0a-32c1-4650-9246-bb0c846abad3	test-fixed@example.com	$2b$10$S3b6qauv4TMAl5SWtnG.fehfG6MmfceHtIp2I63hAvERCKSu/Xgvu	Test	User	customer	t	f	2025-08-16 13:33:36.702931+00	2025-08-16 13:33:36.702931+00
cbd8bbe5-0b83-4317-a88b-7e870c36b014	mocherka@gmail.com	$2b$10$/k5WxwG5GJrftR.XZApQ7.pyMRF/LIPBNT89zF5h5rcPIhOFAwfhC	Mike	Tyse	customer	t	f	2025-08-16 14:16:22.435038+00	2025-08-16 14:16:22.435038+00
78326bfd-f9e2-4b90-afab-af0c8004348b	frontend_test@example.com	$2b$10$F.koVQx4rUYf9fVvN280j.yQOKPVfhkuZgyqcCWmw3PBgFoaULYae	Frontend	Test	customer	t	f	2025-08-16 14:53:40.808214+00	2025-08-16 14:53:40.808214+00
f68102d9-7daa-4529-b8ba-d17391b966e3	qa-test-1755358875783@example.com	$2b$10$JhpmCflmgKoryW17IkSmkO83L2VSLb65HGq2m1fOwWifdPwHK4OCO	QA	Tester	customer	t	f	2025-08-16 15:41:37.638527+00	2025-08-16 15:41:37.638527+00
9967772d-4fe4-4d86-8977-78dd30cb00c1	qa-test-20250816@example.com	$2b$10$ZjwRoqJDHI0A5xW8MKzPKuBOc41QZCk0Mv4Ljeen2dQpgcDFQ6VJG	QA	Tester	customer	t	f	2025-08-16 15:42:34.385053+00	2025-08-16 15:42:34.385053+00
b9c68a87-d197-448b-b4ed-d935cea5ad66	admin@example.com	$2b$10$PWZ2HdHn9QXihR5GZjAG7uMs.EAL5EvBgph.8dzlkvyq.r/vl/CKW	Admin	User	customer	t	f	2025-08-16 15:42:34.798413+00	2025-08-16 15:42:34.798413+00
ab69e819-1209-451c-8fe3-d1729e9af52c	qa-comprehensive-1755359054018@example.com	$2b$10$cwyf2zhWJQr2dLx.2J9CrOyQUpnabYBwzt38U8RdpgQai1zapgFIG	Comprehensive	Tester	customer	t	f	2025-08-16 15:44:35.700415+00	2025-08-16 15:44:35.700415+00
b0c05b26-5c11-4518-82cf-74e08e5edfd0	perf-test-1755359055522@example.com	$2b$10$ffHImcXUzDH8IAVotpBEG.sTeZ0fXNs6k2gAeAHyTQ06SB92UegKC	Perf	Test	customer	t	f	2025-08-16 15:44:37.168842+00	2025-08-16 15:44:37.168842+00
b4e92af8-7063-4698-b5ad-62f21278dff3	test-fix-1755360555@example.com	$2b$10$n2yjff4EMzJYjuXpgybo6u.tlqJNryfwUwwtmGQvYwaLZsuzxEugm	Test	User	customer	t	f	2025-08-16 16:09:37.719242+00	2025-08-16 16:09:37.719242+00
660a6e06-2dde-40e2-a684-a17f561e555a	mocherka2@gmail.com	$2b$10$vyJo6ZoQsepcdDrR8oaB/ebqMtPbx04JQHJ9L5Nts/DoZpqbYbDVq	mok	tok	customer	t	f	2025-08-16 16:43:13.668945+00	2025-08-16 16:43:13.668945+00
18b343ab-871e-44d6-9423-2775c2a2fd65	production-test@example.com	$2b$10$V6PQVRf/q5T4dsI/O/w0s.Wf6o9Nl7P8FKEwALyG55yOenf.pwZTG	Production	Test	customer	t	f	2025-08-16 17:04:11.850077+00	2025-08-16 17:04:11.850077+00
62bfffde-67bf-4f29-9416-ccf4f22ea823	mlocheg@gmail.com	$2b$10$lT.w8bzDD8KYRl1fiBZnbOk5XK4wHCLVwJmiwCFPW49XW24rWQoLq	mok	tok	customer	t	f	2025-08-16 19:36:21.880115+00	2025-08-16 19:36:21.880115+00
90a60996-a997-4f23-b461-a1278dbb160c	mcherka@gmail.com	$2b$10$XBkU7Hs5uCh4bEt5Ck61SOX23v.CVinrIJNXboIanWxbN7JVsyX9i	mol	fol	customer	t	f	2025-08-16 19:36:46.063984+00	2025-08-16 19:36:46.063984+00
3b23afd0-398c-4bdd-9f46-c2766d313a18	staff-1755385941887@locod-ai.com	$2b$10$G2T/0bBzSZnb4/9UL03LBOdaHJmj2vIoode88bJVmQ9GH2/JqIwRC	Test	Staff	customer	t	f	2025-08-16 23:12:43.94045+00	2025-08-16 23:12:43.94045+00
84e7b3eb-5e59-4160-b70e-4102827e00bd	staff-1755386001135@locod-ai.com	$2b$10$V/RtcSZyDUGAVkM2a6MlQ.z/QbetwkQHnqsS1638SJw.gzhjaBSrq	Test	Staff	customer	t	f	2025-08-16 23:13:43.099636+00	2025-08-16 23:13:43.099636+00
07fde21f-d591-4437-9157-41e3b012f373	admin@locod.ai	$2b$12$iKeYeXxZ3bSTYg1bvcD5/.KskRC.PSTh.ncy0t4yGmMIC9BR55h0u	Admin	User	admin	t	t	2025-08-14 19:39:31.722739+00	2025-08-17 14:58:35.948596+00
41a829ad-b0f3-46ea-8690-df61d4350dd8	newuser@example.com	$2b$10$ku5wFZAXX81.Xk87p.5AQuRaCjD5xItDm.xeGqssFZwko0K0n5HDu	New	User	customer	t	f	2025-08-17 18:00:03.488395+00	2025-08-17 18:00:03.488395+00
f47e9666-70ce-42ad-8b02-b328f0804969	test1755453886@example.com	$2b$10$.YjOIVvbDaHB1gPtfnjd4uBncamp9DannHGvIaEFZsfkmGbRfxZU2	Test	User	customer	t	f	2025-08-17 18:04:47.056673+00	2025-08-17 18:04:47.056673+00
4739bdfd-e036-4c74-8d32-c012ad756214	user1755453894@test.com	$2b$10$rt/2kK1q1zJygQfEhyhXneFoGbsslOvesmQXPY2un8Yyh8BrvEAOS	John	Doe	customer	t	f	2025-08-17 18:04:54.675497+00	2025-08-17 18:04:54.675497+00
862278ba-fd2d-439c-ac80-63b3d3cc8dae	duplicate@test.com	$2b$10$WIGSBPFEtRI91Solg5AqQOC62YtRAMmTQ4u.IGie21WIIedi6RxOK	First	User	customer	t	f	2025-08-17 18:05:07.202163+00	2025-08-17 18:05:07.202163+00
aeda00d9-5c8a-425d-81c1-bc82c2a9a1fe	perf4_1755454015719077540@test.com	$2b$10$MxUST0hh3u86dy9TujYG7u2p0WOdIea9b/ZrWPUlloUQDekMnzMh2	User	4	customer	t	f	2025-08-17 18:06:55.848358+00	2025-08-17 18:06:55.848358+00
478c2e1b-ecbe-43bb-bea7-ffb61f1da643	perf3_1755454015710777220@test.com	$2b$10$wF25n8ACs6CsnnCljtVn2OYRz1dHQCNuP7gp.TU0eY9Cotchuvgq.	User	3	customer	t	f	2025-08-17 18:06:55.851609+00	2025-08-17 18:06:55.851609+00
da55929b-b1df-4a1f-ac65-18cbd4f0bd33	perf1_1755454015708187366@test.com	$2b$10$9GcaraPvUko/3CKbWGAi6eietM6dQJ3PrRLOm.rqe4mkdwnTtqWzm	User	1	customer	t	f	2025-08-17 18:06:55.862711+00	2025-08-17 18:06:55.862711+00
9db9a0d3-07ce-4eee-9543-5abd3d468eef	test+1755456365@example.com	$2b$10$ErirteU/K7vJdztwnI5uPuNjcHxovIdkPJqCpkFJ7h4KBfGoMPq8e	Test	User	customer	t	f	2025-08-17 18:46:05.214265+00	2025-08-17 18:46:05.214265+00
2e22a4b0-eb54-4672-b239-195d2ba9114c	testuser@audit.com	$2b$10$77mUj5G7kjF2/CmON2HANumA4MMpccXzbA/GuVcgTPwULbtWlobSK	Audit	User	customer	t	f	2025-08-17 21:09:26.293872+00	2025-08-17 21:09:26.293872+00
091d1181-f375-4710-b2b6-6512a00ff4f7	test-1755465791311@example.com	$2b$10$MeT7jpkMjrMIauYAzYWMGueJUKbrYxHmsb40nD5GQ.gd1yFOj/.C6	Test	User	customer	t	f	2025-08-17 21:23:11.391166+00	2025-08-17 21:23:11.391166+00
d1f170a4-a467-4c96-b79d-1e65cee36ad4	test-single-1755465806986@example.com	$2b$10$z9eXyGoXJ5Rg5j3Icjh3aO./W0rtAIWbyX2YT20uusFELhAeFFe1G	Test	User	customer	t	f	2025-08-17 21:23:27.114362+00	2025-08-17 21:23:27.114362+00
bb9f9c5b-6d36-4095-a5af-65bebb93e0c7	test-single-1755465823523@example.com	$2b$10$Eet6opfyjmcKFzwU2xLITe9eKa2xnV5ZnGO8ythwQwQ7QLaNeEONe	Test	User	customer	t	f	2025-08-17 21:23:43.616531+00	2025-08-17 21:23:43.616531+00
c57c8b47-0712-4aca-a017-416033f10edf	test-single-1755465916029@example.com	$2b$10$n1ysBuP96BUkJvNpKeNXauPkAgXQasXBcfC23UifeEbgLpdZAQpp2	Test	User	customer	t	f	2025-08-17 21:25:16.160356+00	2025-08-17 21:25:16.160356+00
aec590c2-5b01-4a9a-ab0c-0c211dfaf6ac	test2@example.com	$2b$10$tlUEHyEMzsL1KQDL7w6PAuVG07Aki9jn5WhJm2bXuDqBHE3X0QMUe	Test	User	customer	t	f	2025-08-17 21:39:43.786731+00	2025-08-17 21:39:43.786731+00
68013abb-6f7f-403b-8d82-625995e78cc9	test-qa-1755470146@example.com	$2b$10$lmcMpy9zBM0rOG5XDXEnk.PJKBn6qqGnz8Jbc7/hcHOOH79cfOKKK	QA	Tester	customer	t	f	2025-08-17 22:35:46.466497+00	2025-08-17 22:35:46.466497+00
c5effa69-fe60-419f-8e91-119b4c91f408	testuser1755511154@example.com	$2b$10$N/5rQBLlJDkCMwGkC2ciJux/1hNaYBs2vssn/eLOrL9.YF12yFzoW	Test	User	customer	t	f	2025-08-18 09:59:14.712851+00	2025-08-18 09:59:14.712851+00
e07b7507-e91e-4da0-bd53-beb175545459	testuser1755512877@example.com	$2b$10$tBbcAXKxO/um45bnNMigSeA4CAotTgYoGy0q9G/Pv/cCdAeW4z5UO	Test	User	customer	t	f	2025-08-18 10:27:57.998164+00	2025-08-18 10:27:57.998164+00
8fe18983-1a19-488b-8fa7-4991d522533a	testuser1755513664@example.com	$2b$10$v8m4Mes.rgvVfuhOwM83VumHLtMjpNZWxGKr5I0H3AI7O6OwtmgsG	Test	User	customer	t	f	2025-08-18 10:41:04.855561+00	2025-08-18 10:41:04.855561+00
3e4b33f4-b144-4b9a-82f0-509bb74e94fe	test.customer.portal@example.com	$2b$10$VizTEbA9uH/dkbNvl8bumOz8xUSjFVNSsbYPSffGyuBaHr1W85JtK	Test	Customer	customer	t	f	2025-08-18 10:47:22.1478+00	2025-08-18 10:47:22.1478+00
a077ec6a-178a-42a7-8750-2326568c17de	testcustomer@example.com	$2b$10$fjiKqjsG62KpDkCNZf7CGeitk5xh5tANaH77Y0E.bTsiNCXjywQRG	Test	Customer	customer	t	f	2025-08-18 11:09:04.252124+00	2025-08-18 11:09:04.252124+00
8333cd96-0bc6-4ccb-8fc7-3d2f86672552	newuser1755523265@example.com	$2b$10$440tKk5d0A2pV1H2ffQhQeug5Is6X5WvFJfoSH9wkmA23YeiuDODK	Jane	Doe	customer	t	f	2025-08-18 13:21:05.182143+00	2025-08-18 13:21:05.182143+00
c6ad1ec8-9718-45f2-a523-24aac7c82947	testuser1755523358773@example.com	$2b$10$/9pvccbQBTNPeFcf9KH1ReT1x9rYkil/4l4ECIN0W1kvaeOUTNTtu	Test	User	customer	t	f	2025-08-18 13:22:38.851769+00	2025-08-18 13:22:38.851769+00
ef0f294f-d6af-4698-a607-05cd5d7d22b3	testuser1755523380494@example.com	$2b$10$rHWwmwi3ECxD4fNttRqg5OqRG9GdTm4199njIT8sWXSoBwv/xmaN.	Test	User	customer	t	f	2025-08-18 13:23:00.592525+00	2025-08-18 13:23:00.592525+00
27828d5b-4d2f-4b25-9494-31260584e4db	finaltest1755523406600@example.com	$2b$10$KzBJkzU6POVCQKXC1.MBAe3mheniOE/CEygEV7JKOZy9sCOY9grU2	John	Doe	customer	t	f	2025-08-18 13:23:26.744092+00	2025-08-18 13:23:26.744092+00
f525a5ba-91e6-40ea-99ff-978d1db2ffc1	newuser1755523884@example.com	$2b$10$YigMQhjpbOR9wtoq1c4Dm.RzsEf6BHrGChXLnk8moy9zVz5f83Cte	Test	User	customer	t	f	2025-08-18 13:31:24.632836+00	2025-08-18 13:31:24.632836+00
9c7f1dac-cd26-4f05-9515-e89350db4abd	mocherka1@gmail.com	$2b$10$u6glLDD1y.6BE3ptYebGre.WhuhiXTggBalAY3Z9pzkmTGOHo02xa	mok	tok	customer	t	f	2025-08-18 13:49:54.334472+00	2025-08-18 13:49:54.334472+00
e171af6d-d774-4a19-9b5b-2039de0325d1	gestion@locod-ai.com	$2b$10$FwDvKg5ScrEECn56yJnV1ulAE2Hgw1CmfLz3/CoKlnhw63smBY0Fm	Moulay-Mokhtar	Cherkaoui	customer	t	f	2025-08-18 13:57:25.229616+00	2025-08-18 13:57:25.229616+00
b213b8dc-ac96-451f-b76c-3c8616a61fda	testapi@playwright.test	$2b$10$Ne6XZs9wx7OUTEbRj7YI/Oz6mkrlJf9u7ov8D7B0pXBCk7FP/ukza	TestUser	TestLast	customer	t	f	2025-08-18 14:02:44.927238+00	2025-08-18 14:02:44.927238+00
aed746c2-5950-4294-9abf-ab3ca65684d0	test1755525787152nn0bgm@playwright.test	$2b$10$vjgiBu3wHmxIC8y9fTBoo.DgTkJNOYR1EGbY55cHmX3/0I099sUBK	TestUsernn0bgm	LastNamenn0bgm	customer	t	f	2025-08-18 14:03:07.221285+00	2025-08-18 14:03:07.221285+00
4b502788-3dfe-4255-9188-27028c951af9	test17555257865930yc6lc@playwright.test	$2b$10$TynxsTM97xsn7Y5vaeX41.7WUuxPT0oirSMYkFDUKs.WjHw7Eh4te	TestUser0yc6lc	LastName0yc6lc	customer	t	f	2025-08-18 14:03:07.93171+00	2025-08-18 14:03:07.93171+00
4c5188bf-1fee-4f56-82e8-d697f9901333	test1755525787337x3n0lj@playwright.test	$2b$10$ihC3R.KkfJ3HF0BgYFfwP.BTTkT.w4EUs9xT7j9p5zGSQJwqINpXy	TestUserx3n0lj	LastNamex3n0lj	customer	t	f	2025-08-18 14:03:08.659681+00	2025-08-18 14:03:08.659681+00
9294b01e-35b2-45fb-8054-fb54137f59a4	test1755525789331bua0ir@playwright.test	$2b$10$QWv8xsTD6Cs5OoqbqXUYHOzPVHJSclU37KvIkC67Duel91AHLg8bW	TestUserbua0ir	LastNamebua0ir	customer	t	f	2025-08-18 14:03:15.802483+00	2025-08-18 14:03:15.802483+00
8f412d26-a04b-43e8-b1a6-98aac9075115	test1755525870432q2i6c6@playwright.test	$2b$10$X6Q8JOl6QAeNulJBnP6ayeTFJKfjwFDRPv1WrIxjXNDkBSXNs/etq	TestUserq2i6c6	LastNameq2i6c6	customer	t	f	2025-08-18 14:04:30.50713+00	2025-08-18 14:04:30.50713+00
c3107abd-7e92-45bf-a757-13dbd7c795c6	test1755525870122modvqh@playwright.test	$2b$10$I8roLAhOLsjvpfqPwTy1..8a8W6q/LtzRJtbXqF6w6SI6WC19en7O	TestUsermodvqh	LastNamemodvqh	customer	t	f	2025-08-18 14:04:31.399799+00	2025-08-18 14:04:31.399799+00
2c59e6ec-bfaa-48fd-9494-619932cf1235	test1755525870732t3ke2q@playwright.test	$2b$10$qZC.HbEQnmy8mBz9xcfcO.EpzihZ/0jBegt5Wq6ssxQdwmUXLVfui	TestUsert3ke2q	LastNamet3ke2q	customer	t	f	2025-08-18 14:04:31.906959+00	2025-08-18 14:04:31.906959+00
0e4b0fe2-f78e-46a6-874b-3fa5ec954629	test17555258766929peecv@playwright.test	$2b$10$Ql5wMDFjAaWmx61FUu06IOBVFFpNPzetMbZkaCIMxZMEJSB7Mchg6	TestUser9peecv	LastName9peecv	customer	t	f	2025-08-18 14:04:43.2824+00	2025-08-18 14:04:43.2824+00
69223f81-e66c-4f26-bb40-44775bd11df7	test1755526024362pq8o0x@playwright.test	$2b$10$x3QuY6tSP341QD/TiauOButdhEbXs1FTey0j//2I35lxsr6hfgqNe	TestUserpq8o0x	LastNamepq8o0x	customer	t	f	2025-08-18 14:07:04.440616+00	2025-08-18 14:07:04.440616+00
8dbade99-a2cb-4974-9687-b991c8827ab4	test1755526024109gwn0d1@playwright.test	$2b$10$01C1oO/5V4N8MtAVFr6/GO75lhhn9j/iGBdfoc8TomATVJgqqdtcu	TestUsergwn0d1	LastNamegwn0d1	customer	t	f	2025-08-18 14:07:05.312588+00	2025-08-18 14:07:05.312588+00
7055eeff-8c1b-4f89-9393-a05d43445328	test1755526024601eegnny@playwright.test	$2b$10$0YEmtCymQ62dYQuDek6N3exyoxZ2DCgAVldYZnUX2OGkzzyzEo/wW	TestUsereegnny	LastNameeegnny	customer	t	f	2025-08-18 14:07:05.851569+00	2025-08-18 14:07:05.851569+00
9874e76f-3f5c-4b22-8055-69c54da94d38	test1755526026403y5nkg4@playwright.test	$2b$10$FSH3Bqqkp5dmgz09NL9pYeNii6Yd6hL06Ii0oeVa9dnxoYbOlx7y2	TestUsery5nkg4	LastNamey5nkg4	customer	t	f	2025-08-18 14:07:13.063101+00	2025-08-18 14:07:13.063101+00
54a3b3d7-ecc5-4708-9746-504f0afc18ac	test1755526042673m7r7cs@playwright.test	$2b$10$7A3L5wf1HcrDv5WjmYFU2uDHq.qgOFa/YMOTGv.V1aI7Ehjo7No6S	TestUserm7r7cs	LastNamem7r7cs	customer	t	f	2025-08-18 14:07:22.740905+00	2025-08-18 14:07:22.740905+00
42b9d23e-fae8-484e-8382-9688e34651d4	test1755526042645ekj8py@playwright.test	$2b$10$li3fG4WqawhN02Io29q5kOp8KQxXh4tjXGnIWNWxvK/dUsd0jrJBy	TestUserekj8py	LastNameekj8py	customer	t	f	2025-08-18 14:07:24.035645+00	2025-08-18 14:07:24.035645+00
e0c5ec72-83dc-43c6-bad4-82206b4d323a	test1755526043189rrh5gj@playwright.test	$2b$10$xDadRWdhhdecabb8B1/TJus27YJLB6YnE1Zq/KzF8EbxA1xPshCPi	TestUserrrh5gj	LastNamerrh5gj	customer	t	f	2025-08-18 14:07:24.685998+00	2025-08-18 14:07:24.685998+00
02958cb8-3b2a-4243-8428-17fe512d3559	test1755526070468702izg@playwright.test	$2b$10$6wRMES4X7vva1ixAFHGWEuJYOGpHSHORwlef5NnxPj5OAPEzb0LGa	TestUser702izg	LastName702izg	customer	t	f	2025-08-18 14:07:50.54707+00	2025-08-18 14:07:50.54707+00
45ab32d7-4b37-42ff-bfce-b9217c573555	test1755526069237t8jsgp@playwright.test	$2b$10$DDkdsgKvUhP0dnqsheqty.6fc00rvezp4dLHTTHJbEAbqJsogePFa	TestUsert8jsgp	LastNamet8jsgp	customer	t	f	2025-08-18 14:07:51.245004+00	2025-08-18 14:07:51.245004+00
8456f295-87f1-4698-b7ca-ce61e699a710	test1755526087901f3epmm@playwright.test	$2b$10$7AMr6WgIeaZcDy2OdLp6puwdVUI4oHFWtl6KNHu7sd1YMP6ltRXlS	TestUserf3epmm	LastNamef3epmm	customer	t	f	2025-08-18 14:08:09.151435+00	2025-08-18 14:08:09.151435+00
ccab5091-dbc0-467b-adbb-3ab820014ec7	test1755526089098na95uh@playwright.test	$2b$10$sLZ0LvXFi4FW9OM0wdcW1.5lQ012BVon1NsNsNVb9sTqXX9Pc/MrC	TestUserna95uh	LastNamena95uh	customer	t	f	2025-08-18 14:08:09.169916+00	2025-08-18 14:08:09.169916+00
8e9d2466-fde3-4017-9fb2-5f1e9d40f206	test1755526089384auku2b@playwright.test	$2b$10$AhiWew1Qh/QjhYuRlsWb8ewI2yUFATFmVTT3LTyUcV9/PN4cOp1kO	TestUserauku2b	LastNameauku2b	customer	t	f	2025-08-18 14:08:10.629921+00	2025-08-18 14:08:10.629921+00
3a6e99c9-5153-4e10-a649-144e523552fe	test175552609455406mvjy@playwright.test	$2b$10$38x0EvtgqO9KfnhnQJHmru9g3.hJrqrsHzxJXDOscl5m4XsZQdeDe	TestUser06mvjy	LastName06mvjy	customer	t	f	2025-08-18 14:08:20.963228+00	2025-08-18 14:08:20.963228+00
e56ab44a-e2e1-4d8f-b2ed-5d850926e0e6	test1755526107849q8ew3g@playwright.test	$2b$10$jcq19y4VAtKq7GZBizn1SuganZs37g2HBVn.jfJSYCAIoZCZgrMwi	TestUserq8ew3g	LastNameq8ew3g	customer	t	f	2025-08-18 14:08:27.926537+00	2025-08-18 14:08:27.926537+00
a0f8b020-150b-4331-970a-d3940772e945	test1755526106210dxh2tv@playwright.test	$2b$10$ZiYsZGLR.OlnAud7.5nbYekcWyg29V0cupL8idmJniDuuRA4sOAXi	TestUserdxh2tv	LastNamedxh2tv	customer	t	f	2025-08-18 14:08:27.969007+00	2025-08-18 14:08:27.969007+00
d1773c89-2e75-46a9-b775-0986ab2b4cc6	test175552610841106ljs9@playwright.test	$2b$10$HqLz6uuSedvGB/IlnCVNnuPSZOsa3t1pIYaak6rVxPM8MfOkhjPYG	TestUser06ljs9	LastName06ljs9	customer	t	f	2025-08-18 14:08:30.244703+00	2025-08-18 14:08:30.244703+00
1454252c-773b-4536-9318-343286f1022e	test123@example.com	$2b$10$T62Zq8eIftKqMHQAo0ifrut3aMqqtkWWLaXsJV.7qLz8mj9A.uPUW	Test	User	customer	t	f	2025-08-18 14:09:08.13336+00	2025-08-18 14:09:08.13336+00
429e1428-b21d-4cc8-a365-bb3e5987bedc	test1755526198534cv08pi@playwright.test	$2b$10$v9nj5gARZ9GCebrtv8BOKOxwEgGaAdzFMX/3r7lZRUXLUvSc0HaiO	TestUsercv08pi	LastNamecv08pi	customer	t	f	2025-08-18 14:09:59.803156+00	2025-08-18 14:09:59.803156+00
40726093-db96-4392-94e8-bd87b362db84	test17555262302137uxu9o@playwright.test	$2b$10$/DG.70DriMsvqVTaIg5eyuUevpy6H5VnzsxGJ/h5IkH6HAn9xUZeC	TestUser7uxu9o	LastName7uxu9o	customer	t	f	2025-08-18 14:10:31.428928+00	2025-08-18 14:10:31.428928+00
c1de923e-0e06-454a-996b-3cf1b6d17620	gestion1@locod-ai.com	$2b$10$P6YWrgyKkQcl7gXj.lG3Pern6NzIf6n7iaLF/j2GcOZNar5/AM7Uy	Moulay	Cherkaoui	customer	t	f	2025-08-18 14:12:24.722333+00	2025-08-18 14:12:24.722333+00
22db1b76-9a7d-4b95-998e-0733b4f71d7c	mocherka3@gmail.com	$2b$10$bNuQisviI1Cb.DAmKjkqhO.wNsg.Qio/WZ.ygDTi/g9IW46rv8wty	mok	tok	customer	t	f	2025-08-18 14:13:30.946025+00	2025-08-18 14:13:30.946025+00
2184df7d-cfc0-4ef7-813e-3631458ce376	test.1755526919305@example.com	$2b$10$kRNMA/ONs7iPvjUoznFf7uc7I5ZOm1TPdeBBHan.fyLEV9QUROwPG	Test	User	customer	t	f	2025-08-18 14:21:59.414741+00	2025-08-18 14:21:59.414741+00
5ae6c1d3-7bd9-4832-ad58-8ea01b73b2eb	duplicate@example.com	$2b$10$cwgT3zAZmmK1aL.NWXRcIOBvwa8ATUoeZXTMYXgblR9.DMy4BZXCG	Test	User	customer	t	f	2025-08-18 14:21:59.560534+00	2025-08-18 14:21:59.560534+00
16f52476-f0f9-4bc3-9b1a-9847e49c1fa6	test.1755526938242@example.com	$2b$10$aiY4U/xFNUCTajiyBt2if.WfE7HhM3w3IQ7k6jY1M2MTsTcVpnxuO	Test	User	customer	t	f	2025-08-18 14:22:18.351297+00	2025-08-18 14:22:18.351297+00
16c462ae-94cd-4090-b021-43232ad80eb8	e2e.1755526939655@example.com	$2b$10$lpt/1e96IvCOpvD8K/FU0uxHNoJi5woaksTiZwM40xYbU0zKhfARu	E2E	Test	customer	t	f	2025-08-18 14:22:20.024166+00	2025-08-18 14:22:20.024166+00
1e70c1c4-4a71-46db-a03c-21c2237ca8ef	concurrent.2.1755526950000@example.com	$2b$10$WCVOAmoDiL7VWisArsAiNu6m4viHqoOHblhMZwDCENRtAC8YjriEK	Concurrent2	User	customer	t	f	2025-08-18 14:22:30.152474+00	2025-08-18 14:22:30.152474+00
7ccb2e7f-a887-480b-b754-36a7b2045730	concurrent.0.1755526949995@example.com	$2b$10$m/lSRZkw3mu6AMQEPYkZfOwYo9AJCnwqNB30jJcggRG2S2OqBvf/W	Concurrent0	User	customer	t	f	2025-08-18 14:22:30.153583+00	2025-08-18 14:22:30.153583+00
ed03f736-5589-49e9-bf4d-35c5ec5a4450	concurrent.1.1755526949998@example.com	$2b$10$Sx8Qvv3PHohRyy7G5WdOueF1mgoqVGdPWb4cNL4Y4AL0wtN4ksbQi	Concurrent1	User	customer	t	f	2025-08-18 14:22:30.166532+00	2025-08-18 14:22:30.166532+00
272bf142-8701-4072-8d46-bbb5bb408fac	testuser@example.com	$2b$10$Xi2VGxTg7ttnUVTCqKw1jeGAqC0YIw6KVR2zGYG2NMbuLYxsFCRdW	Test	User	customer	t	f	2025-08-18 14:26:41.970541+00	2025-08-18 14:26:41.970541+00
4584948e-c0c9-494c-ae18-39aab60c9399	testuser1@example.com	$2b$10$0vc35HcuazT.enoIdZUA0.hpi26xGqcliJJp95GwudPyZkXinGxCa	Test1	User	customer	t	f	2025-08-18 14:27:59.017858+00	2025-08-18 14:27:59.017858+00
a96b35fd-7e0e-4e0c-a951-29808953097a	testuser2@example.com	$2b$10$qYyj8jcit6zrHEVJ4nKVMegcTME41rk0HRIRDiiqiHLUqhKdDRX/u	Test2	User	customer	t	f	2025-08-18 14:27:59.220762+00	2025-08-18 14:27:59.220762+00
c2d0e805-9d29-4af4-b875-ee7ebc6266d6	testuser3@example.com	$2b$10$7ou3t/MBPMQLgezbrY7xFOm7QJno06WgDYP5frCL2gMgH4Obn636C	Test3	User	customer	t	f	2025-08-18 14:27:59.439347+00	2025-08-18 14:27:59.439347+00
5d5818c0-470c-48e3-bd60-766393cac62d	testuser4@example.com	$2b$10$Q8jEKLGFRS0aNJmAwGuWo.D3PLS4TVn3VjtiWr4ewTN9L4e0VavEi	Test4	User	customer	t	f	2025-08-18 14:27:59.625629+00	2025-08-18 14:27:59.625629+00
695f2692-22a8-4795-9c11-70c23de2aaf7	testuser5@example.com	$2b$10$ORQdnUa58SVOi7LNAFEamOKWPuqzGsgkwhhQ3sJ/6fSyzvZPHdpTe	Test5	User	customer	t	f	2025-08-18 14:27:59.831148+00	2025-08-18 14:27:59.831148+00
cfdf6c77-29ec-4744-8812-87472ce2cf4e	testfix1755527532@example.com	$2b$10$GZcC1BwRDiD1rzF2XEku6OiV/lOSg9oIFKPSA44EJZbi/mLgqmjWi	Test	User	customer	t	f	2025-08-18 14:32:12.332175+00	2025-08-18 14:32:12.332175+00
8f86a663-fa59-49d2-950a-e523f4d5914a	testuser11755527586845@example.com	$2b$10$HMEirAatz1ZE1QXZ.fc7a.qgrTd9kDUdg9nTjY037W6w74L6n9jym	TestUser1	LastName1	customer	t	f	2025-08-18 14:33:06.947119+00	2025-08-18 14:33:06.947119+00
0e56747e-1a09-43d0-8593-02763e201de6	testuser21755527587964@example.com	$2b$10$0zPefINsKxAXPY6poZ4/ROBpwUCCo2KLH4LNh..bLic7Zp6h6i/u6	TestUser2	LastName2	customer	t	f	2025-08-18 14:33:08.076416+00	2025-08-18 14:33:08.076416+00
22f49f5e-a6f4-497b-911b-9d0bfae91a5e	testuser31755527589093@example.com	$2b$10$86bKh9kaONbwC8GoM/OOeOtqjv8TpXb9.AS481qyTq32pNu2tzoKC	TestUser3	LastName3	customer	t	f	2025-08-18 14:33:09.217605+00	2025-08-18 14:33:09.217605+00
7028fb33-12e6-4ff0-b697-dc86d7d95772	testuser41755527590229@example.com	$2b$10$3IwhOCeWAuoSrIpeGvfR7eiZLbJOqIoxpZSqHU7RmsaUt8isRRXli	TestUser4	LastName4	customer	t	f	2025-08-18 14:33:10.33747+00	2025-08-18 14:33:10.33747+00
c888c057-89b6-4abf-b9c9-68ef24a52d17	testuser51755527591353@example.com	$2b$10$mQQkim1GiMILJPuDRnD82eEe5A4UnLMEsJGjTJRWcx5zl17ZLq5/O	TestUser5	LastName5	customer	t	f	2025-08-18 14:33:11.462906+00	2025-08-18 14:33:11.462906+00
e5fe1346-93ca-425c-924c-efb7e6401484	test1755527599952mtbzqy@playwright.test	$2b$10$4YmkkKFQTM5nVpJ0PrNpw.pTS1Xozy/TKLpupopUOEyzXdwtJrcF2	TestUsermtbzqy	LastNamemtbzqy	customer	t	f	2025-08-18 14:33:21.139201+00	2025-08-18 14:33:21.139201+00
00e17658-ef14-49cc-9e5d-45cfa2586e19	mocherka9@gmail.com	$2b$10$N7xD/2nzj8jaV6z8N9oc0OIfJAextU/6B9/foDpEBtt1uepYRBTFS	Moulay	Cherkaoui	customer	t	f	2025-08-18 14:35:58.274798+00	2025-08-18 14:35:58.274798+00
5c6de5b8-058f-430e-931f-e79e8990d216	test1755528029175nscj93@playwright.test	$2b$10$VLTCgDCt52tSdH4cK5/WOuV6BuvUSrrFHts2ML/xS43Z9KpMq3m1y	TestUsernscj93	LastNamenscj93	customer	t	f	2025-08-18 14:40:30.832161+00	2025-08-18 14:40:30.832161+00
ad46b5cb-7ee5-414b-a64c-053395e7d918	mocherkaM@gmail.com	$2b$10$1mIz2WTewq.S/SeCCPIq7eJvwh7Q96qww4jdDfvuiKpSrBNqFtDL6	Mike	Tyse	customer	t	f	2025-08-18 14:41:40.776193+00	2025-08-18 14:41:40.776193+00
59083a1c-24b0-422c-b1a2-ba8d5bafb95f	gestion2@locod-ai.com	$2b$10$NkmjdoCM.b.s2IvTr9/8l.piBzZAmy43StAPoVfFBJY7YUDwehvDi	Moulay-Mokhtar	Cherkaoui	customer	t	f	2025-08-18 14:54:03.988168+00	2025-08-18 14:54:03.988168+00
6ae02838-605d-404d-98db-0fe35ca171e1	gestion3@locod-ai.com	$2b$10$WodAhwEIuSndFKYB2z0zuu232gG3YfX5tnIExRbR3K3BXruA.fVrS	Moulay-Mokhtar	Cherkaoui	customer	t	f	2025-08-18 14:58:04.547127+00	2025-08-18 14:58:04.547127+00
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: locod_user
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: admin_activity_log; Type: TABLE DATA; Schema: public; Owner: locod_user
--

COPY public.admin_activity_log (id, admin_id, action, target_type, target_id, details, ip_address, user_agent, "timestamp") FROM stdin;
1	1	start	system	1	{}	127.0.0.1	test-agent	2025-08-07 08:55:36
2	1	complete	system	1	{}	127.0.0.1	migrated	2025-08-07 08:55:36
3	1	start	system	1	{}	::1	curl/8.8.0	2025-08-07 09:37:14
4	1	assign	ai_request	1	{"status": "assigned"}	::1	curl/8.8.0	2025-08-07 09:46:08
5	1	start	ai_request	1	{"status": "processing"}	::1	curl/8.8.0	2025-08-07 09:49:35
6	1	complete	ai_request	1	{"status": "completed"}	::1	curl/8.8.0	2025-08-07 09:49:36
\.


--
-- Data for Name: ai_request_history; Type: TABLE DATA; Schema: public; Owner: locod_user
--

COPY public.ai_request_history (id, request_id, previous_status, new_status, changed_by, change_reason, details, "timestamp") FROM stdin;
1	1	pending	assigned	1	Auto-assigned to admin	\N	2025-08-07 09:46:08
2	1	assigned	processing	1	Started processing request	\N	2025-08-07 09:49:35
3	1	processing	completed	1	Generated services successfully	\N	2025-08-07 09:49:36
\.


--
-- Data for Name: ai_requests; Type: TABLE DATA; Schema: public; Owner: locod_user
--

COPY public.ai_requests (id, site_id, customer_id, request_type, status, admin_id, request_data, generated_content, processing_notes, created_at, assigned_at, started_at, completed_at, estimated_cost, actual_cost, business_type, terminology, priority, wizard_session_id, admin_comments, billing_status, customer_feedback, customer_notes, feedback_at, revision_count, client_ip, user_agent, processing_duration, error_message, retry_count, expires_at, updated_at) FROM stdin;
1	test-site-001	1	services	completed	1	{"domain": "test.example.com", "siteName": "Test Translation Service", "businessType": "translation"}	{"cta_text": "Demandez votre devis gratuit", "services": [{"name": "Traduction professionnelle", "description": "Services de traduction de haute qualité"}, {"name": "Révision et relecture", "description": "Correction et amélioration de vos textes"}, {"name": "Localisation", "description": "Adaptation culturelle de vos contenus"}], "hero_text": "Votre partenaire de confiance pour tous vos besoins de traduction"}	Generated services for translation business using Claude AI	2025-08-07 09:43:14	2025-08-07 09:46:08	2025-08-07 09:49:35	2025-08-07 09:49:36	2.00	2.50	translation	services	normal	wizard-test-001	\N	pending	\N	\N	\N	0	::1	curl/8.8.0	\N	\N	0	\N	2025-08-07 09:49:36
\.


--
-- Data for Name: typeorm_migrations; Type: TABLE DATA; Schema: public; Owner: locod_user
--

COPY public.typeorm_migrations (id, "timestamp", name) FROM stdin;
2	1755575100000	SimpleV1ToV2Migration1755575100000
3	1755576000000	CompleteWizardSchema1755576000000
\.


--
-- Data for Name: website_wizard_sessions; Type: TABLE DATA; Schema: public; Owner: locod_user
--

COPY public.website_wizard_sessions (id, session_name, status, current_step, completed_steps, progress_percentage, business_info, template_selection, design_preferences, content_data, ai_generation_requests, customization_settings, final_configuration, deployment_config, generated_site_id, expires_at, last_activity_at, estimated_completion_time, customer_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ai_requests; Type: TABLE DATA; Schema: queue; Owner: locod_user
--

COPY queue.ai_requests (id, customer_id, site_id, request_type, request_data, status, assigned_to, priority, prompt, result, error_message, created_at, started_at, completed_at) FROM stdin;
\.


--
-- Data for Name: sites; Type: TABLE DATA; Schema: sites; Owner: locod_user
--

COPY sites.sites (id, customer_id, site_id, site_name, domain, business_type, status, config, deployment_url, created_at, updated_at, deployed_at, build_logs) FROM stdin;
c310f57f-8747-4a19-926b-e07eca9d5f2e	07fde21f-d591-4437-9157-41e3b012f373	test-site-123	Test Site	test.com	\N	created	\N	\N	2025-08-15 00:27:14.335182+00	2025-08-15 00:27:14.335182+00	\N	\N
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: sites; Owner: locod_user
--

COPY sites.templates (id, name, display_name, description, business_types, config, preview_image, is_active, created_at) FROM stdin;
54067b15-fd97-45a8-a32a-a034840fcd79	template-base	Template de Base	Template standard pour tous types de business	{general}	{"version": "2.0"}	\N	t	2025-08-14 19:39:31.72491+00
517b6138-5f0d-446f-b686-430589fbb50d	translation-pro	Translation Professional	Template pour services de traduction	{translation,language-services}	{"version": "2.0"}	\N	t	2025-08-14 19:39:31.72491+00
6497c79c-91fa-4019-b776-fc9a32434d6a	education	Education & Training	Template pour établissements éducatifs	{education,training,course}	{"version": "2.0"}	\N	t	2025-08-14 19:39:31.72491+00
\.


--
-- Name: admin_activity_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: locod_user
--

SELECT pg_catalog.setval('public.admin_activity_log_id_seq', 1, false);


--
-- Name: ai_request_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: locod_user
--

SELECT pg_catalog.setval('public.ai_request_history_id_seq', 1, false);


--
-- Name: ai_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: locod_user
--

SELECT pg_catalog.setval('public.ai_requests_id_seq', 1, false);


--
-- Name: typeorm_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: locod_user
--

SELECT pg_catalog.setval('public.typeorm_migrations_id_seq', 3, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: admin; Owner: locod_user
--

ALTER TABLE ONLY admin.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_key; Type: CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: sessions sessions_token_key; Type: CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_token_key UNIQUE (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: typeorm_migrations PK_bb2f075707dd300ba86d0208923; Type: CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.typeorm_migrations
    ADD CONSTRAINT "PK_bb2f075707dd300ba86d0208923" PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_activity_log admin_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (id);


--
-- Name: ai_request_history ai_request_history_pkey; Type: CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.ai_request_history
    ADD CONSTRAINT ai_request_history_pkey PRIMARY KEY (id);


--
-- Name: ai_requests ai_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.ai_requests
    ADD CONSTRAINT ai_requests_pkey PRIMARY KEY (id);


--
-- Name: website_wizard_sessions website_wizard_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.website_wizard_sessions
    ADD CONSTRAINT website_wizard_sessions_pkey PRIMARY KEY (id);


--
-- Name: ai_requests ai_requests_pkey; Type: CONSTRAINT; Schema: queue; Owner: locod_user
--

ALTER TABLE ONLY queue.ai_requests
    ADD CONSTRAINT ai_requests_pkey PRIMARY KEY (id);


--
-- Name: sites sites_pkey; Type: CONSTRAINT; Schema: sites; Owner: locod_user
--

ALTER TABLE ONLY sites.sites
    ADD CONSTRAINT sites_pkey PRIMARY KEY (id);


--
-- Name: sites sites_site_id_key; Type: CONSTRAINT; Schema: sites; Owner: locod_user
--

ALTER TABLE ONLY sites.sites
    ADD CONSTRAINT sites_site_id_key UNIQUE (site_id);


--
-- Name: templates templates_name_key; Type: CONSTRAINT; Schema: sites; Owner: locod_user
--

ALTER TABLE ONLY sites.templates
    ADD CONSTRAINT templates_name_key UNIQUE (name);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: sites; Owner: locod_user
--

ALTER TABLE ONLY sites.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: admin; Owner: locod_user
--

CREATE INDEX idx_audit_logs_action ON admin.audit_logs USING btree (action);


--
-- Name: idx_audit_logs_admin_user_id; Type: INDEX; Schema: admin; Owner: locod_user
--

CREATE INDEX idx_audit_logs_admin_user_id ON admin.audit_logs USING btree (admin_user_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: admin; Owner: locod_user
--

CREATE INDEX idx_audit_logs_created_at ON admin.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_target_user_id; Type: INDEX; Schema: admin; Owner: locod_user
--

CREATE INDEX idx_audit_logs_target_user_id ON admin.audit_logs USING btree (target_user_id);


--
-- Name: idx_sessions_is_active; Type: INDEX; Schema: auth; Owner: locod_user
--

CREATE INDEX idx_sessions_is_active ON auth.sessions USING btree (is_active);


--
-- Name: idx_sessions_last_active_at; Type: INDEX; Schema: auth; Owner: locod_user
--

CREATE INDEX idx_sessions_last_active_at ON auth.sessions USING btree (last_active_at);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: auth; Owner: locod_user
--

CREATE INDEX idx_sessions_token ON auth.sessions USING btree (token);


--
-- Name: idx_sessions_user_id_is_active; Type: INDEX; Schema: auth; Owner: locod_user
--

CREATE INDEX idx_sessions_user_id_is_active ON auth.sessions USING btree (user_id, is_active);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: locod_user
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_activity_logs_created; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_user; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_activity_logs_user ON public.activity_logs USING btree (user_id);


--
-- Name: idx_admin_activity_target; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_admin_activity_target ON public.admin_activity_log USING btree (target_type, target_id);


--
-- Name: idx_admin_activity_timestamp; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_admin_activity_timestamp ON public.admin_activity_log USING btree ("timestamp");


--
-- Name: idx_ai_history_request; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_history_request ON public.ai_request_history USING btree (request_id);


--
-- Name: idx_ai_requests_admin; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_admin ON public.ai_requests USING btree (admin_id);


--
-- Name: idx_ai_requests_billing_status; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_billing_status ON public.ai_requests USING btree (billing_status);


--
-- Name: idx_ai_requests_business_type; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_business_type ON public.ai_requests USING btree (business_type);


--
-- Name: idx_ai_requests_created; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_created ON public.ai_requests USING btree (created_at);


--
-- Name: idx_ai_requests_customer; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_customer ON public.ai_requests USING btree (customer_id);


--
-- Name: idx_ai_requests_expires; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_expires ON public.ai_requests USING btree (expires_at);


--
-- Name: idx_ai_requests_priority; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_priority ON public.ai_requests USING btree (priority);


--
-- Name: idx_ai_requests_status; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_status ON public.ai_requests USING btree (status);


--
-- Name: idx_ai_requests_updated; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_updated ON public.ai_requests USING btree (updated_at);


--
-- Name: idx_ai_requests_wizard_session; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_ai_requests_wizard_session ON public.ai_requests USING btree (wizard_session_id);


--
-- Name: idx_wizard_sessions_activity; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_wizard_sessions_activity ON public.website_wizard_sessions USING btree (last_activity_at);


--
-- Name: idx_wizard_sessions_customer; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_wizard_sessions_customer ON public.website_wizard_sessions USING btree (customer_id);


--
-- Name: idx_wizard_sessions_expires; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_wizard_sessions_expires ON public.website_wizard_sessions USING btree (expires_at);


--
-- Name: idx_wizard_sessions_site; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_wizard_sessions_site ON public.website_wizard_sessions USING btree (generated_site_id);


--
-- Name: idx_wizard_sessions_status; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_wizard_sessions_status ON public.website_wizard_sessions USING btree (status);


--
-- Name: idx_wizard_sessions_step; Type: INDEX; Schema: public; Owner: locod_user
--

CREATE INDEX idx_wizard_sessions_step ON public.website_wizard_sessions USING btree (current_step);


--
-- Name: idx_ai_requests_customer; Type: INDEX; Schema: queue; Owner: locod_user
--

CREATE INDEX idx_ai_requests_customer ON queue.ai_requests USING btree (customer_id);


--
-- Name: idx_ai_requests_status; Type: INDEX; Schema: queue; Owner: locod_user
--

CREATE INDEX idx_ai_requests_status ON queue.ai_requests USING btree (status);


--
-- Name: idx_sites_customer; Type: INDEX; Schema: sites; Owner: locod_user
--

CREATE INDEX idx_sites_customer ON sites.sites USING btree (customer_id);


--
-- Name: idx_sites_status; Type: INDEX; Schema: sites; Owner: locod_user
--

CREATE INDEX idx_sites_status ON sites.sites USING btree (status);


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: auth; Owner: locod_user
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sites update_sites_updated_at; Type: TRIGGER; Schema: sites; Owner: locod_user
--

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_logs audit_logs_admin_user_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: locod_user
--

ALTER TABLE ONLY admin.audit_logs
    ADD CONSTRAINT audit_logs_admin_user_id_fkey FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: admin; Owner: locod_user
--

ALTER TABLE ONLY admin.audit_logs
    ADD CONSTRAINT audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: customers customers_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.customers
    ADD CONSTRAINT customers_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: locod_user
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: ai_request_history ai_request_history_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: locod_user
--

ALTER TABLE ONLY public.ai_request_history
    ADD CONSTRAINT ai_request_history_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.ai_requests(id) ON DELETE CASCADE;


--
-- Name: ai_requests ai_requests_assigned_to_fkey; Type: FK CONSTRAINT; Schema: queue; Owner: locod_user
--

ALTER TABLE ONLY queue.ai_requests
    ADD CONSTRAINT ai_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);


--
-- Name: ai_requests ai_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: queue; Owner: locod_user
--

ALTER TABLE ONLY queue.ai_requests
    ADD CONSTRAINT ai_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id);


--
-- Name: ai_requests ai_requests_site_id_fkey; Type: FK CONSTRAINT; Schema: queue; Owner: locod_user
--

ALTER TABLE ONLY queue.ai_requests
    ADD CONSTRAINT ai_requests_site_id_fkey FOREIGN KEY (site_id) REFERENCES sites.sites(id);


--
-- Name: sites sites_customer_id_fkey; Type: FK CONSTRAINT; Schema: sites; Owner: locod_user
--

ALTER TABLE ONLY sites.sites
    ADD CONSTRAINT sites_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

