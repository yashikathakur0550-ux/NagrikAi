import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const isPlaceholderKey = !apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '';

let genAIClient: GoogleGenAI | null = null;

if (!isPlaceholderKey) {
  try {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

const SERVICE_ADVISOR_SYSTEM_PROMPT = `
You are NagrikAI Smart Service Advisor (नागरिक सेवा सहायक), an expert AI diagnostic and home repair consultant for local household and professional services in India.

Your core capabilities:
1. Diagnose customer home maintenance problems (e.g., electrical sparking, water leakage, low cooling in AC, jammed doors, pest infestations, washing machine errors, RO water filter TDS issues).
2. Recommend the exact service category needed from the 15 supported categories:
   - Plumbing
   - Electrician
   - Carpenter
   - Home Cleaning
   - AC Repair
   - Appliance Repair
   - Painting
   - Pest Control
   - Beauty Services
   - Salon at Home
   - Gardening
   - RO and Water Purifier Repair
   - Computer and Laptop Repair
   - Vehicle Repair
   - Packers and Movers
3. Provide typical realistic repair cost estimates in Indian Rupees (₹), standard inspection fees (usually ₹249 - ₹499), and standard timelines.
4. Give immediate preliminary safety precautions (e.g., "Immediately turn off the main water valve / switch off the 32A MCB switch before inspecting").

Tone: Helpful, practical, transparent, and respectful. Use clear bullet points and bold headers.
`;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function askServiceAdvisorAI(
  messages: ChatMessage[],
  customerContext?: { name?: string; city?: string }
): Promise<{ text: string; isLiveAi: boolean; modelUsed: string; error?: string }> {
  if (!genAIClient || isPlaceholderKey) {
    return generateFallbackServiceResponse(messages[messages.length - 1]?.content || '', customerContext);
  }

  try {
    const formattedContents = messages.map((m) => {
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      };
    });

    const contextPrefix = customerContext
      ? `[Customer Context: Name: ${customerContext.name || 'Customer'}, City: ${customerContext.city || 'India'}]\n\n`
      : '';

    if (formattedContents.length > 0) {
      const lastIndex = formattedContents.length - 1;
      const lastText = formattedContents[lastIndex].parts[0].text;
      formattedContents[lastIndex].parts[0].text = contextPrefix + lastText;
    }

    const response = await genAIClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction: SERVICE_ADVISOR_SYSTEM_PROMPT,
      },
    });

    return {
      text: response.text || 'I could not generate a response. Please describe your service requirement.',
      isLiveAi: true,
      modelUsed: 'gemini-3.8-flash',
    };
  } catch (error: any) {
    console.warn('Gemini Service Advisor fallback triggered:', error);
    const fallback = generateFallbackServiceResponse(messages[messages.length - 1]?.content || '', customerContext);
    return {
      text: fallback.text,
      isLiveAi: false,
      modelUsed: 'local-service-knowledge-base',
      error: error?.message,
    };
  }
}

function generateFallbackServiceResponse(
  query: string,
  context?: { name?: string; city?: string }
): { text: string; isLiveAi: boolean; modelUsed: string } {
  const q = query.toLowerCase();
  const name = context?.name || 'Customer';

  if (q.includes('ac') || q.includes('cooling') || q.includes('compressor')) {
    return {
      text: `Hello ${name}! For your AC issue:

### ❄️ Recommended Service: AC Repair & Servicing
- **Likely Problem**: Clogged air filters, low refrigerant gas, or outdoor unit compressor condenser dust buildup.
- **Immediate Precaution**: Switch off the AC if you notice ice formation on copper pipes or a burning smell.
- **Estimated Inspection Cost**: ₹299 - ₹449 visiting charge. Full gas charging ranges between ₹1,800 and ₹2,400 depending on tonnage.
- **Next Step**: Click **Book AC Repair** on the dashboard to select a verified technician near you!`,
      isLiveAi: false,
      modelUsed: 'service-knowledge-base',
    };
  }

  if (q.includes('leak') || q.includes('tap') || q.includes('pipe') || q.includes('plumb')) {
    return {
      text: `Hello ${name}! For your water and pipe issue:

### 🚰 Recommended Service: Plumbing
- **Likely Problem**: Worn-out rubber washer inside mixer tap or loose CPVC union connector behind wall tiles.
- **Immediate Precaution**: Turn off the angle cock valve under the sink or the master overhead tank valve to prevent water damage.
- **Estimated Inspection Cost**: ₹249 - ₹349 visit charge. Minor washer/tap replacement is usually ₹150 - ₹300 for labor.
- **Next Step**: Choose a top-rated local plumber from your **Nearby Available Workers** map on the dashboard!`,
      isLiveAi: false,
      modelUsed: 'service-knowledge-base',
    };
  }

  if (q.includes('electric') || q.includes('mcb') || q.includes('short') || q.includes('wiring') || q.includes('switch')) {
    return {
      text: `Hello ${name}! For your electrical issue:

### ⚡ Recommended Service: Electrician
- **Likely Problem**: Circuit overload, neutral earthing fault, or a faulty 16A heating appliance coil causing MCB trips.
- **Immediate Precaution**: Do NOT touch exposed switchboard wires. Turn off the main tripping breaker until our verified electrician arrives.
- **Estimated Inspection Cost**: ₹299 visiting & diagnosis charge.
- **Next Step**: You can book a verified electrician with 30-minute arrival in your city!`,
      isLiveAi: false,
      modelUsed: 'service-knowledge-base',
    };
  }

  return {
    text: `Hello ${name}! I am **NagrikAI Smart Service Advisor**.

Tell me what is broken or what service you require (e.g. "My refrigerator is not cooling", "Need deep cleaning before moving in", "Ceiling fan making squeaking noise").

I will diagnose the issue, recommend the right service specialist, and estimate the fair market charges!`,
    isLiveAi: false,
    modelUsed: 'service-knowledge-base',
  };
}
