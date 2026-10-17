-- ============================================
-- SCHEMA DE BASE DE DATOS - COMMUNITY PROJECT
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: profiles
-- Perfiles de usuarios (estudiantes, instituciones, admin)
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'institution', 'admin')),
    email VARCHAR(255),
    career VARCHAR(255),
    semester INTEGER CHECK (semester >= 1 AND semester <= 12),
    cv_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: institutions
-- Información de instituciones educativas
-- ============================================
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    schedule JSONB,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- ============================================
-- TABLA: departments
-- Departamentos de una institución (para clasificar necesidades)
-- ============================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(institution_id, name)
);

-- ============================================
-- TABLA: needs
-- Necesidades/opportunidades publicadas por instituciones
-- ============================================
CREATE TABLE needs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: applications
-- Solicitudes de estudiantes a necesidades
-- ============================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: notifications
-- Notificaciones a instituciones/estudiantes (ej: nueva solicitud)
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'new_application',
    need_id UUID REFERENCES needs(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para mejorar rendimiento
-- ============================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_institutions_profile_id ON institutions(profile_id);
CREATE INDEX idx_institutions_verified ON institutions(verified);
CREATE INDEX idx_departments_institution_id ON departments(institution_id);
CREATE INDEX idx_needs_institution_id ON needs(institution_id);
CREATE INDEX idx_needs_department_id ON needs(department_id);
CREATE INDEX idx_needs_status ON needs(status);
CREATE INDEX idx_applications_need_id ON applications(need_id);
CREATE INDEX idx_applications_student_id ON applications(student_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, read, created_at DESC);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================
-- POLICIES DE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy: institutions
CREATE POLICY "Anyone can view institutions" ON institutions FOR SELECT USING (true);
CREATE POLICY "Institutions can update own institution" ON institutions FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Institutions can insert own institution" ON institutions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Admins can update any institution" ON institutions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policy: departments
CREATE POLICY "Anyone can view departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Institutions can manage own departments" ON departments FOR ALL USING (
    EXISTS (
        SELECT 1 FROM institutions 
        WHERE institutions.id = departments.institution_id 
        AND institutions.profile_id = auth.uid()
    )
);

-- Policy: needs
CREATE POLICY "Anyone can view needs" ON needs FOR SELECT USING (true);
CREATE POLICY "Institutions can manage own needs" ON needs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM institutions 
        WHERE institutions.id = needs.institution_id 
        AND institutions.profile_id = auth.uid()
    )
);

-- Policy: applications
CREATE POLICY "Students can view own applications" ON applications FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Institutions can view applications for their needs" ON applications FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM needs 
        JOIN institutions ON needs.institution_id = institutions.id
        WHERE needs.id = applications.need_id 
        AND institutions.profile_id = auth.uid()
    )
);
CREATE POLICY "Students can create applications" ON applications FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Institutions can update application status" ON applications FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM needs 
        JOIN institutions ON needs.institution_id = institutions.id
        WHERE needs.id = applications.need_id 
        AND institutions.profile_id = auth.uid()
    )
);

-- Policy: notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- ============================================
-- PERMISOS (GRANTS) para los roles de Supabase
-- IMPORTANTE: RLS + policies NO bastan; sin estos GRANT la app
-- recibe "permission denied for table ..." (rol authenticated/anon)
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON institutions TO authenticated;
GRANT SELECT ON institutions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO authenticated;
GRANT SELECT ON departments TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON needs TO authenticated;
GRANT SELECT ON needs TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON applications TO authenticated;
GRANT SELECT ON applications TO anon;

GRANT SELECT, UPDATE ON notifications TO authenticated;

-- ============================================
-- STORAGE: buckets y políticas para avatares y CVs
-- (corrige el error "new row violates row-level security policy")
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true), ('cvs', 'cvs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "avatars_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete" ON storage.objects;
DROP POLICY IF EXISTS "cvs_upload" ON storage.objects;
DROP POLICY IF EXISTS "cvs_update" ON storage.objects;
DROP POLICY IF EXISTS "cvs_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_all" ON storage.objects;
DROP POLICY IF EXISTS "cvs_all" ON storage.objects;

CREATE POLICY "avatars_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "cvs_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cvs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================
-- TABLA: team_members
-- Integrantes del equipo de un estudiante
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, member_id),
    CHECK (owner_id <> member_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_owner ON team_members(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own team members" ON team_members FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owner can insert team members" ON team_members FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner can delete team members" ON team_members FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Institution can view team members of applicants" ON team_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM applications a
        JOIN needs n ON n.id = a.need_id
        JOIN institutions i ON i.id = n.institution_id
        WHERE a.student_id = team_members.owner_id
        AND i.profile_id = auth.uid()
    )
);

