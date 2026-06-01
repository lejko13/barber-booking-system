import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://nzvxjvrnzjvgpkzjemgt.supabase.co";

const supabaseKey = "sb_publishable_UtC5WDn-D9WPE7lk53kBsg_xN2RkgSU";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

