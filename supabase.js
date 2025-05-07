import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mmdzskvtxudysikubewg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZHpza3Z0eHVkeXNpa3ViZXdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMjUwNjUsImV4cCI6MjA2MTcwMTA2NX0.7QJNGfFXi2eLUC_-yvAZ0_s-N9ofjRz5R2FeXfDY19s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
