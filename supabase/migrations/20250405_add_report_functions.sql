
-- Function to count content by status
CREATE OR REPLACE FUNCTION public.count_content_by_status(
  start_date date,
  end_date date
)
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    status,
    COUNT(*) as count
  FROM 
    conteudos_produzidos
  WHERE 
    data_programada >= start_date AND 
    data_programada <= end_date
  GROUP BY 
    status;
$$;

-- Function to count content by program and status
CREATE OR REPLACE FUNCTION public.count_content_by_program_status(
  start_date date,
  end_date date
)
RETURNS TABLE (
  program_name text,
  status text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.nome as program_name,
    c.status,
    COUNT(*) as count
  FROM 
    conteudos_produzidos c
  LEFT JOIN
    programas p ON c.programa_id = p.id
  WHERE 
    c.data_programada >= start_date AND 
    c.data_programada <= end_date
  GROUP BY 
    p.nome, c.status;
$$;
