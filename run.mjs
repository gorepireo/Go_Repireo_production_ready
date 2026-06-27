import { execSync } from 'child_process';
import fs from 'fs';

const sql = `
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    BEGIN
        CREATE POLICY "Users can insert their own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
        CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;
`;

fs.writeFileSync('temp.sql', sql);
// Let's just use regular powershell from node
try {
  execSync('powershell.exe -Command "$q = Get-Content temp.sql -Raw; npx @insforge/cli db query $q"', { stdio: 'inherit' });
} catch (e) {
  console.log(e.message);
}
