import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tihgmqjtsojvldxqevda.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpaGdtcWp0c29qdmxkeHFldmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMjE1NTYsImV4cCI6MjA5MzU5NzU1Nn0.dxa_xomJ8wtCvr-kAARG855rio8ve4tmMnaiyzvGCB4";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);