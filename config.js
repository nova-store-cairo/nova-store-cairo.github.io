// =====================================================
// STORE SETTINGS — the only file you change for a new client
// (plus the text in the <head> of index.html for Google & sharing)
// =====================================================

// 1. Supabase connection (public values — safe in the website)
//    NEVER put the "secret" / "service_role" key here.
const SUPABASE_URL = "https://vbrfsyaacwrnlphxnhmh.supabase.co";
const SUPABASE_KEY = "sb_publishable_MpJZlJOe0OhFHM-uf5X9OA_0GRMaCF7";

// 2. The store's identity
const STORE = {
  name: "NOVA Wear", // full name (footer, WhatsApp message, browser tab)
  logo: "NOVA", // short name in the top-left corner
  heroTitle: "Built for Cairo nights.",
  heroText: "Heavyweight hoodies, relaxed cargos and everyday tees. Made in Cairo.",
  heroImage:
    "https://images.unsplash.com/photo-1773236237682-5b5d5d771f06?w=2000&h=1125&fit=crop&auto=format&q=80",
  whatsapp: "201000000000", // shop's WhatsApp: country code + number, no "+" or spaces
  currency: "EGP",
  accentColor: "#0071e3" // the one color used for buttons and links
};
