-- KKNHub PostgreSQL Database Schema Initialization
-- Kelompok KKN 211 Desa Sukaluyu, Cianjur
-- Senior Database Architect & System Analyst Blueprint

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. USERS PROFILE TABLE (Linked to auth.users)
-- -------------------------------------------------------------
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    photo_url TEXT,
    role VARCHAR(30) NOT NULL CHECK (role IN ('Anggota', 'Sekretaris')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on users profiles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 2. GROUPS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name VARCHAR(100) NOT NULL,
    village VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 3. GROUP MEMBERS RELATION MAPPING
-- -------------------------------------------------------------
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_group_user UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 4. PROGRAMS (Program Kerja) TABLE
-- -------------------------------------------------------------
CREATE TABLE public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    pic_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    deadline DATE,
    location VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Belum Dimulai' CHECK (status IN ('Belum Dimulai', 'Berjalan', 'Selesai')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 5. TIMELINES (Agenda Kegiatan) TABLE
-- -------------------------------------------------------------
CREATE TABLE public.timelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT check_timeline_times CHECK (end_time > start_time)
);

ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 6. LOGBOOKS (Laporan Harian Anggota) TABLE
-- -------------------------------------------------------------
CREATE TABLE public.logbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    timeline_id UUID REFERENCES public.timelines(id) ON DELETE SET NULL,
    date DATE NOT NULL CHECK (date <= CURRENT_DATE),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Selesai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_logbook_times CHECK (end_time > start_time)
);

ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 7. PHOTOS (Logbook Documentation) TABLE
-- -------------------------------------------------------------
CREATE TABLE public.photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    logbook_id UUID NOT NULL REFERENCES public.logbooks(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 8. DOCUMENTS TABLE
-- -------------------------------------------------------------
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------
-- 9. MEETING NOTES TABLE
-- -------------------------------------------------------------
CREATE TABLE public.meeting_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    location VARCHAR(255),
    participants TEXT[] NOT NULL,
    discussion TEXT NOT NULL,
    decision TEXT,
    follow_up TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;


-- =============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================

-- Helper Function to check if a user is a member of the same group
CREATE OR REPLACE FUNCTION public.is_group_member(group_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_members.group_id = is_group_member.group_id 
        AND group_members.user_id = is_group_member.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    u_role VARCHAR;
BEGIN
    SELECT role INTO u_role FROM public.users WHERE id = user_id;
    RETURN u_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. USERS POLICIES
CREATE POLICY "Users can read all profiles in their KKN group" ON public.users
    FOR SELECT TO authenticated
    USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm1
            JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
            WHERE gm1.user_id = auth.uid() AND gm2.user_id = users.id
        )
    );

CREATE POLICY "Users can update their own profile details" ON public.users
    FOR UPDATE TO authenticated
    USING (id = auth.uid());

CREATE POLICY "Sekretaris can create user profiles" ON public.users
    FOR INSERT TO authenticated
    WITH CHECK (public.get_user_role(auth.uid()) = 'Sekretaris');


-- 2. GROUPS POLICIES
CREATE POLICY "Members can select their own group details" ON public.groups
    FOR SELECT TO authenticated
    USING (public.is_group_member(groups.id, auth.uid()));

CREATE POLICY "Sekretaris can create or modify group" ON public.groups
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Sekretaris');


-- 3. GROUP MEMBERS POLICIES
CREATE POLICY "Members can view mapping of their group" ON public.group_members
    FOR SELECT TO authenticated
    USING (
        public.is_group_member(group_members.group_id, auth.uid())
    );

CREATE POLICY "Sekretaris can manage mapping" ON public.group_members
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Sekretaris');


-- 4. PROGRAMS (Proker) POLICIES
CREATE POLICY "Authenticated users can select all prokers" ON public.programs
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Sekretaris can fully manage programs" ON public.programs
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Sekretaris');


-- 5. TIMELINES POLICIES
CREATE POLICY "Authenticated users can select all timelines" ON public.timelines
    FOR SELECT TO authenticated
    USING (TRUE);

CREATE POLICY "Sekretaris can manage timelines" ON public.timelines
    FOR ALL TO authenticated
    USING (public.get_user_role(auth.uid()) = 'Sekretaris');


-- 6. LOGBOOKS POLICIES
CREATE POLICY "Users can fully manage their own logbooks" ON public.logbooks
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Sekretaris can view all group logbooks" ON public.logbooks
    FOR SELECT TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'Sekretaris'
    );


-- 7. PHOTOS POLICIES
CREATE POLICY "Users can manage photos linked to their logbooks" ON public.photos
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.logbooks l
            WHERE l.id = photos.logbook_id
            AND l.user_id = auth.uid()
        )
    );

CREATE POLICY "Sekretaris can view all photos" ON public.photos
    FOR SELECT TO authenticated
    USING (
        public.get_user_role(auth.uid()) = 'Sekretaris'
    );


-- 8. DOCUMENTS & 9. MEETING NOTES POLICIES
CREATE POLICY "Members can view files and meeting notes" ON public.documents
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Members can view meeting summaries" ON public.meeting_notes
    FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Sekretaris can manage files" ON public.documents
    FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'Sekretaris');

CREATE POLICY "Sekretaris can manage meeting summaries" ON public.meeting_notes
    FOR ALL TO authenticated USING (public.get_user_role(auth.uid()) = 'Sekretaris');


-- =============================================================
-- AUTOMATIC AUTH USER SYNC TO PUBLIC PROFILE TRIGGER
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Nama Anggota'),
        new.email,
        new.raw_user_meta_data->>'phone',
        COALESCE(new.raw_user_meta_data->>'role', 'Anggota')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution binding
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