GRANT SELECT, INSERT, DELETE ON team_members TO authenticated;

-- ============================================
-- TRIGGER para notificar a la institución al recibir una solicitud
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_application_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_institution_profile_id UUID;
    v_need_title TEXT;
    v_student_name TEXT;
BEGIN
    SELECT i.profile_id, n.title
    INTO v_institution_profile_id, v_need_title
    FROM public.needs n
    JOIN public.institutions i ON i.id = n.institution_id
    WHERE n.id = NEW.need_id;

    IF v_institution_profile_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(
        NULLIF(TRIM(p.first_name || ' ' || p.last_name), ''),
        p.full_name,
        'Un estudiante'
    )
    INTO v_student_name
    FROM public.profiles p
    WHERE p.id = NEW.student_id;

    INSERT INTO public.notifications (recipient_id, type, need_id, message)
    VALUES (
        v_institution_profile_id,
        'new_application',
        NEW.need_id,
        v_student_name || ' solicitó participar en "' || COALESCE(v_need_title, 'una necesidad') || '"'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_application_notification
    AFTER INSERT ON applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_application_notification();

-- ============================================
-- TRIGGER para notificar al estudiante al aceptar su solicitud
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_application_accepted()
RETURNS TRIGGER AS $$
DECLARE
    v_need_title TEXT;
    v_institution_name TEXT;
    v_institution_address TEXT;
    v_institution_phone TEXT;
    v_message TEXT;
BEGIN
    IF NEW.status <> 'accepted' OR OLD.status = 'accepted' THEN
        RETURN NEW;
    END IF;

    SELECT n.title, i.name, i.address, i.phone
    INTO v_need_title, v_institution_name, v_institution_address, v_institution_phone
    FROM public.needs n
    JOIN public.institutions i ON i.id = n.institution_id
    WHERE n.id = NEW.need_id;

    v_message := '¡Tu solicitud para "' || COALESCE(v_need_title, 'la necesidad') || '" fue aprobada! Ya puedes ir a ' ||
                 COALESCE(v_institution_name, 'la institución');

    IF v_institution_address IS NOT NULL AND v_institution_address <> '' THEN
        v_message := v_message || ', ubicada en ' || v_institution_address;
    END IF;

    IF v_institution_phone IS NOT NULL AND v_institution_phone <> '' THEN
        v_message := v_message || ' (contacto: ' || v_institution_phone || ')';
    END IF;

    v_message := v_message || '. Recuerda llevar tu carta de aceptación emitida por la universidad, firmada por el coordinador de tu carrera.';

    INSERT INTO public.notifications (recipient_id, type, need_id, message)
    VALUES (NEW.student_id, 'application_accepted', NEW.need_id, v_message);

    -- La necesidad pasa a 'approved' automáticamente: ya no aparece a otros estudiantes
    UPDATE public.needs SET status = 'approved' WHERE id = NEW.need_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_accepted
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_application_accepted();

-- ============================================
-- TRIGGER para notificar al estudiante al rechazar su solicitud
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_application_rejected()
RETURNS TRIGGER AS $$
DECLARE
    v_need_title TEXT;
    v_message TEXT;
BEGIN
    IF NEW.status <> 'rejected' OR OLD.status = 'rejected' THEN
        RETURN NEW;
    END IF;

    SELECT title INTO v_need_title FROM public.needs WHERE id = NEW.need_id;

    v_message := 'Tu solicitud para "' || COALESCE(v_need_title, 'la necesidad') || '" fue rechazada.';

    IF NEW.rejection_reason IS NOT NULL AND NEW.rejection_reason <> '' THEN
        v_message := v_message || ' Motivo: ' || NEW.rejection_reason;
    END IF;

    INSERT INTO public.notifications (recipient_id, type, need_id, message)
    VALUES (NEW.student_id, 'application_rejected', NEW.need_id, v_message);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_application_rejected
    AFTER UPDATE OF status ON applications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_application_rejected();

-- ============================================
-- TRIGGER para crear perfil automáticamente al registrar usuario
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
        NULLIF(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'role',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

