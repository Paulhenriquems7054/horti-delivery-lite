import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SUPABASE_URL = "https://ggtdnczmmoxagmbzopsf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndGRuY3ptbW94YWdtYnpvcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzgxMTIsImV4cCI6MjA4OTcxNDExMn0.oqrMVrztvsLXtdaZoB6hdxB_IWsaWhjf4IZUbS_nQR0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const storeName = "Loja Teste";
  const slug = "httpshorti-delivery-litevercelappteste";

  try {
    const { data, error } = await supabase.from("stores").insert({
      owner_id: null,
      name: storeName,
      slug: slug,
    }).select();

    if (error) {
      console.log("INSERT ERROR:", JSON.stringify(error, null, 2));
    } else {
      console.log("SUCCESS:", data);
    }
  } catch(e) {
    console.log("Exception:", e);
  }
}

run();
