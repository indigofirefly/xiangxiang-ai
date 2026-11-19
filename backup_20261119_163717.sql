--
-- PostgreSQL database dump
--

\restrict MztAKWCoQJTIfCoVQGiXzfqnEhfeGcHYDdBq2PRHiEdBaODvCaRJIdaqeNFbXxs

-- Dumped from database version 18.7
-- Dumped by pg_dump version 18.7

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: nestjs_lkk
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO nestjs_lkk;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: nestjs_lkk
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title text NOT NULL,
    content text,
    published boolean DEFAULT false NOT NULL,
    "authorId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone
);


ALTER TABLE public.posts OWNER TO nestjs_lkk;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: nestjs_lkk
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO nestjs_lkk;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nestjs_lkk
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: nestjs_lkk
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    phone character varying(11),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.users OWNER TO nestjs_lkk;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: nestjs_lkk
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO nestjs_lkk;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: nestjs_lkk
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: nestjs_lkk
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: nestjs_lkk
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: nestjs_lkk
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
66663706-6685-4af5-9ebb-36847968c5e7	a05609e226bc563898ff1a41426fb587daba4dc9872a0b76e7b09731be81c190	2026-11-19 07:56:16.142127+00	20261117080503_add	\N	\N	2026-11-19 07:56:16.114324+00	1
90572fd1-77da-48d2-8ec8-cd0cbe936b9b	c7b67366f497f9a1a4f079cdcf944cf9a2320f08896de30806aec138ca17c105	2026-11-19 07:56:16.145075+00	20261118012354_add_phone_into_users	\N	\N	2026-11-19 07:56:16.142614+00	1
6eae2c17-2f17-4d06-b150-2b61cb5e729f	a3b8929f51075db6aad92b02a47a54a9ffa25c5dbbe953f57895f9cb20e07292	2026-11-19 07:56:16.153571+00	20261118064714_add_user_phone	\N	\N	2026-11-19 07:56:16.145541+00	1
b843bf37-7413-4324-8315-0faca953bae0	9bda0bb9014d8c569a70a8c219d5fe5b16d7e69bacea51b8583c77cc5af7ec2c	2026-11-19 07:56:16.157958+00	20261118084054_add_operate_time	\N	\N	2026-11-19 07:56:16.154069+00	1
07d2d72c-66f5-491e-b79a-7cae8a485efa	51c4f51876b6a3a626533ec679c1ab9fa7b8f18238885bf678d3b4ccf5da5df3	2026-11-19 07:56:16.161872+00	20261118084350_allow_reuse_email_after_soft_delete	\N	\N	2026-11-19 07:56:16.158306+00	1
a4fe9aaa-91e9-45a1-8348-919d52282e86	df9ef79f385f49179a909aa9f59a79072cc949d828557498cbe78142e7bbee47	2026-11-19 07:56:16.164366+00	20261118084700_restore_email_unique	\N	\N	2026-11-19 07:56:16.162217+00	1
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: nestjs_lkk
--

COPY public.posts (id, title, content, published, "authorId", "createdAt", "updatedAt", "deletedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: nestjs_lkk
--

COPY public.users (id, email, name, phone, "createdAt", "deletedAt", "updatedAt") FROM stdin;
1	123@qq.com	巷巷	13505960695	2026-11-19 08:05:13.167	\N	2026-11-19 08:05:13.167
2	23423424@qq.com	巷巷1	1353453534	2026-11-19 08:20:36.763	\N	2026-11-19 08:20:36.763
\.


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nestjs_lkk
--

SELECT pg_catalog.setval('public.posts_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: nestjs_lkk
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: nestjs_lkk
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: nestjs_lkk
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: nestjs_lkk
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: nestjs_lkk
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: posts posts_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: nestjs_lkk
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict MztAKWCoQJTIfCoVQGiXzfqnEhfeGcHYDdBq2PRHiEdBaODvCaRJIdaqeNFbXxs

