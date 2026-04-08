import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zojvjkndqfuizksqegne.supabase.co";
const supabaseKey = "sb_publishable_OikJvv5MoqP470MEzTeRJw_ylVMBU00";

export const hasSupabaseEnv = true;
export const supabase = createClient(supabaseUrl, supabaseKey);