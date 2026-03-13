import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dngabmkaxninvtuxcyta.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuZ2FibWtheG5pbnZ0dXhjeXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzQ5MDUsImV4cCI6MjA4ODcxMDkwNX0.Pz1Avs3pbAKDGFH_r3Xyhhjoms6XwjuaIyLnSb4bFXA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);