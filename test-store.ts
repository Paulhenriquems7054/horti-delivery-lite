import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ggtdnczmmoxagmbzopsf.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdndGRuY3ptbW94YWdtYnpvcHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMzgxMTIsImV4cCI6MjA4OTcxNDExMn0.oqrMVrztvsLXtdaZoB6hdxB_IWsaWhjf4IZUbS_nQR0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';
  const slug = `slug-${Date.now()}`;
  const storeName = `Store ${Date.now()}`;



  let out = "";
  console.log("Signing up...", email);
  out += "Signing up: " + email + "\n";
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    out += "SignUp Error: " + JSON.stringify(signUpError, null, 2) + "\n";
    require('fs').writeFileSync('test-out.txt', out);
    return;
  }
  out += "User: " + user?.id + "\n";

  const { data, error: storeError } = await supabase.from("stores").insert({
    owner_id: user?.id,
    name: storeName,
    slug: slug,
  }).select();

  if (storeError) {
    out += "Store Error: " + JSON.stringify(storeError, null, 2) + "\n";
  } else {
    out += "Store Created: " + JSON.stringify(data, null, 2) + "\n";
  }
  require('fs').writeFileSync('test-out.txt', out);
}

run();
