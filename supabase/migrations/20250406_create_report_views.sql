
-- Create SQL Views for the report functions we created earlier, 
-- so they can be queried directly with select statements

-- View for count_content_by_status
CREATE OR REPLACE VIEW public.count_content_by_status AS
SELECT 
  s.start_date, 
  s.end_date, 
  s.status, 
  s.count
FROM 
  (SELECT 
     start_date::DATE, 
     end_date::DATE, 
     res.status, 
     res.count
   FROM 
     (SELECT NULL::DATE as start_date, NULL::DATE as end_date) params,
     LATERAL public.count_content_by_status(params.start_date, params.end_date) res
  ) s;

-- View for count_content_by_program_status
CREATE OR REPLACE VIEW public.count_content_by_program_status AS
SELECT 
  s.start_date, 
  s.end_date, 
  s.programa_id, 
  s.programa_nome, 
  s.status, 
  s.count
FROM 
  (SELECT 
     start_date::DATE, 
     end_date::DATE, 
     res.programa_id, 
     res.programa_nome, 
     res.status, 
     res.count
   FROM 
     (SELECT NULL::DATE as start_date, NULL::DATE as end_date) params,
     LATERAL public.count_content_by_program_status(params.start_date, params.end_date) res
  ) s;
