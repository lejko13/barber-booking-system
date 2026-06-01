import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      email,
      name,
      service,
      date,
      time,
      cancelLink,
    } = await req.json();

    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Rezervácie <onboarding@resend.dev>",
        to: email,
        subject: "Potvrdenie rezervácie",
        html: `
          <h2>Rezervácia bola prijatá</h2>
          <p>Ahoj ${name},</p>

          <p>Tvoja rezervácia bola úspešne vytvorená.</p>

          <p><b>Služba:</b> ${service}</p>
          <p><b>Dátum:</b> ${date}</p>
          <p><b>Čas:</b> ${time}</p>

          <br />

          <a href="${cancelLink}">
            Zrušiť rezerváciu
          </a>
        `,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});


