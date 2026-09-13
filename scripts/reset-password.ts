import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const newPassword = process.argv[2];
const email = process.argv[3] || 'k.ewing@theewingagency.com';

if (!newPassword) {
  console.log("Usage: powershell -ExecutionPolicy Bypass -Command \"npx tsx scripts/reset-password.ts <newPassword> [email]\"");
  process.exit(1);
}

async function resetPassword() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    return;
  }
  
  const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error(`User with email ${email} not found.`);
    return;
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    console.error("Failed to update password:", error.message);
    return;
  }

  console.log(`\n✅ Successfully updated password for ${email} (User ID: ${user.id})! You can now log in with the new password.`);
}

resetPassword();
