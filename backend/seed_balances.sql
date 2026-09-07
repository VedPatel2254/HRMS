DO $$
DECLARE
  usr RECORD;
  lt RECORD;
  yr INT := EXTRACT(YEAR FROM NOW())::INT;
  now TIMESTAMP := NOW();
BEGIN
  FOR usr IN SELECT id FROM users WHERE status = 'ACTIVE' LOOP
    FOR lt IN SELECT id, "defaultDays" FROM leave_types LOOP
      INSERT INTO leave_balances (id, "userId", "leaveTypeId", year, allocated, used, remaining, "createdAt", "updatedAt")
      SELECT gen_random_uuid(), usr.id, lt.id, yr, lt."defaultDays", 0, lt."defaultDays", now, now
      WHERE NOT EXISTS (
        SELECT 1 FROM leave_balances WHERE "userId" = usr.id AND "leaveTypeId" = lt.id AND year = yr
      );
    END LOOP;
  END LOOP;
END $$;

SELECT u.email, lb.year, lt.name as type, lb.allocated, lb.used, lb.remaining
FROM leave_balances lb
JOIN users u ON u.id = lb."userId"
JOIN leave_types lt ON lt.id = lb."leaveTypeId"
ORDER BY u.email, lt.name;
