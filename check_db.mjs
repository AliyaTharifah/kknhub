import { createClient } from "@supabase/supabase-js";

const url = "https://euvbkvjbsswbyhmnesvz.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dmJrdmpic3N3YnlobW5lc3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzMyNzUsImV4cCI6MjA5OTk0OTI3NX0.tSaZuzrV4pA0e97COFmfU1TfAX66tevesT8WWgNlrLw";

const supabase = createClient(url, key);

async function check() {
  const tables = ["users", "groups", "group_members", "programs", "timelines", "logbooks", "photos", "documents", "meeting_notes"];
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select("*", { count: "exact" });
    console.log(`Table '${table}': count=${count}, rows=${data?.length}, error=`, error ? error.message : null);
    if (data && data.length > 0) {
      console.log(`  Sample data from '${table}':`, JSON.stringify(data.slice(0, 2)));
    }
  }
}

check();
