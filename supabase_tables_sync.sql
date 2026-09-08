-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Mensajes y Consultas de IA / Agente
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT,
    query TEXT NOT NULL,
    category TEXT DEFAULT 'GENERAL',
    response TEXT,
    is_helpful BOOLEAN DEFAULT true,
    rating INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de FAQs Oficiales
CREATE TABLE IF NOT EXISTS faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla de Agendamientos Google Calendar (Bookings)
CREATE TABLE IF NOT EXISTS calendar_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    company TEXT,
    service_interest TEXT,
    booking_date DATE NOT NULL,
    booking_time TEXT NOT NULL,
    meet_url TEXT,
    status TEXT DEFAULT 'confirmada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Habilitar lectura pública (anon) para sincronización en tiempo real
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica ai_conversations" ON ai_conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura publica faqs" ON faqs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Lectura publica calendar_bookings" ON calendar_bookings FOR ALL USING (true) WITH CHECK (true);
