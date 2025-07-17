// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qnonqdoezynoimiydyaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFub25xZG9lenlub2ltaXlkeWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTY1NzksImV4cCI6MjA2ODI5MjU3OX0.xrG0xMAQaEWQvPRnAN1-geSzGlcGy7iWyi0QLXSq04Q';
export const supabase = createClient(supabaseUrl, supabaseKey);
