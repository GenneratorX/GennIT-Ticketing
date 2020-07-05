--
-- PostgreSQL database dump
--

-- Dumped from database version 12.3
-- Dumped by pg_dump version 12.3

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
-- Name: gennit; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA gennit;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: conversation; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.conversation (
    conversation_id character(12) NOT NULL,
    create_date timestamp without time zone DEFAULT now()
);


--
-- Name: department; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.department (
    department_id smallint NOT NULL,
    name character varying(50) NOT NULL
);


--
-- Name: gender; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.gender (
    gender_id smallint NOT NULL,
    name character varying(15)
);


--
-- Name: message; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.message (
    message_id integer NOT NULL,
    message character varying(2000) NOT NULL,
    create_date timestamp without time zone DEFAULT now(),
    user_id character(12) NOT NULL,
    conversation_id character(12) NOT NULL
);


--
-- Name: message_message_id_seq; Type: SEQUENCE; Schema: gennit; Owner: -
--

CREATE SEQUENCE gennit.message_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_message_id_seq; Type: SEQUENCE OWNED BY; Schema: gennit; Owner: -
--

ALTER SEQUENCE gennit.message_message_id_seq OWNED BY gennit.message.message_id;


--
-- Name: ticket; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.ticket (
    ticket_id character(12) NOT NULL,
    title character varying(100) NOT NULL,
    message character varying(2000) NOT NULL,
    start_date timestamp without time zone DEFAULT now(),
    end_date timestamp without time zone,
    status_id smallint NOT NULL,
    priority_id smallint NOT NULL,
    department_id smallint NOT NULL,
    created_by character(12) NOT NULL,
    assigned_to character(12),
    conversation_id character(12) NOT NULL
);


--
-- Name: ticket_event; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.ticket_event (
    event_id integer NOT NULL,
    ticket_id character(12) NOT NULL,
    user_id character(12) NOT NULL,
    event_type smallint NOT NULL,
    event_date timestamp without time zone DEFAULT now() NOT NULL,
    assignee_from character(12),
    assignee_to character(12),
    status_from smallint,
    status_to smallint,
    priority_from smallint,
    priority_to smallint,
    department_from smallint,
    department_to smallint,
    end_date_from timestamp without time zone,
    end_date_to timestamp without time zone
);


--
-- Name: ticket_event_event_id_seq; Type: SEQUENCE; Schema: gennit; Owner: -
--

CREATE SEQUENCE gennit.ticket_event_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ticket_event_event_id_seq; Type: SEQUENCE OWNED BY; Schema: gennit; Owner: -
--

ALTER SEQUENCE gennit.ticket_event_event_id_seq OWNED BY gennit.ticket_event.event_id;


--
-- Name: ticket_event_type; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.ticket_event_type (
    event_type smallint NOT NULL,
    event_description character varying(16) NOT NULL
);


--
-- Name: ticket_priority; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.ticket_priority (
    priority_id smallint NOT NULL,
    priority character varying(10) NOT NULL
);


