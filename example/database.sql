--
-- PostgreSQL database dump
--

-- Dumped from database version 12.2
-- Dumped by pg_dump version 12.2

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

ALTER TABLE ONLY gennit.users_reset DROP CONSTRAINT users_reset_user_id_fkey;
ALTER TABLE ONLY gennit.users DROP CONSTRAINT users_gender_fkey;
ALTER TABLE ONLY gennit.users_activation DROP CONSTRAINT users_activation_user_id_fkey;
ALTER TABLE ONLY gennit.users DROP CONSTRAINT users_username_key;
ALTER TABLE ONLY gennit.users_reset DROP CONSTRAINT users_reset_reset_code_key;
ALTER TABLE ONLY gennit.users_reset DROP CONSTRAINT users_reset_pkey;
ALTER TABLE ONLY gennit.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY gennit.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY gennit.users_activation DROP CONSTRAINT users_activation_pkey;
ALTER TABLE ONLY gennit.users_activation DROP CONSTRAINT users_activation_activation_code_key;
ALTER TABLE ONLY gennit.gender DROP CONSTRAINT gender_pkey;
DROP TABLE gennit.users_reset;
DROP TABLE gennit.users_activation;
DROP TABLE gennit.users;
DROP TABLE gennit.gender;
DROP SCHEMA gennit;
--
-- Name: gennit; Type: SCHEMA; Schema: -; Owner: Gennerator
--

CREATE SCHEMA gennit;


ALTER SCHEMA gennit OWNER TO "Gennerator";

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: gender; Type: TABLE; Schema: gennit; Owner: Gennerator
--

CREATE TABLE gennit.gender (
    gender_id smallint NOT NULL,
    name character varying(15)
);


ALTER TABLE gennit.gender OWNER TO "Gennerator";

--
-- Name: users; Type: TABLE; Schema: gennit; Owner: Gennerator
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


ALTER TABLE gennit.users OWNER TO "Gennerator";

--
-- Name: users_activation; Type: TABLE; Schema: gennit; Owner: Gennerator
--

CREATE TABLE gennit.users_activation (
    user_id character(12) NOT NULL,
    activation_code character(172) NOT NULL
);


ALTER TABLE gennit.users_activation OWNER TO "Gennerator";

--
-- Name: users_reset; Type: TABLE; Schema: gennit; Owner: Gennerator
--

CREATE TABLE gennit.users_reset (
    user_id character(12) NOT NULL,
    reset_code character(172) NOT NULL
);


ALTER TABLE gennit.users_reset OWNER TO "Gennerator";

--
-- Name: gender gender_pkey; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.gender
    ADD CONSTRAINT gender_pkey PRIMARY KEY (gender_id);


--
-- Name: users_activation users_activation_activation_code_key; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users_activation
    ADD CONSTRAINT users_activation_activation_code_key UNIQUE (activation_code);


--
-- Name: users_activation users_activation_pkey; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users_activation
    ADD CONSTRAINT users_activation_pkey PRIMARY KEY (user_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users_reset users_reset_pkey; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users_reset
    ADD CONSTRAINT users_reset_pkey PRIMARY KEY (user_id);


--
-- Name: users_reset users_reset_reset_code_key; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users_reset
    ADD CONSTRAINT users_reset_reset_code_key UNIQUE (reset_code);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: users_activation users_activation_user_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users_activation
    ADD CONSTRAINT users_activation_user_id_fkey FOREIGN KEY (user_id) REFERENCES gennit.users(user_id) ON DELETE CASCADE;


--
-- Name: users users_gender_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users
    ADD CONSTRAINT users_gender_fkey FOREIGN KEY (gender) REFERENCES gennit.gender(gender_id) ON DELETE CASCADE;


--
-- Name: users_reset users_reset_user_id_fkey; Type: FK CONSTRAINT; Schema: gennit; Owner: Gennerator
--

ALTER TABLE ONLY gennit.users_reset
    ADD CONSTRAINT users_reset_user_id_fkey FOREIGN KEY (user_id) REFERENCES gennit.users(user_id) ON DELETE CASCADE;


--
-- Name: SCHEMA gennit; Type: ACL; Schema: -; Owner: Gennerator
--

GRANT USAGE ON SCHEMA gennit TO production;


--
-- Name: TABLE gender; Type: ACL; Schema: gennit; Owner: Gennerator
--

GRANT SELECT,INSERT,UPDATE ON TABLE gennit.gender TO production;


--
-- Name: TABLE users; Type: ACL; Schema: gennit; Owner: Gennerator
--

GRANT SELECT,INSERT,UPDATE ON TABLE gennit.users TO production;


--
-- Name: TABLE users_activation; Type: ACL; Schema: gennit; Owner: Gennerator
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE gennit.users_activation TO production;


--
-- Name: TABLE users_reset; Type: ACL; Schema: gennit; Owner: Gennerator
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE gennit.users_reset TO production;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: gennit; Owner: Gennerator
--

ALTER DEFAULT PRIVILEGES FOR ROLE "Gennerator" IN SCHEMA gennit REVOKE ALL ON SEQUENCES  FROM "Gennerator";
ALTER DEFAULT PRIVILEGES FOR ROLE "Gennerator" IN SCHEMA gennit GRANT USAGE ON SEQUENCES  TO production;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: gennit; Owner: Gennerator
--

ALTER DEFAULT PRIVILEGES FOR ROLE "Gennerator" IN SCHEMA gennit REVOKE ALL ON TABLES  FROM "Gennerator";
ALTER DEFAULT PRIVILEGES FOR ROLE "Gennerator" IN SCHEMA gennit GRANT SELECT,INSERT,UPDATE ON TABLES  TO production;


--
-- PostgreSQL database dump complete
--
