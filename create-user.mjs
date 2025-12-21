import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnrzrjyyaupfhcfspomk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucnpyanl5YXVwZmhjZnNwb21rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0MDgwOTAsImV4cCI6MjA3MTk4NDA5MH0.SVenD_TF6vT1ZuILBUPE3V2jxHkOSMz_pBAAAxbx9jQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const email = 'admin@memorycatalog.local';
const password = 'deep2924';

console.log('Attempting to create user...');

try {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Error creating user:', error);
  } else {
    console.log('User created successfully:', data);
  }
} catch (err) {
  console.error('Exception:', err);
}