--
-- Name: ticket_status; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.ticket_status (
    status_id smallint NOT NULL,
    status character varying(15) NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.users (
    user_id character(12) NOT NULL,
    username character varying(40) NOT NULL,
    password character(247) NOT NULL,
    email character varying(254) NOT NULL,
    active boolean DEFAULT false,
    create_date timestamp without time zone DEFAULT now(),
    last_login timestamp without time zone,
    admin boolean DEFAULT false,
    first_name character varying(50),
    last_name character varying(50),
    birth_date date,
    gender smallint,
    phone_number character varying(15)
);


--
-- Name: users_activation; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.users_activation (
    user_id character(12) NOT NULL,
    activation_code character(172) NOT NULL
);


--
-- Name: users_relationship; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.users_relationship (
    user_1 character(12) NOT NULL,
    user_2 character(12) NOT NULL,
    status character(1) NOT NULL
);


--
-- Name: users_relationship_status; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.users_relationship_status (
    status_id character(1) NOT NULL,
    name character varying(20) NOT NULL
);


--
-- Name: users_reset; Type: TABLE; Schema: gennit; Owner: -
--

CREATE TABLE gennit.users_reset (
    user_id character(12) NOT NULL,
    reset_code character(172) NOT NULL
);


--
-- Name: message message_id; Type: DEFAULT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.message ALTER COLUMN message_id SET DEFAULT nextval('gennit.message_message_id_seq'::regclass);


--
-- Name: ticket_event event_id; Type: DEFAULT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event ALTER COLUMN event_id SET DEFAULT nextval('gennit.ticket_event_event_id_seq'::regclass);


--
-- Name: conversation conversation_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.conversation
    ADD CONSTRAINT conversation_pkey PRIMARY KEY (conversation_id);


--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.department
    ADD CONSTRAINT department_pkey PRIMARY KEY (department_id);


--
-- Name: gender gender_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.gender
    ADD CONSTRAINT gender_pkey PRIMARY KEY (gender_id);


--
-- Name: message message_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.message
    ADD CONSTRAINT message_pkey PRIMARY KEY (message_id);


--
-- Name: ticket_event ticket_event_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_pkey PRIMARY KEY (event_id);


--
-- Name: ticket_event_type ticket_event_types_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event_type
    ADD CONSTRAINT ticket_event_types_pkey PRIMARY KEY (event_type);


--
-- Name: ticket ticket_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_pkey PRIMARY KEY (ticket_id);


--
-- Name: ticket_priority ticket_priority_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_priority
    ADD CONSTRAINT ticket_priority_pkey PRIMARY KEY (priority_id);


--
-- Name: ticket_status ticket_status_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_status
    ADD CONSTRAINT ticket_status_pkey PRIMARY KEY (status_id);


--
-- Name: users_activation users_activation_activation_code_key; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_activation
    ADD CONSTRAINT users_activation_activation_code_key UNIQUE (activation_code);


--
-- Name: users_activation users_activation_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_activation
    ADD CONSTRAINT users_activation_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users_relationship users_relationship_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_relationship
    ADD CONSTRAINT users_relationship_pkey PRIMARY KEY (user_1, user_2);


--
-- Name: users_relationship_status users_relationship_status_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_relationship_status
    ADD CONSTRAINT users_relationship_status_pkey PRIMARY KEY (status_id);


--
-- Name: users_reset users_reset_pkey; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_reset
    ADD CONSTRAINT users_reset_pkey PRIMARY KEY (user_id);


--
-- Name: users_reset users_reset_reset_code_key; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_reset
    ADD CONSTRAINT users_reset_reset_code_key UNIQUE (reset_code);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: message message_conversation_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.message
    ADD CONSTRAINT message_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES gennit.conversation(conversation_id) ON DELETE CASCADE;


--
-- Name: message message_user_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.message
    ADD CONSTRAINT message_user_id_fkey FOREIGN KEY (user_id) REFERENCES gennit.users(user_id);


--
-- Name: ticket ticket_assigned_to_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES gennit.users(user_id);


--
-- Name: ticket ticket_conversation_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES gennit.conversation(conversation_id);


--
-- Name: ticket ticket_created_by_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_created_by_fkey FOREIGN KEY (created_by) REFERENCES gennit.users(user_id);


--
-- Name: ticket ticket_department_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_department_id_fkey FOREIGN KEY (department_id) REFERENCES gennit.department(department_id);


--
-- Name: ticket_event ticket_event_assignee_from_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_assignee_from_fkey FOREIGN KEY (assignee_from) REFERENCES gennit.users(user_id);


--
-- Name: ticket_event ticket_event_assignee_to_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_assignee_to_fkey FOREIGN KEY (assignee_to) REFERENCES gennit.users(user_id);


--
-- Name: ticket_event ticket_event_department_from_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_department_from_fkey FOREIGN KEY (department_from) REFERENCES gennit.department(department_id);


--
-- Name: ticket_event ticket_event_department_to_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_department_to_fkey FOREIGN KEY (department_to) REFERENCES gennit.department(department_id);


--
-- Name: ticket_event ticket_event_event_type_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_event_type_fkey FOREIGN KEY (event_type) REFERENCES gennit.ticket_event_type(event_type);


--
-- Name: ticket_event ticket_event_priority_from_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_priority_from_fkey FOREIGN KEY (priority_from) REFERENCES gennit.ticket_priority(priority_id);


--
-- Name: ticket_event ticket_event_priority_to_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_priority_to_fkey FOREIGN KEY (priority_to) REFERENCES gennit.ticket_priority(priority_id);


--
-- Name: ticket_event ticket_event_status_from_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_status_from_fkey FOREIGN KEY (status_from) REFERENCES gennit.ticket_status(status_id);


--
-- Name: ticket_event ticket_event_status_to_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_status_to_fkey FOREIGN KEY (status_to) REFERENCES gennit.ticket_status(status_id);


--
-- Name: ticket_event ticket_event_ticket_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES gennit.ticket(ticket_id) ON DELETE CASCADE;


--
-- Name: ticket_event ticket_event_user_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket_event
    ADD CONSTRAINT ticket_event_user_id_fkey FOREIGN KEY (user_id) REFERENCES gennit.users(user_id);


--
-- Name: ticket ticket_priority_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_priority_id_fkey FOREIGN KEY (priority_id) REFERENCES gennit.ticket_priority(priority_id);


--
-- Name: ticket ticket_status_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.ticket
    ADD CONSTRAINT ticket_status_id_fkey FOREIGN KEY (status_id) REFERENCES gennit.ticket_status(status_id);


--
-- Name: users_activation users_activation_user_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_activation
    ADD CONSTRAINT users_activation_user_id_fkey FOREIGN KEY (user_id) REFERENCES gennit.users(user_id) ON DELETE CASCADE;


--
-- Name: users users_gender_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_gender_fkey FOREIGN KEY (gender) REFERENCES gennit.gender(gender_id) ON DELETE CASCADE;


--
-- Name: users_relationship users_relationship_status_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_relationship
    ADD CONSTRAINT users_relationship_status_fkey FOREIGN KEY (status) REFERENCES gennit.users_relationship_status(status_id);


--
-- Name: users_relationship users_relationship_user_1_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_relationship
    ADD CONSTRAINT users_relationship_user_1_fkey FOREIGN KEY (user_1) REFERENCES gennit.users(user_id) ON DELETE CASCADE;


--
-- Name: users_relationship users_relationship_user_2_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_relationship
    ADD CONSTRAINT users_relationship_user_2_fkey FOREIGN KEY (user_2) REFERENCES gennit.users(user_id) ON DELETE CASCADE;


--
-- Name: users_reset users_reset_user_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: -
--

ALTER TABLE ONLY gennit.users_reset
    ADD CONSTRAINT users_reset_user_id_fkey FOREIGN KEY (user_id) REFERENCES gennit.users(user_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
