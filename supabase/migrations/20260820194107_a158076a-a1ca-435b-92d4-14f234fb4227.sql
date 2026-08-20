CREATE TABLE IF NOT EXISTS public.report_ojo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_referencia TEXT NOT NULL,
    nf TEXT,
    data_pickup TIMESTAMPTZ,
    data_arrived TIMESTAMPTZ,
    data_finished TIMESTAMPTZ,
    data_planned TIMESTAMPTZ,
    municipio_destino TEXT,
    uf_destino TEXT,
    cliente TEXT,
    produto TEXT,
    peso_kg NUMERIC,
    placa TEXT,
    transportadora TEXT,
    status TEXT,
    raw_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cod_referencia)
);

CREATE TABLE IF NOT EXISTS public.report_cockpit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_embarque TEXT NOT NULL,
    data_inclusao TIMESTAMPTZ,
    data_carregamento TIMESTAMPTZ,
    uf TEXT,
    raw_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(pre_embarque)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_ojo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.report_cockpit TO authenticated;
GRANT ALL ON public.report_ojo TO service_role;
GRANT ALL ON public.report_cockpit TO service_role;
GRANT SELECT ON public.report_ojo TO anon;
GRANT SELECT ON public.report_cockpit TO anon;

ALTER TABLE public.report_ojo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cockpit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for demo" ON public.report_ojo FOR SELECT USING (true);
CREATE POLICY "Allow public read for demo" ON public.report_cockpit FOR SELECT USING (true);
CREATE POLICY "Allow authenticated full access" ON public.report_ojo FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated full access" ON public.report_cockpit FOR ALL TO authenticated USING (true);
