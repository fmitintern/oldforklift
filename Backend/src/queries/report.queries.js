export const RIDE_REPORTS_QUERY = `
  SELECT r.id, r.from_location, r.to_location, r.vehicle_type, r.ride_type,
         TO_CHAR(r.start_time, 'YYYY-MM-DD HH24:MI:SS') AS start_time, 
         TO_CHAR(r.material_pick_time, 'YYYY-MM-DD HH24:MI:SS') AS material_pick_time, 
         TO_CHAR(r.end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time,
         CASE 
           WHEN r.end_time IS NOT NULL AND r.material_pick_time IS NOT NULL 
           THEN ROUND((r.end_time - r.material_pick_time) * 1440, 2) 
           ELSE NULL 
         END AS gap_pick_drop,
         CASE 
           WHEN r.material_pick_time IS NOT NULL AND r.start_time IS NOT NULL 
           THEN ROUND((r.material_pick_time - r.start_time) * 1440, 2) 
           ELSE NULL 
         END AS gap_pick_start,
         TO_CHAR(f.last_maintenance_date, 'YYYY-MM-DD') AS last_maintenance_date 
  FROM rides r
  LEFT JOIN forklifts f ON r.vehicle_type = f.id
  WHERE r.status = 'completed'
  ORDER BY r.end_time DESC
`;

export const MAINTENANCE_REPORTS_QUERY = `
  SELECT m.id, f.vehicle_number, m.issue, m.status, 
         TO_CHAR(m.reported_at, 'YYYY-MM-DD HH24:MI:SS') AS reported_at
  FROM maintenance_requests m
  JOIN forklifts f ON m.forklift_id = f.id
  ORDER BY m.reported_at DESC
`;